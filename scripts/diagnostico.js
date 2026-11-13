// Diagnóstico rápido do Game Aura (só leitura). Rodar no Cloud Shell, dentro de game-aura/functions:
//   node ../scripts/diagnostico.js
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'game-aura-59bf8' });
const db = admin.firestore();
(async () => {
  const cfg = (await db.doc('config/geral').get()).data() || {};
  const tid = cfg.temporadaAtiva || '';
  console.log('Temporada ativa:', tid || '(nenhuma)');
  const temps = await db.collection('temporadas').get();
  temps.forEach((d) => console.log('  temporada', d.id, '|', d.data().nome, '|', d.data().status || ''));
  const jog = await db.collection('jogadores').get();
  const st = {};
  jog.forEach((d) => { const s = d.data().status || '?'; st[s] = (st[s] || 0) + 1; });
  console.log('Pessoas por status:', JSON.stringify(st));
  jog.forEach((d) => { const j = d.data(); if (j.status !== 'ativo') console.log('  não ativo:', j.apelido || j.nome, '|', j.status); });
  const agora = Date.now();
  const rods = await db.collection('rodadas').where('temporadaId', '==', tid).get();
  rods.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.n - b.n).forEach((r) => {
    if (agora >= r.inicio && agora <= r.fim) console.log('Rodada atual:', r.n, r.id, new Date(r.inicio).toISOString(), '→', new Date(r.fim).toISOString());
  });
  const plac = await db.collection('placar').get();
  plac.forEach((d) => { const p = d.data(); console.log('Placar', d.id, '| temporada', p.temporadaId, '| pessoas:', Object.keys(p.p || {}).length, Object.values(p.p || {}).map((e) => e.ap).join(', ')); });
  const quiz = await db.collection('quiz').get();
  const cor = await db.collection('corrida').get();
  console.log('Quiz iniciados:', quiz.size, '| Corridas (tentativas registradas):', cor.size);
  quiz.forEach((d) => { const q = d.data(); console.log('  quiz', q.uid, '| rodada', q.rodadaId, '| temporada', q.temporadaId, '| finalizado', !!q.finalizado); });
  cor.forEach((d) => { const c = d.data(); console.log('  corrida', c.uid, '| rodada', c.rodadaId, '| temporada', c.temporadaId, '| tentativa', c.n, c.status); });
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
