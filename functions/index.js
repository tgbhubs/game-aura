/* Game icarros — Cloud Functions (corrigem o quiz e validam a corrida no servidor).
   O gabarito nunca vai para o navegador do jogador. */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const L = require('./logica');

admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 10 });

function uidDe(req) {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Faça login para jogar.');
  return req.auth.uid;
}
function texto(v, nome) {
  if (typeof v !== 'string' || !v || v.length > 80 || v.indexOf('/') >= 0) throw new HttpsError('invalid-argument', 'Parâmetro inválido: ' + nome);
  return v;
}
function dados(s) { return s.exists ? s.data() : null; }
async function rodar(fn) {
  try { return await fn(); }
  catch (e) {
    if (e instanceof HttpsError) throw e;
    if (e && e.erroJogo) throw new HttpsError('failed-precondition', e.message);
    console.error(e);
    throw new HttpsError('internal', 'Erro no servidor. Tente de novo.');
  }
}
function gravarPlacar(tx, rodada, uid, entrada) {
  const p = {}; p[uid] = entrada;
  tx.set(db.doc('placar/' + rodada.id), { temporadaId: rodada.temporadaId, rodadaId: rodada.id, p: p }, { merge: true });
}

async function quiz(req, tipo) {
  const uid = uidDe(req);
  const rid = texto(req.data && req.data.rodadaId, 'rodadaId');
  return rodar(() => db.runTransaction(async (tx) => {
    const refs = [db.doc('jogadores/' + uid), db.doc('rodadas/' + rid), db.doc('gabarito/' + rid), db.doc('quiz/' + rid + '_' + uid)];
    const [j, r, g, q] = await Promise.all(refs.map((x) => tx.get(x)));
    const rodada = dados(r); if (rodada) rodada.id = rid;
    const ctx = { now: Date.now(), uid, jog: dados(j), rodada, gab: dados(g), quiz: dados(q), idx: req.data.idx, alt: req.data.alt };
    const res = tipo === 'iniciar' ? L.iniciarQuiz(ctx) : L.responderQuiz(ctx);
    if (res.quiz) tx.set(refs[3], res.quiz);
    if (res.placar) gravarPlacar(tx, rodada, uid, res.placar);
    return res.resp;
  }));
}
exports.iniciarQuiz = onCall((req) => quiz(req, 'iniciar'));
exports.responderQuiz = onCall((req) => quiz(req, 'responder'));

function refsTentativas(rid, uid) { return [1, 2, 3].map((n) => db.doc('corrida/' + rid + '_' + uid + '_' + n)); }

exports.iniciarCorrida = onCall((req) => {
  const uid = uidDe(req);
  const rid = texto(req.data && req.data.rodadaId, 'rodadaId');
  return rodar(() => db.runTransaction(async (tx) => {
    const tr = refsTentativas(rid, uid);
    const snaps = await Promise.all([db.doc('jogadores/' + uid), db.doc('rodadas/' + rid)].concat(tr).map((x) => tx.get(x)));
    const rodada = dados(snaps[1]); if (rodada) rodada.id = rid;
    const res = L.iniciarCorrida({ now: Date.now(), uid, jog: dados(snaps[0]), rodada, tent: snaps.slice(2).map(dados) });
    tx.set(tr[res.n - 1], res.doc);
    gravarPlacar(tx, rodada, uid, res.placar);
    return res.resp;
  }));
});

exports.finalizarCorrida = onCall((req) => {
  const uid = uidDe(req);
  const rid = texto(req.data && req.data.rodadaId, 'rodadaId');
  const n = Number(req.data.n);
  if (![1, 2, 3].includes(n)) throw new HttpsError('invalid-argument', 'Tentativa inválida.');
  return rodar(() => db.runTransaction(async (tx) => {
    const tr = refsTentativas(rid, uid);
    const snaps = await Promise.all([db.doc('jogadores/' + uid), db.doc('rodadas/' + rid)].concat(tr).map((x) => tx.get(x)));
    const rodada = dados(snaps[1]); if (rodada) rodada.id = rid;
    const res = L.finalizarCorrida({ now: Date.now(), uid, jog: dados(snaps[0]), rodada, tent: snaps.slice(2).map(dados), n, tempo: req.data.tempo });
    tx.set(tr[n - 1], res.doc);
    gravarPlacar(tx, rodada, uid, res.placar);
    return res.resp;
  }));
});

exports.anularTentativa = onCall((req) => {
  const uid = uidDe(req);
  const rid = texto(req.data && req.data.rodadaId, 'rodadaId');
  const alvo = texto(req.data && req.data.uid, 'uid');
  const n = Number(req.data.n);
  if (![1, 2, 3].includes(n)) throw new HttpsError('invalid-argument', 'Tentativa inválida.');
  return rodar(() => db.runTransaction(async (tx) => {
    const tr = refsTentativas(rid, alvo);
    const snaps = await Promise.all([db.doc('config/geral'), db.doc('jogadores/' + uid), db.doc('jogadores/' + alvo), db.doc('rodadas/' + rid)].concat(tr).map((x) => tx.get(x)));
    const cfg = dados(snaps[0]), eu = dados(snaps[1]);
    const adm = (cfg && cfg.masterUid === uid) || (eu && eu.status === 'ativo' && eu.papel === 'adm');
    if (!adm) throw new HttpsError('permission-denied', 'Apenas administradores.');
    const rodada = dados(snaps[3]); if (!rodada) throw new HttpsError('not-found', 'Rodada não encontrada.');
    rodada.id = rid;
    const res = L.anularTentativa({ jog: dados(snaps[2]) || {}, tent: snaps.slice(4).map(dados), n, anular: !!req.data.anular });
    tx.set(tr[n - 1], res.doc);
    gravarPlacar(tx, rodada, alvo, res.placar);
    return { ok: true };
  }));
});

