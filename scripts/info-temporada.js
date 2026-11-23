// Leitura apenas: mostra as temporadas (início, semanas, fim) e quantas pessoas pontuaram
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'game-aura-59bf8' });
const db = admin.firestore();
const dia = (ms) => new Date(ms - 3 * 3600000).toISOString().slice(0, 10);
(async () => {
  const ts = await db.collection('temporadas').get();
  for (const d of ts.docs) {
    const t = d.data(), fim = t.inicio + t.semanas * 7 * 86400000 - 1;
    const rods = await db.collection('rodadas').where('temporadaId', '==', d.id).get();
    console.log(JSON.stringify({ id: d.id, nome: t.nome, status: t.status, inicio: dia(t.inicio), semanas: t.semanas, fim: dia(fim), rodadas: rods.size }));
  }
  const jog = await db.collection('jogadores').where('status', '==', 'ativo').get();
  console.log('jogadores ativos:', jog.size);
})().catch((e) => { console.error(e); process.exit(1); });
// duelos (leitura): status, prazo e corridas de cada lado
(async () => {
  const ds = await db.collection('duelos').get();
  const dh = (ms) => ms ? new Date(ms - 3 * 3600000).toISOString().slice(5, 16).replace('T', ' ') : '-';
  ds.docs.forEach((x) => { const d = x.data(); console.log('DUELO', x.id, d.ap.de, 'x', d.ap.para, d.status, 'criado', dh(d.criadoEm), 'aceito', dh(d.aceitoEm), 'prazo', dh(d.prazo), 'fim', dh(d.fimEm),
    'de:', JSON.stringify((d.corridas.de || []).map((c) => c && { t: c.t, ini: dh(c.inicio) })), 'para:', JSON.stringify((d.corridas.para || []).map((c) => c && { t: c.t, ini: dh(c.inicio) })), 'placar', JSON.stringify(d.placar), 'venceu', JSON.stringify(d.venceu)); });
})();
