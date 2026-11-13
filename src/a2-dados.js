/* ================== ESTADO ================== */
var B = null;
var S = {
  user: null, me: null, meOk: false, tab: 'inicio', admTab: 'temporada',
  rankModo: 'rodada', rankRodada: '', rankTemp: '', authTela: 'login', authErro: '', authInfo: '', ocupado: false,
  pergFiltro: 'Todos', pergBusca: '', admRodadaCorrida: '', pessoasFiltro: 'pendente', renderPendente: false
};
var D = {
  config: null, configOk: false, areas: {}, temporadas: {}, rodadas: {}, placares: {}, jogadores: {},
  meusQuiz: {}, minhasCorridas: {}, perguntas: {}, segredo: null, admCorridas: null, outrasTemp: {}, mesas: {}, partidas: {}, treinos: {}, garagem: null, carteira: null, anuncios: {}
};
var subUser = [], subTemp = [], subAdm = [];
function limpar(lista) { lista.forEach(function (u) { try { u(); } catch (e) { } }); lista.length = 0; }

function ativo() { return !!(S.me && S.me.status === 'ativo'); }
function ehMaster() { return !!(D.config && S.user && D.config.masterUid === S.user.uid); }
function ehAdm() { return ativo() && (S.me.papel === 'adm' || ehMaster()); }
function tempAtivaId() { return D.config && D.config.temporadaAtiva; }
function tempAtiva() { var id = tempAtivaId(); return id ? D.temporadas[id] : null; }
function areaNome(id) { var a = D.areas[id]; return a ? a.nome + (a.status === 'pendente' ? ' (em aprovação)' : '') : (id || '—'); }
function areasAtivas() {
  return Object.keys(D.areas).filter(function (k) { return D.areas[k].status === 'ativa'; })
    .sort(function (a, b) { return D.areas[a].nome.localeCompare(D.areas[b].nome); });
}
function rodadasDe(tid, fonte) {
  var R = fonte || D.rodadas;
  return Object.keys(R).filter(function (id) { return R[id].temporadaId === tid; })
    .map(function (id) { var r = JSON.parse(JSON.stringify(R[id])); r.id = id; return r; })
    .sort(function (a, b) { return a.n - b.n; });
}
function rodadaAtual() {
  var tid = tempAtivaId(); if (!tid) return null;
  var t = D.temporadas[tid]; if (t && t.status === 'encerrada') return null;
  var now = Date.now();
  var l = rodadasDe(tid).filter(function (r) { return now >= r.inicio && now <= r.fim; });
  return l[0] || null;
}
function proximaRodada() {
  var tid = tempAtivaId(); if (!tid) return null;
  var now = Date.now();
  return rodadasDe(tid).filter(function (r) { return r.inicio > now; })[0] || null;
}
function jogDe(uid, e) {
  var j = D.jogadores[uid];
  if (j) return j;
  if (e) return { nome: e.nm || '', apelido: e.ap || '', areaId: e.a };
  return null;
}

