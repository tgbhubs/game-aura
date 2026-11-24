/* ================== MODAIS ================== */
function abrirModal(html) { var m = $('#modal'); m.innerHTML = '<div class="mbox">' + html + '</div>'; m.className = 'on'; }
function fecharModal() { var m = $('#modal'); m.className = ''; m.innerHTML = ''; S._confirma = null; S._qeqNovo = null; }
function abrirConfirma(titulo, texto, botao, fn, perigo) {
  S._confirma = fn;
  abrirModal('<h3>' + esc(titulo) + '</h3><p class="mut">' + esc(texto) + '</p><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn ' + (perigo ? 'red' : 'lar') + '" data-a="confirmar">' + esc(botao) + '</button></div>');
}
document.addEventListener('click', function (e) { if (e.target && e.target.id === 'modal') fecharModal(); });

/* ================== IMAGENS PARA COMPARTILHAR ================== */
function fundoMarca(ctx, W, H) {
  ctx.fillStyle = '#14235E'; ctx.fillRect(0, 0, W, H);
}
var _logoImg = null;
function carregarFontes() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.all(['900 40px Montserrat', '800 40px Montserrat', '600 20px "Public Sans"', '500 20px "Public Sans"'].map(function (f) { return document.fonts.load(f).catch(function () { }); }));
}
function carregarLogo() { return carregarFontes().then(function () { return _logoImg ? _logoImg : carregarImg(svgDataUrl(LOGO_NEG_SVG)).then(function (i) { _logoImg = i; return i; }); }); }
function _carregarLogoAntigo() { return _logoImg ? Promise.resolve(_logoImg) : carregarImg(svgDataUrl(LOGO_NEG_SVG)).then(function (i) { _logoImg = i; return i; }); }
// desenha o logo oficial (altura "alt") com o selo GAME ao lado; x,y = canto superior esquerdo
function marcaCanvas(ctx, x, y, alt) {
  var w = alt * LOGO_PROP;
  if (_logoImg) ctx.drawImage(_logoImg, x, y, w, alt);
  var pw = alt * 0.95, ph = alt * 0.34, px = x + w + alt * 0.22, py = y + alt * 0.42;
  ctx.fillStyle = '#EC7000'; arredondado(ctx, px, py, pw, ph, ph / 2); ctx.fill();
  ctx.fillStyle = '#14235E'; ctx.font = '800 ' + Math.round(ph * 0.55) + 'px Montserrat, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('GAME', px + pw / 2, py + ph / 2 + 1); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function arredondado(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function quebrar(ctx, txt, maxW) {
  var pal = String(txt).split(' '), linhas = [], l = '';
  pal.forEach(function (p) { var t = l ? l + ' ' + p : p; if (ctx.measureText(t).width > maxW && l) { linhas.push(l); l = p; } else l = t; });
  if (l) linhas.push(l); return linhas;
}
function carregarImg(src) { return new Promise(function (res) { if (!src) { res(null); return; } var i = new Image(); if (!/^data:/.test(src)) i.crossOrigin = 'anonymous'; i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; }); }
function avatarCanvas(ctx, img, j, uid, x, y, d) {
  ctx.save(); ctx.beginPath(); ctx.arc(x + d / 2, y + d / 2, d / 2, 0, 7); ctx.closePath(); ctx.clip();
  if (img) ctx.drawImage(img, x, y, d, d);
  else { ctx.fillStyle = corDe(uid); ctx.fillRect(x, y, d, d); ctx.fillStyle = '#fff'; ctx.font = '800 ' + Math.round(d * 0.38) + 'px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(iniciais(j ? (j.apelido || j.nome) : '?'), x + d / 2, y + d / 2 + 2); }
  ctx.restore(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
}
// O arquivo é gerado quando a prévia abre; o toque em Compartilhar chama o share na hora (o iPhone exige isso).
function compartilharPrevia() {
  var p = S._previa; if (!p) return;
  if (!p.arq) { toast('Preparando a imagem, toque de novo em instantes.'); return; }
  if (navigator.canShare && navigator.canShare({ files: [p.arq] })) {
    navigator.share({ files: [p.arq], text: p.texto }).catch(function (e) {
      if (e && e.name === 'AbortError') return;
      baixarArquivo(p.arq);
    });
  } else baixarArquivo(p.arq);
}
function baixarArquivo(arq) {
  var a = document.createElement('a'); a.href = URL.createObjectURL(arq); a.download = arq.name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  toast('Imagem baixada. É só postar!');
}
function mostrarPrevia(cv, nome, texto) {
  var url;
  try { url = cv.toDataURL('image/png'); } catch (e) { toast('Não consegui gerar a imagem.'); return; }
  var p = S._previa = { nome: nome, texto: texto, arq: null };
  cv.toBlob(function (blob) { if (blob && S._previa === p) p.arq = new File([blob], nome, { type: 'image/png' }); }, 'image/png');
  abrirModal('<h3>Pronto para postar</h3><img src="' + url + '" style="width:100%;border-radius:14px;display:block;margin:8px 0"><div class="mact"><button class="btn gh" data-a="fecharModal">Fechar</button><button class="btn lar" data-a="compartilharPrevia">📤 Compartilhar</button></div>');
}
function imagemBadge(tipo, rid, n) {
  var d = BADGES[tipo]; if (!d) return;
  var me = S.me, uid = S.user.uid;
  var t = tempAtiva();
  document.fonts.ready.then(carregarLogo).then(function () { return carregarImg(me.foto); }).then(function (img) {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    fundoMarca(ctx, W, H); marcaCanvas(ctx, 80, 80, 96);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(W / 2, 520, 230, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(W / 2, 520, 180, 0, 7); ctx.fill();
    ctx.font = '220px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.e, W / 2, 530); ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#FF8A2B'; ctx.font = '800 34px Montserrat, Arial, sans-serif'; ctx.fillText('CONQUISTA DESBLOQUEADA', W / 2, 840);
    ctx.fillStyle = '#fff'; ctx.font = '900 92px Montserrat, Arial, sans-serif'; ctx.fillText(d.t, W / 2, 940);
    ctx.font = '500 38px "Public Sans", Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.82)';
    quebrar(ctx, d.d, 820).forEach(function (l, i) { ctx.fillText(l, W / 2, 1005 + i * 48); });
    avatarCanvas(ctx, img, me, uid, 80, 1110, 96);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '800 40px Montserrat, Arial, sans-serif'; ctx.fillText(nomeExib(me), 200, 1150);
    ctx.font = '500 30px "Public Sans", Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.fillText((n ? 'Rodada ' + n + ' · ' : '') + (t ? t.nome : '') + ' · ' + areaNome(me.areaId), 200, 1194);
    compartilharEPrever(cv, 'conquista-' + tipo + '.png', 'Conquistei "' + d.t + '" no Game Aura ' + d.e);
  });
}
function compartilharEPrever(cv, nome, texto) { mostrarPrevia(cv, nome, texto); }
function imagemRanking() {
  var c = S._compart; if (!c || !c.linhas.length) return;
  var top = c.linhas.slice(0, 10);
  var eu = c.area ? null : c.linhas.filter(function (l) { return l.uid === S.user.uid; })[0];
  if (eu && top.indexOf(eu) >= 0) eu = null;
  var lista = top.concat(eu ? [eu] : []);
  document.fonts.ready.then(carregarLogo).then(function () {
    return Promise.all(lista.map(function (l) { var j = l.uid ? jogDe(l.uid, l.l) : null; return carregarImg(j && j.foto); }));
  }).then(function (imgs) {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    fundoMarca(ctx, W, H); marcaCanvas(ctx, 70, 64, 78);
    ctx.fillStyle = '#fff'; ctx.font = '900 56px Montserrat, Arial, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Ranking', 70, 230);
    ctx.font = '600 32px "Public Sans", Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.fillText(c.titulo, 70, 278);
    var y0 = 320, alt = 82;
    lista.forEach(function (l, i) {
      var y = y0 + i * alt + (eu && i === lista.length - 1 ? 22 : 0);
      var minha = l.uid === S.user.uid || (c.area && l.area === S.me.areaId);
      ctx.fillStyle = minha ? 'rgba(237,108,66,.28)' : 'rgba(255,255,255,.07)'; arredondado(ctx, 60, y, W - 120, alt - 12, 18); ctx.fill();
      ctx.fillStyle = l.pos <= 3 ? '#FF8A2B' : '#F4F1EA';
      ctx.font = '900 34px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(l.pos), 112, y + 47);
      var nome, sub;
      if (c.area) { nome = areaNome(l.area); sub = l.sub; ctx.fillStyle = corDe(l.area); ctx.beginPath(); ctx.arc(180, y + 35, 26, 0, 7); ctx.fill(); }
      else { var j = jogDe(l.uid, l.l); nome = nomeExib(j); sub = l.sub; avatarCanvas(ctx, imgs[i], j, l.uid, 154, y + 9, 52); }
      ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '800 30px Montserrat, Arial, sans-serif';
      var nm = nome; while (ctx.measureText(nm).width > 560 && nm.length > 4) nm = nm.slice(0, -2);
      ctx.fillText(nm === nome ? nome : nm + '…', 226, y + 34);
      ctx.font = '500 22px "Public Sans", Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(sub, 226, y + 62);
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = '900 36px Montserrat, Arial, sans-serif'; ctx.fillText(String(l.pts), W - 90, y + 48);
    });
    ctx.textAlign = 'left'; ctx.font = '600 26px "Public Sans", Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.fillText('Jogue também no Game Aura', 70, H - 60);
    compartilharEPrever(cv, 'ranking-game-aura.png', 'Ranking do Game Aura · ' + c.titulo);
  });
}

/* ================== FOTO ================== */
function processarFoto(input) {
  var f = input.files && input.files[0]; if (!f) return;
  var rd = new FileReader();
  rd.onload = function () {
    var img = new Image();
    img.onload = function () {
      var T = 128, cv = document.createElement('canvas'); cv.width = T; cv.height = T;
      var ctx = cv.getContext('2d'), m = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, T, T);
      var url = cv.toDataURL('image/jpeg', 0.72);
      // no cadastro ainda não existe o jogador: guarda para salvar junto e só atualiza a prévia (sem redesenhar o formulário)
      if (!S.me) { S.fotoCad = url; var pv = $('#fFotoPrev'); if (pv) pv.innerHTML = '<img src="' + url + '" alt="">'; var st = $('#fFotoTxt'); if (st) st.textContent = 'Foto escolhida. Pode trocar se quiser.'; return; }
      B.update('jogadores/' + S.user.uid, { foto: url }).then(function () { toast('Foto atualizada.'); if ($('#modal').className === 'on' && $('#modalFoto')) fecharModal(); }).catch(function (e) { toast(msgErro(e)); });
    };
    img.src = rd.result;
  };
  rd.readAsDataURL(f); input.value = '';
}

/* ================== CADASTRO ================== */
function lerCadastro() {
  var area = $('#fArea').value, nova = ($('#fAreaNova') || {}).value || '';
  return { nome: $('#fNome').value.trim(), apelido: $('#fApelido').value.trim(), area: area, areaNova: nova.trim(), codigo: $('#fCodigo').value.trim().toUpperCase() };
}
function validarCadastro(c) {
  if (c.nome.split(/\s+/).length < 2) return 'Informe nome e sobrenome.';
  if (!c.apelido) return 'Escolha um apelido para o ranking.';
  if (!c.area) return 'Selecione sua área.';
  if (c.area === '__nova' && c.areaNova.length < 2) return 'Digite o nome da sua área.';
  if (!S.fotoCad && !(S.user && S.user.foto)) return 'Coloque uma foto: o jogo é para o time se conhecer.';
  return '';
}
function salvarCadastro(c) {
  var uid = S.user.uid;
  var areaId = c.area;
  var passos = Promise.resolve();
  if (c.area === '__nova') {
    areaId = slug(c.areaNova);
    if (!D.areas[areaId]) passos = passos.then(function () { return B.set('areas/' + areaId, { nome: c.areaNova, status: 'pendente', criadaPor: uid, criadaEm: Date.now() }); });
  }
  var base = { uid: uid, nome: c.nome, apelido: c.apelido.slice(0, 18), email: S.user.email || '', areaId: areaId, foto: S.fotoCad || S.user.foto || '', curiosidades: [], criadoEm: Date.now(), codigoAcesso: c.codigo || '' };
  var aviso = '';
  return passos.then(function () { return B.get('config/geral'); }).then(function (cfg) {
    if (!cfg || !cfg.masterUid) return B.set('config/geral', { masterUid: uid }).then(function () { return true; }, function () { return false; });
    return cfg.masterUid === uid;
  }).then(function (souMaster) {
    if (souMaster) return B.set('jogadores/' + uid, Object.assign({}, base, { papel: 'master', status: 'ativo' }));
    if (!c.codigo) return B.set('jogadores/' + uid, Object.assign({}, base, { papel: 'jogador', status: 'pendente' }));
    return B.set('jogadores/' + uid, Object.assign({}, base, { papel: 'jogador', status: 'ativo' })).catch(function () {
      aviso = 'Código não reconhecido. Seu cadastro ficou aguardando aprovação.';
      return B.set('jogadores/' + uid, Object.assign({}, base, { papel: 'jogador', status: 'pendente' }));
    });
  }).then(function () { if (aviso) S.authErro = aviso; });
}

/* ================== AÇÕES ================== */
var A = {
  tab: function (v) { S.tab = v; S.manterScroll = false; window.scrollTo(0, 0); if (v === 'inicio' || v === 'perfil') { } R(); },
  authTela: function (v) { S.authTela = v; S.authErro = ''; S.authInfo = ''; R(); },
  demoEntrar: function (v) { B.entrarComo({ uid: v, email: v.replace('demo-', '') + '@exemplo.com', nome: '' }); },
  demoReset: function () { abrirConfirma('Reiniciar a demonstração?', 'Os dados fictícios voltam ao estado inicial.', 'Reiniciar', function () { B.resetar(); }); },
  entrar: function () {
    var e = $('#fEmail').value.trim(), s = $('#fSenha').value;
    if (!e || !s) { S.authErro = 'Preencha e-mail e senha.'; R(); return; }
    S.ocupado = true; S.authErro = ''; R();
    B.entrarEmail(e, s).catch(function (er) { S.authErro = traduzAuth(er); }).then(function () { S.ocupado = false; R(); });
  },
  google: function () {
    S.authErro = '';
    B.entrarGoogle().catch(function (er) {
      if (er && er.code === 'demo-google') { S.authErro = 'No modo demonstração o Google é simulado: escolha uma pessoa na tela de entrada.'; S.authTela = 'login'; }
      else S.authErro = traduzAuth(er);
      R();
    });
  },
  cadastrar: function () {
    var e = $('#fEmail').value.trim(), s = $('#fSenha').value, c = lerCadastro();
    var err = !e ? 'Informe seu e-mail.' : s.length < 6 ? 'A senha precisa ter pelo menos 6 caracteres.' : validarCadastro(c);
    if (err) { S.authErro = err; R(); return; }
    S.ocupado = true; S.authErro = ''; S._cadastroPend = c; R();
    B.criarConta(e, s)
      .catch(function (er) { S.authErro = traduzAuth(er); S._cadastroPend = null; S.ocupado = false; R(); });
  },
  completar: function () {
    var c = lerCadastro(), err = validarCadastro(c);
    if (err) { S.authErro = err; R(); return; }
    S.ocupado = true; S.authErro = ''; R();
    salvarCadastro(c).catch(function (er) { S.authErro = msgErro(er); }).then(function () { S.ocupado = false; R(); });
  },
  usarCodigo: function () {
    var c = $('#fCodigo').value.trim().toUpperCase();
    if (!c) { S.authErro = 'Digite o código.'; R(); return; }
    B.update('jogadores/' + S.user.uid, { status: 'ativo', codigoAcesso: c }).then(function () { S.authErro = ''; toast('Bem-vindo ao jogo!'); })
      .catch(function () { S.authErro = 'Código não reconhecido.'; R(); });
  },
  redefinir: function () {
    var e = $('#fEmail').value.trim(); if (!e) { S.authErro = 'Informe o e-mail.'; R(); return; }
    B.redefinir(e).then(function () { S.authErro = ''; S.authInfo = 'Se houver conta com esse e-mail, você vai receber um link para criar uma nova senha.'; R(); })
      .catch(function (er) { S.authErro = traduzAuth(er); R(); });
  },
  sair: function () { S.tab = 'inicio'; S.authTela = 'login'; S.authErro = ''; B.sair(); R(); },
  quiz: function () { abrirQuiz(); },
  comecarQuiz: function () { comecarQuiz(); },
  resp: function (v) { responderQuiz(parseInt(v, 10)); },
  fecharQuiz: function () {
    if (QZ && (QZ.fase === 'pergunta' || QZ.fase === 'enviando' || QZ.fase === 'feedback')) {
      abrirConfirma('Sair do quiz?', 'Você pode continuar depois, mas o relógio da pergunta atual não para.', 'Sair', function () { fecharOv(); });
    } else fecharOv();
  },
  irCorrida: function () { QZ = null; abrirCorrida(false); },
  corrida: function () { abrirCorrida(false); },
  treino: function () { abrirCorrida(true); },
  treinoDaqui: function () { CR.treino = true; CR.fase = 'intro'; desenharCorrida(); },
  paraValendo: function () { CR.treino = false; CR.fase = 'intro'; desenharCorrida(); },
  iniciarCorrida: function () { Musica.preparar(); iniciarCorrida(); },
  rankTreino: function (v) { S.rankTreino = v; S.manterScroll = true; R(); },
  verRankingTreino: function () { fecharOv(); S.tab = 'ranking'; S.rankModo = 'treino'; S.rankTreino = 'semana'; R(); },
  pausarCorrida: function () { if (CR && CR.motor && CR.motor.pausaJogo) CR.motor.pausaJogo(true); },
  retomarCorrida: function () { if (CR && CR.motor && CR.motor.pausaJogo) CR.motor.pausaJogo(false); },
  musica: function () {
    var on = Musica.alternar(), b = $('#btMusica');
    if (b) b.innerHTML = on ? '♫' : '<s>♫</s>';
    if (on && CR && CR.motor && CR.motor.estado && CR.motor.estado.fase === 'rodando' && CR.motor.estado.vivo) Musica.tocar();
    toast(on ? 'Música e sons ligados' : 'Música e sons desligados', 1200);
  },
  carro: function (v) { gravarLS('gi_carro', v); if (CR) { CR.carro = v; desenharCorrida(); } },
  visual: function (v) { gravarLS('gi_visual', v); if (CR) { CR.visual = v; desenharCorrida(); } },
  fecharCorrida: function () {
    if (CR && CR.fase === 'jogo' && CR.motor) {
      if (CR.treino) { fecharOv(); return; }
      if (CR.duelo) { abrirConfirma('Encerrar esta corrida do duelo?', 'O tempo até aqui fica registrado e a corrida conta como feita.', 'Encerrar', function () { if (CR && CR.motor) CR.motor.abortar(); }, true); return; }
      abrirConfirma('Encerrar a tentativa?', 'O tempo até aqui fica registrado e a tentativa conta como usada.', 'Encerrar', function () { if (CR && CR.motor) CR.motor.abortar(); }, true);
    } else if (CR && CR.fase === 'salvando') toast('Aguarde, registrando seu tempo…');
    else fecharOv();
  },
  rankModo: function (v) { S.rankModo = v; R(); },
  rankCarro: function (v) { S.rankCarroAberto = S.rankCarroAberto === v ? '' : v; S.manterScroll = true; R(); },
  rankRodada: function (v) { S.rankRodada = v; R(); },
  compartilharRanking: function () { imagemRanking(); },
  compartilharBadge: function (v) { var p = v.split('|'); imagemBadge(p[0], p[1], p[2] ? parseInt(p[2], 10) : null); },
  compartilharPrevia: function () { compartilharPrevia(); },
  vistos: function () { marcarBadgesVistos(); R(); },
  infoBadge: function (v) { var d = BADGES[v], n = meusBadges().filter(function (b) { return b.tipo === v; }).length; abrirModal('<div style="text-align:center"><div style="font-size:56px' + (n ? '' : ';filter:grayscale(1);opacity:.6') + '">' + d.e + '</div><h3>' + d.t + '</h3><p class="mut">' + esc(d.d) + '</p>' + (n ? '<p><b style="color:#7CE0B0">Conquistado' + (n > 1 ? ' ' + n + ' vezes' : '') + ' nesta temporada</b></p>' : '') + (d.como ? '<div class="card" style="text-align:left;margin-top:10px"><div class="tiny" style="opacity:.7;text-transform:uppercase;letter-spacing:.06em">' + (n ? 'Como conquistar de novo' : 'Como conquistar') + '</div><div style="margin-top:4px">' + esc(d.como) + '</div></div>' : '') + '</div><div class="mact"><button class="btn" data-a="fecharModal">Ok</button></div>'); },
  editarPerfil: function () {
    var me = S.me;
    abrirModal('<h3>Editar dados</h3><label class="f">Nome completo</label><input class="inp" id="eNome" value="' + esc(me.nome) + '"><label class="f">Apelido</label><input class="inp" id="eApelido" maxlength="18" value="' + esc(me.apelido) + '">' +
      '<label class="f">Área</label><select class="inp" id="eArea">' + opcoesArea(me.areaId).replace('<option value="__nova">Minha área não está na lista…</option>', '') + (D.areas[me.areaId] && D.areas[me.areaId].status !== 'ativa' ? '<option value="' + esc(me.areaId) + '" selected>' + esc(areaNome(me.areaId)) + '</option>' : '') + '</select>' +
      '<p class="tiny mut">A mudança de área vale para as próximas rodadas.</p><div id="eErr"></div><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="salvarPerfil">Salvar</button></div>');
  },
  salvarPerfil: function () {
    var n = $('#eNome').value.trim(), a = $('#eApelido').value.trim(), ar = $('#eArea').value;
    if (n.split(/\s+/).length < 2 || !a || !ar) { $('#eErr').innerHTML = '<div class="err">Preencha nome completo, apelido e área.</div>'; return; }
    B.update('jogadores/' + S.user.uid, { nome: n, apelido: a.slice(0, 18), areaId: ar }).then(function () { fecharModal(); toast('Dados salvos.'); }).catch(function (e) { $('#eErr').innerHTML = '<div class="err">' + esc(msgErro(e)) + '</div>'; });
  },
  editarCuriosidades: function () {
    var c = S.me.curiosidades || [];
    var h = '<h3>Quem é quem</h3><p class="small mut">Escreva como se completasse a frase "Quem do time…". Ex.: <i>já morou fora do Brasil</i>, <i>toca bateria</i>. Deixe em branco para remover.</p>';
    for (var i = 0; i < 3; i++) h += '<input class="inp" style="margin:6px 0" id="cur' + i + '" maxlength="80" placeholder="Curiosidade ' + (i + 1) + '" value="' + esc(c[i] || '') + '">';
    h += '<p class="tiny mut">Ao preencher, você autoriza que vire pergunta no quiz. Se remover depois, a pergunta sai do banco.</p><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="salvarCuriosidades">Salvar</button></div>';
    abrirModal(h);
  },
  salvarCuriosidades: function () {
    var l = [0, 1, 2].map(function (i) { return $('#cur' + i).value.trim(); }).filter(function (x) { return x; });
    B.update('jogadores/' + S.user.uid, { curiosidades: l }).then(function () { fecharModal(); toast('Curiosidades salvas.'); });
  },
  fecharModal: function () { fecharModal(); },
  confirmar: function () { var f = S._confirma; fecharModal(); if (f) f(); },
  // admin
  admTab: function (v) { S.admTab = v; R(); },
  sugFiltro: function (v) { S.sugFiltro = v; R(); },
  sugStatus: function (v) { var p = v.split('|'); B.update('sugestoes/' + p[0], { status: p[1], atualizadoEm: Date.now() }).catch(function (e) { toast(msgErro(e)); }); },
  sugerir: function () {
    S._sugTipo = S._sugTipo || 'sugestao';
    abrirModal('<h3>Sugestões e problemas</h3><p class="mut small">Conte o que você pensou ou o que aconteceu. Se for um problema, diga em que tela e o que você estava fazendo.</p>' +
      '<div class="row" style="gap:6px;flex-wrap:wrap">' + [['sugestao', '💡 Sugestão'], ['melhoria', '🛠️ Melhoria'], ['problema', '🐞 Problema']].map(function (t) { return '<button class="chip' + (S._sugTipo === t[0] ? ' on' : '') + '" data-a="sugTipo" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<label class="f" for="sugTela">Onde? (opcional)</label><select class="inp" id="sugTela"><option value="">—</option>' + ['Quiz', 'Corrida', 'Treino', 'Placa!', 'Garagem', 'Ranking', 'Perfil', 'Cadastro', 'Outra'].map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>' +
      '<label class="f" for="sugTexto">Sua mensagem</label><textarea class="inp" id="sugTexto" rows="5" maxlength="1000" placeholder="Escreva aqui…"></textarea>' +
      '<div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="sugEnviar">Enviar</button></div>');
  },
  sugTipo: function (v, el) { S._sugTipo = v; Array.prototype.forEach.call(document.querySelectorAll('#modal [data-a="sugTipo"]'), function (b) { b.classList.toggle('on', b === el); }); },
  sugEnviar: function () {
    var tx = ($('#sugTexto').value || '').trim();
    if (tx.length < 3) { toast('Escreva um pouco mais.'); return; }
    var now = Date.now(), uid = S.user.uid;
    var doc = { uid: uid, apelido: (S.me && (S.me.apelido || S.me.nome)) || '', tipo: S._sugTipo || 'sugestao', texto: tx.slice(0, 1000), tela: ($('#sugTela').value || '').slice(0, 30), versao: BUILD, aparelho: (navigator.userAgent || '').slice(0, 200), status: 'nova', criadoEm: now };
    B.set('sugestoes/' + uid + '_' + now, doc).then(function () { fecharModal(); toast('Recebido! Obrigado por ajudar a melhorar o jogo.'); }).catch(function (e) { toast(msgErro(e)); });
  },
  editarCodigo: function () {
    abrirModal('<h3>Código de acesso</h3><p class="small mut">Divulgue pelos canais internos. Quem se cadastrar com ele entra aprovado. Deixe vazio para exigir aprovação manual de todos.</p><input class="inp" id="cCod" autocapitalize="characters" value="' + esc((D.segredo && D.segredo.codigo) || '') + '"><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="salvarCodigo">Salvar</button></div>');
  },
  salvarCodigo: function () {
    var c = $('#cCod').value.trim().toUpperCase().replace(/\s+/g, '');
    B.set('segredos/acesso', { codigo: c, atualizadoEm: Date.now() }).then(function () { fecharModal(); toast(c ? 'Código salvo.' : 'Código removido.'); }).catch(function (e) { toast(msgErro(e)); });
  },
  editarK: function () {
    var t = tempAtiva();
    abrirModal('<h3>Fator k da corrida</h3><p class="small mut">Pontos = 100 × (1 − e^(−tempo/k)). Quanto maior o k, mais difícil chegar perto de 100.</p><input class="inp" id="kVal" type="number" min="10" max="120" value="' + t.k + '"><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="salvarK">Salvar</button></div>');
  },
  salvarK: function () { var k = parseFloat($('#kVal').value); if (!(k >= 10)) return; B.set('temporadas/' + tempAtivaId(), { k: k }, true).then(function () { fecharModal(); }); },
  novaTemporada: function () { abrirModal(formTemporada()); },
  salvarTemporada: function () { salvarTemporada(); },
  gerarRodadas: function () { abrirConfirma('Montar as rodadas?', 'O app vai sortear as perguntas de todas as rodadas da temporada agora. Rodadas futuras podem ser sorteadas de novo depois.', 'Montar', gerarRodadas); },
  verRodada: function (v) { verRodada(v); },
  regerarRodada: function (v) { regerarRodada(v); },
  encerrarTemporada: function () {
    abrirConfirma('Encerrar a temporada?', 'O ranking final fica fechado e ninguém joga mais nesta temporada.', 'Encerrar', function () {
      B.set('temporadas/' + tempAtivaId(), { status: 'encerrada', encerradaEm: Date.now() }, true).then(function () { toast('Temporada encerrada.'); });
    }, true);
  },
  pergFiltro: function (v) { S.pergFiltro = v; R(); },
  novaPergunta: function () { S._qeqNovo = null; abrirModal(formPergunta(null)); },
  editarPergunta: function (v) { abrirModal(formPergunta(v)); },
  salvarPergunta: function (v) { salvarPergunta(v || null); },
  excluirPergunta: function (v) { abrirConfirma('Excluir esta pergunta?', 'Ela sai do banco. Rodadas já montadas mantêm a cópia delas.', 'Excluir', function () { B.del('perguntas/' + v).then(function () { toast('Pergunta excluída.'); }); }, true); },
  excluirPerguntaDireto: function (v) { B.del('perguntas/' + v).then(function () { toast('Pergunta excluída.'); }); },
  importarBanco: function () { importarBanco(); },
  pessoasFiltro: function (v) { S.pessoasFiltro = v; R(); },
  statusPessoa: function (v) { var p = v.split('|'); B.update('jogadores/' + p[0], { status: p[1] }).then(function () { toast(p[1] === 'ativo' ? 'Acesso liberado.' : 'Acesso bloqueado.'); }).catch(function (e) { toast(msgErro(e)); }); },
  papelPessoa: function (v) { var j = D.jogadores[v]; B.update('jogadores/' + v, { papel: j.papel === 'adm' ? 'jogador' : 'adm' }).catch(function (e) { toast(msgErro(e)); }); },
  novaArea: function () { abrirModal('<h3>Nova área</h3><input class="inp" id="aNome" maxlength="40" placeholder="Nome da área"><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="salvarArea">Salvar</button></div>'); },
  salvarArea: function (v) {
    var n = $('#aNome').value.trim(); if (n.length < 2) return;
    var id = v || slug(n);
    B.set('areas/' + id, v ? { nome: n } : { nome: n, status: 'ativa', criadaEm: Date.now() }, !!v).then(function () { fecharModal(); });
  },
  aprovarArea: function (v) { B.set('areas/' + v, { status: 'ativa' }, true); },
  renomearArea: function (v) { abrirModal('<h3>Renomear área</h3><input class="inp" id="aNome" maxlength="40" value="' + esc(D.areas[v].nome) + '"><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="salvarArea" data-v="' + v + '">Salvar</button></div>'); },
  excluirArea: function (v) { abrirConfirma('Excluir a área ' + D.areas[v].nome + '?', 'Nenhuma pessoa está nela.', 'Excluir', function () { B.del('areas/' + v); }, true); },
  admRodadaCorrida: function (v) { S.admRodadaCorrida = v; R(); },
  recarregarCorridas: function () { D.admCorridas = null; R(); },
  anular: function (v) {
    var p = v.split('|');
    B.chamar('anularTentativa', { rodadaId: p[0], uid: p[1], n: parseInt(p[2], 10), anular: p[3] === '1' }).then(function () { toast(p[3] === '1' ? 'Tentativa anulada.' : 'Tentativa restaurada.'); D.admCorridas = null; R(); })
      .catch(function (e) { toast(msgErro(e)); });
  },
  gerarQeq: function (v) { gerarQeq(v); }
};
Object.keys(A_PLACA).forEach(function (k) { A[k] = A_PLACA[k]; });
Object.keys(A_GAR).forEach(function (k) { A[k] = A_GAR[k]; });
Object.keys(A_DUELO).forEach(function (k) { A[k] = A_DUELO[k]; });
// foto obrigatória para jogar: o objetivo é interação, todo mundo precisa ser reconhecível no ranking e nas mesas
function DEMO_SEM_FOTO() { return typeof DEMO !== 'undefined' && DEMO && !S.testeFoto; }
var ACOES_JOGO = { quiz: 1, corrida: 1, treino: 1, irCorrida: 1, paraValendo: 1, treinoDaqui: 1, comecarQuiz: 1, iniciarCorrida: 1, placaCriar: 1, placaCriarN: 1, placaCriarRobo: 1, placaEntrar: 1, duelDesafiar: 1, duelAceitar: 1, duelCorrer: 1 };
function pedirFoto() {
  abrirModal('<div id="modalFoto"><h3>Coloque uma foto para jogar 📷</h3><p class="mut small">O Game Aura é para o time se conhecer: sua foto aparece no ranking, nas mesas do Placa! e nas conquistas. Escolha uma foto em que dê para ver seu rosto.</p>' +
    '<div class="mact"><button class="btn gh" data-a="fecharModal">Agora não</button><label class="btn lar" style="margin:0">Escolher foto<input type="file" accept="image/*" data-c="foto" style="display:none"></label></div></div>');
}
document.addEventListener('click', function (e) {
  var el = e.target.closest && e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  if (ACOES_JOGO[el.getAttribute('data-a')] && S.me && !S.me.foto && !DEMO_SEM_FOTO()) { e.preventDefault(); pedirFoto(); return; }
  var f = A[el.getAttribute('data-a')];
  if (f) { e.preventDefault(); f(el.getAttribute('data-v'), el, e); }
});
document.addEventListener('change', function (e) {
  var c = e.target.getAttribute && e.target.getAttribute('data-c');
  if (!c) return;
  if (c === 'areaNova') { var b = $('#boxAreaNova'); if (b) b.style.display = e.target.value === '__nova' ? 'block' : 'none'; }
  if (c === 'foto') processarFoto(e.target);
  if (c === 'importarPlanilha') importarPlanilha(e.target);
  if (c === 'rankTemp') { S.rankTemp = e.target.value; S.rankRodada = ''; e.target.blur(); R(); }
});
document.addEventListener('input', function (e) {
  var i = e.target.getAttribute && e.target.getAttribute('data-i');
  if (i === 'pergBusca') {
    S.pergBusca = e.target.value;
    clearTimeout(S._tb);
    S._tb = setTimeout(function () {
      var pos = e.target.selectionStart; render(true);
      var n = document.querySelector('[data-i=pergBusca]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { } }
    }, 250);
  }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'fSenha' && S.authTela === 'login') A.entrar();
});
// atualiza contagens regressivas
setInterval(function () { if (!$('#ov').className && !$('#modal').className) render(); }, 60000);

/* ================== INÍCIO ================== */
function iniciar() {
  if (!DEMO && !FB_OK) { R(); return; }
  try { B = DEMO ? criarDemo() : criarFirebase(); } catch (e) { $('#app').innerHTML = '<div class="wrap"><div class="err">Falha ao iniciar: ' + esc(e.message) + '</div></div>'; return; }
  assinarBase();
  // após criar conta por e-mail, o cadastro é salvo assim que o login é reconhecido
  B.onAuth(function (u) {
    if (u && S._cadastroPend) {
      var c = S._cadastroPend; S._cadastroPend = null;
      setTimeout(function () {
        salvarCadastro(c).catch(function (er) { S.authErro = msgErro(er); }).then(function () { S.ocupado = false; R(); });
      }, 50);
    }
  });
  R();
}
iniciar();
