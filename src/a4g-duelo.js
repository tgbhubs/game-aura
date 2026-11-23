/* ================== DUELOS (melhor de 3 corridas, cada um no seu tempo) ==================
   Quem desafia escolhe a pessoa e a aposta (créditos ou um carro); quem aceita escolhe a sua.
   As 3 pistas são as mesmas para os dois, valem os atributos do carro e quem vencer 2 leva tudo. */
var DU = { tela: false, vistos: {}, atualizados: {} };
function duelosLista() { var u = S.user.uid; return Object.keys(D.duelos || {}).map(function (k) { var d = D.duelos[k]; d._id = k; return d; }).filter(function (d) { return (d.uids || []).indexOf(u) >= 0; }); }
// retrospecto na temporada (estatísticas dos duelos encerrados)
function retrospectoDuelos(uid) {
  var tid = tempAtivaId(); if (!tid) return '';
  var x = calcDuelos(tid).por[uid]; if (!x) return '';
  return '<div class="dstats"><div><b>' + x.vitorias + '</b><span>vitórias</span></div><div><b>' + x.derrotas + '</b><span>derrotas</span></div><div><b>' + Math.round(x.taxa * 100) + '%</b><span>aproveitamento</span></div><div><b>' + (x.creditos > 0 ? '+' : '') + nCred(x.creditos) + '</b><span>créditos</span></div><div><b>' + x.carrosGanhos + '</b><span>carros ganhos</span></div><div><b>' + x.maiorSeq + '</b><span>maior sequência</span></div></div>';
}
function meuLado(d) { return Garagem.lado(d, S.user.uid); }
function advDe(d) { var l = meuLado(d), o = Garagem.outro(l); return { uid: d[o], ap: d.ap[o], lado: o }; }
function prazoTxt(ms) { var h = Math.max(0, Math.round((ms - Date.now()) / 3600000)); return h >= 24 ? Math.floor(h / 24) + ' d ' + (h % 24) + ' h' : h + ' h'; }
function convitesRecebidos() { return duelosLista().filter(function (d) { return d.status === 'pendente' && d.para === S.user.uid && Date.now() <= d.prazo; }); }
function duelosEmAndamento() { return duelosLista().filter(function (d) { return d.status === 'andamento'; }); }
function proximaCorrida(d) { var cs = d.corridas[meuLado(d)]; for (var i = 0; i < 3; i++) if (!cs[i]) return i; return -1; }
// duelos com prazo vencido são encerrados no servidor quando alguém abre a lista
function atualizarVencidos() {
  duelosLista().forEach(function (d) {
    if (Garagem.duelAtivo(d) && Date.now() > d.prazo && !DU.atualizados[d._id]) {
      DU.atualizados[d._id] = 1; B.chamar('duelo', { op: 'atualizar', id: d._id }).catch(function () { });
    }
  });
}
function apostaHTML(a) { if (!a) return '<span class="mut">a definir</span>'; return a.tipo === 'carro' ? miniCarro(a.cat) + '<b>' + esc(Garagem.CATALOGO[a.cat] ? Garagem.CATALOGO[a.cat].nome : 'carro') + '</b>' : '<b>' + nCred(a.valor) + ' créditos</b>'; }