/* ================== ASSINATURAS ================== */
function assinarBase() {
  B.ouvirDoc('config/geral', function (d) { D.config = d; D.configOk = true; reassinarTemporada(); render(); });
  B.ouvirCol('areas', null, function (m) { D.areas = m; render(); });
  B.ouvirCol('temporadas', null, function (m) { D.temporadas = m; render(); });
  B.onAuth(function (u) {
    limpar(subUser); limpar(subTemp); limpar(subAdm);
    S.user = u; S.me = null; S.meOk = false; S.ativoAssinado = false; S.tidAssinado = null;
    D.jogadores = {}; D.meusQuiz = {}; D.minhasCorridas = {}; D.placares = {}; D.rodadas = {}; D.perguntas = {}; D.mesas = {}; D.partidas = {}; D.treinos = {}; D.garagem = null; D.carteira = null; D.anuncios = {};
    if (u) {
      subUser.push(B.ouvirDoc('jogadores/' + u.uid, function (d) {
        S.me = d; S.meOk = true;
        if (d && d.status === 'ativo' && !S.ativoAssinado) assinarAtivo();
        else if (ehAdm() && !subAdm.length) assinarAdm();
        render();
      }));
    }
    render(true);
  });
}
function assinarAtivo() {
  S.ativoAssinado = true;
  subUser.push(B.ouvirCol('jogadores', null, function (m) { D.jogadores = m; render(); }));
  subUser.push(B.ouvirDoc('garagens/' + S.user.uid, function (d) { D.garagem = d; render(); }));
  subUser.push(B.ouvirDoc('carteira/' + S.user.uid, function (d) { var mudou = D.carteira && d && JSON.stringify(d) !== JSON.stringify(D.carteira); D.carteira = d; if (mudou && typeof atualizarSaldo === 'function') atualizarSaldo(); render(); }));
  subUser.push(B.ouvirCol('anuncios', [['status', '==', 'ativo']], function (m) { D.anuncios = m; render(); }));
  subUser.push(B.ouvirCol('treinos', null, function (m) { D.treinos = m; render(); }));
  subUser.push(B.ouvirCol('mesas', [['aberta', '==', true]], function (m) { D.mesas = m; render(); if (typeof placaAtualizarLista === 'function') placaAtualizarLista(); }));
  reassinarTemporada();
  assinarAdm();
}
function assinarAdm() {
  limpar(subAdm);
  if (!ehAdm()) return;
  subAdm.push(B.ouvirCol('perguntas', null, function (m) { D.perguntas = m; render(); }));
  subAdm.push(B.ouvirDoc('segredos/acesso', function (d) { D.segredo = d; render(); }));
}
function reassinarTemporada() {
  var tid = tempAtivaId();
  if (S.user && ativo() && tid && tid === S.tidAssinado && subTemp.length) { if (ehAdm() && !subAdm.length) assinarAdm(); return; }
  limpar(subTemp); S.tidAssinado = null;
  if (!S.user || !ativo() || !tid) return;
  S.tidAssinado = tid;
  var uid = S.user.uid;
  subTemp.push(B.ouvirCol('rodadas', [['temporadaId', '==', tid]], function (m) { D.rodadas = m; render(); }));
  subTemp.push(B.ouvirCol('placar', [['temporadaId', '==', tid]], function (m) { D.placares = m; render(); }));
  subTemp.push(B.ouvirCol('quiz', [['uid', '==', uid], ['temporadaId', '==', tid]], function (m) { D.meusQuiz = m; render(); }));
  subTemp.push(B.ouvirCol('corrida', [['uid', '==', uid], ['temporadaId', '==', tid]], function (m) { D.minhasCorridas = m; render(); }));
  subTemp.push(B.ouvirCol('placaPartidas', [['temporadaId', '==', tid]], function (m) { D.partidas = m; render(); }));
  if (ehAdm() && !subAdm.length) assinarAdm();
}

