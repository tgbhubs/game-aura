/* ================== PLACA! (mesa online) ==================
   A mesa pública vem de mesas/{id}; a sua mão, de maos/{id}_{uid}. Toda jogada passa pelo servidor. */
var PL = null;
var PCOR = { L: '#EC7000', A: '#2F7FE0', V: '#17935F', R: '#D23F3F' };
var PROTULO = { ped: 'PEDÁGIO', ret: 'RETORNO', g2: 'GUINCHO', seg: 'SEGURO', s4: 'SEG. TOTAL' };
function placaAtualizarLista() { }

/* ---------- sons ---------- */
var _ac = null;
function som(tipo) {
  try {
    _ac = _ac || new (window.AudioContext || window.webkitAudioContext)();
    if (_ac.state === 'suspended') _ac.resume();
    var seq = { jogar: [[520, 0.05], [780, 0.07]], compra: [[300, 0.07]], vez: [[660, 0.09], [880, 0.12]], placa: [[880, 0.06], [1100, 0.06], [1320, 0.1]], multa: [[180, 0.18]], fim: [[523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.22]], erro: [[150, 0.08]] }[tipo];
    if (!seq) return;
    var t = _ac.currentTime;
    seq.forEach(function (n) {
      var o = _ac.createOscillator(), g = _ac.createGain();
      o.type = tipo === 'multa' || tipo === 'erro' ? 'sawtooth' : 'triangle'; o.frequency.value = n[0];
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1]);
      o.connect(g); g.connect(_ac.destination); o.start(t); o.stop(t + n[1] + 0.02); t += n[1] * 0.9;
    });
  } catch (e) { }
}

