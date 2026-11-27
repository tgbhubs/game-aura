/* Garagem Aura — catálogo, créditos e lojas (compartilhado: Cloud Functions + modo demonstração).
   Mantenha idêntico ao bloco "GARAGEM" do index.html. */
(function (root) {
  var G = {};
  var L = (typeof module !== 'undefined' && module.exports) ? require('./logica') : root.Logica;

  // atributos só valem no treino: faixa = agilidade para trocar de faixa (maior é melhor),
  // pneu = gasto do pneu (menor é melhor), seguro = vidas com que você larga
  G.CATALOGO = {
    'aura':            { nome: 'Aura',              modelo: 'aura',     cor: 0x2F7FE0, preco: 0,    tipo: 'Sedã',      atr: { faixa: 1.00, pneu: 1.00, seguro: 0 } },
    'conceito':        { nome: 'Conceito',          modelo: 'conceito', cor: 0xB04600, preco: 0,    tipo: 'Esportivo', atr: { faixa: 1.10, pneu: 1.00, seguro: 0, eletrico: true } },
    'cyberpunk':       { nome: 'Cyberpunk',         modelo: 'cyberpunk', cor: null,    preco: 0,    tipo: 'Muscle',    atr: { faixa: 1.10, pneu: 1.00, seguro: 0, eletrico: true } },
    'hatch-verde':     { nome: 'Hatch Verde',       modelo: 'hatch',    cor: 0x17935F, preco: 300,  tipo: 'Hatch',     atr: { faixa: 1.10, pneu: 0.95, seguro: 0 }, fora: true },
    'hatch-branco':    { nome: 'Hatch Branco',      modelo: 'hatch',    cor: 0xE9E7E1, preco: 300,  tipo: 'Hatch',     atr: { faixa: 1.10, pneu: 0.95, seguro: 0 }, fora: true },
    'sedan-grafite':   { nome: 'Sedã Grafite',      modelo: 'aura',     cor: 0x3A3F4B, preco: 350,  tipo: 'Sedã',      atr: { faixa: 1.05, pneu: 0.85, seguro: 0 }, fora: true },
    'sedan-prata':     { nome: 'Sedã Prata',        modelo: 'aura',     cor: 0xB9BEC6, preco: 350,  tipo: 'Sedã',      atr: { faixa: 1.05, pneu: 0.85, seguro: 0 }, fora: true },
    'suv-areia':       { nome: 'SUV Areia',         modelo: 'suv',      cor: 0xCDBB98, preco: 550,  tipo: 'SUV',       atr: { faixa: 1.05, pneu: 0.80, seguro: 1 }, fora: true },
    'suv-porto':       { nome: 'SUV Azul Porto',    modelo: 'suv',      cor: 0x499EF2, preco: 650,  tipo: 'SUV',       atr: { faixa: 1.10, pneu: 0.80, seguro: 1 }, fora: true },
    'picape-laranja':  { nome: 'Picape Laranja',    modelo: 'picape',   cor: 0xEC7000, preco: 600,  tipo: 'Picape',    atr: { faixa: 1.05, pneu: 0.75, seguro: 1 }, fora: true },
    'picape-marinho':  { nome: 'Picape Marinho',    modelo: 'picape',   cor: 0x1C398E, preco: 600,  tipo: 'Picape',    atr: { faixa: 1.05, pneu: 0.75, seguro: 1 }, fora: true },
    'conceito-marinho':{ nome: 'Conceito Marinho',  modelo: 'conceito', cor: 0x14235E, preco: 900,  tipo: 'Esportivo', atr: { faixa: 1.40, pneu: 1.05, seguro: 0, eletrico: true } },
    'conceito-branco': { nome: 'Conceito Branco',   modelo: 'conceito', cor: 0xE9E7E1, preco: 950,  tipo: 'Esportivo', atr: { faixa: 1.40, pneu: 1.05, seguro: 0, eletrico: true } },
    // modelos 3D detalhados (nomes fictícios; créditos dos autores na aba Regras)
    'besouro':         { nome: 'Besouro',           modelo: 'besouro',   cor: null, preco: 400,  tipo: 'Clássico',  atr: { faixa: 1.10, pneu: 0.85, seguro: 0 }, lancado: '2026-11' },
    'perua':           { nome: 'Perua Retrô',       modelo: 'perua',     cor: null, preco: 500,  tipo: 'Clássico',  atr: { faixa: 1.00, pneu: 0.75, seguro: 1 }, lancado: '2026-11' },
    'diplomata':       { nome: 'Diplomata 87',      modelo: 'diplomata', cor: null, preco: 700,  tipo: 'Clássico',  atr: { faixa: 1.10, pneu: 0.85, seguro: 1 }, lancado: '2026-11' },
    'serpente':        { nome: 'Serpente GTS',      modelo: 'serpente',  cor: null, preco: 1100, tipo: 'Muscle',    atr: { faixa: 1.40, pneu: 1.05, seguro: 0 }, lancado: '2026-11' },
    'granturismo':     { nome: 'Gran Turismo',      modelo: 'granturismo', cor: null, preco: 1200, tipo: 'Esportivo', atr: { faixa: 1.35, pneu: 0.95, seguro: 1 }, lancado: '2026-11' },
    'gaivota':         { nome: 'Asa de Gaivota',    modelo: 'gaivota',   cor: null, preco: 1300, tipo: 'Esportivo', atr: { faixa: 1.45, pneu: 1.05, seguro: 0 }, lancado: '2026-11' },
    'felino':          { nome: 'Felino X',          modelo: 'felino',    cor: null, preco: 1350, tipo: 'Superesportivo', atr: { faixa: 1.50, pneu: 1.05, seguro: 0 }, lancado: '2026-11' },
    'neon':            { nome: 'Conceito Neon',     modelo: 'neon',      cor: null, preco: 1400, tipo: 'Conceito',  atr: { faixa: 1.55, pneu: 1.00, seguro: 1, eletrico: true }, lancado: '2026-11' },
    'veloce':          { nome: 'Veloce Pista',      modelo: 'veloce',    cor: null, preco: 1500, tipo: 'Superesportivo', atr: { faixa: 1.55, pneu: 1.00, seguro: 1 }, lancado: '2026-11' },
    'touro':           { nome: 'Touro SV',          modelo: 'touro',     cor: null, preco: 1600, tipo: 'Superesportivo', atr: { faixa: 1.60, pneu: 1.00, seguro: 1 }, lancado: '2026-11' },
    'viajante':        { nome: 'Viajante 88',       modelo: 'viajante',  cor: null, preco: 450,  tipo: 'Clássico',  atr: { faixa: 1.00, pneu: 0.80, seguro: 1 }, lancado: '2026-11' },
    'roadster':        { nome: 'Serpente Roadster', modelo: 'roadster',  cor: null, preco: 1000, tipo: 'Muscle',    atr: { faixa: 1.35, pneu: 1.05, seguro: 0 }, lancado: '2026-11' },
    'trilha':          { nome: 'Conceito Trilha',   modelo: 'trilha',    cor: null, preco: 1250, tipo: 'Conceito',  atr: { faixa: 1.40, pneu: 0.80, seguro: 1, eletrico: true }, lancado: '2026-11' },
    'hatch-e':         { nome: 'Hatch E',           modelo: 'hatch',     cor: 0x7FD3F5, preco: 480,  tipo: 'Elétrico',  atr: { faixa: 1.25, pneu: 0.95, seguro: 0, eletrico: true }, lancado: '2026-11', fora: true },
    'suv-e':           { nome: 'SUV Porto E',       modelo: 'suv',       cor: 0x2FB8A6, preco: 820,  tipo: 'Elétrico',  atr: { faixa: 1.20, pneu: 0.80, seguro: 1, eletrico: true }, lancado: '2026-11', fora: true },
    // lançamentos de dezembro (só aparecem à venda a partir de 01/12)
    'rali':            { nome: 'Rali Evo',          modelo: 'rali',      cor: null, preco: 1150, tipo: 'Rali',      atr: { faixa: 1.40, pneu: 0.85, seguro: 1 }, lancado: '2026-12' },
    'hibrido':         { nome: 'Híbrido 90',        modelo: 'hibrido',   cor: null, preco: 1800, tipo: 'Superesportivo', atr: { faixa: 1.65, pneu: 1.00, seguro: 1, eletrico: true }, lancado: '2026-12' },
    'serra':           { nome: 'Serra 7',           modelo: 'serra',     cor: null, preco: 650,  tipo: 'SUV',       atr: { faixa: 1.15, pneu: 0.75, seguro: 1 }, lancado: '2026-12' },
    'berlinetta':      { nome: 'Berlinetta 94',     modelo: 'berlinetta', cor: null, preco: 1050, tipo: 'Clássico',  atr: { faixa: 1.38, pneu: 0.95, seguro: 0 }, lancado: '2026-12' },
    'samurai':         { nome: 'Samurai R',         modelo: 'samurai',   cor: null, preco: 1250, tipo: 'Esportivo', atr: { faixa: 1.45, pneu: 0.95, seguro: 1 }, lancado: '2026-12' },
    'trovao':          { nome: 'Trovão EV',         modelo: 'trovao',    cor: null, preco: 1300, tipo: 'Picape',    atr: { faixa: 1.30, pneu: 0.75, seguro: 1, eletrico: true }, lancado: '2026-12' },
    'brisa':           { nome: 'Brisa GT',          modelo: 'brisa',     cor: null, preco: 1450, tipo: 'Conversível', atr: { faixa: 1.50, pneu: 1.00, seguro: 1 }, lancado: '2026-12' },
    'patrulha':        { nome: 'Patrulha 50',       modelo: 'patrulha',  cor: null, preco: 1700, tipo: 'Viatura',   atr: { faixa: 1.62, pneu: 1.00, seguro: 1 }, lancado: '2026-12' },
    'vento':           { nome: 'Vento F',           modelo: 'vento',     cor: null, preco: 2100, tipo: 'Hipercarro', atr: { faixa: 1.72, pneu: 1.05, seguro: 0 }, lancado: '2026-12' },
    'monoposto':       { nome: 'Monoposto F',       modelo: 'monoposto', cor: null, preco: 2000, tipo: 'Fórmula',   atr: { faixa: 1.75, pneu: 0.95, seguro: 1 }, lancado: '2026-11' }
  };
  G.BASE = ['aura', 'conceito', 'cyberpunk'];
  // fora: true = modelo genérico fora de linha (não vende mais 0 km nem entra nos lotes de retomados; quem já tem continua usando e pode revender)
  G.foraDeLinha = function (cat) { return !!(G.CATALOGO[cat] && G.CATALOGO[cat].fora); };
  // showroom do 0 km: lançamentos do mês (campo lancado = 'AAAA-MM'); se o mês não tem lançamento, mostra o mais recente
  G.mesId = function (now) { return new Date(now - 3 * 3600000).toISOString().slice(0, 7); };
  G.lancamentos = function (now) {
    var mes = G.mesId(now), todos = Object.keys(G.CATALOGO).filter(function (k) { return G.CATALOGO[k].lancado && G.CATALOGO[k].lancado <= mes && !G.CATALOGO[k].fora; });
    if (!todos.length) return { mes: mes, cats: [], doMes: false };
    var ult = todos.map(function (k) { return G.CATALOGO[k].lancado; }).sort().pop();
    return { mes: ult, doMes: ult === mes, cats: todos.filter(function (k) { return G.CATALOGO[k].lancado === ult; }).sort(function (a, b) { return G.CATALOGO[b].preco - G.CATALOGO[a].preco; }) };
  };
  // à venda no mês: tira os grátis, os fora de linha e os lançamentos de meses que ainda não chegaram
  G.venda = function (now) { var mes = G.mesId(now || Date.now()); return Object.keys(G.CATALOGO).filter(function (k) { var c = G.CATALOGO[k]; return G.BASE.indexOf(k) < 0 && !c.fora && !(c.lancado && c.lancado > mes); }); };
  G.VENDA = G.venda(Date.now());
  G.PONTOS_VITORIA_PLACA = 30;
  G.TREINO_PROP = 0.4;          // treino rende 40% dos pontos que o tempo valeria na rodada…
  G.TREINO_EXTRA_APOS = 180;    // …e, sem teto, +1 crédito a cada 15 s depois dos 3 minutos
  G.TREINO_EXTRA_CADA = 15;
  G.BONUS_ELETRICO = 0.15;      // carro elétrico rende +15% de créditos no treino e nos duelos
  G.ehEletrico = function (cat) { return !!(G.CATALOGO[cat] && G.CATALOGO[cat].atr.eletrico); };
  G.creditosTreino = function (tempo, cat) {
    tempo = Number(tempo) || 0;
    var c = Math.round(L.curva(tempo, 40) * G.TREINO_PROP) + Math.max(0, Math.floor((tempo - G.TREINO_EXTRA_APOS) / G.TREINO_EXTRA_CADA));
    return G.ehEletrico(cat) ? Math.round(c * (1 + G.BONUS_ELETRICO)) : c;
  };
  // corrida de duelo: rende créditos como um treino, com 40% a mais
  G.DUELO_PROP = 1.4;
  G.creditosDuelo = function (tempo, cat) { return Math.round(G.creditosTreino(tempo, cat) * G.DUELO_PROP); };
  G.creditarCorridaDuelo = function (cart0, tempo, cat, adv, now) {
    var v = G.creditosDuelo(tempo, cat), cart = L.clone(cart0 || {});
    if (v > 0) { cart.recebido = (cart.recebido || 0) + v; mov(cart, { t: now, v: v, d: 'Corrida de duelo com ' + adv + ' (' + (Math.round(tempo * 10) / 10) + ' s)' }); }
    return { carteira: cart, creditos: v };
  };
  G.TREINO_LIMITE_DIA = Infinity; // sem limite: créditos não mexem no ranking e incentivam compra e venda
  G.dia = function (now) { return new Date(now - 3 * 3600000).toISOString().slice(0, 10); };
  G.LOTE = 5;
  G.PRECO_MIN = 50; G.PRECO_MAX = 5000;
  G.taxa = function (preco) { return Math.max(5, Math.round(preco * 0.05)); };

  // ---------- créditos ----------
  // ganhos = pontos de todas as rodadas jogadas (quiz + corrida) + 30 por vitória no Placa! contra pessoas
  G.ganhos = function (uid, placares, temporadas, vitoriasPlaca, creditosTreino) {
    var total = 0;
    (placares || []).forEach(function (p) {
      var e = p && p.p && p.p[uid]; if (!e) return;
      var k = ((temporadas || {})[p.temporadaId] || {}).k || 40;
      total += (e.q || 0) * 10 + L.curva(e.c || 0, k);
    });
    return total + (vitoriasPlaca || 0) * G.PONTOS_VITORIA_PLACA + (creditosTreino || 0);
  };
  G.saldo = function (ganhos, carteira) { var c = carteira || {}; return ganhos + (c.recebido || 0) - (c.gasto || 0); };
  function mov(c, m) { c.mov = [m].concat(c.mov || []).slice(0, 30); }

  // ---------- lote semanal de Retomados Itaú e Porto ----------
  // origem de cada carro do lote: Itaú (retomada de financiamento) ou Porto (recuperado do seguro); lotes antigos sem o campo usam o id
  G.ORIGENS = { itau: 'Itaú', porto: 'Porto' };
  G.origemRetomado = function (it) { return (it && (it.origem === 'itau' || it.origem === 'porto')) ? it.origem : (L.hash(String(it && it.id)) % 2 ? 'itau' : 'porto'); };
  G.semana = function (now) { return 'S' + new Date(L.inicioSemana(now)).toISOString().slice(0, 10); };
  G.lote = function (now) {
    var sid = G.semana(now), r = L.rng(L.hash('retomados|' + sid)), itens = [];
    var cats = L.shuffle(G.venda(now), r);
    for (var i = 0; i < G.LOTE; i++) {
      var cat = cats[i % cats.length], base = G.CATALOGO[cat].preco, desc = 0.35 + r() * 0.2;
      var idI = sid + '-' + (i + 1);
      itens.push({ id: idI, origem: G.origemRetomado({ id: idI }), cat: cat, preco: Math.round(base * (1 - desc) / 5) * 5, km: Math.round((18 + r() * 75)) * 1000, vendidoPara: '' });
    }
    return { semana: sid, itens: itens, criadoEm: now };
  };

  // lote já gravado antes de um modelo sair de linha: troca os itens ainda à venda por um modelo atual (determinístico, igual no app e no servidor)
  G.saneiaLote = function (lote) {
    if (!lote || !lote.itens) return lote;
    var mudou = false, itens = lote.itens.map(function (it) {
      if (it.vendidoPara || !G.foraDeLinha(it.cat)) return it;
      mudou = true; var h = L.hash('troca|' + it.id), vd = G.venda(lote.criadoEm || Date.now()), cat = vd[h % vd.length], desc = 0.35 + (h % 1000) / 1000 * 0.2;
      var n = L.clone(it); n.cat = cat; n.preco = Math.round(G.CATALOGO[cat].preco * (1 - desc) / 5) * 5; return n;
    });
    if (!mudou) return lote; var l2 = L.clone(lote); l2.itens = itens; return l2;
  };

  // ---------- operações (puras: recebem o estado e devolvem o que gravar) ----------
  function precisa(saldo, valor) { if (saldo < valor) L.erro('Créditos insuficientes: faltam ' + (valor - saldo) + '.'); }
  function novaInst(gar, cat, origem, km, now, de, retomadoDe) {
    var n = (gar.seq || 0) + 1; gar.seq = n;
    var iid = 'c' + n + '-' + (now % 100000).toString(36);
    gar.carros = gar.carros || {};
    gar.carros[iid] = { cat: cat, origem: origem, km: km || 0, compradoEm: now, de: de || '' };
    if (retomadoDe) gar.carros[iid].retomadoDe = retomadoDe;
    return iid;
  }
  // ---------- histórico de transações e Preço Aura ----------
  // cada compra vira um registro público (sem dados pessoais além do apelido): base para o Preço Aura
  function transacao(tipo, cat, km, preco, taxa, comprador, vendedor, now, retomadoDe) {
    var t = { tipo: tipo, cat: cat, modelo: G.CATALOGO[cat].modelo, km: km || 0, preco: preco, taxa: taxa || 0,
      comprador: comprador.uid, compradorAp: comprador.apelido || '', vendedor: vendedor ? vendedor.uid : '', vendedorAp: vendedor ? (vendedor.apelido || '') : (tipo === '0km' ? 'Concessionária' : (G.ORIGENS[retomadoDe] || 'Porto')),
      em: now, semana: G.semana(now) };
    if (retomadoDe) t.retomadoDe = retomadoDe;
    return t;
  }
  // Preço Aura de um modelo: mediana das últimas vendas de usados e retomados, ajustada para 30 mil km.
  // Com menos de 3 vendas, vira estimativa: 70% do preço 0 km.
  G.KM_REF = 30000; G.DEPREC_KM = 0.004; // 0,4% por mil km de diferença
  G.precoAura = function (cat, transacoes) {
    var c = G.CATALOGO[cat]; if (!c) return null;
    var l = (transacoes || []).filter(function (t) { return t.cat === cat && (t.tipo === 'usado' || t.tipo === 'retomado'); })
      .sort(function (a, b) { return b.em - a.em; }).slice(0, 15)
      .map(function (t) { return t.preco * (1 + G.DEPREC_KM * ((t.km || 0) - G.KM_REF) / 1000); }).sort(function (a, b) { return a - b; });
    var ultima = (transacoes || []).filter(function (t) { return t.cat === cat; }).sort(function (a, b) { return b.em - a.em; })[0];
    if (l.length < 3) return { valor: c.preco ? Math.round(c.preco * 0.7 / 5) * 5 : 0, n: l.length, estimado: true, ultima: ultima || null };
    var m = l.length % 2 ? l[(l.length - 1) / 2] : (l[l.length / 2 - 1] + l[l.length / 2]) / 2;
    return { valor: Math.round(m / 5) * 5, n: l.length, estimado: false, ultima: ultima || null };
  };
  // Preço Aura para um carro específico (ajusta pela quilometragem)
  G.precoAuraCarro = function (cat, km, transacoes) {
    var p = G.precoAura(cat, transacoes); if (!p) return 0;
    return Math.max(G.PRECO_MIN, Math.round(p.valor * (1 - G.DEPREC_KM * ((km || 0) - G.KM_REF) / 1000) / 5) * 5);
  };
  G.comprar0km = function (st, cat, now) {
    var c = G.CATALOGO[cat];
    if (!c || G.venda(now).indexOf(cat) < 0) L.erro('Carro indisponível.');
    precisa(st.saldo, c.preco);
    var gar = L.clone(st.garagem || {}), cart = L.clone(st.carteira || {});
    var iid = novaInst(gar, cat, '0km', 0, now);
    cart.gasto = (cart.gasto || 0) + c.preco; mov(cart, { t: now, v: -c.preco, d: '0 km: ' + c.nome });
    return { garagem: gar, carteira: cart, iid: iid, transacao: transacao('0km', cat, 0, c.preco, 0, st, null, now) };
  };
  G.comprarRetomado = function (st, lote, itemId, now) {
    lote = G.saneiaLote(lote);
    var it = (lote.itens || []).filter(function (x) { return x.id === itemId; })[0];
    if (!it) L.erro('Esse carro não está no lote desta semana.');
    if (it.vendidoPara) L.erro('Esse carro já foi vendido.');
    precisa(st.saldo, it.preco);
    var gar = L.clone(st.garagem || {}), cart = L.clone(st.carteira || {}), lt = L.clone(lote);
    var org = G.origemRetomado(it);
    var iid = novaInst(gar, it.cat, 'retomado', it.km, now, '', org);
    lt.itens.forEach(function (x) { if (x.id === itemId) x.vendidoPara = st.uid; });
    cart.gasto = (cart.gasto || 0) + it.preco; mov(cart, { t: now, v: -it.preco, d: 'Retomado ' + G.ORIGENS[org] + ': ' + G.CATALOGO[it.cat].nome });
    return { garagem: gar, carteira: cart, lote: lt, iid: iid, transacao: transacao('retomado', it.cat, it.km, it.preco, 0, st, null, now, org) };
  };
  G.anunciar = function (st, iid, preco, anuncios, now) {
    var car = (st.garagem && st.garagem.carros || {})[iid];
    if (!car) L.erro('Esse carro não está na sua garagem.');
    if (G.multasPendentes(st.carteira).some(function (m) { return m.carro === iid; })) L.erro('Esse carro tem multa pendente. Pague a multa antes de anunciar.');
    if (car.travado) L.erro('Esse carro está apostado num duelo.');
    preco = Math.round(Number(preco));
    if (!(preco >= G.PRECO_MIN && preco <= G.PRECO_MAX)) L.erro('O preço deve ficar entre ' + G.PRECO_MIN + ' e ' + G.PRECO_MAX + ' créditos.');
    if ((anuncios || []).some(function (a) { return a.iid === iid && a.status === 'ativo'; })) L.erro('Esse carro já está anunciado.');
    return { vendedor: st.uid, vendedorAp: st.apelido || '', iid: iid, cat: car.cat, km: car.km || 0, origem: car.origem, preco: preco, criadoEm: now, status: 'ativo', compradoPor: '' };
  };
  G.comprarUsado = function (comprador, vendedor, anuncio, now) {
    if (!anuncio || anuncio.status !== 'ativo') L.erro('Esse anúncio não está mais disponível.');
    if (anuncio.vendedor === comprador.uid) L.erro('Esse anúncio é seu.');
    var car = (vendedor.garagem && vendedor.garagem.carros || {})[anuncio.iid];
    if (!car) L.erro('O carro não está mais com o vendedor.');
    var tx = G.taxa(anuncio.preco), total = anuncio.preco + tx;
    precisa(comprador.saldo, total);
    var gc = L.clone(comprador.garagem || {}), gv = L.clone(vendedor.garagem || {});
    var cc = L.clone(comprador.carteira || {}), cv = L.clone(vendedor.carteira || {});
    delete gv.carros[anuncio.iid];
    var km = (car.km || 0) + 1000 + Math.round((L.hash(anuncio.iid + now) % 4000));
    var iid = novaInst(gc, anuncio.cat, 'usado', km, now, anuncio.vendedorAp);
    var nome = G.CATALOGO[anuncio.cat].nome;
    cc.gasto = (cc.gasto || 0) + total; mov(cc, { t: now, v: -total, d: 'Usado de ' + (anuncio.vendedorAp || 'colega') + ': ' + nome + ' (taxa ' + tx + ')' });
    cv.recebido = (cv.recebido || 0) + anuncio.preco; mov(cv, { t: now, v: anuncio.preco, d: 'Venda: ' + nome });
    var an = L.clone(anuncio); an.status = 'vendido'; an.compradoPor = comprador.uid; an.vendidoEm = now;
    return { garagemComprador: gc, garagemVendedor: gv, carteiraComprador: cc, carteiraVendedor: cv, anuncio: an, iid: iid, taxa: tx,
      transacao: transacao('usado', anuncio.cat, car.km || 0, anuncio.preco, tx, comprador, { uid: anuncio.vendedor, apelido: anuncio.vendedorAp }, now) };
  };

  // ---------- duelos: melhor de 3 corridas, cada um no seu tempo, valendo créditos ou um carro ----------
  // A aposta fica reservada ao desafiar/aceitar e vai inteira para quem vencer; empate devolve tudo.
  G.DUELO = { minCred: 5, maxCred: 100, prazoAceite: 48 * 3600000, prazoCorridas: 48 * 3600000, maxAtivos: 5 };
  G.duelAtivo = function (d) { return d && (d.status === 'pendente' || d.status === 'andamento'); };
  G.lado = function (d, uid) { return d.de === uid ? 'de' : d.para === uid ? 'para' : ''; };
  G.outro = function (lado) { return lado === 'de' ? 'para' : 'de'; };
  // valida e normaliza a aposta de um jogador (st: { saldo, garagem, carteira }, anunciados: iids anunciados)
  G.validarAposta = function (st, ap, anunciados) {
    ap = ap || {};
    if (ap.tipo === 'carro') {
      var iid = String(ap.iid || ''), car = (st.garagem && st.garagem.carros || {})[iid];
      if (!car) L.erro('Esse carro não está na sua garagem.');
      if (car.origem === 'base') L.erro('Os carros da casa não podem ser apostados.');
      if (car.travado) L.erro('Esse carro já está apostado em outro duelo.');
      if ((anunciados || []).indexOf(iid) >= 0) L.erro('Esse carro está anunciado no mercado. Cancele o anúncio para apostar.');
      if (G.multasPendentes(st.carteira).some(function (m) { return m.carro === iid; })) L.erro('Esse carro tem multa pendente.');
      return { tipo: 'carro', iid: iid, cat: car.cat, km: car.km || 0 };
    }
    var v = Math.round(Number(ap.valor));
    if (!(v >= G.DUELO.minCred && v <= G.DUELO.maxCred)) L.erro('A aposta em créditos vai de ' + G.DUELO.minCred + ' a ' + G.DUELO.maxCred + '.');
    precisa(st.saldo, v);
    return { tipo: 'creditos', valor: v };
  };
  G.apostaTxt = function (a) { return !a ? '—' : a.tipo === 'carro' ? (G.CATALOGO[a.cat] ? G.CATALOGO[a.cat].nome : 'carro') : a.valor + ' créditos'; };
  function reservar(cart, gar, a, idD, advAp, now) {
    if (a.tipo === 'carro') gar.carros[a.iid].travado = idD;
    else { cart.gasto = (cart.gasto || 0) + a.valor; mov(cart, { t: now, v: -a.valor, d: 'Aposta reservada: duelo com ' + advAp }); }
  }
  function devolver(cart, gar, a, advAp, now, motivo) {
    if (a.tipo === 'carro') { if (gar.carros && gar.carros[a.iid]) delete gar.carros[a.iid].travado; }
    else { cart.recebido = (cart.recebido || 0) + a.valor; mov(cart, { t: now, v: a.valor, d: 'Aposta devolvida (' + motivo + '): duelo com ' + advAp }); }
  }
  G.desafiar = function (c) {
    // c: { now, uid, ap, para, paraAp, paraAtivo, aposta, st, anunciados, meusAtivos, entreNos }
    if (c.para === c.uid) L.erro('Desafie outra pessoa.');
    if (!c.paraAtivo) L.erro('Essa pessoa não está ativa no jogo.');
    if ((c.meusAtivos || 0) >= G.DUELO.maxAtivos) L.erro('Você já tem ' + G.DUELO.maxAtivos + ' duelos em aberto.');
    if (c.entreNos) L.erro('Já existe um duelo em aberto entre vocês.');
    var a = G.validarAposta(c.st, c.aposta, c.anunciados);
    var cart = L.clone(c.st.carteira || {}), gar = L.clone(c.st.garagem || { carros: {} });
    reservar(cart, gar, a, c.id, c.paraAp, c.now);
    var doc = { de: c.uid, para: c.para, ap: { de: c.ap, para: c.paraAp }, uids: [c.uid, c.para], status: 'pendente', criadoEm: c.now, prazo: c.now + G.DUELO.prazoAceite,
      aposta: { de: a, para: null }, seeds: [], corridas: { de: [null, null, null], para: [null, null, null] }, placar: { de: 0, para: 0 }, vencedor: '' };
    return { doc: doc, carteira: cart, garagem: gar };
  };
  // contraproposta (só em duelo de créditos): quem foi desafiado propõe outro valor; quem desafiou aceita (o duelo começa) ou recusa
  G.contrapropor = function (c) {
    // c: { now, uid, d, valor, st }
    var d = L.clone(c.d);
    if (!d || d.status !== 'pendente') L.erro('Esse desafio não está mais aberto.');
    if (d.para !== c.uid) L.erro('Esse desafio não é para você.');
    if (c.now > d.prazo) L.erro('Esse desafio expirou.');
    if (!d.aposta.de || d.aposta.de.tipo !== 'creditos') L.erro('Contraproposta só vale em duelo de créditos.');
    var v = Math.round(Number(c.valor));
    if (!(v >= G.DUELO.minCred && v <= G.DUELO.maxCred)) L.erro('Proponha de ' + G.DUELO.minCred + ' a ' + G.DUELO.maxCred + ' créditos.');
    if (v === d.aposta.de.valor) L.erro('Esse já é o valor do desafio: é só aceitar.');
    if ((c.st.saldo || 0) < v) L.erro('Você não tem ' + v + ' créditos para propor.');
    d.contra = { valor: v, em: c.now }; d.prazo = c.now + G.DUELO.prazoAceite;
    return { doc: d };
  };
  G.aceitarContra = function (c) {
    // c: { id, now, uid, d, stDe, stPara } : quem desafiou aceita o novo valor e o duelo começa
    var d = L.clone(c.d);
    if (!d || d.status !== 'pendente' || !d.contra) L.erro('Não há contraproposta aberta nesse duelo.');
    if (d.de !== c.uid) L.erro('Só quem desafiou responde à contraproposta.');
    if (c.now > d.prazo) L.erro('A contraproposta expirou.');
    var v = d.contra.valor, antes = d.aposta.de.valor, dif = v - antes;
    var cartDe = L.clone(c.stDe.carteira || {});
    if (dif > 0) { if ((c.stDe.saldo || 0) < dif) L.erro('Você precisa de mais ' + dif + ' créditos para aceitar esse valor.'); cartDe.gasto = (cartDe.gasto || 0) + dif; mov(cartDe, { t: c.now, v: -dif, d: 'Aposta ajustada para ' + v + ': duelo com ' + d.ap.para }); }
    else if (dif < 0) { cartDe.recebido = (cartDe.recebido || 0) - dif; mov(cartDe, { t: c.now, v: -dif, d: 'Aposta ajustada para ' + v + ': duelo com ' + d.ap.para }); }
    d.aposta.de = { tipo: 'creditos', valor: v };
    if ((c.stPara.saldo || 0) < v) L.erro(d.ap.para + ' não tem mais ' + v + ' créditos. Recuse e desafie de novo.');
    var a = { tipo: 'creditos', valor: v }, cartPara = L.clone(c.stPara.carteira || {}), garPara = L.clone(c.stPara.garagem || { carros: {} });
    reservar(cartPara, garPara, a, c.id, d.ap.de, c.now);
    d.aposta.para = a; d.contraAceita = { de: antes, para: v, em: c.now }; delete d.contra;
    d.status = 'andamento'; d.aceitoEm = c.now; d.prazo = c.now + G.DUELO.prazoCorridas;
    var r = L.rng(L.hash('duelo|' + c.id + '|' + c.now));
    d.seeds = [0, 1, 2].map(function () { return (Math.floor(r() * 4294967295) >>> 0) || 1; });
    return { doc: d, carteiraDe: cartDe, carteiraPara: cartPara };
  };
  G.aceitar = function (c) {
    // c: { now, uid, d, aposta, st, anunciados }
    var d = L.clone(c.d);
    if (!d || d.status !== 'pendente') L.erro('Esse desafio não está mais aberto.');
    if (d.para !== c.uid) L.erro('Esse desafio não é para você.');
    if (c.now > d.prazo) L.erro('Esse desafio expirou.');
    // o duelo é ou de créditos ou de carro: quem aceita aposta do mesmo tipo de quem desafiou
    var tipoDe = d.aposta && d.aposta.de && d.aposta.de.tipo === 'carro' ? 'carro' : 'creditos';
    if (((c.aposta || {}).tipo === 'carro' ? 'carro' : 'creditos') !== tipoDe) L.erro(tipoDe === 'carro' ? 'Esse duelo vale carro: aposte um carro seu.' : 'Esse duelo vale créditos: aposte créditos.');
    if (d.contra) L.erro('Você já propôs outro valor. Aguarde a resposta de ' + d.ap.de + '.');
    // créditos: o valor tem de ser igual ao de quem desafiou (para outro valor, use a contraproposta)
    if (tipoDe === 'creditos' && Math.round(Number(c.aposta.valor)) !== d.aposta.de.valor) L.erro('Para aceitar, aposte os mesmos ' + d.aposta.de.valor + ' créditos. Se quiser outro valor, faça uma contraproposta.');
    var a = G.validarAposta(c.st, c.aposta, c.anunciados);
    var cart = L.clone(c.st.carteira || {}), gar = L.clone(c.st.garagem || { carros: {} });
    reservar(cart, gar, a, c.id, d.ap.de, c.now);
    d.aposta.para = a; d.status = 'andamento'; d.aceitoEm = c.now; d.prazo = c.now + G.DUELO.prazoCorridas;
    var r = L.rng(L.hash('duelo|' + c.id + '|' + c.now));
    d.seeds = [0, 1, 2].map(function () { return (Math.floor(r() * 4294967295) >>> 0) || 1; });
    return { doc: d, carteira: cart, garagem: gar };
  };
  // recusa (convidado), cancelamento (quem desafiou) ou expiração do convite: devolve a aposta de quem desafiou
  G.desfazer = function (c) {
    // c: { now, d, motivo, cartDe, garDe }
    var d = L.clone(c.d), cart = L.clone(c.cartDe || {}), gar = L.clone(c.garDe || { carros: {} });
    if (d.status !== 'pendente') L.erro('Esse desafio não está mais aberto.');
    devolver(cart, gar, d.aposta.de, d.ap.para, c.now, c.motivo);
    d.status = c.motivo === 'recusado' ? 'recusado' : c.motivo === 'cancelado' ? 'cancelado' : 'expirado'; d.fimEm = c.now;
    return { doc: d, carteira: cart, garagem: gar };
  };
  G.iniciarDuelo = function (c) {
    // c: { now, uid, d, n, carro, garagem }
    var d = L.clone(c.d), lado = G.lado(d, c.uid), n = Math.floor(Number(c.n));
    if (!lado) L.erro('Esse duelo não é seu.');
    if (d.status !== 'andamento') L.erro('Esse duelo não está em andamento.');
    if (c.now > d.prazo) L.erro('O prazo do duelo acabou.');
    var cs = d.corridas[lado];
    if (!(n >= 0 && n <= 2)) L.erro('Corrida inválida.');
    if (cs[n]) L.erro('Você já usou essa corrida.');
    if (n > 0 && !cs[n - 1]) L.erro('Corra as corridas na ordem.');
    var cat = G.catDoCarro(c.carro, c.garagem);
    cs[n] = { inicio: c.now, cat: cat, carro: cat === 'aura' && c.carro !== 'aura' ? 'aura' : String(c.carro || 'aura') };
    return { doc: d, resp: { seed: d.seeds[n], n: n } };
  };
  // placar parcial e decisão: corrida sem tempo conta 0 quando o prazo acaba; quem vencer 2 leva
  G.placarDuelo = function (d, now) {
    var venc = { de: 0, para: 0 }, venceu = [], acabou = now > d.prazo, decididas = 0;
    for (var i = 0; i < 3; i++) {
      var a = d.corridas.de[i], b = d.corridas.para[i];
      var ta = a && a.t != null ? a.t : (acabou ? 0 : null), tb = b && b.t != null ? b.t : (acabou ? 0 : null);
      if (ta == null || tb == null) { venceu.push(''); continue; }
      decididas++;
      var w = ta > tb ? 'de' : tb > ta ? 'para' : '';
      if (w) venc[w]++; venceu.push(w || 'empate');
    }
    var fim = venc.de >= 2 || venc.para >= 2 || decididas === 3 || acabou;
    var vencedor = venc.de > venc.para ? 'de' : venc.para > venc.de ? 'para' : '';
    if (fim && !vencedor) {
      // desempate pela soma dos tempos
      var soma = function (l) { return l.reduce(function (s, x) { return s + (x && x.t ? x.t : 0); }, 0); };
      var sa = soma(d.corridas.de), sb = soma(d.corridas.para);
      vencedor = sa > sb ? 'de' : sb > sa ? 'para' : '';
    }
    return { placar: venc, venceu: venceu, fim: fim, vencedor: fim ? vencedor : '' };
  };
  G.finalizarDuelo = function (c) {
    // c: { now, uid, d, n, tempo }
    var d = L.clone(c.d), lado = G.lado(d, c.uid), n = Math.floor(Number(c.n));
    if (!lado) L.erro('Esse duelo não é seu.');
    var x = d.corridas[lado][n];
    if (!x || x.t != null) L.erro('Essa corrida não foi iniciada.');
    var tempo = Number(c.tempo); if (!(tempo >= 0)) tempo = 0;
    var maxT = (c.now - x.inicio) / 1000 + 2, valido = tempo <= maxT;
    x.t = Math.round(Math.min(tempo, maxT) * 100) / 100; x.fim = c.now; if (!valido) x.ajustado = true;
    return { doc: d, valido: valido, tempo: x.t };
  };
  // entrega as apostas quando o duelo termina (cartas: { de, para } carteiras; gars: { de, para } garagens)
  G.liquidarDuelo = function (d0, carts, gars, now) {
    var d = L.clone(d0), pl = G.placarDuelo(d, now);
    if (d.status !== 'andamento' || !pl.fim) return null;
    var c = { de: L.clone(carts.de || {}), para: L.clone(carts.para || {}) }, g = { de: L.clone(gars.de || { carros: {} }), para: L.clone(gars.para || { carros: {} }) };
    d.status = 'fim'; d.fimEm = now; d.placar = pl.placar; d.venceu = pl.venceu;
    if (!pl.vencedor) {
      ['de', 'para'].forEach(function (s) { devolver(c[s], g[s], d.aposta[s], d.ap[G.outro(s)], now, 'empate'); });
      d.vencedor = ''; return { doc: d, carteiras: c, garagens: g, vencedor: '' };
    }
    var w = pl.vencedor, l = G.outro(w), aw = d.aposta[w], al = d.aposta[l];
    d.vencedor = d[w];
    // a aposta do vencedor volta para ele
    if (aw.tipo === 'carro') { if (g[w].carros[aw.iid]) delete g[w].carros[aw.iid].travado; }
    else { c[w].recebido = (c[w].recebido || 0) + aw.valor; mov(c[w], { t: now, v: aw.valor, d: 'Aposta devolvida: venceu o duelo com ' + d.ap[l] }); }
    // e a do perdedor passa para o vencedor
    if (al.tipo === 'carro') {
      var car = g[l].carros[al.iid];
      if (car) { delete g[l].carros[al.iid]; var iid = novaInst(g[w], al.cat, 'duelo', car.km || 0, now, d.ap[l]); d.carroGanho = { iid: iid, cat: al.cat }; }
    } else { c[w].recebido = (c[w].recebido || 0) + al.valor; mov(c[w], { t: now, v: al.valor, d: 'Prêmio do duelo com ' + d.ap[l] }); }
    // bônus elétrico: quem venceu correndo a última corrida com carro elétrico ganha +15% sobre os créditos ganhos
    var ult = (d.corridas[w] || []).filter(function (x) { return x && x.t != null; }).pop();
    if (al.tipo === 'creditos' && ult && G.ehEletrico(ult.cat)) { var bn = Math.round(al.valor * G.BONUS_ELETRICO); if (bn > 0) { c[w].recebido = (c[w].recebido || 0) + bn; mov(c[w], { t: now, v: bn, d: 'Bônus elétrico do duelo' }); d.bonusEletrico = bn; } }
    return { doc: d, carteiras: c, garagens: g, vencedor: d[w] };
  };

  // ---------- multas por evasão de pedágio (free flow sem TAG) ----------
  // A multa fica no carro usado; não mexe no tempo nem no ranking, só nos créditos.
  G.MULTA = { valor: 10, desconto: 0.2, juros: 0.5, prazoDias: 7, guardar: 60 };
  G.multasPendentes = function (cart) { return ((cart && cart.multas) || []).filter(function (m) { return !m.pago; }); };
  G.valorMulta = function (m, now) {
    // usa sempre o valor atual da tabela: multas antigas acompanham mudanças de preço
    var base = G.MULTA.valor;
    return now <= m.vence ? Math.round(base * (1 - G.MULTA.desconto)) : Math.round(base * (1 + G.MULTA.juros));
  };
  // Seguro Porto pego com o estoque cheio vira crédito na carteira (máximo plausível: 1 a cada 10 s de corrida)
  G.SEGURO_CREDITO = 5;
  G.maxSegurosExtra = function (tempo) { return Math.max(0, Math.min(30, Math.floor((Number(tempo) || 0) / 10) + 1)); };
  G.creditarSeguros = function (cart0, n, tempo, origem, now) {
    n = Math.max(0, Math.min(Math.floor(Number(n) || 0), G.maxSegurosExtra(tempo)));
    var cart = L.clone(cart0 || {}), v = n * G.SEGURO_CREDITO;
    if (!v) return { carteira: cart, creditos: 0 };
    cart.recebido = (cart.recebido || 0) + v;
    mov(cart, { t: now, v: v, d: 'Seguros extras (' + n + ') no ' + origem });
    return { carteira: cart, creditos: v };
  };
  // máximo plausível: uma praça a cada 12 s de corrida
  G.maxMultas = function (tempo) { return Math.max(0, Math.floor((Number(tempo) || 0) / 12) + 1); };
  G.registrarMultas = function (cart0, n, carro, cat, origem, now) {
    n = Math.max(0, Math.min(Math.floor(Number(n) || 0), 20));
    var cart = L.clone(cart0 || {});
    if (!n) return { carteira: cart, novas: 0 };
    cart.multas = cart.multas || []; cart.seqMulta = cart.seqMulta || 0;
    for (var i = 0; i < n; i++) {
      cart.seqMulta++;
      cart.multas.unshift({ id: 'm' + cart.seqMulta, valor: G.MULTA.valor, em: now, vence: now + G.MULTA.prazoDias * 86400000, carro: carro || '', cat: cat || '', origem: origem, pago: false });
    }
    // guarda as pendentes e as últimas pagas
    var pend = cart.multas.filter(function (m) { return !m.pago; }), pagas = cart.multas.filter(function (m) { return m.pago; });
    cart.multas = pend.concat(pagas.slice(0, Math.max(0, G.MULTA.guardar - pend.length)));
    return { carteira: cart, novas: n };
  };
  G.pagarMulta = function (st, id, now) {
    var cart = L.clone(st.carteira || {}), m = (cart.multas || []).filter(function (x) { return x.id === id; })[0];
    if (!m) L.erro('Multa não encontrada.');
    if (m.pago) L.erro('Essa multa já foi paga.');
    var v = G.valorMulta(m, now); precisa(st.saldo, v);
    m.pago = true; m.pagoEm = now; m.pagoValor = v;
    cart.gasto = (cart.gasto || 0) + v;
    mov(cart, { t: now, v: -v, d: 'Multa por evasão de pedágio' + (G.CATALOGO[m.cat] ? ' (' + G.CATALOGO[m.cat].nome + ')' : '') + (now <= m.vence ? ', com desconto' : ', vencida') });
    return { carteira: cart, valor: v };
  };

  // ---------- treino com recorde (validado como a corrida da rodada) ----------
  // carro: chave escolhida (um dos da casa ou o id de um carro da garagem)
  G.catDoCarro = function (carro, garagem) {
    if (G.BASE.indexOf(carro) >= 0) return carro;
    var c = (garagem && garagem.carros || {})[carro];
    return c && G.CATALOGO[c.cat] ? c.cat : 'aura';
  };
  G.iniciarTreino = function (c) {
    if (!c.jog || c.jog.status !== 'ativo') L.erro('Seu cadastro ainda não foi aprovado.');
    var seed = (L.hash(c.uid + '|' + c.now + '|' + Math.random()) >>> 0) || 1;
    var doc = L.clone(c.doc || {});
    doc.uid = c.uid; doc.ap = c.jog.apelido || ''; doc.nm = String(c.jog.nome || '').trim().split(/\s+/)[0] || ''; doc.a = c.jog.areaId || '';
    doc.sessao = { inicio: c.now, seed: seed, cat: G.catDoCarro(c.carro, c.garagem), carro: G.catDoCarro(c.carro, c.garagem) === 'aura' && c.carro !== 'aura' ? 'aura' : c.carro };
    return { doc: doc, resp: { seed: seed } };
  };
  // recordes de tempo zerados na largada da Temporada 2 (30/11 00:00 de Brasília): antes disso nada muda;
  // depois, recordes de treino anteriores deixam de contar (créditos, carros e multas continuam)
  G.CORTE_TEMPOS = Date.UTC(2026, 10, 30, 3);
  G.vale = function (r, now) { return !!r && ((now || Date.now()) < G.CORTE_TEMPOS || (r.em || 0) >= G.CORTE_TEMPOS); };
  // melhores tempos por carro de um documento de treino (usa porCarro e, para dados antigos, melhor e semanas)
  G.porCarroDe = function (doc, now) {
    var m = {}, add = function (r) { if (r && G.vale(r, now) && r.cat && G.CATALOGO[r.cat] && (!m[r.cat] || r.t > m[r.cat].t)) m[r.cat] = r.duelo ? { t: r.t, em: r.em, duelo: true } : { t: r.t, em: r.em }; };
    Object.keys((doc && doc.porCarro) || {}).forEach(function (k) { add({ cat: k, t: doc.porCarro[k].t, em: doc.porCarro[k].em, duelo: doc.porCarro[k].duelo }); });
    add(doc && doc.melhor); Object.keys((doc && doc.semanas) || {}).forEach(function (k) { add(doc.semanas[k]); });
    return m;
  };
  // recordes do treino (geral, da semana e por carro) a partir de um tempo válido; também usado pelas corridas de duelo
  G.gravarRecordes = function (doc, reg, now) {
    var sid = G.semana(now), recorde = false, recordeSemana = false;
    if (!G.vale(doc.melhor, now) || reg.t > doc.melhor.t) { doc.melhor = reg; recorde = true; }
    doc.semanas = doc.semanas || {};
    if (!doc.semanas[sid] || reg.t > doc.semanas[sid].t) { doc.semanas[sid] = reg; recordeSemana = true; }
    doc.porCarro = G.porCarroDe(doc, now);
    if (!doc.porCarro[reg.cat] || reg.t > doc.porCarro[reg.cat].t) doc.porCarro[reg.cat] = reg.duelo ? { t: reg.t, em: now, duelo: true } : { t: reg.t, em: now };
    Object.keys(doc.semanas).sort().slice(0, -12).forEach(function (k) { delete doc.semanas[k]; });
    return { recorde: recorde, recordeSemana: recordeSemana };
  };
  G.finalizarTreino = function (c) {
    var doc = L.clone(c.doc || {}), ss = doc.sessao;
    if (!ss) L.erro('Treino não encontrado. Comece de novo.');
    var tempo = Number(c.tempo); if (!(tempo >= 0)) tempo = 0;
    var maxT = (c.now - ss.inicio) / 1000 + 2, valido = tempo <= maxT;
    tempo = Math.round(Math.min(tempo, maxT) * 100) / 100;
    delete doc.sessao;
    doc.treinos = (doc.treinos || 0) + 1;
    var sid = G.semana(c.now), reg = { t: tempo, cat: ss.cat, em: c.now }, recorde = false, recordeSemana = false, creditos = 0;
    if (valido) {
      var rr = G.gravarRecordes(doc, reg, c.now); recorde = rr.recorde; recordeSemana = rr.recordeSemana;
      // créditos do treino, com limite diário
      var hoje = G.dia(c.now); if (!doc.hoje || doc.hoje.id !== hoje) doc.hoje = { id: hoje, creditos: 0 };
      creditos = Math.max(0, Math.min(G.creditosTreino(tempo, ss.cat), G.TREINO_LIMITE_DIA - doc.hoje.creditos));
      doc.hoje.creditos += creditos; doc.creditos = (doc.creditos || 0) + creditos;
      // histórico curto para o extrato (últimos 20 treinos)
      doc.hist = [{ t: tempo, cat: ss.cat, c: creditos, em: c.now }].concat(doc.hist || []).slice(0, 20);
      // guarda só as últimas 12 semanas
      Object.keys(doc.semanas).sort().slice(0, -12).forEach(function (k) { delete doc.semanas[k]; });
    }
    return { doc: doc, sessao: ss, resp: { creditos: creditos, creditosHoje: doc.hoje ? doc.hoje.creditos : 0, tempo: tempo, valido: valido, recorde: recorde, recordeSemana: recordeSemana, melhor: G.vale(doc.melhor, c.now) ? doc.melhor.t : 0, melhorSemana: doc.semanas && doc.semanas[sid] ? doc.semanas[sid].t : 0 } };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = G; else root.Garagem = G;
})(this);