/* ================== CÁLCULOS ================== */
var BADGES = {
  gabaritou: { e: '🧠', t: 'Gabaritou', d: 'Acertou 10 de 10 no quiz' },
  relampago: { e: '⚡', t: 'Relâmpago', d: 'Gabarito mais rápido da rodada' },
  piloto: { e: '🏁', t: 'Piloto de Ouro', d: 'Passou de 120 s na corrida' },
  combo: { e: '💎', t: 'Combo Perfeito', d: '10/10 no quiz e 90 s+ na corrida na mesma rodada' },
  liderRodada: { e: '🥇', t: 'Líder da Rodada', d: '1º lugar no ranking da rodada' },
  liderTemporada: { e: '🏆', t: 'Líder da Temporada', d: '1º lugar no ranking final da temporada' },
  presenca: { e: '📅', t: 'Presença VIP', d: 'Jogou 4 rodadas seguidas' },
  virada: { e: '🚀', t: 'Virada', d: 'Subiu 5+ posições no ranking da temporada numa rodada' },
  timeCampeao: { e: '🤝', t: 'Time Campeão', d: 'Sua área foi a 1ª da rodada' }
};
var ORDEM_BADGES = ['liderTemporada', 'liderRodada', 'combo', 'gabaritou', 'relampago', 'piloto', 'virada', 'presenca', 'timeCampeao'];
BADGES.placaPrimeira = { e: '🪪', t: 'Primeira Placa', d: 'Venceu a primeira partida de Placa! na temporada' };
BADGES.placaSequencia = { e: '🔥', t: 'Sequência', d: 'Venceu 3 partidas de Placa! seguidas' };
BADGES.placaGuincheiro = { e: '🚛', t: 'Guincheiro', d: 'Fez alguém comprar 8 ou mais com Guincho acumulado' };
BADGES.placaSegurado = { e: '🛡️', t: 'Segurado', d: 'Venceu jogando um Seguro como última carta' };
BADGES.placaFiscal = { e: '👮', t: 'Fiscal', d: 'Aplicou 5 multas de "Placa!" na temporada' };
var ORDEM_PLACA = ['placaPrimeira', 'placaSequencia', 'placaGuincheiro', 'placaSegurado', 'placaFiscal'];
var PLACA_MIN = 5;
// ranking e conquistas do Placa! (separados do quiz e da corrida)
function calcPlaca(tid) {
  var lista = Object.keys(D.partidas).map(function (k) { return D.partidas[k]; })
    .filter(function (p) { return p.temporadaId === tid; }).sort(function (a, b) { return a.fimEm - b.fimEm; });
  var por = {}, badges = {}, seq = {}, multas = {};
  function add(uid, tipo, p) { (badges[uid] = badges[uid] || []).push({ tipo: tipo, rid: 'placa|' + p.mesaId, n: null, tid: tid }); }
  lista.forEach(function (p) {
    (p.jogadores || []).forEach(function (j) {
      var x = por[j.uid] = por[j.uid] || { uid: j.uid, partidas: 0, vitorias: 0, a: j.a, ap: j.ap, nm: j.nm };
      x.partidas++; x.ap = j.ap; x.nm = j.nm; x.a = j.a;
      var st = (p.stats || {})[j.uid] || {};
      if (st.guincho8) add(j.uid, 'placaGuincheiro', p);
      var antes = multas[j.uid] || 0; multas[j.uid] = antes + (st.multas || 0);
      if (antes < 5 && multas[j.uid] >= 5) add(j.uid, 'placaFiscal', p);
      if (p.vencedor === j.uid) {
        x.vitorias++;
        if (x.vitorias === 1) add(j.uid, 'placaPrimeira', p);
        seq[j.uid] = (seq[j.uid] || 0) + 1; if (seq[j.uid] === 3) add(j.uid, 'placaSequencia', p);
        if (p.segurado) add(j.uid, 'placaSegurado', p);
      } else seq[j.uid] = 0;
    });
  });
  var arr = Object.keys(por).map(function (k) { var x = por[k]; x.taxa = x.partidas ? x.vitorias / x.partidas : 0; x.elegivel = x.partidas >= PLACA_MIN; return x; });
  arr.sort(function (a, b) { return (b.elegivel - a.elegivel) || b.vitorias - a.vitorias || b.taxa - a.taxa || b.partidas - a.partidas || (a.ap || '').localeCompare(b.ap || ''); });
  var pos = 0; arr.forEach(function (x, i) { x.pos = x.elegivel ? ((i > 0 && arr[i - 1].elegivel && arr[i - 1].vitorias === x.vitorias && arr[i - 1].taxa === x.taxa) ? arr[i - 1].pos : i + 1) : null; });
  return { ranking: arr, badges: badges, partidas: lista };
}