// resumo de um duelo: corrida a corrida, por que terminou e o que aconteceu com as apostas
function resumoDueloHTML(d) {
  var lado = meuLado(d), a = advDe(d), o = a.lado, pl = Garagem.placarDuelo(d, d.fimEm || Date.now());
  var cs = d.corridas || { de: [], para: [] }, eu = S.user.uid;
  var feitas = function (l) { return l.filter(function (x) { return x && x.t != null; }).length; };
  var nEu = feitas(cs[lado] || []), nEle = feitas(cs[o] || []);
  var placarTxt = (d.placar ? d.placar[lado] : pl.placar[lado]) + ' × ' + (d.placar ? d.placar[o] : pl.placar[o]);
  var res = d.status !== 'fim' ? 'Em andamento' : !d.vencedor ? 'Empate' : d.vencedor === eu ? '🏆 Você venceu' : esc(a.ap) + ' venceu';
  var h = '<h3>⚔️ Você × ' + esc(a.ap) + '</h3><div class="dres ' + (d.status !== 'fim' ? '' : !d.vencedor ? 'emp' : d.vencedor === eu ? 'win' : 'lose') + '"><b>' + res + '</b><span>' + placarTxt + '</span></div>';
  // motivo do fim
  var venceu2 = !!(d.placar && (d.placar.de >= 2 || d.placar.para >= 2));
  var porPrazo = d.status === 'fim' && !venceu2 && (nEu < 3 || nEle < 3);
  if (d.status === 'fim') {
    if (venceu2) h += '<p class="small">' + (d.vencedor === eu ? 'Você' : esc(a.ap)) + ' venceu 2 corridas e fechou o duelo.</p>';
    else if (porPrazo) h += '<p class="small">O prazo de 48 h acabou em <b>' + fmtDiaHora(d.prazo) + '</b>. Você fez ' + nEu + (nEu === 1 ? ' corrida' : ' corridas') + ' e ' + esc(a.ap) + ' fez ' + nEle + '. Corrida não feita vale 0 e, quando os dois ficam sem tempo, a corrida empata.</p>';
    else h += '<p class="small">As 3 corridas foram feitas.</p>';
    if (d.placar && d.placar.de === d.placar.para && d.vencedor) h += '<p class="small">Empatou nas corridas e quem decidiu foi a <b>soma dos tempos</b>.</p>';
  } else h += '<p class="small">Termina em ' + fmtDiaHora(d.prazo) + ' (' + prazoTxt(d.prazo) + ').</p>';
  // tabela corrida a corrida
  h += '<div class="dtab"><div class="dtr dth"><span></span><span>Você</span><span>' + esc(a.ap) + '</span></div>';
  for (var i = 0; i < 3; i++) {
    var x = (cs[lado] || [])[i], y = (cs[o] || [])[i], w = (d.venceu || pl.venceu)[i];
    var cel = function (c) { return c && c.t != null ? '<b>' + fmtSeg(c.t) + '</b>' + miniCarro(c.cat) : c ? '<span class="mut">não terminou</span>' : '<span class="mut">' + (d.status === 'fim' ? 'não correu (0)' : '—') + '</span>'; };
    var marca = w === lado ? '<span class="dwin-t">você</span>' : w === o ? '<span class="dlose-t">' + esc(a.ap) + '</span>' : w === 'empate' ? '<span class="mut">empate</span>' : '';
    h += '<div class="dtr' + (w === lado ? ' g' : w === o ? ' p' : '') + '"><span>Corrida ' + (i + 1) + '<br>' + marca + '</span><span>' + cel(x) + '</span><span>' + cel(y) + '</span></div>';
  }
  h += '</div>';
  // apostas
  var mia = d.aposta[lado], dele = d.aposta[o];
  h += '<div class="dapostas" style="margin-top:12px"><div><span class="tiny mut">Sua aposta</span><div class="small">' + apostaHTML(mia) + '</div></div><div><span class="tiny mut">Aposta de ' + esc(a.ap) + '</span><div class="small">' + apostaHTML(dele) + '</div></div></div>';
  if (d.status === 'fim') {
    var txt = !d.vencedor ? 'As duas apostas voltaram para cada um.' : d.vencedor === eu ? 'Você recebeu de volta a sua aposta e ganhou ' + esc(Garagem.apostaTxt(dele)) + '.' : 'Sua aposta (' + esc(Garagem.apostaTxt(mia)) + ') foi para ' + esc(a.ap) + '.';
    h += '<p class="small" style="margin-top:10px"><b>' + txt + '</b></p>';
  }
  return h + '<div class="mact"><button class="btn gh" data-a="fecharModal">Fechar</button>' + (d.status === 'fim' ? '<button class="btn lar" data-a="duelRevanche" data-v="' + esc(a.uid) + '">Revanche</button>' : '') + '</div>';
}
// mostra o resumo uma vez quando um duelo meu termina
function verDuelosEncerrados() {
  if (!S.user || !D.duelos || $('#modal').className === 'on') return;
  var chave = 'gi_duelos_vistos_' + S.user.uid, vistos = lerLS(chave, null);
  var fim = duelosLista().filter(function (d) { return d.status === 'fim'; });
  if (vistos === null) { gravarLS(chave, fim.map(function (d) { return d._id; })); return; }
  var novo = fim.filter(function (d) { return vistos.indexOf(d._id) < 0; }).sort(function (a, b) { return b.fimEm - a.fimEm; })[0];
  if (!novo || (typeof CR !== 'undefined' && CR)) return;
  vistos.push(novo._id); gravarLS(chave, vistos);
  abrirModal(resumoDueloHTML(novo));
}
function avisoDuelo() {
  setTimeout(verDuelosEncerrados, 300);
  var urg = duelosEmAndamento().filter(function (d) { return proximaCorrida(d) >= 0 && d.prazo - Date.now() < 12 * 3600000 && d.prazo > Date.now(); })[0];
  var alerta = urg ? '<button class="pvez dvez" data-a="duelos"><span class="pvez-c" style="font-size:26px">⏰</span><span style="flex:1;text-align:left"><b>Seu duelo com ' + esc(advDe(urg).ap) + ' acaba em ' + prazoTxt(urg.prazo) + '</b><span>Corrida não feita vale 0. Corra a corrida ' + (proximaCorrida(urg) + 1) + ' de 3.</span></span><span class="tag gold">Correr</span></button>' : '';
  var l = convitesRecebidos(); if (!l.length) return alerta;
  var d = l[0];
  return alerta + '<button class="pvez dvez" data-a="duelos"><span class="pvez-c" style="font-size:26px">⚔️</span><span style="flex:1;text-align:left"><b>' + esc(d.ap.de) + ' te desafiou!</b><span>Duelo valendo ' + esc(Garagem.apostaTxt(d.aposta.de)) + (l.length > 1 ? ' · +' + (l.length - 1) + ' desafio' + (l.length > 2 ? 's' : '') : '') + '</span></span><span class="tag gold">Ver</span></button>';
}
function secaoDuelos() {
  var rec = convitesRecebidos().length, and = duelosEmAndamento().filter(function (d) { return proximaCorrida(d) >= 0; }).length;
  return '<div class="card dcard"><div class="row between" style="gap:10px"><div style="min-width:0"><h3 style="margin:0">⚔️ Duelos</h3><p class="small mut" style="margin:4px 0 0">Desafie alguém numa melhor de 3 corridas, valendo créditos ou um carro.</p></div></div>' +
    (rec || and ? '<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">' + (rec ? '<span class="tag gold">' + rec + ' desafio' + (rec > 1 ? 's' : '') + ' para você</span>' : '') + (and ? '<span class="tag">' + and + ' com corrida sua pendente</span>' : '') + '</div>' : '') +
    '<div class="row" style="gap:8px;margin-top:12px"><button class="btn lar" style="flex:1" data-a="duelDesafiar">Desafiar alguém</button><button class="btn gh" style="flex:1" data-a="duelos">Meus duelos</button></div></div>';
}

