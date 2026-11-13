/* ================== GARAGEM (créditos, 0 km, Retomados Porto e mercado) ==================
   Tudo que mexe em créditos passa pela Cloud Function "garagem"; aqui só mostramos e pedimos. */
var GS = { aba: 'minha', saldo: null, carregandoSaldo: false, estoque: null, subEst: null, semana: '' };
function nCred(n) { return (n || 0).toLocaleString('pt-BR'); }
function fotoCat(cat) { var f = window.FOTOS_CARROS && FOTOS_CARROS[cat]; return f ? '<img class="gfoto" src="' + f.foto + '" alt="">' : '<div class="gfoto"></div>'; }
function origemTxt(o) { return o === 'base' ? 'Da casa' : o === 'retomado' ? 'Retomado Porto' : o === 'usado' ? 'Usado' : '0 km'; }
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
    GS.subEst = B.ouvirDoc('estoque/' + sem, function (d) { GS.estoque = d; if (S.tab === 'garagem') R(); });
  }).catch(function (e) { toast(msgErro(e)); });
}

function telaGaragem() {
  if (GS.saldo == null) atualizarSaldo();
  var sd = GS.saldo, h = '';
  h += '<div class="card gsaldo"><div class="row between" style="align-items:flex-end"><div><div class="tiny" style="opacity:.75;letter-spacing:.06em">SEUS CRÉDITOS</div><div class="gnum">' + (sd ? nCred(sd.saldo) : '…') + '</div></div>' +
    '<button class="btn sm" style="background:rgba(255,255,255,.12);color:#fff" data-a="garExtrato">Extrato</button></div>' +
    '<p class="small" style="opacity:.8;margin:8px 0 0">Você ganha créditos com os pontos de cada rodada (quiz + corrida) e com ' + Garagem.PONTOS_VITORIA_PLACA + ' por vitória no Placa! contra pessoas. Os créditos acumulam para sempre.</p></div>';
  h += '<div class="seg">' + [['minha', 'Garagem'], ['0km', '0 km'], ['retomados', 'Retomados'], ['mercado', 'Mercado']].map(function (a) {
    return '<button class="' + (GS.aba === a[0] ? 'on' : '') + '" data-a="garAba" data-v="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>';
  if (GS.aba === 'minha') h += garMinha();
  else if (GS.aba === '0km') h += gar0km();
  else if (GS.aba === 'retomados') h += garRetomados();
  else h += garMercado();
  return h;
}
function anuncioDe(key) { return Object.keys(D.anuncios || {}).map(function (k) { var a = D.anuncios[k]; a._id = k; return a; }).filter(function (a) { return a.iid === key && a.status === 'ativo'; })[0]; }
function garMinha() {
  var sel = carroPreferido(), h = '<p class="small mut">Escolha o carro que você usa na corrida. Na rodada todos andam igual; no treino valem os atributos de cada carro.</p><div class="glista">';
  meusCarros().forEach(function (x) {
    var c = Garagem.CATALOGO[x.cat], an = anuncioDe(x.key);
    h += '<div class="gitem' + (sel === x.key ? ' on' : '') + '">' + fotoCat(x.cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b><span>' + c.tipo + ' · ' + origemTxt(x.origem) + (x.origem !== 'base' ? ' · ' + kmTxt(x.km) : '') + (x.de ? ' · era de ' + esc(x.de) : '') + '</span>' + barrasAtrMini(c.atr) +
      '<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">' + (sel === x.key ? '<span class="tag ok">Em uso</span>' : '<button class="btn sm lar" data-a="garUsar" data-v="' + esc(x.key) + '">Usar</button>') +
      (x.origem === 'base' ? '' : an ? '<span class="tag gold">Anunciado por ' + nCred(an.preco) + '</span><button class="lnk tiny" data-a="garCancelar" data-v="' + an._id + '">Cancelar anúncio</button>' : '<button class="btn sm gh" data-a="garAnunciar" data-v="' + esc(x.key) + '">Anunciar no mercado</button>') +
      '</div></div></div>';
  });
  return h + '</div>';
}
function barrasAtrMini(a) {
  return '<div class="gatr"><span title="Agilidade">⚡ ' + Math.round(a.faixa * 100) + '%</span><span title="Pneus">🛞 ' + (a.pneu < 1 ? 'duram mais' : a.pneu > 1 ? 'gastam mais' : 'normais') + '</span><span title="Seguro">🛡️ ' + (a.seguro ? '+1' : '—') + '</span></div>';
}
function gar0km() {
  var saldo = GS.saldo ? GS.saldo.saldo : 0, h = '<p class="small mut">Carros novos, direto da concessionária. Preço fixo.</p><div class="glista">';
  Garagem.VENDA.forEach(function (cat) {
    var c = Garagem.CATALOGO[cat], pode = saldo >= c.preco;
    h += '<div class="gitem">' + fotoCat(cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b><span>' + c.tipo + ' · 0 km</span>' + barrasAtrMini(c.atr) +
      '<div class="row between" style="margin-top:8px"><span class="gpreco">' + nCred(c.preco) + ' <small>créditos</small></span><button class="btn sm ' + (pode ? 'lar' : 'gh') + '" data-a="garComprar0km" data-v="' + cat + '"' + (pode ? '' : ' disabled') + '>' + (pode ? 'Comprar' : 'Faltam ' + nCred(c.preco - saldo)) + '</button></div></div></div>';
  });
  return h + '</div>';
}
function garRetomados() {
  assinarEstoque();
  var e = GS.estoque, saldo = GS.saldo ? GS.saldo.saldo : 0;
  var h = '<div class="card gporto"><b>Retomados Porto</b><p class="small" style="margin:4px 0 0">Carros recuperados pela Porto, revisados e com desconto. Um lote novo de ' + Garagem.LOTE + ' carros chega toda segunda; quem comprar primeiro leva.</p></div>';
  if (!e) return h + carregando('Abrindo o pátio…');
  h += '<div class="glista">';
  e.itens.forEach(function (it) {
    var c = Garagem.CATALOGO[it.cat], vend = !!it.vendidoPara, pode = !vend && saldo >= it.preco;
    var quem = vend ? (it.vendidoPara === S.user.uid ? 'você' : nomeExib(jogDe(it.vendidoPara, null) || {})) : '';
    h += '<div class="gitem' + (vend ? ' vendido' : '') + '">' + fotoCat(it.cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b><span>' + c.tipo + ' · ' + kmTxt(it.km) + ' · revisado</span>' + barrasAtrMini(c.atr) +
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
    h += '<div class="gitem">' + fotoCat(a.cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b><span>' + c.tipo + ' · ' + kmTxt(a.km) + ' · de ' + esc(a.vendedorAp || 'colega') + '</span>' + barrasAtrMini(c.atr) +
      '<div class="row between" style="margin-top:8px"><span class="gpreco">' + nCred(a.preco) + ' <small>+ ' + nCred(tx) + ' de taxa</small></span><button class="btn sm ' + (pode ? 'lar' : 'gh') + '" data-a="garComprarUsado" data-v="' + a._id + '"' + (pode ? '' : ' disabled') + '>' + (pode ? 'Comprar' : 'Faltam ' + nCred(total - saldo)) + '</button></div></div></div>';
  });
  h += '</div>';
  if (meus.length) {
    h += '<div class="sec">Seus anúncios</div><div class="glista">';
    meus.forEach(function (a) { var c = Garagem.CATALOGO[a.cat]; h += '<div class="gitem">' + fotoCat(a.cat) + '<div class="ginfo"><b>' + esc(c.nome) + '</b><span>' + kmTxt(a.km) + '</span><div class="row between" style="margin-top:8px"><span class="gpreco">' + nCred(a.preco) + '</span><button class="btn sm gh" data-a="garCancelar" data-v="' + a._id + '">Cancelar</button></div></div></div>'; });
    h += '</div>';
  }
  return h;
}

function garChamar(d, ok) {
  return B.chamar('garagem', d).then(function (r) { atualizarSaldo(); if (ok) ok(r); return r; }).catch(function (e) { toast(msgErro(e)); });
}
var A_GAR = {
  irGaragem: function () { if (typeof fecharOv === 'function') fecharOv(); S.tab = 'garagem'; GS.aba = 'minha'; R(); },
  garAba: function (v) { GS.aba = v; S.manterScroll = true; R(); },
  garUsar: function (v) { gravarLS('gi_carro', v); toast('Carro escolhido para a corrida.'); R(); },
  garExtrato: function () {
    var sd = GS.saldo || {}, mv = (D.carteira && D.carteira.mov) || sd.mov || [];
    abrirModal('<h3>Extrato de créditos</h3><div class="gext"><div class="row between"><span>Ganhos jogando</span><b>' + nCred(sd.ganhos) + '</b></div><div class="row between"><span>Vendas no mercado</span><b>+' + nCred(sd.recebido) + '</b></div><div class="row between"><span>Compras</span><b>−' + nCred(sd.gasto) + '</b></div><div class="row between" style="border-top:1px solid var(--line);padding-top:8px"><span>Saldo</span><b>' + nCred(sd.saldo) + '</b></div></div>' +
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
    abrirConfirma('Comprar ' + c.nome + ' retomado?', kmTxt(it.km) + ', revisado pela Porto. Custa ' + nCred(it.preco) + ' créditos.', 'Comprar', function () {
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
    var c = Garagem.CATALOGO[x.cat], sug = Math.round(c.preco * (x.origem === '0km' ? 0.8 : 0.6) / 5) * 5;
    abrirModal('<h3>Anunciar ' + esc(c.nome) + '</h3><p class="mut small">Quem comprar paga o seu preço mais 5% de taxa. Você recebe o preço inteiro. Novo, ele custa ' + nCred(c.preco) + '.</p>' +
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