function linhasRodada(placar, k) {
  var P = (placar && placar.p) || {}, out = [];
  Object.keys(P).forEach(function (uid) {
    var e = P[uid];
    var jogou = e.qf || typeof e.q === 'number' || (e.tn || 0) > 0;
    if (!jogou) return;
    var q = e.q || 0, c = e.c || 0, cp = Logica.curva(c, k);
    out.push({ uid: uid, q: q, qms: e.qms || 0, qf: !!e.qf, c: c, cp: cp, qp: q * 10, total: q * 10 + cp, a: e.a || '', ap: e.ap, nm: e.nm, tn: e.tn || 0 });
  });
  out.sort(function (a, b) { return b.total - a.total || a.qms - b.qms || (a.ap || '').localeCompare(b.ap || ''); });
  posicoes(out, function (a, b) { return a.total === b.total && a.qms === b.qms; });
  return out;
}
function posicoes(arr, igual) {
  arr.forEach(function (l, i) { l.pos = (i > 0 && igual(arr[i - 1], l)) ? arr[i - 1].pos : i + 1; });
}
function rankingAcumulado(acum) {
  var arr = Object.keys(acum).map(function (uid) { return acum[uid]; });
  arr.sort(function (a, b) { return b.total - a.total || b.rodadas - a.rodadas || b.quiz - a.quiz || (a.ap || '').localeCompare(b.ap || ''); });
  posicoes(arr, function (a, b) { return a.total === b.total && a.rodadas === b.rodadas && a.quiz === b.quiz; });
  return arr;
}
function areasDe(linhas, campo) {
  var g = {};
  linhas.forEach(function (l) {
    var j = D.jogadores[l.uid]; var a = (campo === 'atual' && j) ? j.areaId : l.a;
    if (!a) return;
    var x = g[a] = g[a] || { areaId: a, n: 0, soma: 0 };
    x.n++; x.soma += l.total;
  });
  var arr = Object.keys(g).map(function (k) { var x = g[k]; x.media = Math.round(x.soma / x.n * 10) / 10; x.elegivel = x.n >= 3; return x; });
  arr.sort(function (a, b) { return (b.elegivel - a.elegivel) || b.media - a.media; });
  var pos = 0; arr.forEach(function (x) { x.pos = x.elegivel ? ++pos : null; });
  return arr;
}

