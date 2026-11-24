/* ================== GARAGEM (créditos, 0 km, Retomados Itaú e Porto, mercado e multas) ==================
   Tudo que mexe em créditos passa pela Cloud Function "garagem"; aqui só mostramos e pedimos. */
var GS = { aba: 'minha', saldo: null, carregandoSaldo: false, estoque: null, subEst: null, semana: '' };
function nCred(n) { return (n || 0).toLocaleString('pt-BR'); }
function fotoCat(cat) { var f = window.FOTOS_CARROS && FOTOS_CARROS[cat]; return f ? '<img class="gfoto" src="' + f.foto + '" alt="">' : '<div class="gfoto"></div>'; }
function origemTxt(o, rd) { return o === 'base' ? 'Da casa' : o === 'retomado' ? 'Retomado ' + (Garagem.ORIGENS[rd] || 'Porto') : o === 'usado' ? 'Usado' : o === 'duelo' ? 'Ganho em duelo' : '0 km'; }
function seloOrigem(org) { return '<span class="gselo ' + org + '">' + (org === 'itau' ? 'Itaú' : 'Porto') + '</span>'; }
function multasPend() { return Garagem.multasPendentes(D.carteira); }
function dataHora(ms) { return dataCurta(ms); }
function garMultas() {
  var l = multasPend(), now = Date.now(), saldo = GS.saldo ? GS.saldo.saldo : 0;
  if (!l.length) return '';
  var h = '<div class="card gmulta"><div class="row between"><b>🚨 Multas pendentes</b><span class="tag">' + l.length + '</span></div><p class="small" style="margin:4px 0 8px">Evasão de pedágio: passou no free flow sem TAG. Pagando até o vencimento, tem ' + Math.round(Garagem.MULTA.desconto * 100) + '% de desconto; depois, o valor sobe ' + Math.round(Garagem.MULTA.juros * 100) + '%. Carro com multa não pode ser anunciado.</p>';
  l.forEach(function (m) {
    var v = Garagem.valorMulta(m, now), venc = now > m.vence, c = Garagem.CATALOGO[m.cat];
    h += '<div class="gtr"><div style="min-width:0"><b>' + esc(c ? c.nome : 'Carro') + '</b> <span class="tiny mut">· ' + (m.origem === 'treino' ? 'treino' : m.origem === 'duelo' ? 'duelo' : 'corrida') + ' de ' + dataCurta(m.em) + '</span><br><span class="tiny ' + (venc ? 'gvenc' : 'mut') + '">' + (venc ? 'Vencida em ' + dataCurta(m.vence) : 'Vence em ' + dataCurta(m.vence) + ' · com desconto') + '</span></div>' +
      '<button class="btn sm ' + (saldo >= v ? 'lar' : 'gh') + '" data-a="garPagarMulta" data-v="' + esc(m.id) + '"' + (saldo >= v ? '' : ' disabled') + '>Pagar ' + nCred(v) + '</button></div>';
  });
  return h + '</div>';
}
function kmTxt(km) { return km ? nCred(km) + ' km' : '0 km'; }

function atualizarSaldo() {
  if (GS.carregandoSaldo || !S.user) return;
  GS.carregandoSaldo = true;
  B.chamar('garagem', { op: 'saldo' }).then(function (r) { GS.carregandoSaldo = false; GS.saldo = r; if (S.tab === 'garagem') R(); })
    .catch(function (e) { GS.carregandoSaldo = false; console.warn(e); });
}
function assinarEstoque() {
  var sem = Garagem.semana(Date.now());
  if (GS.subEst && GS.semana === sem) return;
  if (GS.subEst) { try { GS.subEst(); } catch (e) { } }
  GS.semana = sem; GS.estoque = null;
  B.chamar('garagem', { op: 'vitrine' }).then(function () {
    GS.subEst = B.ouvirDoc('estoque/' + sem, function (d) { GS.estoque = Garagem.saneiaLote(d); if (S.tab === 'garagem') R(); });
  }).catch(function (e) { toast(msgErro(e)); });
}