/* ================== PLACA! ==================
   Mesa online de cartas. Monte e mãos ficam no servidor: cada pessoa só lê a própria mão. */
const P = require('./placa');
const crypto = require('crypto');

function semente() { return crypto.randomInt(1, 2147483647); }
function gravarEstado(tx, mid, E, antes) {
  tx.set(db.doc('mesas/' + mid), P.publico(E));
  tx.set(db.doc('montes/' + mid), P.privado(E));
  E.uids.forEach((u) => tx.set(db.doc('maos/' + mid + '_' + u), { uid: u, mesaId: mid, cartas: E.maos[u] }));
  (E.removidos || []).forEach((u) => tx.delete(db.doc('maos/' + mid + '_' + u)));
  if (E.status === 'fim' && (!antes || antes.status !== 'fim')) tx.set(db.doc('placaPartidas/' + mid), P.resultado(E, mid));
}

exports.placa = onCall((req) => {
  const uid = uidDe(req);
  const d = req.data || {};
  const op = String(d.op || '');
  return rodar(async () => {
    if (op === 'criar') {
      const [j, cfg] = await Promise.all([db.doc('jogadores/' + uid).get(), db.doc('config/geral').get()]);
      const m = P.novaMesa({ uid, jog: dados(j), lugares: d.lugares, now: Date.now(), temporadaId: (dados(cfg) || {}).temporadaAtiva || '' });
      const ref = db.collection('mesas').doc();
      await ref.set(m);
      return { mesaId: ref.id };
    }
    const mid = texto(d.mesaId, 'mesaId');
    return db.runTransaction(async (tx) => {
      const mRef = db.doc('mesas/' + mid);
      const mesa = dados(await tx.get(mRef));
      if (!mesa) throw new HttpsError('not-found', 'Mesa não encontrada.');
      const now = Date.now();

      if (op === 'entrar' || op === 'sair' || op === 'iniciar') {
        const j = dados(await tx.get(db.doc('jogadores/' + uid)));
        if (op === 'entrar') {
          const m2 = P.entrar(mesa, uid, j, now);
          if (m2.jogadores.length === m2.lugares) gravarEstado(tx, mid, P.iniciar(m2, null, semente(), now));
          else tx.set(mRef, m2);
        } else if (op === 'sair') tx.set(mRef, P.sair(mesa, uid, now));
        else gravarEstado(tx, mid, P.iniciar(mesa, uid, semente(), now));
        return { ok: true };
      }
      if (op === 'revanche') {
        if (mesa.uids.indexOf(uid) < 0) throw new HttpsError('permission-denied', 'Você não estava nesta mesa.');
        if (mesa.revanche) return { mesaId: mesa.revanche };
        if (mesa.status !== 'fim' && mesa.status !== 'encerrada') throw new HttpsError('failed-precondition', 'A partida ainda não terminou.');
        const [j, cfg] = await Promise.all([tx.get(db.doc('jogadores/' + uid)), tx.get(db.doc('config/geral'))]);
        const nova = P.novaMesa({ uid, jog: dados(j), lugares: mesa.lugares, now, temporadaId: (dados(cfg) || {}).temporadaAtiva || '' });
        const ref = db.collection('mesas').doc();
        tx.set(ref, nova);
        tx.update(mRef, { revanche: ref.id });
        return { mesaId: ref.id };
      }
      if (op === 'fecharMesa') {
        const [cfg, eu] = await Promise.all([tx.get(db.doc('config/geral')), tx.get(db.doc('jogadores/' + uid))]);
        const c = dados(cfg), e = dados(eu);
        const adm = (c && c.masterUid === uid) || (e && e.status === 'ativo' && e.papel === 'adm');
        if (!adm) throw new HttpsError('permission-denied', 'Apenas administradores.');
        tx.update(mRef, { status: 'encerrada', aberta: false, fimEm: now, atualizadaEm: now });
        return { ok: true };
      }
      // jogada
      if (mesa.status === 'aguardando' || mesa.status === 'cancelada') throw new HttpsError('failed-precondition', 'A partida ainda não começou.');
      const priv = dados(await tx.get(db.doc('montes/' + mid)));
      const snaps = await Promise.all(mesa.uids.map((u) => tx.get(db.doc('maos/' + mid + '_' + u))));
      const maos = {};
      mesa.uids.forEach((u, i) => { maos[u] = (dados(snaps[i]) || {}).cartas || []; });
      const E = P.compor(mesa, priv, maos);
      const acao = { op, carta: d.carta, cor: d.cor, alvo: d.alvo, sim: d.sim };
      const E2 = P.acao(E, uid, acao, now);
      gravarEstado(tx, mid, E2, mesa);
      return { ok: true };
    });
  });
});