var _cache = { chave: '', val: null };
function calcTemporada(tid, fonteRod, fontePlac) {
  var temp = D.temporadas[tid] || D.outrasTemp[tid] || {};
  var rods = rodadasDe(tid, fonteRod);
  var P = fontePlac || D.placares;
  var chave = tid + '|' + JSON.stringify(P).length + '|' + rods.length + '|' + Math.floor(Date.now() / 60000) + '|' + (temp.status || '') + '|' + Object.keys(D.jogadores).length;
  if (!fonteRod && _cache.chave === chave) return _cache.val;
  var k = temp.k || 40, now = Date.now();
  var res = { temp: temp, k: k, rods: rods, rod: {}, areaRod: {}, badges: {}, final: [], acumAte: {} };
  var acum = {}, antes = null, streak = {};
  function add(uid, tipo, r) { (res.badges[uid] = res.badges[uid] || []).push({ tipo: tipo, rid: r ? r.id : tid, n: r ? r.n : null, tid: tid }); }
  rods.forEach(function (r) {
    if (now < r.inicio) return;
    var linhas = linhasRodada(P[r.id], k);
    res.rod[r.id] = linhas;
    res.areaRod[r.id] = areasDe(linhas, 'rodada');
    linhas.forEach(function (l) {
      var x = acum[l.uid] = acum[l.uid] || { uid: l.uid, total: 0, rodadas: 0, quiz: 0, corrida: 0, a: l.a, ap: l.ap, nm: l.nm };
      x.total += l.total; x.rodadas++; x.quiz += l.qp; x.corrida += l.cp; x.a = l.a; x.ap = l.ap; x.nm = l.nm;
      if (l.q === 10) add(l.uid, 'gabaritou', r);
      if (l.c >= 120) add(l.uid, 'piloto', r);
      if (l.q === 10 && l.c >= 90) add(l.uid, 'combo', r);
    });
    var fechada = now > r.fim;
    r.fechada = fechada;
    var rk = rankingAcumulado(acum);
    res.acumAte[r.id] = rk;
    if (!fechada) return;
    if (linhas.length && linhas[0].total > 0) linhas.forEach(function (l) { if (l.total === linhas[0].total) add(l.uid, 'liderRodada', r); });
    var gab = linhas.filter(function (l) { return l.q === 10; });
    if (gab.length) { var mn = Math.min.apply(null, gab.map(function (l) { return l.qms; })); gab.forEach(function (l) { if (l.qms === mn) add(l.uid, 'relampago', r); }); }
    var ar = res.areaRod[r.id].filter(function (x) { return x.elegivel; });
    if (ar.length >= 2) linhas.forEach(function (l) { if (l.a === ar[0].areaId) add(l.uid, 'timeCampeao', r); });
    var jogaram = {}; linhas.forEach(function (l) { jogaram[l.uid] = true; });
    Object.keys(streak).forEach(function (u) { if (!jogaram[u]) streak[u] = 0; });
    linhas.forEach(function (l) { streak[l.uid] = (streak[l.uid] || 0) + 1; if (streak[l.uid] % 4 === 0) add(l.uid, 'presenca', r); });
    var agora = {}; rk.forEach(function (x) { agora[x.uid] = x.pos; });
    if (antes) Object.keys(agora).forEach(function (u) { if (antes[u] && antes[u] - agora[u] >= 5) add(u, 'virada', r); });
    antes = agora;
  });
  res.final = rankingAcumulado(acum);
  var ultima = rods[rods.length - 1];
  res.encerrada = temp.status === 'encerrada' || (ultima && now > ultima.fim);
  if (res.encerrada && res.final.length && res.final[0].total > 0) res.final.forEach(function (x) { if (x.total === res.final[0].total) add(x.uid, 'liderTemporada', null); });
  if (!fonteRod) _cache = { chave: chave, val: res };
  return res;
}
function badgeChave(b) { return b.tipo + '|' + b.rid; }
function meusBadges() {
  var tid = tempAtivaId(); if (!tid || !S.user) return [];
  var res = calcTemporada(tid);
  var l = (res.badges[S.user.uid] || []).concat(calcPlaca(tid).badges[S.user.uid] || []);
  l.sort(function (a, b) { return (b.n || 99) - (a.n || 99) || ORDEM_BADGES.indexOf(a.tipo) - ORDEM_BADGES.indexOf(b.tipo); });
  return l;
}
function badgesNovos() {
  var vistos = lerLS('gi_vistos_' + S.user.uid, null);
  var todos = meusBadges();
  if (vistos === null) { gravarLS('gi_vistos_' + S.user.uid, todos.map(badgeChave)); return []; }
  return todos.filter(function (b) { return vistos.indexOf(badgeChave(b)) < 0; });
}
function marcarBadgesVistos() { gravarLS('gi_vistos_' + S.user.uid, meusBadges().map(badgeChave)); }

function minhaRodada(rid) {
  var uid = S.user.uid;
  var quiz = D.meusQuiz[rid + '_' + uid] || null;
  var tent = [];
  for (var n = 1; n <= 3; n++) tent.push(D.minhasCorridas[rid + '_' + uid + '_' + n] || null);
  var usadas = tent.filter(function (t) { return !!t; }).length;
  return { quiz: quiz, tent: tent, usadas: usadas, restantes: 3 - usadas, melhor: Logica.melhorTempo(tent) };
}
