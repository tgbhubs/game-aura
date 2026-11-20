// Ajuste único das áreas: a antiga "ConectCar" vira "Diretoria" (mesmo id, as pessoas continuam nela)
// e entram as áreas da estrutura funcional da ConectCar. Pode rodar de novo sem duplicar.
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'game-aura-59bf8' });
const db = admin.firestore();
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const NOVAS = ['Dados, Marketing e CRM', 'Operações', 'Finanças', 'Negócios e Produtos', 'Pessoas e Agilidade', 'Tecnologia', 'Jurídico, Compliance e Riscos'];
(async () => {
  const snap = await db.collection('areas').get();
  const areas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log('Antes:', areas.map((a) => `${a.id}=${a.nome} (${a.status})`).join(' | '));
  const cc = areas.find((a) => norm(a.nome) === 'conectcar');
  if (cc) { await db.doc('areas/' + cc.id).set({ nome: 'Diretoria', status: 'ativa' }, { merge: true }); console.log('Renomeada:', cc.id, '-> Diretoria'); }
  else console.log('Área ConectCar não encontrada (talvez já renomeada).');
  for (const nome of NOVAS) {
    if (areas.some((a) => norm(a.nome) === norm(nome))) { console.log('Já existe:', nome); continue; }
    await db.doc('areas/' + slug(nome)).set({ nome, status: 'ativa', criadaEm: Date.now() }, { merge: true });
    console.log('Criada:', nome);
  }
  const fim = await db.collection('areas').get();
  console.log('Depois:', fim.docs.map((d) => `${d.id}=${d.data().nome} (${d.data().status})`).join(' | '));
})().catch((e) => { console.error(e); process.exit(1); });
