// E-mails agendados do Game Aura (GitHub Actions). MODO: segunda | domingo | hora | lancamentos | teste
// segunda: rodada aberta (+ fim de temporada, se acabou); domingo: lembrete para quem não jogou a rodada;
// hora: duelos a menos de 12 h do prazo; lancamentos: dia 1º, carros novos do mês; teste: todos os modelos para o remetente.
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'game-aura-59bf8' });
const db = admin.firestore();
const G = require('./garagem');
const E = require('./email');
const L = require('./logica');
const MODO = process.env.MODO || 'teste';
const DIA = 86400000;
const pn = (j) => j.apelido || String(j.nome || '').split(/\s+/)[0];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
async function jogadores() { return (await db.collection('jogadores').get()).docs.map((d) => Object.assign({ uid: d.id }, d.data())).filter((j) => j.status === 'ativo' && j.email && j.emails !== false); }
async function lote(lista, fazer) { let n = 0; for (const j of lista) { if (await E.enviar(j.email, fazer(j))) n++; await espera(400); } return n; }
async function marca(campo, valor) { await db.doc('config/emails').set({ [campo]: valor, [campo + 'Em']: Date.now() }, { merge: true }); }
(async () => {
  const now = Date.now();
  const cfg = (await db.doc('config/geral').get()).data() || {};
  const ctl = (await db.doc('config/emails').get()).data() || {};
  const tid = cfg.temporadaAtiva, temp = tid ? (await db.doc('temporadas/' + tid).get()).data() : null;
  const rods = tid ? (await db.collection('rodadas').where('temporadaId', '==', tid).get()).docs.map((d) => Object.assign({ id: d.id }, d.data())) : [];
  const atual = rods.find((r) => now >= r.inicio && now <= r.fim);
  if (MODO === 'teste') {
    const eu = { email: 'tgbhubs@gmail.com' };
    const ms = [E.boasVindas('Tarcísio'), E.desafio('Dirceu', '40 créditos', 48), E.dueloAceito('Dirceu', '30 créditos'), E.dueloPrazo('Dirceu', 2),
      E.dueloResultado('venceu', 'Dirceu', '2×1', '30 créditos'), E.carroVendido('Besouro', 380, 'Suelen'), E.rodadaAberta('Tarcísio', 1, 'Temporada 2', 'domingo, 06/12, às 23h59', 8),
      E.lembrete('Tarcísio', 1), E.lancamentos([{ nome: 'Vento F', tipo: 'Hipercarro', preco: 2100 }, { nome: 'Serra 7', tipo: 'SUV', preco: 650 }], 'dezembro'),
      E.fimTemporada('Tarcísio', 'Temporada 2', [{ nome: 'Suelen', pts: 1520 }, { nome: 'Dirceu', pts: 1490 }, { nome: 'Tarcísio', pts: 1410 }], { pos: 3, pts: 1410 }, true)];
    let n = 0; for (const m of ms) { m.assunto = '[teste] ' + m.assunto; if (await E.enviar(eu.email, m)) n++; await espera(400); }
    console.log('teste: enviados', n, 'de', ms.length); if (!n) process.exit(1); return;
  }
  if (MODO === 'segunda') {
    // fim de temporada: a anterior encerrada normalmente (não a de teste, cortada antes da hora)
    const temps = (await db.collection('temporadas').get()).docs.map((d) => Object.assign({ id: d.id }, d.data()));
    for (const t of temps) {
      if (t.status !== 'encerrada' || t.semanasPrevistas || ctl['fim_' + t.id]) continue;
      if (now - (t.encerradaEm || 0) > 8 * DIA) { await marca('fim_' + t.id, 'antiga'); continue; }
      const pl = (await db.collection('placar').get()).docs.map((d) => d.data()).filter((x) => x.temporadaId === t.id);
      const soma = {}, k = t.k || 40;
      pl.forEach((x) => Object.keys(x.p || {}).forEach((u) => { const e = x.p[u]; if (!(e.qf || typeof e.q === 'number' || (e.tn || 0) > 0)) return; soma[u] = (soma[u] || 0) + (e.q || 0) * 10 + L.curva(e.c || 0, k); }));
      const js = await jogadores(), nomes = {}; (await db.collection('jogadores').get()).docs.forEach((d) => { nomes[d.id] = pn(d.data()); });
      const rk = Object.keys(soma).sort((a, b) => soma[b] - soma[a]);
      const top = rk.slice(0, 5).map((u) => ({ nome: nomes[u] || '—', pts: Math.round(soma[u]) }));
      const n = await lote(js, (j) => { const i = rk.indexOf(j.uid); return E.fimTemporada(pn(j), t.nome, top, i >= 0 ? { pos: i + 1, pts: Math.round(soma[j.uid]) } : null, true); });
      await marca('fim_' + t.id, n); console.log('fim de temporada', t.id, 'enviados', n);
    }
    if (!atual || ctl.rodadaAberta === atual.id) { console.log('sem rodada nova'); return; }
    const fim = new Date(atual.fim - 3 * 3600000), fimTxt = 'domingo, ' + String(fim.getUTCDate()).padStart(2, '0') + '/' + String(fim.getUTCMonth() + 1).padStart(2, '0') + ', às 23h59';
    const n = await lote(await jogadores(), (j) => E.rodadaAberta(pn(j), atual.n, temp ? temp.nome : 'temporada', fimTxt, temp ? temp.semanas : 0));
    await marca('rodadaAberta', atual.id); console.log('rodada aberta', atual.id, 'enviados', n); return;
  }
  if (MODO === 'domingo') {
    if (!atual || ctl.lembrete === atual.id) { console.log('nada a lembrar'); return; }
    const pl = (await db.doc('placar/' + atual.id).get()).data() || {}, P = pl.p || {};
    const faltam = (await jogadores()).filter((j) => { const e = P[j.uid]; return !(e && (e.qf || typeof e.q === 'number' || (e.tn || 0) > 0)); });
    const n = await lote(faltam, (j) => E.lembrete(pn(j), atual.n));
    await marca('lembrete', atual.id); console.log('lembrete', atual.id, 'enviados', n, 'de', faltam.length); return;
  }
  if (MODO === 'hora') {
    const ds = (await db.collection('duelos').where('status', '==', 'andamento').get()).docs;
    let n = 0;
    for (const doc of ds) {
      const du = doc.data(); if (du.aviso12 || du.prazo - now > 12 * 3600000 || du.prazo < now) continue;
      await doc.ref.set({ aviso12: now }, { merge: true });
      for (const s of ['de', 'para']) {
        const faltam = (du.corridas[s] || []).filter((x) => !x || !x.fim).length; if (!faltam) continue;
        const j = (await db.doc('jogadores/' + du[s]).get()).data();
        if (j && j.status === 'ativo' && j.emails !== false && j.email && await E.enviar(j.email, E.dueloPrazo(du.ap[s === 'de' ? 'para' : 'de'], faltam))) n++;
      }
    }
    console.log('avisos de prazo de duelo', n); return;
  }
  if (MODO === 'lancamentos') {
    const l = G.lancamentos(now); if (!l.doMes || ctl.lancamentos === l.mes) { console.log('sem lançamentos novos'); return; }
    const carros = l.cats.map((c) => ({ nome: G.CATALOGO[c].nome, tipo: G.CATALOGO[c].tipo, preco: G.CATALOGO[c].preco }));
    const mesTxt = MESES[Number(l.mes.slice(5, 7)) - 1];
    const n = await lote(await jogadores(), () => E.lancamentos(carros, mesTxt));
    await marca('lancamentos', l.mes); console.log('lançamentos', l.mes, 'enviados', n); return;
  }
  console.log('modo desconhecido', MODO);
})().catch((e) => { console.error(e); process.exit(1); });