/* ---------- cartas ---------- */
var PICO = {
  ped: '<svg viewBox="-5 -3 50 46" aria-hidden="true"><rect x="3" y="8" width="7" height="27" rx="2" fill="currentColor"/><rect x="2" y="32" width="9" height="4" rx="1" fill="currentColor"/><rect x="8" y="13" width="30" height="10" rx="2.5" fill="currentColor"/><path d="M16 13.5l-4 9M24 13.5l-4 9M32 13.5l-4 9" stroke="#fff" stroke-width="3"/></svg>',
  ret: '<svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 15h20l-6-6"/><path d="M31 25H11l6 6"/></svg>',
  seg: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4l13 5v9c0 9-5.6 15.4-13 18C12.6 33.4 7 27 7 18V9z" fill="currentColor"/><path d="M14 19l4.5 4.5L27 15" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
function cartaHTML(id, extra, attrs) {
  var c = Placa.carta(id), cls = 'pc ' + (c.curinga ? 'cw' : 'c' + c.cor) + (extra ? ' ' + extra : '');
  var mio, canto;
  if (/^\d$/.test(c.v)) { mio = '<span class="pv">' + c.v + '</span>'; canto = c.v; }
  else if (c.v === 'g2') { mio = '<span class="pv sm">+2</span>'; canto = '+2'; }
  else if (c.v === 's4') { mio = PICO.seg + '<span class="pmais">+4</span>'; canto = '+4'; }
  else { mio = PICO[c.v]; canto = c.v === 'ped' ? '⊘' : c.v === 'ret' ? '⇄' : '★'; }
  return '<button class="' + cls + '" ' + (attrs || '') + ' aria-label="' + esc(Placa.nomeCarta(id)) + '"><span class="pk">' + canto + '</span><span class="po">' + mio + '</span>' +
    (PROTULO[c.v] ? '<span class="pr">' + PROTULO[c.v] + '</span>' : '') + '</button>';
}
function versoHTML(extra, attrs, n) {
  return '<button class="pc verso' + (extra ? ' ' + extra : '') + '" ' + (attrs || '') + '><span class="pvl">PLACA!</span>' + (n != null ? '<span class="pn">' + n + '</span>' : '') + '</button>';
}

/* ---------- lista de mesas (aba Jogar e Início) ---------- */
function minhasMesasVez() {
  if (!S.user) return [];
  var me = S.user.uid;
  return Object.keys(D.mesas).filter(function (k) { var m = D.mesas[k]; return m.status === 'jogando' && m.jogadores[m.vez] && m.jogadores[m.vez].uid === me; });
}
function avisoVezPlaca() {
  var l = minhasMesasVez();
  if (!l.length) return '';
  return '<button class="pvez" data-a="placaAbrir" data-v="' + l[0] + '"><span class="pvez-c">' + cartaHTML('L.7.1', 'mini') + '</span><span style="flex:1;text-align:left"><b>Sua vez no Placa!</b><span>' + (l.length > 1 ? l.length + ' mesas esperando você' : 'A mesa está esperando sua jogada') + '</span></span><span class="tag gold">Jogar</span></button>';
}
function secaoPlaca() {
  var me = S.user.uid;
  var ids = Object.keys(D.mesas).filter(function (k) { var m = D.mesas[k]; return m.status === 'aguardando' || m.uids.indexOf(me) >= 0; });
  ids.sort(function (a, b) {
    var A1 = D.mesas[a], B1 = D.mesas[b];
    var pa = (A1.uids.indexOf(me) >= 0 ? 0 : 2) + (A1.status === 'aguardando' ? 0 : 1), pb = (B1.uids.indexOf(me) >= 0 ? 0 : 2) + (B1.status === 'aguardando' ? 0 : 1);
    return pa - pb || (B1.atualizadaEm || 0) - (A1.atualizadaEm || 0);
  });
  var jogando = Object.keys(D.mesas).filter(function (k) { var m = D.mesas[k]; return m.status !== 'aguardando' && m.uids.indexOf(me) < 0; }).length;
  var h = '<div class="sec">Placa! · jogo de cartas</div><div class="card pl-card">' +
    '<div class="row" style="gap:12px;align-items:flex-start"><div class="pl-leque">' + cartaHTML('A.ped.1', 'mini') + cartaHTML('L.7.1', 'mini') + cartaHTML('W.s4.1', 'mini') + '</div>' +
    '<div style="flex:1;min-width:0"><h3 style="margin:0 0 2px">Mesa online, de 2 a 6 pessoas</h3><p class="small mut" style="margin:0">Combine cor ou número, zere a mão e grite "Placa!" na penúltima carta. Ranking próprio, separado do quiz e da corrida.</p></div></div>' +
    '<button class="btn lar full" style="margin-top:12px" data-a="placaCriar">Criar mesa</button>';
  if (!ids.length) h += '<p class="small mut" style="margin:12px 0 0;text-align:center">Nenhuma mesa esperando gente agora. Crie uma e chame o time.</p>';
  ids.forEach(function (k) {
    var m = D.mesas[k], minha = m.uids.indexOf(me) >= 0, vez = m.status === 'jogando' && m.jogadores[m.vez] && m.jogadores[m.vez].uid === me;
    var st = m.status === 'aguardando' ? '<span class="tag nv">' + m.jogadores.length + ' de ' + m.lugares + ' lugares</span>' : m.status === 'pausada' ? '<span class="tag">Pausada</span>' : vez ? '<span class="tag gold">Sua vez</span>' : '<span class="tag ok">Em jogo</span>';
    var dono = jogDe(m.dono, null) || m.jogadores[0];
    var bt = minha ? '<button class="btn sm' + (vez ? ' lar' : '') + '" data-a="placaAbrir" data-v="' + k + '">' + (m.status === 'aguardando' ? 'Ver mesa' : 'Abrir') + '</button>'
      : '<button class="btn sm lar" data-a="placaEntrar" data-v="' + k + '">Entrar</button>';
    h += '<div class="pl-mesa"><div class="pl-avs">' + m.jogadores.slice(0, 4).map(function (j) { return avatar(jogDe(j.uid, j), j.uid, 'sm'); }).join('') + '</div>' +
      '<div style="flex:1;min-width:0"><b class="small">Mesa de ' + esc(nomeExib(dono)) + '</b><div>' + st + '</div></div>' + bt +
      (ehAdm() && !minha ? '<button class="lnk tiny" data-a="placaFecharMesa" data-v="' + k + '">Fechar</button>' : '') + '</div>';
  });
  if (jogando) h += '<p class="tiny mut" style="margin:10px 0 0;text-align:center">' + jogando + ' mesa' + (jogando > 1 ? 's' : '') + ' em jogo agora.</p>';
  return h + '</div>';
}

/* ---------- abrir / fechar a mesa ---------- */
function abrirMesa(mid) {
  fecharMesaPlaca(true);
  PL = { mid: mid, mesa: null, mao: [], unsub: [], seq: -1, vezAntes: false };
  var uid = S.user.uid;
  PL.unsub.push(B.ouvirDoc('mesas/' + mid, function (m) {
    if (!PL || PL.mid !== mid) return;
    var antes = PL.mesa; PL.mesa = m; eventosMesa(antes, m); desenharMesa();
  }));
  PL.unsub.push(B.ouvirDoc('maos/' + mid + '_' + uid, function (d) {
    if (!PL || PL.mid !== mid) return;
    var nova = (d && d.cartas) || [];
    PL.novas = nova.filter(function (c) { return PL.mao.indexOf(c) < 0; });
    PL.mao = nova; desenharMesa();
  }));
  PL.relogio = setInterval(function () { if (PL && PL.mesa && PL.mesa.status === 'jogando') desenharMesa(); }, 30000);
  if (B.placaRobos) B.placaRobos(mid);
  abrirOv('<div class="pmesa"><div class="loading" style="color:#fff"><div class="spin"></div><div>Abrindo a mesa…</div></div></div>');
  $('#ov').classList.add('pl');
}
function fecharMesaPlaca(semRender) {
  if (!PL) return;
  limpar(PL.unsub); clearInterval(PL.relogio); PL = null;
  var o = $('#ov'); o.className = ''; o.innerHTML = ''; document.body.style.overflow = '';
  if (!semRender) R();
}
function eventosMesa(antes, m) {
  if (!m) return;
  var me = S.user.uid;
  var ev = m.ultimo;
  if (antes && ev && ev.s !== (antes.ultimo && antes.ultimo.s)) {
    PL.anim = !!ev.jogou;
    if (m.status === 'fim') som('fim');
    else if (ev.multa) som('multa');
    else if (ev.grito) som('placa');
    else if (ev.jogou) som('jogar');
    else if (ev.compra) som('compra');
  } else PL.anim = false;
  var vez = m.status === 'jogando' && m.jogadores[m.vez] && m.jogadores[m.vez].uid === me;
  if (vez && !PL.vezAntes && antes) { setTimeout(function () { som('vez'); }, 260); try { navigator.vibrate && navigator.vibrate(60); } catch (e) { } }
  PL.vezAntes = vez;
}
function placaChamar(op, extra) {
  if (!PL || PL.ocupado) return Promise.resolve();
  var d = { op: op, mesaId: PL.mid }; Object.keys(extra || {}).forEach(function (k) { d[k] = extra[k]; });
  PL.ocupado = true;
  return B.chamar('placa', d).then(function (r) { if (PL) PL.ocupado = false; return r; })
    .catch(function (e) { if (PL) PL.ocupado = false; som('erro'); toast(msgErro(e)); });
}

/* ---------- desenho ---------- */
function estadoCliente(m) { return { acumulo: m.acumulo || 0, comprou: m.comprou || '', cor: m.cor, descarte: [m.topo] }; }
function nomeJ(j) { var x = jogDe(j.uid, j); return nomeExib(x); }
function desenharMesa() {
  if (!PL) return;
  var m = PL.mesa, me = S.user.uid, o = $('#ov');
  var sl = o.querySelector('.pmao'); var scroll = sl ? sl.scrollLeft : 0;
  if (!m) { o.innerHTML = '<div class="pmesa"><div class="loading" style="color:#fff"><div>Mesa não encontrada.</div><button class="btn wh" data-a="placaFechar">Voltar</button></div></div>'; return; }
  var h = '<div class="pmesa"><div class="ptopo"><div class="row" style="align-items:center">' + wm(20) + '<span class="pill-game">PLACA!</span></div><div class="row" style="gap:8px">' +
    (m.status === 'jogando' || m.status === 'pausada' ? '<button class="xbtn" data-a="placaMenu" aria-label="Menu da mesa">⋯</button>' : '') +
    '<button class="xbtn" data-a="placaFechar" aria-label="Fechar">✕</button></div></div>';
  if (m.status === 'aguardando') h += salaEspera(m, me);
  else if (m.status === 'cancelada') h += fimSimples('Mesa cancelada', 'Todo mundo saiu antes de começar.');
  else h += mesaJogo(m, me);
  h += '</div>';
  o.innerHTML = h;
  var nl = o.querySelector('.pmao'); if (nl) nl.scrollLeft = scroll;
  PL.anim = false; PL.novas = [];
}
function fimSimples(t, s) {
  return '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center"><h2 style="font-size:24px;font-weight:900">' + esc(t) + '</h2><p style="opacity:.75">' + esc(s) + '</p></div><button class="btn wh full" data-a="placaFechar">Voltar</button>';
}
function salaEspera(m, me) {
  var dono = m.dono === me, dentro = m.uids.indexOf(me) >= 0;
  var h = '<div style="flex:1;display:flex;flex-direction:column;justify-content:center"><div class="qtema" style="text-align:center">Sala de espera</div>' +
    '<h2 style="font-size:24px;font-weight:900;text-align:center;margin:4px 0 16px">' + m.jogadores.length + ' de ' + m.lugares + ' lugares ocupados</h2><div class="plugares">';
  for (var i = 0; i < m.lugares; i++) {
    var j = m.jogadores[i];
    h += j ? '<div class="plugar">' + avatar(jogDe(j.uid, j), j.uid) + '<b>' + esc(nomeJ(j)) + '</b>' + (j.uid === m.dono ? '<span>criou a mesa</span>' : '<span>na mesa</span>') + '</div>'
      : '<div class="plugar vazio"><span class="av" style="background:rgba(255,255,255,.08)">+</span><b>Lugar livre</b><span>esperando</span></div>';
  }
  h += '</div><p class="small" style="opacity:.75;text-align:center;margin-top:14px">A partida começa sozinha quando a mesa lotar. Os lugares são sorteados na hora.</p></div>';
  if (!dentro) h += '<button class="btn lar full" data-a="placaEntrar" data-v="' + PL.mid + '">Sentar na mesa</button>';
  if (dono && m.jogadores.length >= 2) h += '<button class="btn lar full" data-a="placaIniciar">Começar com ' + m.jogadores.length + ' pessoas</button>';
  if (DEMO && dentro && m.jogadores.length < m.lugares) h += '<button class="btn wh full" style="margin-top:10px" data-a="placaRobos">Completar com pessoas fictícias (demonstração)</button>';
  if (dentro) h += '<button class="btn gh full" style="margin-top:10px;background:rgba(255,255,255,.1);color:#fff" data-a="placaSair">Sair da mesa</button>';
  return h;
}
function mesaJogo(m, me) {
  var N = m.jogadores.length, eu = -1;
  m.jogadores.forEach(function (j, i) { if (j.uid === me) eu = i; });
  var minhaVez = m.status === 'jogando' && eu === m.vez;
  var h = '';
  // adversários, na ordem em que jogam depois de você
  h += '<div class="pops">';
  for (var k = 1; k < N + (eu < 0 ? 1 : 0); k++) {
    var idx = eu < 0 ? k - 1 : (eu + k * (m.sentido || 1) + N * 6) % N, j = m.jogadores[idx], u = j.uid, nc = (m.nCartas || {})[u] || 0;
    var multa = m.multavel === u && !(m.gritou || {})[u] && eu >= 0 && m.status === 'jogando';
    h += '<div class="pop' + (idx === m.vez && m.status === 'jogando' ? ' vez' : '') + '">' + avatar(jogDe(u, j), u, 'sm') +
      '<b>' + esc(nomeJ(j)) + '</b><span class="pnc">' + nc + ' carta' + (nc === 1 ? '' : 's') + '</span>' +
      ((m.gritou || {})[u] && nc === 1 ? '<span class="pgrito">PLACA!</span>' : '') +
      (multa ? '<button class="pmulta" data-a="placaMulta" data-v="' + u + '">Multa!</button>' : '') + '</div>';
  }
  h += '</div>';
  // centro: monte, descarte, cor e sentido
  var vezJ = m.jogadores[m.vez] || {};
  var podeComprar = minhaVez && !m.comprou;
  h += '<div class="pcentro"><div class="pmonte">' + versoHTML(podeComprar ? 'pode' : '', 'data-a="placaComprar"' + (podeComprar ? '' : ' disabled'), m.nMonte) +
    '<span class="plab">' + (podeComprar ? (m.acumulo ? 'Comprar ' + m.acumulo : 'Comprar') : 'Monte') + '</span></div>' +
    '<div class="pdesc" style="--cor:' + (PCOR[m.cor] || '#fff') + '">' + (m.anteriores || []).slice(-2).map(function (c, i) { return cartaHTML(c, 'atras a' + i, 'disabled tabindex="-1"'); }).join('') +
    cartaHTML(m.topo, 'topo' + (PL.anim ? ' entra' : ''), 'disabled') + '</div>' +
    '<div class="pinfo"><span class="pcorlab" style="background:' + (PCOR[m.cor] || '#fff') + '">' + (Placa.NOME_COR[m.cor] || '') + '</span><span class="psent">' + ((m.sentido || 1) === 1 ? '↻ horário' : '↺ anti-horário') + '</span>' +
    (m.acumulo ? '<span class="pacum">Guincho +' + m.acumulo + '</span>' : '') + '</div></div>';
  // linha do que aconteceu
  h += '<div class="plog" aria-live="polite">' + esc((m.ultimo && m.ultimo.t) || '') + '</div>';
  // avisos: pausa, encerrar, ausente, fim
  var votos = m.votosEncerrar || [];
  if (m.status === 'pausada') {
    var quem = m.jogadores.filter(function (j) { return j.uid === m.pausadaPor; })[0];
    var livre = m.pausadaPor === me || Date.now() - (m.pausadaEm || 0) >= Placa.PAUSA_MAX_MS;
    h += '<div class="paviso"><b>Partida pausada</b> por ' + esc(quem ? nomeJ(quem) : 'alguém') + '.' + (livre ? ' <button class="btn sm lar" data-a="placaRetomar">Retomar</button>' : ' Volta quando essa pessoa retomar.') + '</div>';
  }
  if (votos.length && m.status !== 'fim' && m.status !== 'encerrada') {
    var votei = votos.indexOf(me) >= 0;
    h += '<div class="paviso">Proposta de <b>encerrar a partida</b> sem resultado: ' + votos.length + ' de ' + N + ' concordam. ' +
      (votei ? '<button class="btn sm" data-a="placaEncerrar" data-v="nao">Retirar meu voto</button>' : '<button class="btn sm lar" data-a="placaEncerrar" data-v="sim">Concordar</button>') + '</div>';
  }
  if (m.status === 'jogando' && !minhaVez && eu >= 0) {
    var parado = Date.now() - (m.ultimaJogadaEm || Date.now());
    if (parado >= Placa.AUSENTE_MS) {
      var vr = (m.votosRemover || {})[vezJ.uid] || [], prec = Math.floor((N - 1) / 2) + 1;
      h += '<div class="paviso">' + esc(nomeJ(vezJ)) + ' está há ' + Math.floor(parado / 60000) + ' min sem jogar. ' +
        (vr.indexOf(me) >= 0 ? 'Você votou para remover (' + vr.length + ' de ' + prec + ').' : '<button class="btn sm lar" data-a="placaRemover" data-v="' + vezJ.uid + '">Votar para remover (' + vr.length + ' de ' + prec + ')</button>') + '</div>';
    }
  }
  if (m.status === 'fim' || m.status === 'encerrada') return h + fimPartida(m, me);
  if (eu < 0) return h + '<div class="paviso">Você não está nesta mesa.</div>';
  // minha área
  var E = estadoCliente(m), mao = PL.mao.slice();
  var validas = minhaVez ? mao.filter(function (c) { return Placa.podeJogar(E, c); }) : [];
  var nMao = mao.length, gritei = (m.gritou || {})[me];
  var podeGritar = (nMao === 2 && minhaVez && !gritei) || (nMao === 1 && !gritei && m.multavel === me);
  var status = m.status === 'pausada' ? 'Partida pausada' : minhaVez ? (m.acumulo ? 'Sua vez: responda com Guincho ou compre ' + m.acumulo : m.comprou ? 'Jogue a carta comprada ou passe' : 'Sua vez') : 'Vez de ' + esc(nomeJ(vezJ));
  h += '<div class="pminha' + (minhaVez ? ' vez' : '') + '"><div class="row between" style="gap:8px"><span class="pstat">' + status + '</span><span class="row" style="gap:6px">' +
    (podeGritar ? '<button class="pgritar' + (m.multavel === me ? ' urg' : '') + '" data-a="placaGritar">Placa!</button>' : '') +
    (gritei && nMao <= 2 ? '<span class="pgrito">PLACA!</span>' : '') +
    (minhaVez && m.comprou ? '<button class="btn sm wh" data-a="placaPassar">Passar</button>' : '') + '</span></div>';
  // ordena a mão por cor e valor
  var ordem = { L: 0, A: 1, V: 2, R: 3, W: 4 }, ov = { ped: 10, ret: 11, g2: 12, seg: 13, s4: 14 };
  mao.sort(function (a, b) { var x = Placa.carta(a), y = Placa.carta(b); return ordem[x.cor || 'W'] - ordem[y.cor || 'W'] || (ov[x.v] || Number(x.v)) - (ov[y.v] || Number(y.v)); });
  // encaixa a mão na largura da tela: sobrepõe as cartas quando não cabem (até um limite; depois rola)
  var larg = Math.min(560, window.innerWidth) - 52, ov = nMao > 1 ? Math.max(-38, Math.min(6, Math.floor((larg - nMao * 58) / (nMao - 1)))) : 0;
  h += '<div class="pmao" style="--ov:' + ov + 'px">' + mao.map(function (c) {
    var ok = validas.indexOf(c) >= 0, nova = (PL.novas || []).indexOf(c) >= 0;
    return cartaHTML(c, (minhaVez ? (ok ? 'ok' : 'off') : '') + (nova ? ' nova' : '') + (c === m.comprou ? ' comprada' : ''), 'data-a="placaJogar" data-v="' + c + '"');
  }).join('') + '</div><div class="tiny" style="opacity:.6;text-align:center;margin-top:4px">' + nMao + ' carta' + (nMao === 1 ? '' : 's') + ' na mão' + (minhaVez && !validas.length && !m.comprou ? ' · nenhuma combina: toque no monte' : '') + '</div></div>';
  if (PL.escolherCor) h += escolhaCor();
  if (PL.menu) h += menuMesa(m, me);
  return h;
}
function escolhaCor() {
  return '<div class="pfolha" role="dialog" aria-label="Escolha a cor"><div class="pfolha-in"><b>Escolha a cor</b><div class="pcores">' +
    Placa.CORES.map(function (c) { return '<button style="background:' + PCOR[c] + '" data-a="placaCor" data-v="' + c + '">' + Placa.NOME_COR[c] + '</button>'; }).join('') +
    '</div><button class="btn gh full" style="margin-top:10px" data-a="placaCor" data-v="">Cancelar</button></div></div>';
}
function menuMesa(m, me) {
  var votei = (m.votosEncerrar || []).indexOf(me) >= 0;
  return '<div class="pfolha" role="dialog" aria-label="Menu da mesa"><div class="pfolha-in"><b>Mesa</b>' +
    (m.status === 'jogando' ? '<button class="btn full" data-a="placaPausar">Pausar a partida</button>' : '') +
    (m.status === 'pausada' ? '<button class="btn full" data-a="placaRetomar">Retomar a partida</button>' : '') +
    (votei ? '<button class="btn full" data-a="placaEncerrar" data-v="nao">Retirar proposta de encerrar</button>' : '<button class="btn full" data-a="placaEncerrar" data-v="sim">Propor encerrar a partida</button>') +
    '<p class="tiny" style="color:var(--mut);margin:4px 0 0">Encerrar só acontece com o aceite de todos e não conta no ranking.</p>' +
    '<button class="btn gh full" data-a="placaRegras">Ver as regras do Placa!</button>' +
    '<button class="btn gh full" data-a="placaMenu">Fechar menu</button></div></div>';
}
function fimPartida(m, me) {
  if (m.status === 'encerrada') return '<div class="pfim"><h2>Partida encerrada</h2><p>Sem resultado: não conta no ranking.</p>' + botoesFim(m, me) + '</div>';
  var v = m.jogadores.filter(function (j) { return j.uid === m.vencedor; })[0], venci = m.vencedor === me;
  var h = '<div class="pfim"><div class="pfim-ic">' + (venci ? '🏆' : '🪪') + '</div><h2>' + (venci ? 'Você zerou a mão e venceu!' : esc(v ? nomeJ(v) : 'Alguém') + ' venceu') + '</h2>';
  h += '<div class="pfim-l">' + m.jogadores.map(function (j) { var n = (m.nCartas || {})[j.uid] || 0; return '<div class="row between"><span class="row" style="gap:8px">' + avatar(jogDe(j.uid, j), j.uid, 'sm') + esc(nomeJ(j)) + '</span><b>' + (j.uid === m.vencedor ? 'venceu' : n + ' carta' + (n === 1 ? '' : 's')) + '</b></div>'; }).join('') + '</div>';
  if (venci) {
    var tid = m.temporadaId; var nov = tid ? (calcPlaca(tid).badges[me] || []).filter(function (b) { return b.rid === 'placa|' + PL.mid; }) : [];
    nov.forEach(function (b) { h += '<button class="bdg novo" style="text-align:left" data-a="compartilharBadge" data-v="' + esc(b.tipo + '|' + b.rid + '|') + '"><span class="e">' + BADGES[b.tipo].e + '</span><span style="flex:1"><b>' + BADGES[b.tipo].t + '</b><span>' + esc(BADGES[b.tipo].d) + '</span></span><span class="tag nv">Compartilhar</span></button>'; });
  }
  return h + botoesFim(m, me) + '</div>';
}
function botoesFim(m, me) {
  return (m.uids.indexOf(me) >= 0 ? '<button class="btn lar full" data-a="placaRevanche">' + (m.revanche ? 'Ir para a revanche' : 'Revanche') + '</button>' : '') +
    '<button class="btn gh full" style="margin-top:10px;background:rgba(255,255,255,.1);color:#fff" data-a="placaFechar">Voltar</button>';
}

/* ---------- ações ---------- */
var A_PLACA = {
  placaCriar: function () {
    abrirModal('<h3>Criar mesa de Placa!</h3><p class="mut small">Quantos lugares? A partida começa quando a mesa lotar, ou antes, se você quiser.</p><div class="pl-lug">' +
      [2, 3, 4, 5, 6].map(function (n) { return '<button class="btn ' + (n === 4 ? 'lar' : 'gh') + '" data-a="placaCriarN" data-v="' + n + '">' + n + '</button>'; }).join('') +
      '</div><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button></div>');
  },
  placaCriarN: function (v) {
    fecharModal();
    B.chamar('placa', { op: 'criar', lugares: parseInt(v, 10) }).then(function (r) { if (r && r.mesaId) abrirMesa(r.mesaId); }).catch(function (e) { toast(msgErro(e)); });
  },
  placaEntrar: function (v) {
    B.chamar('placa', { op: 'entrar', mesaId: v }).then(function () { abrirMesa(v); }).catch(function (e) { toast(msgErro(e)); });
  },
  placaAbrir: function (v) { abrirMesa(v); },
  placaFechar: function () { fecharMesaPlaca(); },
  placaSair: function () { placaChamar('sair').then(function () { fecharMesaPlaca(); }); },
  placaIniciar: function () { placaChamar('iniciar'); },
  placaRobos: function () { placaChamar('robos'); },
  placaComprar: function () { placaChamar('comprar'); },
  placaPassar: function () { placaChamar('passar'); },
  placaGritar: function () { placaChamar('placa'); },
  placaMulta: function (v) { placaChamar('multa', { alvo: v }); },
  placaJogar: function (v, el) {
    var m = PL && PL.mesa; if (!m) return;
    var me = S.user.uid;
    if (m.status !== 'jogando' || !m.jogadores[m.vez] || m.jogadores[m.vez].uid !== me) { toast(m.status === 'pausada' ? 'A partida está pausada.' : 'Espere a sua vez.'); return; }
    if (!Placa.podeJogar(estadoCliente(m), v)) { som('erro'); el.classList.remove('nao'); void el.offsetWidth; el.classList.add('nao'); return; }
    if (Placa.carta(v).curinga) { PL.escolherCor = v; desenharMesa(); return; }
    placaChamar('jogar', { carta: v });
  },
  placaCor: function (v) {
    var c = PL.escolherCor; PL.escolherCor = null;
    if (!v) { desenharMesa(); return; }
    desenharMesa(); placaChamar('jogar', { carta: c, cor: v });
  },
  placaMenu: function () { PL.menu = !PL.menu; desenharMesa(); },
  placaPausar: function () { PL.menu = false; placaChamar('pausar'); },
  placaRetomar: function () { PL.menu = false; placaChamar('retomar'); },
  placaEncerrar: function (v) { PL.menu = false; placaChamar('votarEncerrar', { sim: v !== 'nao' }); },
  placaRemover: function (v) { placaChamar('votarRemover', { alvo: v }); },
  placaRevanche: function () {
    var m = PL.mesa;
    if (m.revanche) { abrirMesa(m.revanche); return; }
    placaChamar('revanche').then(function (r) { if (r && r.mesaId) abrirMesa(r.mesaId); });
  },
  placaRegras: function () { fecharMesaPlaca(); S.tab = 'regras'; S.manterScroll = false; R(); setTimeout(function () { var x = $('#regras-placa'); if (x) x.scrollIntoView(); }, 50); },
  placaFecharMesa: function (v) {
    abrirConfirma('Fechar esta mesa?', 'A partida acaba sem resultado para quem está nela.', 'Fechar mesa', function () { B.chamar('placa', { op: 'fecharMesa', mesaId: v }).then(function () { toast('Mesa fechada.'); }).catch(function (e) { toast(msgErro(e)); }); }, true);
  }
};