function telaDuelos() {
  atualizarVencidos();
  var uid = S.user.uid, l = duelosLista();
  var h = '<div class="row between" style="margin:14px 0 6px"><button class="lnk" data-a="duelVoltar">← Jogar</button><button class="btn lar sm" data-a="duelDesafiar">Desafiar alguém</button></div><h2 style="margin:4px 0 10px">⚔️ Duelos</h2>';
  var rt = retrospectoDuelos(uid);
  if (rt) h += '<div class="card"><div class="row between"><b>Seu retrospecto na temporada</b><button class="lnk tiny" data-a="duelRanking">Ranking de duelos</button></div>' + rt + '</div>';
  else h += '<div class="row" style="justify-content:flex-end;margin:-4px 0 6px"><button class="lnk tiny" data-a="duelRanking">Ranking de duelos</button></div>';
  var rec = l.filter(function (d) { return d.status === 'pendente' && d.para === uid; }).sort(function (a, b) { return b.criadoEm - a.criadoEm; });
  var and = l.filter(function (d) { return d.status === 'andamento'; }).sort(function (a, b) { return a.prazo - b.prazo; });
  var env = l.filter(function (d) { return d.status === 'pendente' && d.de === uid; }).sort(function (a, b) { return b.criadoEm - a.criadoEm; });
  var fim = l.filter(function (d) { return !Garagem.duelAtivo(d); }).sort(function (a, b) { return (b.fimEm || b.criadoEm) - (a.fimEm || a.criadoEm); }).slice(0, 12);
  if (!l.length) h += '<div class="empty">Nenhum duelo ainda. Que tal desafiar alguém?</div>';
  if (rec.length) {
    h += '<div class="sec">Desafios para você</div>';
    rec.forEach(function (d) {
      var venc = Date.now() > d.prazo;
      h += '<div class="card dduel"><div class="row" style="gap:10px;align-items:center">' + avatar(jogDe(d.de, { uid: d.de, ap: d.ap.de }), d.de) + '<div style="min-width:0;flex:1"><b>' + esc(d.ap.de) + ' te desafiou</b><div class="small mut">Aposta: ' + apostaHTML(d.aposta.de) + '</div><div class="tiny mut">' + (venc ? 'Expirou' : 'Responda em ' + prazoTxt(d.prazo)) + '</div></div></div>' +
        (venc ? '' : '<div class="row" style="gap:8px;margin-top:10px"><button class="btn gh" style="flex:1" data-a="duelRecusar" data-v="' + d._id + '">Recusar</button><button class="btn lar" style="flex:1" data-a="duelAceitar" data-v="' + d._id + '">Aceitar</button></div>') + '</div>';
    });
  }
  if (and.length) {
    h += '<div class="sec">Em andamento</div>';
    and.forEach(function (d) { h += cartaoDuelo(d); });
  }
  if (env.length) {
    h += '<div class="sec">Esperando resposta</div>';
    env.forEach(function (d) {
      h += '<div class="card dduel"><div class="row" style="gap:10px;align-items:center">' + avatar(jogDe(d.para, { uid: d.para, ap: d.ap.para }), d.para) + '<div style="min-width:0;flex:1"><b>Você desafiou ' + esc(d.ap.para) + '</b><div class="small mut">Sua aposta: ' + apostaHTML(d.aposta.de) + '</div><div class="tiny mut">' + (Date.now() > d.prazo ? 'Expirou: a aposta volta para você' : 'Expira em ' + prazoTxt(d.prazo)) + '</div></div><button class="lnk tiny" data-a="duelCancelar" data-v="' + d._id + '">Cancelar</button></div></div>';
    });
  }
  if (fim.length) {
    h += '<div class="sec">Histórico</div>';
    fim.forEach(function (d) {
      var a = advDe(d), lado = meuLado(d), res;
      if (d.status === 'fim') res = !d.vencedor ? '<span class="tag">Empate</span>' : d.vencedor === uid ? '<span class="tag dwin">Venceu ' + d.placar[lado] + '×' + d.placar[a.lado] + '</span>' : '<span class="tag dlose">Perdeu ' + d.placar[lado] + '×' + d.placar[a.lado] + '</span>';
      else res = '<span class="tag">' + ({ recusado: 'Recusado', cancelado: 'Cancelado', expirado: 'Expirou' })[d.status] + '</span>';
      var premio = d.status === 'fim' && d.vencedor ? (d.vencedor === uid ? 'Ganhou ' : 'Perdeu ') + esc(Garagem.apostaTxt(d.aposta[d.vencedor === uid ? a.lado : lado])) : '';
      h += '<button class="rk rkbtn" data-a="duelResumo" data-v="' + d._id + '"><span class="pos">⚔️</span>' + avatar(jogDe(a.uid, { uid: a.uid, ap: a.ap }), a.uid) + '<div class="nm"><b>' + esc(a.ap) + '</b><span>' + (premio || 'Toque para ver o resumo') + '</span></div><div>' + res + '</div></button>';
    });
  }
  h += '<div class="card" style="margin-top:16px"><h3 style="margin-top:0">Como funciona</h3><ul class="small" style="margin:0;padding-left:18px;line-height:1.6">' +
    '<li>Quem desafia escolhe a aposta: de ' + Garagem.DUELO.minCred + ' a ' + Garagem.DUELO.maxCred + ' créditos ou um dos seus carros. Quem aceita escolhe a sua.</li>' +
    '<li>São <b>3 corridas</b> com as mesmas pistas para os dois. Cada um corre quando quiser, em até ' + Math.round(Garagem.DUELO.prazoCorridas / 3600000) + ' h depois do aceite. Cada corrida é uma tentativa só.</li>' +
    '<li>Valem os <b>atributos do carro</b> que você escolher em cada corrida. Multas no free flow também valem.</li>' +
    '<li>Ganha quem vencer 2 corridas e leva as duas apostas. Se empatar, decide a soma dos tempos; empate total devolve tudo. Corrida não feita no prazo vale 0.</li>' +
    '<li>As apostas ficam reservadas até o fim: carro apostado não pode ser anunciado nem apostado de novo.</li></ul></div>';
  return h;
}
function cartaoDuelo(d) {
  var a = advDe(d), lado = meuLado(d), pl = Garagem.placarDuelo(d, Date.now()), prox = proximaCorrida(d);
  var h = '<div class="card dduel"><div class="row" style="gap:10px;align-items:center">' + avatar(jogDe(a.uid, { uid: a.uid, ap: a.ap }), a.uid) + '<div style="min-width:0;flex:1"><b>Você × ' + esc(a.ap) + '</b><div class="tiny mut">Termina em ' + prazoTxt(d.prazo) + '</div></div><div class="dplacar">' + pl.placar[lado] + '<small>×</small>' + pl.placar[a.lado] + '</div></div>' +
    '<div class="dapostas"><div><span class="tiny mut">Sua aposta</span><div class="small">' + apostaHTML(d.aposta[lado]) + '</div></div><div><span class="tiny mut">Aposta de ' + esc(a.ap) + '</span><div class="small">' + apostaHTML(d.aposta[a.lado]) + '</div></div></div><div class="dcorridas">';
  for (var i = 0; i < 3; i++) {
    var eu = d.corridas[lado][i], ele = d.corridas[a.lado][i], w = pl.venceu[i];
    var tEu = eu ? (eu.t != null ? fmtSeg(eu.t) : 'correndo…') : '—', tEle = ele ? (ele.t != null ? fmtSeg(ele.t) : 'correndo…') : '—';
    h += '<div class="dcor' + (w === lado ? ' ganhei' : w === a.lado ? ' perdi' : '') + '"><span class="tiny mut">Corrida ' + (i + 1) + '</span><div><b>' + tEu + '</b>' + (eu && eu.t != null ? miniCarro(eu.cat) : '') + '</div><div class="tiny mut">' + esc(a.ap) + ': ' + tEle + '</div></div>';
  }
  h += '</div>';
  var horas = (d.prazo - Date.now()) / 3600000;
  if (prox >= 0 && horas < 12) h += '<div class="dalerta">⏰ Faltam ' + prazoTxt(d.prazo) + '. Corrida não feita até lá vale 0.</div>';
  if (prox >= 0) h += '<button class="btn lar full" style="margin-top:10px" data-a="duelCorrer" data-v="' + d._id + '|' + prox + '">Correr a corrida ' + (prox + 1) + ' de 3</button>';
  else h += '<p class="tiny mut" style="margin:10px 0 0">Você já correu as 3. Falta ' + esc(a.ap) + ' terminar.</p>';
  h += '<button class="lnk tiny" style="margin-top:8px" data-a="duelResumo" data-v="' + d._id + '">Ver resumo</button>';
  return h + '</div>';
}

