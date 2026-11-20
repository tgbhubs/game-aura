/* ================== RENDER ================== */
function render(forcar) {
  var ae = document.activeElement;
  if (!forcar && ae && ae.closest && ae.closest('#app') && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) { S.renderPendente = true; return; }
  S.renderPendente = false;
  var y = window.scrollY;
  $('#app').innerHTML = tela();
  if (S.manterScroll) window.scrollTo(0, y);
  S.manterScroll = true;
}
function R() { render(true); }
document.addEventListener('focusout', function () { setTimeout(function () { if (S.renderPendente) render(); }, 60); });

function wm(h) { return logoSvg(h || 28); }
function bannerDemo() {
  if (!DEMO) return '';
  return '<div class="demo"><div class="wrap"><span><b>Modo demonstração</b> · dados fictícios, só neste navegador</span><button data-a="demoReset">Reiniciar</button></div></div>';
}
function tela() {
  if (!DEMO && !FB_OK) return telaErroConexao();
  if (!D.configOk) return carregando('Carregando…');
  if (!S.user) return telaAuth();
  if (!S.meOk) return carregando('Carregando seu cadastro…');
  if (!S.me) return telaCompletar();
  if (S.me.status === 'pendente') return telaPendente();
  if (S.me.status === 'bloqueado') return telaMsg('Acesso bloqueado', 'Seu acesso ao Game Aura foi bloqueado. Fale com a administração do jogo.');
  return shell();
}
function carregando(t) { return bannerDemo() + '<div class="loading"><div class="spin"></div><div>' + esc(t) + '</div></div>'; }
function telaErroConexao() {
  return '<div class="auth"><div class="wrap">' + wm() + '<div class="card"><h3>Não consegui conectar</h3><p class="mut">Os serviços do Firebase não carregaram. Verifique a internet (ou um bloqueador de conteúdo) e recarregue a página.</p><button class="btn full" onclick="location.reload()">Recarregar</button></div></div></div>';
}
function telaMsg(t, m) {
  return bannerDemo() + '<div class="auth"><div class="wrap">' + wm() + '<div class="card"><h3>' + esc(t) + '</h3><p class="mut">' + esc(m) + '</p><button class="btn gh full" data-a="sair">Sair</button></div></div></div>';
}
function listras() { return ''; }