function telaGaragem() {
  if (GS.saldo == null) atualizarSaldo();
  var sd = GS.saldo, h = '';
  h += '<div class="card gsaldo"><div class="row between" style="align-items:flex-end"><div><div class="tiny" style="opacity:.75;letter-spacing:.06em">SEUS CRÉDITOS</div><div class="gnum">' + (sd ? nCred(sd.saldo) : '…') + '</div></div>' +
    '<button class="btn sm" style="background:rgba(255,255,255,.12);color:#fff" data-a="garExtrato">Extrato</button></div>' +
    '<p class="small" style="opacity:.8;margin:8px 0 0">Você ganha créditos com os pontos de cada rodada (quiz + corrida), com ' + Garagem.PONTOS_VITORIA_PLACA + ' por vitória no Placa! contra pessoas e com os treinos da corrida (40% dos pontos, sem teto). Os créditos acumulam para sempre.</p></div>';
  h += '<div class="seg">' + [['minha', 'Garagem'], ['0km', '0 km'], ['retomados', 'Retomados'], ['mercado', 'Mercado'], ['precos', 'Preços']].map(function (a) {
    return '<button class="' + (GS.aba === a[0] ? 'on' : '') + '" data-a="garAba" data-v="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>';
  h += garMultas();
  if (GS.aba === 'minha') h += garMinha();
  else if (GS.aba === '0km') h += gar0km();
  else if (GS.aba === 'retomados') h += garRetomados();
  else if (GS.aba === 'precos') h += garPrecos();
  else h += garMercado();
  return h;
}
function anuncioDe(key) { return Object.keys(D.anuncios || {}).map(function (k) { var a = D.anuncios[k]; a._id = k; return a; }).filter(function (a) { return a.iid === key && a.status === 'ativo'; })[0]; }
function garMinha() {
  var sel = carroPreferido(), h = '<p class="small mut">Escolha o carro que você usa na corrida. Na rodada todos andam igual; no treino valem os atributos de cada carro.</p>' + legendaAtr() + '<div class="glista">';
  meusCarros().forEach(function (x) {
    var c = Garagem.CATALOGO[x.cat], an = anuncioDe(x.key), mul = multasPend().filter(function (m) { return m.carro === x.key; }).length;
    h += '<div class="gitem' + (sel === x.key ? ' on' : '') + '">' + fotoCat(x.cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b>' + (c.fora ? ' <span class="tag">fora de linha</span>' : '') + (mul ? ' <span class="tag gvenc">' + (mul === 1 ? '1 multa' : mul + ' multas') + '</span>' : '') + '<span>' + c.tipo + ' · ' + origemTxt(x.origem, x.retomadoDe) + (x.origem !== 'base' ? ' · ' + kmTxt(x.km) : '') + (x.de ? ' · era de ' + esc(x.de) : '') + '</span>' + barrasAtrMini(c.atr, x.cat) +
      (x.origem !== 'base' ? '<div style="margin-top:4px">' + selPreco(x.cat, x.km) + '</div>' : '') + '<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">' + (sel === x.key ? '<span class="tag ok">Em uso</span>' : '<button class="btn sm lar" data-a="garUsar" data-v="' + esc(x.key) + '">Usar</button>') +
      (x.origem === 'base' ? '' : an ? '<span class="tag gold">Anunciado por ' + nCred(an.preco) + '</span><button class="lnk tiny" data-a="garCancelar" data-v="' + an._id + '">Cancelar anúncio</button>' : (D.garagem && D.garagem.carros && D.garagem.carros[x.key] && D.garagem.carros[x.key].travado) ? '<span class="tag gold">⚔️ Apostado em duelo</span>' : mul ? '<span class="tiny mut">Pague a multa para anunciar</span>' : '<button class="btn sm gh" data-a="garAnunciar" data-v="' + esc(x.key) + '">Anunciar no mercado</button>') +
      '</div></div></div>';
  });
  return h + '</div>';
}
function barrasAtrMini(a, cat) {
  // toque nos atributos abre a explicação (eles só valem no treino)
  return '<button class="gatr" data-a="infoAtr" data-v="' + (cat || '') + '" aria-label="O que significam os atributos"><span title="Agilidade">⚡ ' + Math.round(a.faixa * 100) + '%</span><span title="Pneus">🛞 ' + (a.pneu < 1 ? 'duram mais' : a.pneu > 1 ? 'gastam mais' : 'normais') + '</span><span title="Seguro">🛡️ ' + (a.seguro ? '+1' : '—') + '</span><span title="Motor">' + (a.eletrico ? '🔋 elétrico' : '⛽') + '</span><span class="gatr-i">ⓘ</span></button>';
}
// duração aproximada do pneu (antes da reta final): 100% / (1,6% por segundo × fator do carro)
function duraPneu(a) { return Math.round(100 / (1.6 * a.pneu)); }
function legendaAtr() { return '<div class="tiny mut gleg">⚡ agilidade · 🛞 pneus · 🛡️ seguro inicial · ⛽/🔋 motor. <button class="lnk tiny" data-a="infoAtr">O que é cada um?</button> Só valem no treino.</div>'; }
var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
// showroom: vitrine dos lançamentos do mês, um carro em destaque por vez (rolagem lateral)
function garShowroom(saldo) {
  var lz = Garagem.lancamentos(Date.now()); if (!lz.cats.length) return '';
  var mes = MESES[+lz.mes.slice(5, 7) - 1];
  var h = '<div class="gshow"><div class="gshow-top"><span class="gshow-kick">SHOWROOM</span><b>' + (lz.doMes ? 'Lançamentos de ' + mes : 'Últimos lançamentos (' + mes + ')') + '</b><span class="tiny" style="opacity:.75">' + lz.cats.length + ' modelos · arraste para o lado · toque nos atributos para entender</span></div><div class="gshow-trilho">';
  lz.cats.forEach(function (cat) {
    var c = Garagem.CATALOGO[cat], f = window.FOTOS_CARROS && FOTOS_CARROS[cat], pode = saldo >= c.preco;
    h += '<div class="gshow-car">' + (f ? '<img src="' + f.foto + '" alt="">' : '') + '<div class="gshow-info"><span class="gselo novo">NOVO</span><b>' + esc(c.nome) + '</b><span class="tiny" style="opacity:.8">' + c.tipo + '</span>' + barrasAtrMini(c.atr, cat) +
      '<div class="row between" style="margin-top:8px;gap:8px"><span class="gpreco" style="color:#fff">' + nCred(c.preco) + ' <small>créditos</small></span><button class="btn sm ' + (pode ? 'lar' : 'wh') + '" data-a="garComprar0km" data-v="' + cat + '"' + (pode ? '' : ' disabled') + '>' + (pode ? 'Comprar' : 'Faltam ' + nCred(c.preco - saldo)) + '</button></div></div></div>';
  });
  return h + '</div></div>';
}
function gar0km() {
  var saldo = GS.saldo ? GS.saldo.saldo : 0, h = garShowroom(saldo) + '<div class="sec">Todos os 0 km</div><p class="small mut">Carros novos, direto da concessionária. Preço fixo.</p>' + legendaAtr() + '<div class="glista">';
  var lz = Garagem.lancamentos(Date.now());
  Garagem.venda(Date.now()).forEach(function (cat) {
    var c = Garagem.CATALOGO[cat], pode = saldo >= c.preco, novo = lz.cats.indexOf(cat) >= 0;
    h += '<div class="gitem">' + fotoCat(cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b>' + (novo ? ' <span class="gselo novo">NOVO</span>' : '') + '<span>' + c.tipo + ' · 0 km</span>' + barrasAtrMini(c.atr, cat) +
      '<div class="row between" style="margin-top:8px"><span class="gpreco">' + nCred(c.preco) + ' <small>créditos</small></span><button class="btn sm ' + (pode ? 'lar' : 'gh') + '" data-a="garComprar0km" data-v="' + cat + '"' + (pode ? '' : ' disabled') + '>' + (pode ? 'Comprar' : 'Faltam ' + nCred(c.preco - saldo)) + '</button></div></div></div>';
  });
  return h + '</div>';
}
function garRetomados() {
  assinarEstoque();
  var e = GS.estoque, saldo = GS.saldo ? GS.saldo.saldo : 0;
  var h = '<div class="card gporto"><b>Retomados Itaú e Porto</b><p class="small" style="margin:4px 0 0">Carros retomados de financiamento pelo <b>Itaú</b> e recuperados pela <b>Porto</b>, revisados e com desconto. Um lote novo de ' + Garagem.LOTE + ' carros chega toda segunda; quem comprar primeiro leva.</p></div>';
  if (!e) return h + carregando('Abrindo o pátio…');
  h += '<div class="glista">';
  e.itens.forEach(function (it) {
    var c = Garagem.CATALOGO[it.cat], vend = !!it.vendidoPara, pode = !vend && saldo >= it.preco;
    var quem = vend ? (it.vendidoPara === S.user.uid ? 'você' : nomeExib(jogDe(it.vendidoPara, null) || {})) : '';
    var org = Garagem.origemRetomado(it);
    h += '<div class="gitem' + (vend ? ' vendido' : '') + '">' + fotoCat(it.cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b> ' + seloOrigem(org) + '<span>' + c.tipo + ' · ' + kmTxt(it.km) + ' · ' + (org === 'itau' ? 'retomado de financiamento' : 'recuperado do seguro') + ' · revisado</span>' + barrasAtrMini(c.atr, it.cat) +
      '<div class="row between" style="margin-top:8px"><span class="gpreco">' + nCred(it.preco) + ' <small><s>' + nCred(c.preco) + '</s></small></span>' +
      (vend ? '<span class="tag">Vendido para ' + esc(quem) + '</span>' : '<button class="btn sm ' + (pode ? 'lar' : 'gh') + '" data-a="garComprarRet" data-v="' + it.id + '"' + (pode ? '' : ' disabled') + '>' + (pode ? 'Comprar' : 'Faltam ' + nCred(it.preco - saldo)) + '</button>') + '</div></div></div>';
  });
  return h + '</div>';
}
function garMercado() {
  var me = S.user.uid, saldo = GS.saldo ? GS.saldo.saldo : 0;
  var l = Object.keys(D.anuncios || {}).map(function (k) { var a = D.anuncios[k]; a._id = k; return a; }).filter(function (a) { return a.status === 'ativo'; })
    .sort(function (a, b) { return (b.criadoEm || 0) - (a.criadoEm || 0); });
  var meus = l.filter(function (a) { return a.vendedor === me; }), outros = l.filter(function (a) { return a.vendedor !== me; });
  var h = '<p class="small mut">Usados anunciados por pessoas do time. Quem compra paga o preço mais uma taxa de transferência de 5% (mínimo 5). Para vender, anuncie um carro na aba Garagem.</p>';
  if (!outros.length) h += '<div class="empty">Nenhum carro à venda agora.</div>';
  h += '<div class="glista">';
  outros.forEach(function (a) {
    var c = Garagem.CATALOGO[a.cat]; if (!c) return;
    var tx = Garagem.taxa(a.preco), total = a.preco + tx, pode = saldo >= total;
    h += '<div class="gitem">' + fotoCat(a.cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b><span>' + c.tipo + ' · ' + kmTxt(a.km) + ' · de ' + esc(a.vendedorAp || 'colega') + '</span>' + barrasAtrMini(c.atr, a.cat) +
      comparaPreco(a.preco, a.cat, a.km) + '<div class="row between" style="margin-top:8px"><span class="gpreco">' + nCred(a.preco) + ' <small>+ ' + nCred(tx) + ' de taxa</small></span><button class="btn sm ' + (pode ? 'lar' : 'gh') + '" data-a="garComprarUsado" data-v="' + a._id + '"' + (pode ? '' : ' disabled') + '>' + (pode ? 'Comprar' : 'Faltam ' + nCred(total - saldo)) + '</button></div></div></div>';
  });
  h += '</div>';
  if (meus.length) {
    h += '<div class="sec">Seus anúncios</div><div class="glista">';
    meus.forEach(function (a) { var c = Garagem.CATALOGO[a.cat]; h += '<div class="gitem">' + fotoCat(a.cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b><span>' + kmTxt(a.km) + '</span><div class="row between" style="margin-top:8px"><span class="gpreco">' + nCred(a.preco) + '</span><button class="btn sm gh" data-a="garCancelar" data-v="' + a._id + '">Cancelar</button></div></div></div>'; });
    h += '</div>';
  }
  return h;
}

// ---------- Preço Aura e histórico de transações ----------
function listaTransacoes() { return Object.keys(D.transacoes || {}).map(function (k) { return D.transacoes[k]; }).sort(function (a, b) { return b.em - a.em; }); }
function selPreco(cat, km) {
  var tr = listaTransacoes(), p = Garagem.precoAura(cat, tr); if (!p) return '';
  return '<span class="gpa' + (p.estimado ? ' est' : '') + '">Preço Aura ' + nCred(km == null ? p.valor : Garagem.precoAuraCarro(cat, km, tr)) + (p.estimado ? ' (estimado)' : '') + '</span>';
}
function comparaPreco(preco, cat, km) {
  var ref = Garagem.precoAuraCarro(cat, km, listaTransacoes()); if (!ref) return '';
  var d = Math.round((preco / ref - 1) * 100);
  if (Math.abs(d) < 5) return '<span class="gcmp ok">no Preço Aura</span>';
  return '<span class="gcmp ' + (d < 0 ? 'bom' : 'alto') + '">' + Math.abs(d) + '% ' + (d < 0 ? 'abaixo' : 'acima') + ' do Preço Aura</span>';
}
function dataCurta(ms) { var d = new Date(ms); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); }
function garPrecos() {
  var tr = listaTransacoes(), h = '<div class="card gporto"><b>Preço Aura</b><p class="small" style="margin:4px 0 0">Referência de preço de cada modelo, calculada pelas vendas reais entre o time e pelos Retomados Itaú e Porto. Usa a mediana das últimas 15 vendas, ajustada para 30 mil km (cada mil km a mais desvaloriza 0,4%). Com menos de 3 vendas, vale uma estimativa de 70% do 0 km.</p></div>';
  h += '<div class="card" style="padding:4px 14px;margin-top:10px;overflow-x:auto"><table class="t gtab"><tr><th>Modelo</th><th class="n">Preço Aura</th><th class="n">0 km</th><th class="n">Vendas</th></tr>';
  Garagem.venda(Date.now()).concat(Object.keys(Garagem.CATALOGO).filter(Garagem.foraDeLinha)).forEach(function (cat) {
    var c = Garagem.CATALOGO[cat], p = Garagem.precoAura(cat, tr), n = tr.filter(function (t) { return t.cat === cat; }).length;
    h += '<tr><td><b>' + esc(c.nome) + '</b><br><span class="tiny mut">' + c.tipo + (c.fora ? ' · fora de linha' : '') + (p.ultima ? ' · última: ' + nCred(p.ultima.preco) + ' em ' + dataCurta(p.ultima.em) : '') + '</span></td><td class="n"><b>' + nCred(p.valor) + '</b>' + (p.estimado ? '<br><span class="tiny mut">estimado</span>' : '<br><span class="tiny mut">' + p.n + ' vendas</span>') + '</td><td class="n">' + (c.fora ? '—' : nCred(c.preco)) + '</td><td class="n">' + n + '</td></tr>';
  });
  h += '</table></div>';
  // indicadores gerais
  var usados = tr.filter(function (t) { return t.tipo === 'usado'; }), vol = tr.reduce(function (a, t) { return a + t.preco; }, 0), taxas = tr.reduce(function (a, t) { return a + (t.taxa || 0); }, 0);
  h += '<div class="gkpis"><div><b>' + tr.length + '</b><span>transações</span></div><div><b>' + usados.length + '</b><span>entre pessoas</span></div><div><b>' + nCred(vol) + '</b><span>créditos movimentados</span></div><div><b>' + nCred(taxas) + '</b><span>em taxas</span></div></div>';
  h += '<div class="sec">Histórico de transações</div><div class="card" style="padding:4px 14px">';
  if (!tr.length) h += '<div class="empty">Nenhuma compra ainda.</div>';
  tr.slice(0, 40).forEach(function (t) {
    var c = Garagem.CATALOGO[t.cat] || { nome: t.cat };
    var tipo = t.tipo === '0km' ? '0 km' : t.tipo === 'retomado' ? 'Retomado ' + (Garagem.ORIGENS[t.retomadoDe] || 'Porto') : 'Usado';
    h += '<div class="gtr"><div style="min-width:0"><b>' + esc(c.nome) + '</b> <span class="tag' + (t.tipo === 'usado' ? ' gold' : '') + '">' + tipo + '</span><br><span class="tiny mut">' + esc(t.vendedorAp || '') + ' → ' + esc(t.compradorAp || '') + ' · ' + (t.km ? nCred(t.km) + ' km · ' : '') + dataCurta(t.em) + '</span></div><b class="gpreco" style="font-size:15px">' + nCred(t.preco) + '</b></div>';
  });
  return h + '</div>';
}
function garChamar(d, ok) {
  return B.chamar('garagem', d).then(function (r) { atualizarSaldo(); if (ok) ok(r); return r; }).catch(function (e) { toast(msgErro(e)); });
}
var A_GAR = {
  irGaragem: function () { if (typeof fecharOv === 'function') fecharOv(); S.tab = 'garagem'; GS.aba = 'minha'; R(); },
  garAba: function (v) { GS.aba = v; S.manterScroll = true; R(); },
  infoAtr: function (cat) {
    var c = cat && Garagem.CATALOGO[cat], a = c ? c.atr : null;
    function item(ic, tit, txt, val) { return '<div class="gex"><div class="gex-ic">' + ic + '</div><div style="min-width:0"><b>' + tit + (val ? ' <span class="gex-v">' + val + '</span>' : '') + '</b><div class="small mut">' + txt + '</div></div></div>'; }
    abrirModal('<h3>' + (c ? esc(c.nome) + ': atributos' : 'O que são os atributos') + '</h3><p class="small mut">Os atributos <b>só valem no treino</b>. Na corrida da rodada, todos os carros andam igual, para o ranking ser justo.</p>' +
      item('⚡', 'Agilidade', 'Rapidez para trocar de faixa. 100% é o carro padrão; acima disso o carro desvia mais rápido, abaixo, demora mais.', a ? Math.round(a.faixa * 100) + '%' : '') +
      item('🛞', 'Pneus', 'Quanto o pneu gasta com o tempo. No carro padrão ele dura cerca de ' + duraPneu({ pneu: 1 }) + ' s até precisar parar no CAP Porto; na reta final (depois de 2 min) gasta mais rápido.', a ? (a.pneu < 1 ? 'duram mais' : a.pneu > 1 ? 'gastam mais' : 'normais') + ' · ~' + duraPneu(a) + ' s' : '') +
      item(a && a.eletrico ? '🔋' : '⛽', 'Motor', 'Combustão: tanque dura cerca de 95 s e abastece em 2 s no posto. Elétrico: bateria dura cerca de 65 s e recarrega em 3,5 s, mas tem torque instantâneo (+10% de agilidade, já somado) e rende +15% de créditos no treino e nos duelos.', a ? (a.eletrico ? 'elétrico' : 'combustão') : '') +
      item('🛡️', 'Seguro inicial', 'Se o carro já larga com um Seguro Porto, que é uma vida extra. "—" quer dizer que larga sem nenhum.', a ? (a.seguro ? 'larga com 1' : 'sem') : '') +
      '<p class="tiny mut" style="margin-top:10px">Carros mais caros costumam ser mais ágeis, mas gastam pneu rápido e não têm seguro. Clássicos e utilitários manobram menos e aguentam mais.</p>' +
      '<div class="mact"><button class="btn lar" data-a="fecharModal">Entendi</button></div>');
  },
  verMultas: function () { if (typeof fecharOv === 'function') fecharOv(); S.tab = 'garagem'; GS.aba = 'minha'; R(); window.scrollTo(0, 0); },
  garPagarMulta: function (v) {
    var m = multasPend().filter(function (x) { return x.id === v; })[0]; if (!m) return;
    var val = Garagem.valorMulta(m, Date.now());
    abrirConfirma('Pagar multa?', 'Evasão de pedágio' + (Garagem.CATALOGO[m.cat] ? ' com o ' + Garagem.CATALOGO[m.cat].nome : '') + '. Valor: ' + nCred(val) + ' créditos' + (Date.now() <= m.vence ? ' (já com desconto).' : ' (vencida, com acréscimo).'), 'Pagar', function () {
      garChamar({ op: 'pagarMulta', id: v }, function () { toast('Multa paga.'); R(); });
    });
  },
  garUsar: function (v) { gravarLS('gi_carro', v); toast('Carro escolhido para a corrida.'); R(); },
  garExtrato: function () {
    var sd = GS.saldo || {}, mv = (D.carteira && D.carteira.mov) || sd.mov || [];
    abrirModal('<h3>Extrato de créditos</h3><div class="gext"><div class="row between"><span>Ganhos jogando (rodadas, Placa! e treinos)</span><b>' + nCred(sd.ganhos) + '</b></div><div class="row between"><span>Vendas no mercado</span><b>+' + nCred(sd.recebido) + '</b></div><div class="row between"><span>Compras e multas</span><b>−' + nCred(sd.gasto) + '</b></div><div class="row between" style="border-top:1px solid var(--line);padding-top:8px"><span>Saldo</span><b>' + nCred(sd.saldo) + '</b></div></div>' +
      (mv.length ? '<div class="sec" style="margin-top:14px">Últimas movimentações</div>' + mv.slice(0, 12).map(function (m) { return '<div class="row between small" style="padding:5px 0;border-bottom:1px solid var(--line)"><span>' + esc(m.d) + '</span><b style="color:' + (m.v < 0 ? 'var(--ink)' : '#17935F') + '">' + (m.v > 0 ? '+' : '−') + nCred(Math.abs(m.v)) + '</b></div>'; }).join('') : '') +
      '<div class="mact"><button class="btn gh" data-a="fecharModal">Fechar</button></div>');
  },
  garComprar0km: function (v) {
    var c = Garagem.CATALOGO[v];
    abrirConfirma('Comprar ' + c.nome + '?', 'Custa ' + nCred(c.preco) + ' créditos. O carro vai para a sua garagem na hora.', 'Comprar', function () {
      garChamar({ op: 'comprar0km', cat: v }, function (r) { if (r && r.iid) gravarLS('gi_carro', r.iid); toast(c.nome + ' na garagem! Já está em uso.'); GS.aba = 'minha'; R(); });
    });
  },
  garComprarRet: function (v) {
    var it = GS.estoque && GS.estoque.itens.filter(function (x) { return x.id === v; })[0]; if (!it) return;
    var c = Garagem.CATALOGO[it.cat];
    var org = Garagem.origemRetomado(it);
    abrirConfirma('Comprar ' + c.nome + ' retomado ' + (org === 'itau' ? 'do Itaú' : 'da Porto') + '?', kmTxt(it.km) + ', ' + (org === 'itau' ? 'retomado de financiamento pelo Itaú' : 'recuperado pela Porto') + ' e revisado. Custa ' + nCred(it.preco) + ' créditos.', 'Comprar', function () {
      garChamar({ op: 'comprarRetomado', item: v }, function (r) { if (r && r.iid) gravarLS('gi_carro', r.iid); toast(c.nome + ' na garagem! Já está em uso.'); GS.aba = 'minha'; R(); });
    });
  },
  garComprarUsado: function (v) {
    var a = D.anuncios[v]; if (!a) return;
    var c = Garagem.CATALOGO[a.cat], tx = Garagem.taxa(a.preco);
    abrirConfirma('Comprar ' + c.nome + ' de ' + (a.vendedorAp || 'colega') + '?', 'Preço ' + nCred(a.preco) + ' + taxa de transferência ' + nCred(tx) + ' = ' + nCred(a.preco + tx) + ' créditos.', 'Comprar', function () {
      garChamar({ op: 'comprarUsado', anuncioId: v }, function (r) { if (r && r.iid) gravarLS('gi_carro', r.iid); toast(c.nome + ' na garagem! Já está em uso.'); GS.aba = 'minha'; R(); });
    });
  },
  garAnunciar: function (v) {
    var x = meusCarros().filter(function (y) { return y.key === v; })[0]; if (!x) return;
    var c = Garagem.CATALOGO[x.cat], sug = Garagem.precoAuraCarro(x.cat, x.km, listaTransacoes());
    abrirModal('<h3>Anunciar ' + esc(c.nome) + '</h3><p class="mut small">Quem comprar paga o seu preço mais 5% de taxa. Você recebe o preço inteiro. O <b>Preço Aura</b> deste carro (' + kmTxt(x.km) + ') é ' + nCred(sug) + '; novo, ele custa ' + nCred(c.preco) + '.</p>' +
      '<label class="f" for="garPreco">Preço em créditos</label><input class="inp" id="garPreco" type="number" inputmode="numeric" min="' + Garagem.PRECO_MIN + '" max="' + Garagem.PRECO_MAX + '" value="' + sug + '">' +
      '<div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="garAnunciarOk" data-v="' + esc(v) + '">Anunciar</button></div>');
  },
  garAnunciarOk: function (v) {
    var p = parseInt(($('#garPreco') || {}).value, 10);
    fecharModal();
    garChamar({ op: 'anunciar', iid: v, preco: p }, function () { toast('Anúncio publicado no mercado.'); });
  },
  garCancelar: function (v) { garChamar({ op: 'cancelarAnuncio', anuncioId: v }, function () { toast('Anúncio cancelado.'); }); }
};
