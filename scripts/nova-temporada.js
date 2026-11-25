// Virada para a Temporada 2 (roda sozinho em 30/11 00:05 de Brasília; idempotente).
// Encerra a Temporada 1 na semana 3 (apaga as rodadas futuras dela), cria a Temporada 2 com 8 semanas,
// monta as rodadas sorteando as perguntas ativas e passa a Temporada 2 a ser a ativa.
// Créditos, carros, multas, duelos e Placa! não são tocados. SECO=1 só mostra o que faria.
const admin = require('firebase-admin');
const L = require('./logica');
admin.initializeApp({ projectId: 'game-aura-59bf8' });
const db = admin.firestore();
const SECO = process.env.SECO === '1';
const T1 = 'T20261109', INICIO2 = Date.UTC(2026, 10, 30, 3), SEMANAS = 8;
const dia = (ms) => new Date(ms - 3 * 3600000).toISOString().slice(0, 10);
(async () => {
  if (!SECO && Date.now() < INICIO2 - 10 * 60000) { console.log('Ainda não é 30/11. Nada feito.'); return; }
  const inicio = L.inicioSemana(INICIO2 + 12 * 3600000);
  const tid = 'T' + new Date(inicio - 3 * 3600000).toISOString().slice(0, 10).replace(/-/g, '');
  const cfg = (await db.doc('config/geral').get()).data() || {};
  if (cfg.temporadaAtiva === tid) { console.log('Temporada 2 já está ativa (' + tid + '). Nada feito.'); return; }
  const t1 = (await db.doc('temporadas/' + T1).get()).data();
  if (!t1) throw new Error('Temporada 1 não encontrada');
  const rods = await db.collection('rodadas').where('temporadaId', '==', T1).get();
  const futuras = rods.docs.filter((d) => d.data().inicio >= INICIO2);
  const pergs = await db.collection('perguntas').get();
  const lista = pergs.docs.filter((d) => d.data().ativa !== false).map((d) => ({ id: d.id, tema: d.data().tema, ativa: true }));
  const ns = []; for (let n = 1; n <= SEMANAS; n++) ns.push(n);
  const m = L.montarRodadas({ perguntas: lista, ns, mix: t1.mix, seed: Math.floor(Math.random() * 1e9) });
  console.log(JSON.stringify({ seco: SECO, t1: { semanasAntes: t1.semanas, semanasDepois: 3, rodadasFuturasApagadas: futuras.map((d) => d.id) },
    t2: { id: tid, inicio: dia(inicio), semanas: SEMANAS, fim: dia(inicio + SEMANAS * 7 * 86400000 - 1), k: t1.k, perguntasAtivas: lista.length,
      rodadas: m.map((x) => x.n + ':' + x.ids.length) } }, null, 1));
  if (SECO) return;
  const b = db.batch();
  b.set(db.doc('temporadas/' + T1), { status: 'encerrada', encerradaEm: Date.now(), semanas: 3, semanasPrevistas: t1.semanas }, { merge: true });
  futuras.forEach((d) => { b.delete(d.ref); b.delete(db.doc('gabarito/' + d.id)); });
  b.set(db.doc('temporadas/' + tid), { nome: 'Temporada 2', inicio, semanas: SEMANAS, k: t1.k, mix: t1.mix, status: 'ativa', criadaEm: Date.now(), criadaPor: 'automatico' });
  const porId = {}; pergs.docs.forEach((d) => { porId[d.id] = d.data(); });
  m.forEach((x) => {
    if (!x.ids.length) return;
    const rid = tid + '_R' + String(x.n).padStart(2, '0'), ini = inicio + (x.n - 1) * 7 * 86400000, g = {};
    x.ids.forEach((id) => { const p = porId[id]; g[id] = { texto: p.texto, alts: p.alts, correta: p.correta, tema: p.tema }; });
    b.set(db.doc('rodadas/' + rid), { temporadaId: tid, n: x.n, inicio: ini, fim: ini + 7 * 86400000 - 1000, seed: Math.floor(Math.random() * 1e9), total: x.ids.length });
    b.set(db.doc('gabarito/' + rid), { temporadaId: tid, perguntas: g });
  });
  b.set(db.doc('config/geral'), { temporadaAtiva: tid }, { merge: true });
  await b.commit();
  console.log('Temporada 2 criada e ativa.');
})().catch((e) => { console.error(e); process.exit(1); });