// ----- escolher a aposta (créditos ou carro), usado ao desafiar e ao aceitar -----
function carrosApostaveis() {
  var anunciados = Object.keys(D.anuncios || {}).map(function (k) { return D.anuncios[k]; }).filter(function (x) { return x.vendedor === S.user.uid; }).map(function (x) { return x.iid; });
  var multas = Garagem.multasPendentes(D.carteira).map(function (m) { return m.carro; });
  var g = (D.garagem && D.garagem.carros) || {};
  return Object.keys(g).filter(function (k) { var c = g[k]; return c.origem !== 'base' && !c.travado && anunciados.indexOf(k) < 0 && multas.indexOf(k) < 0 && Garagem.CATALOGO[c.cat]; })
    .map(function (k) { return { key: k, cat: g[k].cat }; });
}
function formAposta() {
  var cs = carrosApostaveis(), tipo = DU.tipo || 'creditos', saldo = GS.saldo ? GS.saldo.saldo : null;
  var h = '<label class="f">Sua aposta</label><div class="seg" style="margin:0 0 8px;display:grid;grid-template-columns:1fr 1fr"><button class="' + (tipo === 'creditos' ? 'on' : '') + '" data-a="duelTipo" data-v="creditos">Créditos</button><button class="' + (tipo === 'carro' ? 'on' : '') + '" data-a="duelTipo" data-v="carro">Um carro</button></div>';
  if (tipo === 'creditos') {
    h += '<input class="inp" id="duValor" type="number" inputmode="numeric" min="' + Garagem.DUELO.minCred + '" max="' + Garagem.DUELO.maxCred + '" value="' + (DU.valor || 20) + '"><div class="tiny mut">De ' + Garagem.DUELO.minCred + ' a ' + Garagem.DUELO.maxCred + ' créditos' + (saldo != null ? ' · você tem ' + nCred(saldo) : '') + '.</div>';
  } else if (!cs.length) {
    h += '<div class="small mut">Você não tem carro para apostar. Os carros da casa não valem, e carro anunciado, com multa ou já apostado também não.</div>';
  } else {
    h += '<div class="garagem rolar" style="margin:0">' + cs.map(function (x) { var c = Garagem.CATALOGO[x.cat], f = window.FOTOS_CARROS && FOTOS_CARROS[x.cat]; return '<button class="gcar' + (DU.iid === x.key ? ' on' : '') + '" style="color:var(--ink)" data-a="duelCarro" data-v="' + esc(x.key) + '">' + (f ? '<img src="' + f.foto + '" alt="">' : '') + '<span>' + esc(c.nome) + '</span></button>'; }).join('') + '</div>';
  }
  return h;
}
function lerAposta() {
  if ((DU.tipo || 'creditos') === 'carro') { if (!DU.iid) return null; return { tipo: 'carro', iid: DU.iid }; }
  var el = $('#duValor'); var v = Math.round(Number(el ? el.value : 0)); DU.valor = v;
  return { tipo: 'creditos', valor: v };
}
function modalDesafiar() {
  var uid = S.user.uid;
  var pessoas = Object.keys(D.jogadores || {}).filter(function (k) { return k !== uid && D.jogadores[k].status === 'ativo'; })
    .sort(function (a, b) { return nomeExib(D.jogadores[a]).localeCompare(nomeExib(D.jogadores[b])); });
  abrirModal('<h3>⚔️ Desafiar para um duelo</h3><p class="small mut">Melhor de 3 corridas, cada um no seu tempo. Quem vencer leva as duas apostas.</p>' +
    '<label class="f" for="duPara">Quem você quer desafiar?</label><select class="inp" id="duPara"><option value="">Escolha…</option>' + pessoas.map(function (k) { return '<option value="' + esc(k) + '"' + (DU.para === k ? ' selected' : '') + '>' + esc(nomeExib(D.jogadores[k])) + ' · ' + esc(areaNome(D.jogadores[k].areaId)) + '</option>'; }).join('') + '</select>' +
    '<div id="duForm">' + formAposta() + '</div><div id="duErr"></div><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="duelEnviar">Desafiar</button></div>');
}
function modalAceitar(id) {
  var d = D.duelos[id]; if (!d) return;
  abrirModal('<h3>Aceitar o duelo de ' + esc(d.ap.de) + '?</h3><p class="small">A aposta de ' + esc(d.ap.de) + ': ' + apostaHTML(d.aposta.de) + '</p><p class="small mut">Escolha o que você aposta. Quem vencer leva as duas apostas.</p>' +
    '<div id="duForm">' + formAposta() + '</div><div id="duErr"></div><div class="mact"><button class="btn gh" data-a="fecharModal">Voltar</button><button class="btn lar" data-a="duelConfirmarAceite" data-v="' + id + '">Aceitar e apostar</button></div>');
}
function redesenharForm() { var f = $('#duForm'); if (f) f.innerHTML = formAposta(); }
function erroDuelo(e) { var x = $('#duErr'); if (x) x.innerHTML = '<div class="err">' + esc(msgErro(e)) + '</div>'; else toast(msgErro(e)); }

