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
    const multas = Math.floor(Number(req.data.multas) || 0), segs = Math.floor(Number(req.data.segExtra) || 0);
    const [cart, gar] = multas > 0 || segs > 0 ? await Promise.all([tx.get(db.doc('carteira/' + uid)), tx.get(db.doc('garagens/' + uid))]) : [null, null];
    const rodada = dados(snaps[1]); if (rodada) rodada.id = rid;
    const now = Date.now();
    const res = L.finalizarCorrida({ now, uid, jog: dados(snaps[0]), rodada, tent: snaps.slice(2).map(dados), n, tempo: req.data.tempo });
    tx.set(tr[n - 1], res.doc);
    gravarPlacar(tx, rodada, uid, res.placar);
    if (multas > 0) {
      const carro = String(req.data.carro || 'aura'), cat = G.catDoCarro(carro, dados(gar));
      const m = G.registrarMultas(dados(cart), Math.min(multas, G.maxMultas(res.resp.tempo)), cat === 'aura' && carro !== 'aura' ? 'aura' : carro, cat, 'corrida', now);
      if (m.novas) tx.set(db.doc('carteira/' + uid), m.carteira);
      res.resp.multas = m.novas;
      if (m.novas) cart.__c = m.carteira;
    }
    if (segs > 0 && res.resp.valido !== false) {
      const s = G.creditarSeguros((cart && cart.__c) || dados(cart), segs, res.resp.tempo, 'corrida', now);
      if (s.creditos) { tx.set(db.doc('carteira/' + uid), s.carteira); res.resp.segCreditos = s.creditos; }
    }
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
  // partidas com robô não contam para o ranking
  if (E.status === 'fim' && !E.temRobo && (!antes || antes.status !== 'fim')) tx.set(db.doc('placaPartidas/' + mid), P.resultado(E, mid));
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
      if (op === 'robos') {
        const m2 = P.addRobos(mesa, uid, now);
        gravarEstado(tx, mid, P.iniciar(m2, null, semente(), now));
        return { ok: true };
      }
      if (op === 'robo') {
        // alguém da mesa pede a vez dos robôs; o servidor decide se é hora de algum robô jogar
        if (mesa.uids.indexOf(uid) < 0) throw new HttpsError('permission-denied', 'Você não está nesta mesa.');
        if (!mesa.temRobo || mesa.status !== 'jogando') return { feito: false };
        const privR = dados(await tx.get(db.doc('montes/' + mid)));
        const snapsR = await Promise.all(mesa.uids.map((u) => tx.get(db.doc('maos/' + mid + '_' + u))));
        const maosR = {};
        mesa.uids.forEach((u, i) => { maosR[u] = (dados(snapsR[i]) || {}).cartas || []; });
        const ER = P.acaoRobo(P.compor(mesa, privR, maosR), now);
        if (!ER) return { feito: false };
        gravarEstado(tx, mid, ER, mesa);
        return { feito: true };
      }
      if (op === 'revanche') {
        if (mesa.uids.indexOf(uid) < 0) throw new HttpsError('permission-denied', 'Você não estava nesta mesa.');
        if (mesa.revanche) return { mesaId: mesa.revanche };
        if (mesa.status !== 'fim' && mesa.status !== 'encerrada') throw new HttpsError('failed-precondition', 'A partida ainda não terminou.');
        const [j, cfg] = await Promise.all([tx.get(db.doc('jogadores/' + uid)), tx.get(db.doc('config/geral'))]);
        let nova = P.novaMesa({ uid, jog: dados(j), lugares: mesa.lugares, now, temporadaId: (dados(cfg) || {}).temporadaAtiva || '' });
        const ref = db.collection('mesas').doc();
        // mesa só com você e robôs: a revanche já começa com robôs de novo
        const outrosHumanos = mesa.jogadores.filter((x) => !x.bot && x.uid !== uid).length;
        if (mesa.temRobo && !outrosHumanos) {
          nova = P.addRobos(nova, uid, now);
          gravarEstado(tx, ref.id, P.iniciar(nova, null, semente(), now));
        } else tx.set(ref, nova);
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

/* ================== GARAGEM (créditos, 0 km, Retomados Porto e mercado entre pessoas) ==================
   Saldo = pontos de todas as rodadas + vitórias no Placa! contra pessoas + vendas − compras.
   Carteira, garagem, lote e anúncios são gravados só aqui. */
const G = require('./garagem');

async function lerSaldo(tx, uid) {
  const [plac, temps, vit, cart, gar, trn] = await Promise.all([
    tx.get(db.collection('placar')),
    tx.get(db.collection('temporadas')),
    tx.get(db.collection('placaPartidas').where('vencedor', '==', uid)),
    tx.get(db.doc('carteira/' + uid)),
    tx.get(db.doc('garagens/' + uid)),
    tx.get(db.doc('treinos/' + uid))
  ]);
  const tmap = {};
  temps.forEach((d) => { tmap[d.id] = d.data(); });
  const vitorias = vit.docs.filter((d) => !d.data().temRobo).length;
  const ganhos = G.ganhos(uid, plac.docs.map((d) => d.data()), tmap, vitorias, (dados(trn) || {}).creditos || 0);
  const carteira = dados(cart) || {};
  return { uid, ganhos, carteira, garagem: dados(gar) || { carros: {} }, saldo: G.saldo(ganhos, carteira) };
}

exports.garagem = onCall((req) => {
  const uid = uidDe(req);
  const d = req.data || {};
  const op = String(d.op || '');
  return rodar(async () => db.runTransaction(async (tx) => {
    const eu = dados(await tx.get(db.doc('jogadores/' + uid)));
    if (!eu || eu.status !== 'ativo') throw new HttpsError('permission-denied', 'Seu cadastro ainda não foi aprovado.');
    const now = Date.now();
    const loteRef = db.doc('estoque/' + G.semana(now));

    if (op === 'saldo') {
      const st = await lerSaldo(tx, uid);
      return { saldo: st.saldo, ganhos: st.ganhos, gasto: st.carteira.gasto || 0, recebido: st.carteira.recebido || 0, mov: st.carteira.mov || [] };
    }
    if (op === 'pagarMulta') {
      const st = await lerSaldo(tx, uid);
      const r = G.pagarMulta(st, String(d.id || ''), now);
      tx.set(db.doc('carteira/' + uid), r.carteira);
      return { valor: r.valor, saldo: st.saldo - r.valor };
    }
    if (op === 'vitrine') {
      const lt = await tx.get(loteRef);
      if (!lt.exists) { const novo = G.lote(now); tx.set(loteRef, novo); return { semana: novo.semana }; }
      return { semana: lt.id };
    }
    if (op === 'comprar0km') {
      const st = await lerSaldo(tx, uid); st.apelido = eu.apelido || eu.nome || '';
      const r = G.comprar0km(st, String(d.cat || ''), now);
      tx.set(db.collection('transacoes').doc(), r.transacao);
      tx.set(db.doc('garagens/' + uid), r.garagem);
      tx.set(db.doc('carteira/' + uid), r.carteira);
      return { iid: r.iid, saldo: st.saldo - G.CATALOGO[d.cat].preco };
    }
    if (op === 'comprarRetomado') {
      const lt = await tx.get(loteRef);
      const st = await lerSaldo(tx, uid); st.apelido = eu.apelido || eu.nome || '';
      const lote = dados(lt) || G.lote(now);
      const r = G.comprarRetomado(st, lote, String(d.item || ''), now);
      tx.set(db.collection('transacoes').doc(), r.transacao);
      tx.set(loteRef, r.lote);
      tx.set(db.doc('garagens/' + uid), r.garagem);
      tx.set(db.doc('carteira/' + uid), r.carteira);
      return { iid: r.iid };
    }
    if (op === 'anunciar') {
      const [gar, ans, cart] = await Promise.all([tx.get(db.doc('garagens/' + uid)), tx.get(db.collection('anuncios').where('vendedor', '==', uid)), tx.get(db.doc('carteira/' + uid))]);
      const st = { uid, apelido: eu.apelido || eu.nome || '', garagem: dados(gar) || { carros: {} }, carteira: dados(cart) || {} };
      const an = G.anunciar(st, String(d.iid || ''), d.preco, ans.docs.map((x) => x.data()), now);
      const ref = db.collection('anuncios').doc();
      tx.set(ref, an);
      return { anuncioId: ref.id };
    }
    if (op === 'cancelarAnuncio') {
      const ref = db.doc('anuncios/' + String(d.anuncioId || ''));
      const an = dados(await tx.get(ref));
      if (!an || an.vendedor !== uid) throw new HttpsError('permission-denied', 'Esse anúncio não é seu.');
      if (an.status !== 'ativo') return { ok: true };
      tx.update(ref, { status: 'cancelado', canceladoEm: now });
      return { ok: true };
    }
    if (op === 'comprarUsado') {
      const ref = db.doc('anuncios/' + String(d.anuncioId || ''));
      const an = dados(await tx.get(ref));
      if (!an) throw new HttpsError('not-found', 'Anúncio não encontrado.');
      const comprador = await lerSaldo(tx, uid); comprador.apelido = eu.apelido || eu.nome || '';
      const [gv, cv] = await Promise.all([tx.get(db.doc('garagens/' + an.vendedor)), tx.get(db.doc('carteira/' + an.vendedor))]);
      const vendedor = { uid: an.vendedor, garagem: dados(gv) || { carros: {} }, carteira: dados(cv) || {} };
      const r = G.comprarUsado(comprador, vendedor, an, now);
      tx.set(db.doc('garagens/' + uid), r.garagemComprador);
      tx.set(db.doc('garagens/' + an.vendedor), r.garagemVendedor);
      tx.set(db.doc('carteira/' + uid), r.carteiraComprador);
      tx.set(db.doc('carteira/' + an.vendedor), r.carteiraVendedor);
      tx.set(ref, r.anuncio);
      tx.set(db.collection('transacoes').doc(), r.transacao);
      return { iid: r.iid, taxa: r.taxa };
    }
    throw new HttpsError('invalid-argument', 'Operação desconhecida.');
  }));
});

/* ================== TREINO COM RECORDE ==================
   O treino continua livre, mas o tempo só entra no ranking de treinos se bater com o tempo real decorrido. */
exports.treino = onCall((req) => {
  const uid = uidDe(req);
  const d = req.data || {};
  return rodar(() => db.runTransaction(async (tx) => {
    const ref = db.doc('treinos/' + uid);
    const [j, t, g, cart] = await Promise.all([tx.get(db.doc('jogadores/' + uid)), tx.get(ref), tx.get(db.doc('garagens/' + uid)), tx.get(db.doc('carteira/' + uid))]);
    const now = Date.now();
    if (d.op === 'iniciar') {
      const r = G.iniciarTreino({ now, uid, jog: dados(j), doc: dados(t), carro: String(d.carro || ''), garagem: dados(g) });
      tx.set(ref, r.doc);
      return r.resp;
    }
    if (d.op === 'finalizar') {
      const r = G.finalizarTreino({ now, doc: dados(t), tempo: d.tempo });
      tx.set(ref, r.doc);
      if (r.resp.valido && Number(d.multas) > 0) {
        const m = G.registrarMultas(dados(cart), Math.min(Number(d.multas), G.maxMultas(r.resp.tempo)), r.sessao.carro || r.sessao.cat, r.sessao.cat, 'treino', now);
        if (m.novas) tx.set(db.doc('carteira/' + uid), m.carteira);
        r.resp.multas = m.novas;
        if (m.novas) cart.__c = m.carteira;
      }
      if (r.resp.valido && Number(d.segExtra) > 0) {
        const s = G.creditarSeguros(cart.__c || dados(cart), d.segExtra, r.resp.tempo, 'treino', now);
        if (s.creditos) { tx.set(db.doc('carteira/' + uid), s.carteira); r.resp.segCreditos = s.creditos; }
      }
      return r.resp;
    }
    throw new HttpsError('invalid-argument', 'Operação desconhecida.');
  }));
});

/* ================== DUELOS (melhor de 3 corridas, valendo créditos ou carro) ==================
   Tudo gravado só aqui: o convite, as apostas reservadas, as corridas e a entrega do prêmio. */
exports.duelo = onCall((req) => {
  const uid = uidDe(req);
  const d = req.data || {};
  const op = String(d.op || '');
  return rodar(async () => db.runTransaction(async (tx) => {
    const now = Date.now();
    const eu = dados(await tx.get(db.doc('jogadores/' + uid)));
    if (!eu || eu.status !== 'ativo') throw new HttpsError('permission-denied', 'Seu cadastro ainda não foi aprovado.');
    const apelido = (j) => (j && (j.apelido || String(j.nome || '').split(/\s+/)[0])) || '';
    const anunciadosDe = async (u) => (await tx.get(db.collection('anuncios').where('vendedor', '==', u))).docs.map((x) => x.data()).filter((a) => a.status === 'ativo').map((a) => a.iid);
    // lê as carteiras e garagens dos dois lados de um duelo
    const lerLados = async (du) => {
      const s = await Promise.all([du.de, du.para].flatMap((u) => [tx.get(db.doc('carteira/' + u)), tx.get(db.doc('garagens/' + u))]));
      return { carts: { de: dados(s[0]) || {}, para: dados(s[2]) || {} }, gars: { de: dados(s[1]) || { carros: {} }, para: dados(s[3]) || { carros: {} } } };
    };
    const gravarLados = (du, carts, gars) => {
      tx.set(db.doc('carteira/' + du.de), carts.de); tx.set(db.doc('carteira/' + du.para), carts.para);
      tx.set(db.doc('garagens/' + du.de), gars.de); tx.set(db.doc('garagens/' + du.para), gars.para);
    };

    if (op === 'desafiar') {
      const para = String(d.para || '');
      const outro = dados(await tx.get(db.doc('jogadores/' + para)));
      const meus = await tx.get(db.collection('duelos').where('uids', 'array-contains', uid));
      const abertos = meus.docs.map((x) => x.data()).filter((x) => G.duelAtivo(x));
      const st = await lerSaldo(tx, uid);
      const anunciados = await anunciadosDe(uid);
      const ref = db.collection('duelos').doc();
      const r = G.desafiar({ id: ref.id, now, uid, ap: apelido(eu), para, paraAp: apelido(outro), paraAtivo: !!outro && outro.status === 'ativo', aposta: d.aposta, st, anunciados,
        meusAtivos: abertos.length, entreNos: abertos.some((x) => x.uids.indexOf(para) >= 0) });
      tx.set(ref, r.doc); tx.set(db.doc('carteira/' + uid), r.carteira); tx.set(db.doc('garagens/' + uid), r.garagem);
      return { id: ref.id };
    }
    const ref = db.doc('duelos/' + String(d.id || ''));
    const du = dados(await tx.get(ref));
    if (!du) throw new HttpsError('not-found', 'Duelo não encontrado.');

    if (op === 'aceitar') {
      const st = await lerSaldo(tx, uid);
      const anunciados = await anunciadosDe(uid);
      const r = G.aceitar({ id: ref.id, now, uid, d: du, aposta: d.aposta, st, anunciados });
      tx.set(ref, r.doc); tx.set(db.doc('carteira/' + uid), r.carteira); tx.set(db.doc('garagens/' + uid), r.garagem);
      return { ok: true };
    }
    if (op === 'recusar' || op === 'cancelar') {
      if (op === 'recusar' && du.para !== uid) throw new HttpsError('permission-denied', 'Esse desafio não é para você.');
      if (op === 'cancelar' && du.de !== uid) throw new HttpsError('permission-denied', 'Só quem desafiou pode cancelar.');
      const [c, g] = await Promise.all([tx.get(db.doc('carteira/' + du.de)), tx.get(db.doc('garagens/' + du.de))]);
      const r = G.desfazer({ now, d: du, motivo: op === 'recusar' ? 'recusado' : 'cancelado', cartDe: dados(c), garDe: dados(g) });
      tx.set(ref, r.doc); tx.set(db.doc('carteira/' + du.de), r.carteira); tx.set(db.doc('garagens/' + du.de), r.garagem);
      return { ok: true };
    }
    if (op === 'iniciar') {
      const g = dados(await tx.get(db.doc('garagens/' + uid)));
      const r = G.iniciarDuelo({ now, uid, d: du, n: d.n, carro: String(d.carro || ''), garagem: g });
      tx.set(ref, r.doc);
      return r.resp;
    }
    if (op === 'finalizar' || op === 'atualizar') {
      if (!G.lado(du, uid)) throw new HttpsError('permission-denied', 'Esse duelo não é seu.');
      const lados = await lerLados(du);
      let doc = du, resp = {};
      if (op === 'finalizar') {
        const f = G.finalizarDuelo({ now, uid, d: du, n: d.n, tempo: d.tempo });
        doc = f.doc; resp = { tempo: f.tempo, valido: f.valido };
        const nm = Math.floor(Number(d.multas) || 0);
        if (nm > 0 && f.valido) {
          const lado = G.lado(du, uid), x = doc.corridas[lado][Math.floor(Number(d.n))];
          const m = G.registrarMultas(lados.carts[lado], Math.min(nm, G.maxMultas(f.tempo)), x.carro, x.cat, 'duelo', now);
          if (m.novas) { lados.carts[lado] = m.carteira; resp.multas = m.novas; }
        }
        if (Number(d.segExtra) > 0 && f.valido) {
          const lado = G.lado(du, uid), s = G.creditarSeguros(lados.carts[lado], d.segExtra, f.tempo, 'duelo', now);
          if (s.creditos) { lados.carts[lado] = s.carteira; resp.segCreditos = s.creditos; }
        }
      }
      if (doc.status === 'pendente' && now > doc.prazo) {
        const r = G.desfazer({ now, d: doc, motivo: 'expirado', cartDe: lados.carts.de, garDe: lados.gars.de });
        doc = r.doc; lados.carts.de = r.carteira; lados.gars.de = r.garagem;
      }
      const liq = G.liquidarDuelo(doc, lados.carts, lados.gars, now);
      if (liq) { doc = liq.doc; lados.carts = liq.carteiras; lados.gars = liq.garagens; }
      tx.set(ref, doc); gravarLados(doc, lados.carts, lados.gars);
      resp.status = doc.status; resp.vencedor = doc.vencedor || ''; resp.placar = G.placarDuelo(doc, now);
      return resp;
    }
    throw new HttpsError('invalid-argument', 'Operação desconhecida.');
  }));
});