/* ---------- Entrada ---------- */
function telaAuth() {
  var h = bannerDemo() + '<div class="auth"><div class="wrap">' + '<div class="row" style="align-items:center">' + wm(50) + '<span class="pill-game big">GAME</span></div>' +
    '<div class="tagline">Quiz e corrida toda semana. Jogue no seu tempo, suba no ranking e colecione conquistas.</div>';
  if (DEMO && S.authTela === 'login') {
    h += '<div class="card"><h3>Entrar na demonstração</h3><p class="mut small">Escolha uma pessoa fictícia para ver o app pelos olhos dela.</p>' +
      demoConta('demo-master', 'Você (Master)', 'Administra tudo') +
      demoConta('demo-caio', 'Caio Mendes', 'Adm · Tecnologia') +
      demoConta('demo-bruna', 'Bruna Castro', 'Jogadora · Tecnologia') +
      demoConta('demo-diego', 'Diego Rocha', 'Jogador · Operações') +
      demoConta('demo-marina', 'Marina Costa', 'Cadastro pendente') +
      '<div class="sep">ou</div><button class="btn gh full" data-a="authTela" data-v="cadastro">Testar o cadastro de uma conta nova</button></div>';
  } else if (S.authTela === 'cadastro') {
    h += '<div class="card"><h3>Criar conta</h3>' + (S.authErro ? '<div class="err">' + esc(S.authErro) + '</div>' : '') +
      '<button class="btn gbtn full" data-a="google">' + gIcon() + ' Continuar com Google</button><div class="sep">ou com e-mail</div>' +
      formCadastro(true) +
      '<button class="btn lar full" style="margin-top:16px" data-a="cadastrar"' + (S.ocupado ? ' disabled' : '') + '>Criar conta</button>' +
      '<p class="small mut" style="text-align:center;margin:14px 0 0">Já tem conta? <button class="lnk" data-a="authTela" data-v="login">Entrar</button></p></div>';
  } else if (S.authTela === 'esqueci') {
    h += '<div class="card"><h3>Redefinir senha</h3>' + (S.authInfo ? '<div class="okm">' + esc(S.authInfo) + '</div>' : '') + (S.authErro ? '<div class="err">' + esc(S.authErro) + '</div>' : '') +
      '<label class="f">E-mail</label><input class="inp" id="fEmail" type="email" autocomplete="email">' +
      '<button class="btn full" style="margin-top:14px" data-a="redefinir">Enviar link de redefinição</button>' +
      '<p class="small" style="text-align:center;margin:12px 0 0"><button class="lnk" data-a="authTela" data-v="login">Voltar</button></p></div>';
  } else {
    h += '<div class="card"><h3>Entrar</h3>' + (S.authErro ? '<div class="err">' + esc(S.authErro) + '</div>' : '') +
      '<button class="btn gbtn full" data-a="google">' + gIcon() + ' Entrar com Google</button><div class="sep">ou com e-mail</div>' +
      '<label class="f">E-mail</label><input class="inp" id="fEmail" type="email" autocomplete="email">' +
      '<label class="f">Senha</label><input class="inp" id="fSenha" type="password" autocomplete="current-password">' +
      '<button class="btn full" style="margin-top:16px" data-a="entrar"' + (S.ocupado ? ' disabled' : '') + '>Entrar</button>' +
      '<div class="row between" style="margin-top:12px"><button class="lnk small" data-a="authTela" data-v="esqueci">Esqueci a senha</button><button class="lnk small" data-a="authTela" data-v="cadastro">Criar conta</button></div></div>';
  }
  h += '<p class="tiny" style="opacity:.6;text-align:center;margin-top:18px">Game Aura · build ' + BUILD + '</p></div></div>';
  return h;
}
function demoConta(uid, nome, sub) {
  return '<button class="bdg" data-a="demoEntrar" data-v="' + uid + '"><span class="av" style="background:' + corDe(uid) + '">' + iniciais(nome) + '</span><span><b>' + esc(nome) + '</b><span>' + esc(sub) + '</span></span></button>';
}
function gIcon() { return '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z"/></svg>'; }
function opcoesArea(sel) {
  var h = '<option value="">Selecione…</option>';
  areasAtivas().forEach(function (k) { h += '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(D.areas[k].nome) + '</option>'; });
  h += '<option value="__nova"' + (sel === '__nova' ? ' selected' : '') + '>Minha área não está na lista…</option>';
  return h;
}
function formCadastro(comConta) {
  var u = S.user || {};
  var h = '';
  if (comConta) h += '<label class="f">E-mail</label><input class="inp" id="fEmail" type="email" autocomplete="email">' +
    '<label class="f">Senha (mín. 6 caracteres)</label><input class="inp" id="fSenha" type="password" autocomplete="new-password">';
  h += '<label class="f">Nome completo</label><input class="inp" id="fNome" autocomplete="name" value="' + esc(u.nome || '') + '">' +
    '<label class="f">Apelido (como aparece no ranking)</label><input class="inp" id="fApelido" maxlength="18">' +
    '<label class="f">Área</label><select class="inp" id="fArea" data-c="areaNova">' + opcoesArea('') + '</select>' +
    '<div id="boxAreaNova" style="display:none"><label class="f">Nome da sua área</label><input class="inp" id="fAreaNova" maxlength="40"><div class="tiny mut" style="margin-top:4px">Fica em aprovação pela administração.</div></div>' +
    '<label class="f">Sua foto</label><div class="ffoto"><div id="fFotoPrev" class="ffprev">' + ((S.fotoCad || u.foto) ? '<img src="' + esc(S.fotoCad || u.foto) + '" alt="">' : '📷') + '</div><div style="min-width:0"><div class="tiny mut" id="fFotoTxt">' + (S.fotoCad ? 'Foto escolhida. Pode trocar se quiser.' : u.foto ? 'Usando a foto da sua conta Google. Pode trocar se quiser.' : 'Obrigatória: o jogo é para o time se conhecer.') + '</div><label class="btn gh sm" style="margin:6px 0 0">' + ((S.fotoCad || u.foto) ? 'Trocar foto' : 'Escolher foto') + '<input type="file" accept="image/*" data-c="foto" style="display:none"></label></div></div>' +
    '<label class="f">Código de acesso (se recebeu um)</label><input class="inp" id="fCodigo" autocapitalize="characters" autocomplete="off">' +
    '<div class="tiny mut" style="margin-top:4px">Com o código, você entra na hora. Sem ele, seu cadastro fica aguardando aprovação.</div>';
  return h;
}
function telaCompletar() {
  return bannerDemo() + '<div class="auth"><div class="wrap">' + wm(44) + '<div class="tagline">Falta pouco: complete seu cadastro.</div>' +
    '<div class="card"><h3>Seu cadastro</h3>' + (S.authErro ? '<div class="err">' + esc(S.authErro) + '</div>' : '') + formCadastro(false) +
    '<button class="btn lar full" style="margin-top:16px" data-a="completar"' + (S.ocupado ? ' disabled' : '') + '>Concluir cadastro</button>' +
    '<p class="small" style="text-align:center;margin:12px 0 0"><button class="lnk" data-a="sair">Sair</button></p></div></div></div>';
}
function telaPendente() {
  return bannerDemo() + '<div class="auth"><div class="wrap">' + wm(44) +
    '<div class="card"><h3>Cadastro em aprovação ⏳</h3><p class="mut">Oi, ' + esc(primeiroNome(S.me.nome)) + '! Seu cadastro foi recebido e aguarda aprovação da administração do jogo.</p>' +
    (S.authErro ? '<div class="err">' + esc(S.authErro) + '</div>' : '') +
    '<label class="f">Recebeu um código de acesso?</label><input class="inp" id="fCodigo" autocapitalize="characters" autocomplete="off">' +
    '<button class="btn full" style="margin-top:12px" data-a="usarCodigo">Entrar com o código</button>' +
    '<p class="small" style="text-align:center;margin:12px 0 0"><button class="lnk" data-a="sair">Sair</button></p></div></div></div>';
}

/* ---------- App ---------- */
var ABAS = [['inicio', '🏠', 'Início'], ['jogar', '🎮', 'Jogar'], ['garagem', '🚗', 'Garagem'], ['ranking', '🏆', 'Ranking'], ['perfil', '👤', 'Perfil'], ['regras', '📘', 'Regras']];
function shell() {
  var h = bannerDemo() + '<div class="top"><div class="wrap"><button class="logo-home" data-a="tab" data-v="inicio" aria-label="Voltar para o início">' + wm(28) + '<span class="pill-game">GAME</span></button>' +
    '<button style="background:none;border:0;padding:0" data-a="tab" data-v="perfil">' + avatar(S.me, S.user.uid) + '</button></div></div><div class="wrap">';
  var t = S.tab;
  if (t === 'adm' && !ehAdm()) t = 'inicio';
  if (t === 'inicio') h += telaInicio();
  else if (t === 'jogar') h += telaJogar();
  else if (t === 'ranking') h += telaRanking();
  else if (t === 'garagem') h += telaGaragem();
  else if (t === 'perfil') h += telaPerfil();
  else if (t === 'regras') h += telaRegras();
  else if (t === 'adm') h += telaAdm();
  h += '<div class="foot">Game Aura · build ' + BUILD;
  if (ehAdm()) {
    var pend = Object.keys(D.jogadores).filter(function (k) { return D.jogadores[k].status === 'pendente'; }).length;
    h += '<br><button class="lnk" data-a="tab" data-v="adm">Administração' + (pend ? ' (' + pend + ' pendente' + (pend > 1 ? 's' : '') + ')' : '') + '</button>';
  }
  h += '</div></div><nav class="nav"><div class="wrap">';
  ABAS.forEach(function (a) { h += '<button class="' + (t === a[0] ? 'on' : '') + '" data-a="tab" data-v="' + a[0] + '"><span class="ic">' + a[1] + '</span>' + a[2] + '</button>'; });
  return h + '</div></nav>';
}

function heroRodada() {
  var r = rodadaAtual(), t = tempAtiva(), now = Date.now();
  if (!t) return '<div class="hero"><div class="lab">Game Aura</div><h2>Nenhuma temporada ativa</h2><div style="opacity:.8;position:relative;z-index:1">Assim que a administração abrir a temporada, as rodadas aparecem aqui.</div></div>';
  var total = rodadasDe(tempAtivaId()).length;
  if (r) return '<div class="hero"><div class="lab">' + esc(t.nome) + '</div><h2>Rodada ' + r.n + (total ? ' de ' + total : '') + '</h2>' +
    '<div style="opacity:.8;position:relative;z-index:1">' + fmtDia(r.inicio) + ' a ' + fmtDia(r.fim) + '</div><span class="cd">⏱ Fecha em ' + fmtDur(r.fim - now) + '</span></div>';
  var p = proximaRodada();
  if (p) return '<div class="hero"><div class="lab">' + esc(t.nome) + '</div><h2>Rodada ' + p.n + ' em breve</h2><span class="cd">Começa em ' + fmtDur(p.inicio - now) + ' · ' + fmtDiaHora(p.inicio) + '</span></div>';
  return '<div class="hero"><div class="lab">' + esc(t.nome) + '</div><h2>Temporada encerrada</h2><div style="opacity:.8;position:relative;z-index:1">Confira o ranking final e as conquistas. Uma nova temporada vem aí.</div></div>';
}
function cartoesJogo(detalhado) {
  var r = rodadaAtual();
  if (!r) return '';
  var m = minhaRodada(r.id), k = (tempAtiva() || {}).k || 40;
  var q = m.quiz, qs, qb;
  if (!q) { qs = '10 perguntas · 20 s cada · 1 tentativa'; qb = '<button class="btn wh full" data-a="quiz">Jogar o quiz</button>'; }
  else if (!q.finalizado) { qs = 'Em andamento: ' + q.idx + ' de ' + q.ordem.length + ' respondidas'; qb = '<button class="btn wh full" data-a="quiz">Continuar</button>'; }
  else { qs = '<b style="font-size:20px">' + q.acertos + '/10</b> · ' + (q.acertos * 10) + ' pts'; qb = '<button class="btn wh full" disabled>Feito nesta rodada ✓</button>'; }
  var cs, cb;
  if (m.usadas === 0) cs = '3 tentativas · vale o melhor tempo';
  else cs = 'Melhor: <b style="font-size:20px">' + fmtSeg(m.melhor) + '</b> · ' + Logica.curva(m.melhor, k) + ' pts<br>' + m.restantes + ' tentativa' + (m.restantes === 1 ? '' : 's') + ' restante' + (m.restantes === 1 ? '' : 's');
  cb = m.restantes > 0 ? '<button class="btn wh full" data-a="corrida">' + (m.usadas ? 'Correr de novo' : 'Correr') + '</button>' : '<button class="btn wh full" data-a="treino">Treinar (não vale ponto)</button>';
  var h = '<div class="grid2"><div class="game qz"><div class="em">🧠</div><h3>Quiz</h3><div class="st">' + qs + '</div>' + qb + '</div>' +
    '<div class="game cr"><div class="em">🏎️</div><h3>Corrida</h3><div class="st">' + cs + '</div>' + cb + '</div></div>';
  if (detalhado && m.restantes > 0) h += '<p class="center small" style="text-align:center;margin:10px 0"><button class="lnk" data-a="treino">Quer aquecer? Treine a corrida sem gastar tentativa</button></p>';
  return h;
}
function telaInicio() {
  var h = avisoVezPlaca();
  if (S.me && !S.me.foto) h += '<div class="card gmulta" style="margin-top:14px"><b>📷 Falta sua foto</b><p class="small" style="margin:4px 0 8px">Para jogar, coloque uma foto: ela aparece no ranking, nas mesas e nas conquistas. É assim que o time se conhece.</p><label class="btn lar sm" style="margin:0">Escolher foto<input type="file" accept="image/*" data-c="foto" style="display:none"></label></div>';
  h += heroRodada();
  h += cartoesJogo(false);
  h += cartaoPlacaInicio();
  var tid = tempAtivaId();
  if (tid && D.temporadas[tid]) {
    var res = calcTemporada(tid), uid = S.user.uid, r = rodadaAtual();
    var minhaT = res.final.filter(function (x) { return x.uid === uid; })[0];
    var minhaR = r ? (res.rod[r.id] || []).filter(function (x) { return x.uid === uid; })[0] : null;
    h += '<div class="sec">Seus números</div><div class="grid2" style="grid-template-columns:repeat(3,1fr);gap:8px">' +
      '<div class="kp"><b>' + (minhaR ? minhaR.pos + 'º' : '—') + '</b><span>na rodada</span></div>' +
      '<div class="kp"><b>' + (minhaT ? minhaT.pos + 'º' : '—') + '</b><span>na temporada</span></div>' +
      '<div class="kp"><b>' + (minhaT ? minhaT.total : 0) + '</b><span>pontos</span></div></div>';
    var novos = badgesNovos();
    if (novos.length) {
      h += '<div class="sec">Novas conquistas 🎉</div>';
      novos.slice(0, 4).forEach(function (b) { h += cartaoBadge(b, true); });
      h += '<button class="btn gh full sm" data-a="vistos">Marcar como vistas</button>';
    }
    var fechadas = res.rods.filter(function (x) { return x.fechada; });
    var ult = fechadas[fechadas.length - 1];
    if (ult && (res.rod[ult.id] || []).length) {
      h += '<div class="sec">Pódio da rodada ' + ult.n + '</div><div class="card" style="padding:6px 16px">';
      res.rod[ult.id].slice(0, 3).forEach(function (l) { h += linhaRank(l, l.total, l.qp + ' quiz · ' + l.cp + ' corrida'); });
      h += '</div>';
    }
  }
  return h;
}
function cartaoBadge(b, novo) {
  var d = BADGES[b.tipo];
  var onde = b.n ? 'Rodada ' + b.n : (/^placa/.test(b.tipo) ? 'Placa!' : 'Temporada');
  return '<button class="bdg' + (novo ? ' novo' : '') + '" data-a="compartilharBadge" data-v="' + esc(b.tipo + '|' + b.rid + '|' + (b.n || '')) + '"><span class="e">' + d.e + '</span><span style="flex:1"><b>' + d.t + '</b><span>' + esc(d.d) + ' · ' + onde + '</span></span><span class="tag nv">Compartilhar</span></button>';
}
function telaJogar() {
  var h = heroRodada();
  if (!rodadaAtual()) return h + '<div class="card"><h3>Sem rodada aberta agora</h3><p class="mut">Enquanto isso, que tal treinar a corrida?</p><button class="btn lar full" data-a="treino">Treinar corrida</button></div>' + secaoPlaca();
  h += cartoesJogo(true);
  h += secaoPlaca();
  h += '<div class="card"><h3>Como pontua</h3><p class="small mut" style="margin:0">Cada etapa vale até <b>100 pontos</b>. No quiz, 10 por acerto. Na corrida, os pontos vêm do seu melhor tempo: 30 s ≈ 53 · 60 s ≈ 78 · 90 s ≈ 89 · 120 s ≈ 95. A rodada vale até 200.</p></div>';
  return h;
}
function linhaRank(l, pts, sub, eu) {
  var j = jogDe(l.uid, l);
  var cls = 'rk' + (eu ? ' eu' : '');
  var p = l.pos ? '<span class="pos p' + l.pos + '">' + l.pos + '</span>' : '<span class="pos">–</span>';
  return '<div class="' + cls + '">' + p + avatar(j, l.uid) + '<div class="nm"><b>' + esc(nomeExib(j)) + '</b><span>' + esc(sub) + '</span></div><div class="pt">' + pts + '<small>pts</small></div></div>';
}

/* ---------- Ranking ---------- */
function telaRanking() {
  var tidAtiva = tempAtivaId();
  var tid = S.rankTemp || tidAtiva;
  if (!tid) return '<div class="empty">Nenhuma temporada ainda.</div>';
  var outra = tid !== tidAtiva;
  if (outra && !D.outrasTemp['_' + tid]) { carregarOutraTemp(tid); return carregando('Carregando temporada…'); }
  var res = outra ? calcTemporada(tid, D.outrasTemp['_' + tid].rodadas, D.outrasTemp['_' + tid].placares) : calcTemporada(tid);
  var h = '';
  var temps = Object.keys(D.temporadas).sort(function (a, b) { return (D.temporadas[b].inicio || 0) - (D.temporadas[a].inicio || 0); });
  if (temps.length > 1) {
    h += '<select class="inp" style="margin-top:14px" data-c="rankTemp">';
    temps.forEach(function (k) { h += '<option value="' + k + '"' + (k === tid ? ' selected' : '') + '>' + esc(D.temporadas[k].nome) + '</option>'; });
    h += '</select>';
  }
  h += '<div class="seg">' + ['rodada', 'temporada', 'areas', 'placa', 'treino'].map(function (m) {
    return '<button class="' + (S.rankModo === m ? 'on' : '') + '" data-a="rankModo" data-v="' + m + '">' + { rodada: 'Rodada', temporada: 'Temporada', areas: 'Áreas', placa: 'Placa!', treino: 'Treino' }[m] + '</button>';
  }).join('') + '</div>';
  if (S.rankModo === 'placa') return h + rankingPlaca(tid);
  if (S.rankModo === 'treino') return h + rankingTreino();
  var iniciadas = res.rods.filter(function (r) { return Date.now() >= r.inicio; });
  if (!iniciadas.length) return h + '<div class="empty">A primeira rodada ainda não começou.</div>';
  var rid = S.rankRodada && res.rod[S.rankRodada] ? S.rankRodada : iniciadas[iniciadas.length - 1].id;
  var uid = S.user.uid, titulo, linhasCompart = [];
  if (S.rankModo === 'rodada' || S.rankModo === 'areas') {
    h += '<div class="chips">';
    iniciadas.forEach(function (r) { h += '<button class="chip' + (r.id === rid ? ' on' : '') + '" data-a="rankRodada" data-v="' + r.id + '">R' + r.n + (r.fechada ? '' : ' • ao vivo') + '</button>'; });
    h += '</div>';
  }
  var rsel = iniciadas.filter(function (r) { return r.id === rid; })[0];
  if (S.rankModo === 'rodada') {
    var L = res.rod[rid] || [];
    titulo = 'Rodada ' + rsel.n + (rsel.fechada ? '' : ' (parcial)');
    h += '<div class="card" style="padding:6px 16px">';
    if (!L.length) h += '<div class="empty">Ninguém jogou esta rodada ainda.</div>';
    L.forEach(function (l) {
      var sub = (l.qf ? l.q + '/10' : (l.q + '/10 em andamento')) + ' · ' + (l.c ? fmtSeg(l.c) : 'sem corrida');
      h += linhaRank(l, l.total, sub, l.uid === uid);
      linhasCompart.push({ pos: l.pos, uid: l.uid, l: l, pts: l.total, sub: l.qp + ' quiz · ' + l.cp + ' corrida' });
    });
    h += '</div>';
  } else if (S.rankModo === 'temporada') {
    titulo = res.temp.nome || 'Temporada';
    h += '<div class="card" style="padding:6px 16px">';
    if (!res.final.length) h += '<div class="empty">Sem resultados ainda.</div>';
    res.final.forEach(function (x) {
      h += linhaRank(x, x.total, x.rodadas + ' rodada' + (x.rodadas > 1 ? 's' : '') + ' · ' + x.quiz + ' quiz · ' + x.corrida + ' corrida', x.uid === uid);
      linhasCompart.push({ pos: x.pos, uid: x.uid, l: x, pts: x.total, sub: x.rodadas + ' rodadas' });
    });
    h += '</div>';
  } else {
    var A = res.areaRod[rid] || [];
    titulo = 'Áreas · Rodada ' + rsel.n;
    h += '<p class="small mut">Média de pontos de quem jogou na rodada. A área precisa de pelo menos 3 participantes para entrar no ranking.</p><div class="card" style="padding:6px 16px">';
    if (!A.length) h += '<div class="empty">Sem resultados ainda.</div>';
    A.forEach(function (x) {
      var minha = S.me.areaId === x.areaId;
      h += '<div class="rk' + (x.elegivel ? '' : ' fora') + (minha ? ' eu' : '') + '"><span class="pos p' + (x.pos || 0) + '">' + (x.pos || '–') + '</span><span class="av" style="background:' + corDe(x.areaId) + '">' + esc(iniciais(areaNome(x.areaId))) + '</span><div class="nm"><b>' + esc(areaNome(x.areaId)) + '</b><span>' + x.n + ' participante' + (x.n > 1 ? 's' : '') + (x.elegivel ? '' : ' · mínimo 3') + '</span></div><div class="pt">' + String(x.media).replace('.', ',') + '<small>média</small></div></div>';
      if (x.elegivel) linhasCompart.push({ pos: x.pos, area: x.areaId, pts: String(x.media).replace('.', ','), sub: x.n + ' participantes' });
    });
    h += '</div>';
  }
  S._compart = { titulo: titulo, linhas: linhasCompart, area: S.rankModo === 'areas' };
  if (linhasCompart.length) h += '<button class="btn gh full" data-a="compartilharRanking">📸 Compartilhar imagem do ranking</button>';
  return h;
}
function rankingTreino() {
  var sem = S.rankTreino !== 'geral', sid = Garagem.semana(Date.now()), uid = S.user.uid, linhas = [], h = '';
  var porCarro = S.rankTreino === 'carro';
  if (porCarro) sem = false;
  h += '<div class="chips"><button class="chip' + (sem ? ' on' : '') + '" data-a="rankTreino" data-v="semana">Desta semana</button><button class="chip' + (!sem && !porCarro ? ' on' : '') + '" data-a="rankTreino" data-v="geral">Geral</button><button class="chip' + (porCarro ? ' on' : '') + '" data-a="rankTreino" data-v="carro">Por carro</button></div>';
  if (porCarro) return h + rankingPorCarro();
  var l = Object.keys(D.treinos || {}).map(function (k) { var d = D.treinos[k], r = sem ? (d.semanas || {})[sid] : d.melhor; return r ? { uid: k, d: d, r: r } : null; }).filter(Boolean)
    .sort(function (a, b) { return b.r.t - a.r.t || a.r.em - b.r.em; });
  h += '<p class="small mut">Melhor tempo no treino livre' + (sem ? ' desta semana (segunda a domingo)' : ' de todos os tempos') + '. Aqui valem os atributos de cada carro, por isso o carro usado aparece ao lado. Não conta pontos no ranking da temporada; cada treino rende créditos para a Garagem.</p><div class="card" style="padding:6px 16px">';
  if (!l.length) h += '<div class="empty">Ninguém treinou ' + (sem ? 'esta semana' : 'ainda') + '.</div>';
  l.forEach(function (x, i) {
    var j = jogDe(x.uid, { uid: x.uid, ap: x.d.ap, nm: x.d.nm, a: x.d.a }), c = Garagem.CATALOGO[x.r.cat] || Garagem.CATALOGO.aura, pos = i > 0 && l[i - 1].r.t === x.r.t ? linhas[i - 1].pos : i + 1;
    linhas.push({ pos: pos, uid: x.uid, l: { ap: x.d.ap, nm: x.d.nm, a: x.d.a }, pts: fmtSeg(x.r.t), sub: c.nome });
    h += '<div class="rk' + (x.uid === uid ? ' eu' : '') + '"><span class="pos p' + pos + '">' + pos + '</span>' + avatar(j, x.uid) + '<div class="nm"><b>' + esc(nomeExib(j)) + '</b><span class="rkcar">' + miniCarro(x.r.cat) + esc(c.nome) + '</span></div><div class="pt">' + fmtSeg(x.r.t).replace(' s', '') + '<small>segundos</small></div></div>';
  });
  h += '</div>';
  S._compart = { titulo: 'Treino · ' + (sem ? 'semana' : 'geral'), linhas: linhas, area: false };
  if (linhas.length) h += '<button class="btn gh full" data-a="compartilharRanking">📸 Compartilhar imagem do ranking</button>';
  return h;
}
// miniatura do carro (foto do catálogo) para listas
function miniCarro(cat) { var f = window.FOTOS_CARROS && FOTOS_CARROS[cat]; return f ? '<img class="mcar" src="' + f.foto + '" alt="">' : ''; }
// ranking por carro: recorde de cada modelo no treino, com o pódio de quem mais longe foi com ele
function rankingPorCarro() {
  var uid = S.user.uid, por = {};
  Object.keys(D.treinos || {}).forEach(function (k) {
    var d = D.treinos[k], m = Garagem.porCarroDe(d);
    Object.keys(m).forEach(function (cat) { (por[cat] = por[cat] || []).push({ uid: k, d: d, t: m[cat].t, em: m[cat].em }); });
  });
  var cats = Object.keys(por).map(function (cat) { por[cat].sort(function (a, b) { return b.t - a.t || a.em - b.em; }); return cat; })
    .sort(function (a, b) { return por[b][0].t - por[a][0].t; });
  var h = '<p class="small mut">O recorde de cada carro no treino, onde valem os atributos. Toque num carro para ver o pódio completo.</p>';
  if (!cats.length) return h + '<div class="empty">Ninguém treinou ainda.</div>';
  cats.forEach(function (cat, i) {
    var c = Garagem.CATALOGO[cat], l = por[cat], top = l[0], j = jogDe(top.uid, { uid: top.uid, ap: top.d.ap, nm: top.d.nm, a: top.d.a }), aberto = S.rankCarroAberto === cat;
    var meu = l.filter(function (x) { return x.uid === uid; })[0];
    h += '<div class="card rkc' + (aberto ? ' on' : '') + '"><button class="rkc-top" data-a="rankCarro" data-v="' + cat + '">' + (window.FOTOS_CARROS && FOTOS_CARROS[cat] ? '<img class="rkc-foto" src="' + FOTOS_CARROS[cat].foto + '" alt="">' : '') +
      '<div class="rkc-info"><b>' + esc(c.nome) + '</b><span class="tiny mut">' + c.tipo + ' · ' + l.length + (l.length === 1 ? ' piloto' : ' pilotos') + (meu ? ' · você: ' + fmtSeg(meu.t) : '') + '</span>' +
      '<div class="rkc-rec">' + avatar(j, top.uid, 'sm') + '<span>🏆 <b>' + esc(nomeExib(j)) + '</b></span></div></div><div class="pt">' + fmtSeg(top.t).replace(' s', '') + '<small>recorde</small></div></button>';
    if (aberto) {
      h += '<div class="rkc-lista">';
      l.slice(0, 10).forEach(function (x, k) {
        var jj = jogDe(x.uid, { uid: x.uid, ap: x.d.ap, nm: x.d.nm, a: x.d.a });
        h += '<div class="rk' + (x.uid === uid ? ' eu' : '') + '"><span class="pos p' + (k + 1) + '">' + (k + 1) + '</span>' + avatar(jj, x.uid) + '<div class="nm"><b>' + esc(nomeExib(jj)) + '</b><span>' + esc(areaNome(jj.areaId || x.d.a)) + '</span></div><div class="pt">' + fmtSeg(x.t).replace(' s', '') + '<small>segundos</small></div></div>';
      });
      h += '</div>';
    }
    h += '</div>';
  });
  return h;
}
function rankingPlaca(tid) {
  var res = calcPlaca(tid), uid = S.user.uid, h = '', linhas = [];
  h += '<p class="small mut">Vitórias no Placa! nesta temporada. Desempate pela taxa de vitória. Entra no ranking quem jogou pelo menos ' + PLACA_MIN + ' partidas.</p><div class="card" style="padding:6px 16px">';
  if (!res.ranking.length) h += '<div class="empty">Ninguém jogou Placa! nesta temporada ainda.</div>';
  var cortou = false;
  res.ranking.forEach(function (x) {
    if (!x.elegivel && !cortou) { cortou = true; h += '<div class="tiny mut" style="padding:10px 0 2px">Ainda sem o mínimo de ' + PLACA_MIN + ' partidas</div>'; }
    var sub = x.partidas + ' partida' + (x.partidas > 1 ? 's' : '') + ' · ' + Math.round(x.taxa * 100) + '% de vitórias';
    var j = jogDe(x.uid, x);
    h += '<div class="rk' + (x.elegivel ? '' : ' fora') + (x.uid === uid ? ' eu' : '') + '">' + (x.pos ? '<span class="pos p' + x.pos + '">' + x.pos + '</span>' : '<span class="pos">–</span>') + avatar(j, x.uid) +
      '<div class="nm"><b>' + esc(nomeExib(j)) + '</b><span>' + sub + '</span></div><div class="pt">' + x.vitorias + '<small>vitória' + (x.vitorias === 1 ? '' : 's') + '</small></div></div>';
    if (x.elegivel) linhas.push({ pos: x.pos, uid: x.uid, l: x, pts: x.vitorias, sub: sub });
  });
  h += '</div>';
  S._compart = { titulo: 'Placa! · ' + ((D.temporadas[tid] || {}).nome || 'Temporada'), linhas: linhas, area: false };
  if (linhas.length) h += '<button class="btn gh full" data-a="compartilharRanking">📸 Compartilhar imagem do ranking</button>';
  return h;
}
function carregarOutraTemp(tid) {
  if (D.outrasTemp['_c' + tid]) return;
  D.outrasTemp['_c' + tid] = true;
  Promise.all([B.getCol('rodadas', [['temporadaId', '==', tid]]), B.getCol('placar', [['temporadaId', '==', tid]])]).then(function (r) {
    D.outrasTemp['_' + tid] = { rodadas: r[0], placares: r[1] }; R();
  }).catch(function (e) { toast(msgErro(e)); });
}

/* ---------- Perfil ---------- */
function telaPerfil() {
  var me = S.me, uid = S.user.uid;
  var h = '<div class="card" style="text-align:center;margin-top:16px"><div style="position:relative;display:inline-block">' + avatar(me, uid, 'lg') + '</div>' +
    '<h2 style="font-size:20px;font-weight:900;margin-top:10px">' + esc(nomeExib(me)) + '</h2><div class="mut small">' + esc(me.nome) + ' · ' + esc(areaNome(me.areaId)) + '</div>' +
    (ehMaster() ? '<div style="margin-top:6px"><span class="tag gold">Master</span></div>' : (me.papel === 'adm' ? '<div style="margin-top:6px"><span class="tag nv">Adm</span></div>' : '')) +
    '<div class="row" style="justify-content:center;margin-top:12px;flex-wrap:wrap"><label class="btn gh sm" style="margin:0">📷 Foto<input type="file" accept="image/*" data-c="foto" style="display:none"></label>' +

    '<button class="btn gh sm" data-a="editarPerfil">Editar dados</button></div></div>';
  // curiosidades
  var cur = me.curiosidades || [];
  h += '<div class="card gsug" style="margin-top:12px"><div style="min-width:0"><b>💬 Sugestões e problemas</b><div class="small mut">Ideia, melhoria ou algo que não funcionou? Conte para a gente.</div></div><button class="btn lar sm" data-a="sugerir">Enviar</button></div>';
  h += '<div class="sec">Quem é quem</div><div class="card"><p class="small mut" style="margin-top:0">Opcional: conte até 3 curiosidades sobre você. Elas podem virar perguntas do tipo "Quem do time…?" no quiz. Você pode tirar quando quiser.</p>';
  if (cur.length) { h += '<ul style="margin:6px 0 10px;padding-left:18px">'; cur.forEach(function (c) { h += '<li>' + esc(c) + '</li>'; }); h += '</ul>'; }
  else h += '<p class="small" style="font-style:italic">Nenhuma curiosidade cadastrada.</p>';
  h += '<button class="btn gh sm" data-a="editarCuriosidades">' + (cur.length ? 'Editar curiosidades' : 'Adicionar curiosidades') + '</button></div>';
  // conquistas
  var mb = meusBadges(), cont = {};
  mb.forEach(function (b) { cont[b.tipo] = (cont[b.tipo] || 0) + 1; });
  h += '<div class="sec">Conquistas da temporada</div><div class="bgrid">';
  ORDEM_BADGES.forEach(function (t) {
    var d = BADGES[t];
    h += '<button class="bcell' + (cont[t] ? '' : ' off') + '" data-a="infoBadge" data-v="' + t + '"><div class="e">' + d.e + '</div><b>' + d.t + '</b><span>' + (cont[t] ? (cont[t] > 1 ? cont[t] + '×' : 'conquistado') : 'a conquistar') + '</span></button>';
  });
  h += '</div>';
  h += '<div class="sec">Conquistas do Placa!</div><div class="bgrid">';
  ORDEM_PLACA.forEach(function (t) {
    var d = BADGES[t];
    h += '<button class="bcell' + (cont[t] ? '' : ' off') + '" data-a="infoBadge" data-v="' + t + '"><div class="e">' + d.e + '</div><b>' + d.t + '</b><span>' + (cont[t] ? (cont[t] > 1 ? cont[t] + '×' : 'conquistado') : 'a conquistar') + '</span></button>';
  });
  h += '</div>';
  if (mb.length) { h += '<div style="margin-top:8px">'; mb.forEach(function (b) { h += cartaoBadge(b, false); }); h += '</div>'; }
  // histórico
  var tid = tempAtivaId();
  if (tid && D.temporadas[tid]) {
    var res = calcTemporada(tid);
    var linhas = res.rods.filter(function (r) { return Date.now() >= r.inicio; }).map(function (r) {
      var l = (res.rod[r.id] || []).filter(function (x) { return x.uid === uid; })[0];
      return { r: r, l: l };
    });
    if (linhas.length) {
      h += '<div class="sec">Seu histórico</div><div class="card"><table class="t"><tr><th>Rodada</th><th class="n">Quiz</th><th class="n">Corrida</th><th class="n">Total</th><th class="n">Pos.</th></tr>';
      linhas.slice().reverse().forEach(function (x) {
        var l = x.l;
        h += '<tr><td>R' + x.r.n + (x.r.fechada ? '' : ' <span class="tag gold">ao vivo</span>') + '</td>' +
          (l ? '<td class="n">' + l.q + '/10</td><td class="n">' + (l.c ? fmtSeg(l.c) : '—') + '</td><td class="n"><b>' + l.total + '</b></td><td class="n">' + l.pos + 'º</td>' : '<td class="n mut" colspan="4">não jogou</td>') + '</tr>';
      });
      h += '</table></div>';
    }
  }
  h += '<button class="btn out full" style="margin-top:18px" data-a="sair">Sair</button>';
  return h;
}

/* ---------- Regras ---------- */
function telaRegras() {
  var t = tempAtiva(), k = (t && t.k) || 40;
  var tab = [15, 30, 45, 60, 90, 120, 150].map(function (s) { return '<tr><td>' + s + ' s</td><td class="n"><b>' + Logica.curva(s, k) + '</b></td></tr>'; }).join('');
  return '<div class="card gsug" style="margin-top:16px"><div style="min-width:0"><b>💬 Sugestões e problemas</b><div class="small mut">Viu algo estranho ou tem uma ideia? Mande por aqui.</div></div><button class="btn lar sm" data-a="sugerir">Enviar</button></div>' +
    '<div class="card regras" style="margin-top:12px"><h3 style="font-size:20px">Como funciona</h3>' +
    '<p>O Game Aura tem uma <b>rodada por semana</b>, de segunda 00:00 a domingo 23:59. Cada rodada tem duas etapas, que você joga quando quiser dentro da semana e em qualquer ordem.</p>' +
    '<h4>🧠 Quiz</h4><ul><li>10 perguntas, 4 alternativas, 20 segundos por pergunta.</li><li>Uma tentativa por rodada. Tempo esgotado conta como erro.</li><li>10 pontos por acerto (máximo 100).</li><li>Se você sair no meio, pode continuar depois; a pergunta que estava na tela conta como erro se o tempo dela acabar.</li><li>Desempate: menor tempo total nas perguntas que você acertou.</li><li>A ordem das perguntas e das alternativas muda para cada pessoa.</li></ul>' +
    '<h4>🏎️ Corrida</h4><ul><li>A pista tem <b>5 faixas</b>. Desvie de cones e carros parados (bater encerra a corrida) e de buracos (não encerram, mas tiram 35% do pneu) tocando no lado esquerdo ou direito da tela (ou com as setas ← → no computador).</li><li><b>Seguro Porto:</b> pegue o escudo azul para ganhar uma vida extra (acumula até 2). Se bater, o seguro é acionado, o carro pisca por 1,5 s sem sofrer dano e a corrida continua.</li><li><b>Pneus e CAP Porto:</b> o pneu gasta com o tempo (medidor no canto). Com pneu gasto, o carro demora mais para trocar de faixa. De tempos em tempos aparece a entrada do <b>CAP Porto</b> na faixa da direita ou da esquerda: passando por ela, o carro para, troca os pneus, perde 3 segundos no cronômetro e ganha 15 segundos de revisão, que deixa passar por buracos. Se o pneu acabar, ele fura: o seguro troca o pneu, se você tiver; se não, a corrida termina.</li><li>A velocidade aumenta a cada 10 segundos. Depois de 2 minutos começa a <b>reta final</b>: mais obstáculos, menos Seguros e CAPs mais raros, até ficar impossível. A corrida não tem fim: ganha quem for mais longe.</li><li><b>Praça de pedágio:</b> as <b>3 faixas do meio</b> têm cancela. Cada <b>tag</b> que você pega vale 1 mensalidade (acumula até 3; costuma aparecer logo depois do aviso PEDÁGIO) e cada passagem usa uma: a cancela abre e você passa direto. Sem tag, o carro para para pagar e você perde <b>5 segundos</b>.</li><li><b>Free flow:</b> as <b>2 faixas laterais</b> têm pórtico de free flow, sem cancela. Com tag, passa sem parar e usa 1 mensalidade. Sem tag, passa sem parar, mas leva uma <b>multa por evasão</b>. Vale igual no treino e na rodada; a multa não mexe no tempo nem no ranking.</li><li>3 tentativas por rodada, vale o <b>melhor tempo</b>. Começou, a tentativa conta. Sair do app no meio encerra a tentativa.</li><li>Todo mundo corre na mesma pista na rodada (a pista muda a cada tentativa e a cada semana).</li><li>Treino é livre e não vale ponto. O treino rende <b>créditos</b> para a Garagem: 20% dos pontos que o tempo valeria na rodada. O seu melhor tempo entra no <b>ranking de treinos</b> (da semana e geral), onde valem os atributos do carro.</li></ul>' +
    '<p><b>Pontos pelo melhor tempo</b> (não depende da posição dos outros):</p><table class="t" style="max-width:260px"><tr><th>Tempo</th><th class="n">Pontos</th></tr>' + tab + '</table>' +
    '<h4>🏆 Rankings</h4><ul><li>Rodada: quiz + corrida, até 200 pontos.</li><li>Temporada: soma das rodadas. Desempate por mais rodadas jogadas e depois pelos pontos do quiz.</li><li>Áreas: média dos pontos de quem jogou (mínimo de 3 participantes).</li></ul>' +
    '<h4>🎖️ Conquistas</h4><ul>' + ORDEM_BADGES.map(function (b) { return '<li>' + BADGES[b].e + ' <b>' + BADGES[b].t + '</b>: ' + esc(BADGES[b].d) + '</li>'; }).join('') + '</ul>' +
    '<p class="small mut">Conquistas de rodada aparecem quando a rodada fecha (domingo 23:59), exceto Gabaritou, Piloto de Ouro e Combo Perfeito, que saem na hora. Toque numa conquista para compartilhar a imagem.</p>' +
    '<h4>🚗 Garagem e créditos</h4><ul><li>Você ganha <b>créditos</b> com os pontos de cada rodada (quiz + corrida) e ' + Garagem.PONTOS_VITORIA_PLACA + ' por vitória no Placa! contra pessoas e os treinos da corrida (20% dos pontos). Os créditos acumulam para sempre e não mexem no ranking.</li><li>Na aba <b>Garagem</b>, compre carros <b>0 km</b>, <b>Retomados Itaú e Porto</b> (lote novo de ' + Garagem.LOTE + ' carros com desconto toda segunda; quem comprar primeiro leva) ou <b>usados</b> anunciados por colegas (com 5% de taxa de transferência para quem compra).</li><li><b>Multas:</b> cada evasão no free flow gera uma multa de ' + Garagem.MULTA.valor + ' créditos no carro usado. Pagando em até ' + Garagem.MULTA.prazoDias + ' dias, tem ' + Math.round(Garagem.MULTA.desconto * 100) + '% de desconto; depois, sobe ' + Math.round(Garagem.MULTA.juros * 100) + '%. Carro com multa pendente não pode ser anunciado no mercado.</li><li>Cada carro tem atributos (agilidade, durabilidade dos pneus e seguro inicial), mas eles <b>só valem no treino</b>. Na rodada, todos os carros andam igual.</li></ul>' +
    '<h4 id="regras-placa">🃏 Placa!</h4><ul><li>Jogo de cartas online, de 2 a 6 pessoas. Crie uma mesa na aba Jogar ou entre numa mesa aberta. Uma mão = uma partida.</li>' +
    '<li>Baralho de 108 cartas em 4 cores (laranja, azul, verde e vermelho): números de 0 a 9, <b>Pedágio</b> (o próximo perde a vez), <b>Retorno</b> (inverte o sentido), <b>Guincho +2</b>, <b>Seguro</b> (curinga: escolhe a cor) e <b>Seguro Total +4</b> (curinga: escolhe a cor e o próximo compra 4 e perde a vez).</li>' +
    '<li>Cada pessoa começa com 7 cartas. Na sua vez, jogue uma carta da mesma cor, número ou símbolo da carta da mesa. Sem jogada, compre 1: se servir, pode jogá-la na hora.</li>' +
    '<li><b>Guincho acumula:</b> quem recebe pode responder com outro Guincho, e a conta passa adiante (+4, +6…). Quem não responder compra tudo. O Seguro Total +4 não entra na soma.</li>' +
    '<li>Ao jogar a penúltima carta, toque em <b>Placa!</b>. Se esquecer, qualquer um pode tocar em <b>Multa!</b> até a próxima jogada, e você compra 2.</li>' +
    '<li>Sem limite de tempo por jogada. Qualquer um pode pausar. Encerrar antes só com o aceite de todos (e não conta no ranking). Se alguém ficar 10 minutos sem jogar na vez dele, a mesa pode votar para remover a pessoa; as cartas dela voltam para o monte.</li>' +
    '<li><b>Robôs:</b> dá para jogar só contra robôs ou completar os lugares vazios da sua mesa com eles. Partidas com robô não contam para o ranking nem para as conquistas.</li>' +
    '<li><b>Ranking do Placa!:</b> vitórias na temporada, com desempate pela taxa de vitória. Entra quem jogou pelo menos 5 partidas.</li></ul>' +
    '<p class="small">Conquistas do Placa!: ' + ORDEM_PLACA.map(function (b) { return BADGES[b].e + ' <b>' + BADGES[b].t + '</b> (' + esc(BADGES[b].d.charAt(0).toLowerCase() + BADGES[b].d.slice(1)) + ')'; }).join(' · ') + '.</p>' +
    '<h4>🚗 Créditos dos carros 3D</h4><p class="small">Modelos do Sketchfab, adaptados para o jogo (otimizados, sem logotipos e com nomes fictícios).</p><ul class="small"><li>Cyberpunk: <a href="https://sketchfab.com/3d-models/cyberpunk-car-b4301ff99d214d16a7a43708a5866bf0" target="_blank" rel="noopener">modelo de 4d_Bob</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Conceito: <a href="https://sketchfab.com/3d-models/free-concept-car-004-public-domain-cc0-4cba124633eb494eadc3bb0c4660ad7e" target="_blank" rel="noopener">modelo de Unity Fan</a>, domínio público</li><li>Conceito Neon: <a href="https://sketchfab.com/3d-models/free-ai-based-conceptcar-050-public-domain-cc0-3f7a98a53efe48068adddf0c0f3ddbae" target="_blank" rel="noopener">modelo de Unity Fan</a>, domínio público</li><li>Touro SV: <a href="https://sketchfab.com/3d-models/1995-lamborghini-diablo-sv-21d606803a6442ce8877baee15547ed7" target="_blank" rel="noopener">modelo de amogusstrikesback2</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Veloce Pista: <a href="https://sketchfab.com/3d-models/ferrari-488-pista-090fbbb80e3f48ed9c4be915d65c2adf" target="_blank" rel="noopener">modelo de amogusstrikesback2</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Gran Turismo: <a href="https://sketchfab.com/3d-models/maserati-alfieri-dd37cab4fe8644cc9808008a47565195" target="_blank" rel="noopener">modelo de amogusstrikesback2</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Asa de Gaivota: <a href="https://sketchfab.com/3d-models/mercedes-benz-sls-amg-coupe-black-series-d306a599cc014b07a75e20b440635414" target="_blank" rel="noopener">modelo de amogusstrikesback2</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Felino X: <a href="https://sketchfab.com/3d-models/2013-jaguar-c-x75-20caf150bb0444909c65b57217aa46f6" target="_blank" rel="noopener">modelo de amogusstrikesback2</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Monoposto F: <a href="https://sketchfab.com/3d-models/2027-formula-1-car-900b2d93db1b4fd7bfce436067e25287" target="_blank" rel="noopener">modelo de Abu Saif</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Serpente GTS: <a href="https://sketchfab.com/3d-models/1996-dodge-viper-gts-sr2-2a125eb8b25e4a249aab9db8e465274a" target="_blank" rel="noopener">modelo de ilvskf</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Besouro: <a href="https://sketchfab.com/3d-models/beetlefusca-version-1-cb6e82e73386448fb3b4e2dd25255a5e" target="_blank" rel="noopener">modelo de soujagah</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Perua Retrô: <a href="https://sketchfab.com/3d-models/volkswagen-kombi-micro-bus-d34fd744db1c4f84ad40c854ddbff9e9" target="_blank" rel="noopener">modelo de winterborn</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Viajante 88: <a href="https://sketchfab.com/3d-models/80s90s-chevrolet-caravan-c77c570538d6499ca6b6f97bc9b01f21" target="_blank" rel="noopener">modelo de coptrum</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li><li>Serpente Roadster: <a href="https://sketchfab.com/3d-models/dodge-viper-rt10-sr1-f09fc27ddbe1488da79e82fd669c57de" target="_blank" rel="noopener">modelo de ilvskf</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> (cor alterada)</li><li>Conceito Trilha: <a href="https://sketchfab.com/3d-models/free-concept-car-006-public-domain-cc0-a4e19bb6e6394c4a95d4319ef7d265ba" target="_blank" rel="noopener">modelo de Unity Fan</a>, domínio público</li><li>Diplomata 87: <a href="https://sketchfab.com/3d-models/chevrolet-opala-diplomata-87-a704d368afce4f9cae6c2a26dcc0a9ff" target="_blank" rel="noopener">modelo de Ynklar</a>, licença <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></li></ul>' +
    '<h4>🤝 Espírito do jogo</h4><p>É um jogo de integração. Nada de pesquisar respostas ou trocar gabarito: a graça é descobrir junto.</p></div>';
}