// ----- corrida do duelo -----
function abrirCorridaDuelo(id, n) {
  var d = D.duelos[id]; if (!d) return;
  var a = advDe(d);
  CR = { duelo: { id: id, n: n, adv: a.ap }, fase: 'intro' };
  desenharCorrida();
}

var A_DUELO = {
  duelos: function () { DU.tela = true; S.tab = 'jogar'; R(); window.scrollTo(0, 0); },
  duelVoltar: function () { DU.tela = false; R(); },
  duelDesafiar: function () { DU.tipo = 'creditos'; DU.iid = ''; DU.para = ''; if (typeof atualizarSaldo === 'function') atualizarSaldo(); modalDesafiar(); },
  duelTipo: function (v) { var p = $('#duPara'); if (p) DU.para = p.value; var vv = $('#duValor'); if (vv) DU.valor = vv.value; DU.tipo = v; redesenharForm(); Array.prototype.forEach.call(document.querySelectorAll('#modal [data-a="duelTipo"]'), function (b) { b.classList.toggle('on', b.getAttribute('data-v') === v); }); },
  duelCarro: function (v) { DU.iid = v; redesenharForm(); },
  duelEnviar: function () {
    var para = $('#duPara').value, ap = lerAposta();
    if (!para) { erroDuelo({ message: 'Escolha quem você quer desafiar.' }); return; }
    if (!ap) { erroDuelo({ message: 'Escolha o carro que vai apostar.' }); return; }
    B.chamar('duelo', { op: 'desafiar', para: para, aposta: ap }).then(function () { fecharModal(); toast('Desafio enviado! A pessoa tem 48 h para aceitar.'); DU.tela = true; R(); }).catch(erroDuelo);
  },
  duelAceitar: function (id) { DU.tipo = 'creditos'; DU.iid = ''; if (typeof atualizarSaldo === 'function') atualizarSaldo(); modalAceitar(id); },
  duelConfirmarAceite: function (id) {
    var ap = lerAposta(); if (!ap) { erroDuelo({ message: 'Escolha o carro que vai apostar.' }); return; }
    B.chamar('duelo', { op: 'aceitar', id: id, aposta: ap }).then(function () { fecharModal(); toast('Duelo aceito! Valendo.'); R(); }).catch(erroDuelo);
  },
  duelRecusar: function (id) { abrirConfirma('Recusar o desafio?', 'A aposta volta para quem desafiou.', 'Recusar', function () { B.chamar('duelo', { op: 'recusar', id: id }).catch(function (e) { toast(msgErro(e)); }); }); },
  duelCancelar: function (id) { abrirConfirma('Cancelar o desafio?', 'Sua aposta volta para você.', 'Cancelar desafio', function () { B.chamar('duelo', { op: 'cancelar', id: id }).catch(function (e) { toast(msgErro(e)); }); }); },
  duelResumo: function (id) { var d = D.duelos[id]; if (d) { d._id = id; abrirModal(resumoDueloHTML(d)); } },
  duelRevanche: function (uid) { fecharModal(); DU.tipo = 'creditos'; DU.iid = ''; DU.para = uid; if (typeof atualizarSaldo === 'function') atualizarSaldo(); modalDesafiar(); },
  duelRanking: function () { DU.tela = false; S.tab = 'ranking'; S.rankModo = 'duelos'; R(); window.scrollTo(0, 0); },
  duelVerDepois: function () { fecharOv(); DU.tela = true; S.tab = 'jogar'; R(); window.scrollTo(0, 0); },
  duelCorrer: function (v) { var p = v.split('|'); abrirCorridaDuelo(p[0], parseInt(p[1], 10)); }
};
