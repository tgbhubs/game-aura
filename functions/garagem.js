/* Garagem Aura — catálogo, créditos e lojas (compartilhado: Cloud Functions + modo demonstração).
   Mantenha idêntico ao bloco "GARAGEM" do index.html. */
(function (root) {
  var G = {};
  var L = (typeof module !== 'undefined' && module.exports) ? require('./logica') : root.Logica;

  // atributos só valem no treino: faixa = agilidade para trocar de faixa (maior é melhor),
  // pneu = gasto do pneu (menor é melhor), seguro = vidas com que você larga
  G.CATALOGO = {
    'aura':            { nome: 'Aura',              modelo: 'aura',     cor: 0x2F7FE0, preco: 0,    tipo: 'Sedã',      atr: { faixa: 1.00, pneu: 1.00, seguro: 0 } },
    'conceito':        { nome: 'Conceito',          modelo: 'conceito', cor: 0xB04600, preco: 0,    tipo: 'Esportivo', atr: { faixa: 1.00, pneu: 1.00, seguro: 0 } },
    'cyberpunk':       { nome: 'Cyberpunk',         modelo: 'cyberpunk', cor: null,    preco: 0,    tipo: 'Muscle',    atr: { faixa: 1.00, pneu: 1.00, seguro: 0 } },
    'hatch-verde':     { nome: 'Hatch Verde',       modelo: 'hatch',    cor: 0x17935F, preco: 300,  tipo: 'Hatch',     atr: { faixa: 1.15, pneu: 1.00, seguro: 0 } },
    'hatch-branco':    { nome: 'Hatch Branco',      modelo: 'hatch',    cor: 0xE9E7E1, preco: 300,  tipo: 'Hatch',     atr: { faixa: 1.15, pneu: 1.00, seguro: 0 } },
    'sedan-grafite':   { nome: 'Sedã Grafite',      modelo: 'aura',     cor: 0x3A3F4B, preco: 350,  tipo: 'Sedã',      atr: { faixa: 1.00, pneu: 0.85, seguro: 0 } },
    'sedan-prata':     { nome: 'Sedã Prata',        modelo: 'aura',     cor: 0xB9BEC6, preco: 350,  tipo: 'Sedã',      atr: { faixa: 1.00, pneu: 0.85, seguro: 0 } },
    'suv-areia':       { nome: 'SUV Areia',         modelo: 'suv',      cor: 0xCDBB98, preco: 550,  tipo: 'SUV',       atr: { faixa: 0.90, pneu: 0.75, seguro: 1 } },
    'suv-porto':       { nome: 'SUV Azul Porto',    modelo: 'suv',      cor: 0x499EF2, preco: 650,  tipo: 'SUV',       atr: { faixa: 0.95, pneu: 0.75, seguro: 1 } },
    'picape-laranja':  { nome: 'Picape Laranja',    modelo: 'picape',   cor: 0xEC7000, preco: 600,  tipo: 'Picape',    atr: { faixa: 0.85, pneu: 0.65, seguro: 1 } },
    'picape-marinho':  { nome: 'Picape Marinho',    modelo: 'picape',   cor: 0x1C398E, preco: 600,  tipo: 'Picape',    atr: { faixa: 0.85, pneu: 0.65, seguro: 1 } },
    'conceito-marinho':{ nome: 'Conceito Marinho',  modelo: 'conceito', cor: 0x14235E, preco: 900,  tipo: 'Esportivo', atr: { faixa: 1.30, pneu: 1.20, seguro: 0 } },
    'conceito-branco': { nome: 'Conceito Branco',   modelo: 'conceito', cor: 0xE9E7E1, preco: 950,  tipo: 'Esportivo', atr: { faixa: 1.30, pneu: 1.20, seguro: 0 } }
  };
  G.BASE = ['aura', 'conceito', 'cyberpunk'];
  G.VENDA = Object.keys(G.CATALOGO).filter(function (k) { return G.BASE.indexOf(k) < 0; });
  G.PONTOS_VITORIA_PLACA = 30;
  G.TREINO_PROP = 0.2;          // treino rende 20% dos pontos que o tempo valeria na rodada
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

  // ---------- lote semanal de Retomados Porto ----------
  G.semana = function (now) { return 'S' + new Date(L.inicioSemana(now)).toISOString().slice(0, 10); };
  G.lote = function (now) {
    var sid = G.semana(now), r = L.rng(L.hash('retomados|' + sid)), itens = [];
    var cats = L.shuffle(G.VENDA.slice(), r);
    for (var i = 0; i < G.LOTE; i++) {
      var cat = cats[i % cats.length], base = G.CATALOGO[cat].preco, desc = 0.35 + r() * 0.2;
      itens.push({ id: sid + '-' + (i + 1), cat: cat, preco: Math.round(base * (1 - desc) / 5) * 5, km: Math.round((18 + r() * 75)) * 1000, vendidoPara: '' });
    }
    return { semana: sid, itens: itens, criadoEm: now };
  };

  // ---------- operações (puras: recebem o estado e devolvem o que gravar) ----------
  function precisa(saldo, valor) { if (saldo < valor) L.erro('Créditos insuficientes: faltam ' + (valor - saldo) + '.'); }
  function novaInst(gar, cat, origem, km, now, de) {
    var n = (gar.seq || 0) + 1; gar.seq = n;
    var iid = 'c' + n + '-' + (now % 100000).toString(36);
    gar.carros = gar.carros || {};
    gar.carros[iid] = { cat: cat, origem: origem, km: km || 0, compradoEm: now, de: de || '' };
    return iid;
  }
  // ---------- histórico de transações e Preço Aura ----------
  // cada compra vira um registro público (sem dados pessoais além do apelido): base para o Preço Aura
  function transacao(tipo, cat, km, preco, taxa, comprador, vendedor, now) {
    return { tipo: tipo, cat: cat, modelo: G.CATALOGO[cat].modelo, km: km || 0, preco: preco, taxa: taxa || 0,
      comprador: comprador.uid, compradorAp: comprador.apelido || '', vendedor: vendedor ? vendedor.uid : '', vendedorAp: vendedor ? (vendedor.apelido || '') : (tipo === '0km' ? 'Concessionária' : 'Porto'),
      em: now, semana: G.semana(now) };
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
    if (!c || G.BASE.indexOf(cat) >= 0) L.erro('Carro indisponível.');
    precisa(st.saldo, c.preco);
    var gar = L.clone(st.garagem || {}), cart = L.clone(st.carteira || {});
    var iid = novaInst(gar, cat, '0km', 0, now);
    cart.gasto = (cart.gasto || 0) + c.preco; mov(cart, { t: now, v: -c.preco, d: '0 km: ' + c.nome });
    return { garagem: gar, carteira: cart, iid: iid, transacao: transacao('0km', cat, 0, c.preco, 0, st, null, now) };
  };
  G.comprarRetomado = function (st, lote, itemId, now) {
    var it = (lote.itens || []).filter(function (x) { return x.id === itemId; })[0];
    if (!it) L.erro('Esse carro não está no lote desta semana.');
    if (it.vendidoPara) L.erro('Esse carro já foi vendido.');
    precisa(st.saldo, it.preco);
    var gar = L.clone(st.garagem || {}), cart = L.clone(st.carteira || {}), lt = L.clone(lote);
    var iid = novaInst(gar, it.cat, 'retomado', it.km, now);
    lt.itens.forEach(function (x) { if (x.id === itemId) x.vendidoPara = st.uid; });
    cart.gasto = (cart.gasto || 0) + it.preco; mov(cart, { t: now, v: -it.preco, d: 'Retomado Porto: ' + G.CATALOGO[it.cat].nome });
    return { garagem: gar, carteira: cart, lote: lt, iid: iid, transacao: transacao('retomado', it.cat, it.km, it.preco, 0, st, null, now) };
  };
  G.anunciar = function (st, iid, preco, anuncios, now) {
    var car = (st.garagem && st.garagem.carros || {})[iid];
    if (!car) L.erro('Esse carro não está na sua garagem.');
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
    doc.sessao = { inicio: c.now, seed: seed, cat: G.catDoCarro(c.carro, c.garagem) };
    return { doc: doc, resp: { seed: seed } };
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
      if (!doc.melhor || tempo > doc.melhor.t) { doc.melhor = reg; recorde = true; }
      doc.semanas = doc.semanas || {};
      if (!doc.semanas[sid] || tempo > doc.semanas[sid].t) { doc.semanas[sid] = reg; recordeSemana = true; }
      // créditos do treino, com limite diário
      var hoje = G.dia(c.now); if (!doc.hoje || doc.hoje.id !== hoje) doc.hoje = { id: hoje, creditos: 0 };
      creditos = Math.max(0, Math.min(Math.round(L.curva(tempo, 40) * G.TREINO_PROP), G.TREINO_LIMITE_DIA - doc.hoje.creditos));
      doc.hoje.creditos += creditos; doc.creditos = (doc.creditos || 0) + creditos;
      // guarda só as últimas 12 semanas
      Object.keys(doc.semanas).sort().slice(0, -12).forEach(function (k) { delete doc.semanas[k]; });
    }
    return { doc: doc, resp: { creditos: creditos, creditosHoje: doc.hoje ? doc.hoje.creditos : 0, tempo: tempo, valido: valido, recorde: recorde, recordeSemana: recordeSemana, melhor: doc.melhor ? doc.melhor.t : 0, melhorSemana: doc.semanas && doc.semanas[sid] ? doc.semanas[sid].t : 0 } };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = G; else root.Garagem = G;
})(this);
