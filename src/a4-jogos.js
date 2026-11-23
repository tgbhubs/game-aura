/* ================== OVERLAY ================== */
function abrirOv(html) { var o = $('#ov'); o.innerHTML = html; o.className = 'on'; document.body.style.overflow = 'hidden'; }
function fecharOv() { var o = $('#ov'); o.className = ''; o.innerHTML = ''; document.body.style.overflow = ''; QZ = null; if (CR && CR.motor) CR.motor.parar(); CR = null; R(); }

/* ================== QUIZ ================== */
var QZ = null;
var LETRAS = ['A', 'B', 'C', 'D'];
function abrirQuiz() {
  var r = rodadaAtual(); if (!r) { toast('Nenhuma rodada aberta agora.'); return; }
  var m = minhaRodada(r.id);
  QZ = { rid: r.id, n: r.n, fase: m.quiz ? 'carregando' : 'intro' };
  desenharQuiz();
  if (m.quiz) comecarQuiz();
}
function desenharQuiz() {
  if (!QZ) return;
  var h = '<div class="ovw"><div class="ovtop"><div class="row" style="align-items:center">' + wm(22) + '<span class="pill-game">QUIZ</span></div><button class="xbtn" data-a="fecharQuiz">✕</button></div>';
  if (QZ.fase === 'intro') {
    h += '<div style="flex:1;display:flex;flex-direction:column;justify-content:center"><div class="big">🧠</div><h2 style="font-size:28px;font-weight:900;margin:12px 0 6px">Quiz da rodada ' + QZ.n + '</h2>' +
      '<div class="ovcard"><ul style="margin:0;padding-left:18px;line-height:1.7"><li>10 perguntas, 4 alternativas</li><li><b>20 segundos</b> por pergunta</li><li>1 tentativa por rodada</li><li>10 pontos por acerto</li></ul></div>' +
      '<p class="small" style="opacity:.75">Se sair no meio, você continua depois, mas o relógio da pergunta não para.</p></div>' +
      '<button class="btn lar full" data-a="comecarQuiz">Começar agora</button>';
  } else if (QZ.fase === 'carregando') {
    h += '<div class="loading" style="color:#fff"><div class="spin"></div><div>Preparando…</div></div>';
  } else if (QZ.fase === 'erro') {
    h += '<div style="flex:1"><div class="ovcard"><h3>Ops</h3><p>' + esc(QZ.erro) + '</p></div></div><button class="btn lar full" data-a="comecarQuiz">Tentar de novo</button><button class="btn gh full" style="margin-top:10px" data-a="fecharQuiz">Fechar</button>';
  } else if (QZ.fase === 'pergunta' || QZ.fase === 'enviando' || QZ.fase === 'feedback') {
    var p = QZ.p, fb = QZ.fb;
    h += '<div class="row between"><span class="qtema">' + esc(p.tema) + '</span><span class="qtime" id="qTempo">20</span></div>' +
      '<div class="row between small" style="opacity:.75;margin-top:2px"><span>Pergunta ' + (p.idx + 1) + ' de ' + p.total + '</span><span>' + QZ.resumo.acertos + ' acerto' + (QZ.resumo.acertos === 1 ? '' : 's') + '</span></div>' +
      '<div class="qbar"><i id="qBar"></i></div><div class="qtxt">' + esc(p.texto) + '</div>';
    p.alts.forEach(function (a, i) {
      var cls = 'alt';
      if (QZ.fase === 'feedback') { if (i === fb.correta) cls += ' cer'; else if (i === QZ.escolha) cls += ' err'; }
      else if (i === QZ.escolha) cls += ' esc';
      h += '<button class="' + cls + '" data-a="resp" data-v="' + i + '"' + (QZ.fase !== 'pergunta' ? ' disabled' : '') + '><span class="l">' + LETRAS[i] + '</span><span>' + esc(a) + '</span></button>';
    });
    if (QZ.fase === 'feedback') h += '<div class="fb" style="color:' + (fb.certa ? '#7CE0B0' : '#FF9C9C') + '">' + (fb.certa ? 'Acertou! +10' : (fb.expirou || QZ.escolha < 0 ? 'Tempo esgotado' : 'Não foi dessa vez')) + '</div>';
  } else if (QZ.fase === 'fim') {
    var a = QZ.resumo.acertos;
    h += '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center"><div style="font-size:64px">' + (a === 10 ? '🧠' : a >= 7 ? '🔥' : a >= 4 ? '👏' : '💪') + '</div>' +
      '<div class="big" style="margin-top:8px">' + a + '/10</div><div style="font-size:18px;font-weight:700;margin-top:4px">' + (a * 10) + ' pontos no quiz</div>' +
      '<div class="small" style="opacity:.75;margin-top:6px">Tempo nas acertadas: ' + fmtSeg(QZ.resumo.tempoMs / 1000) + '</div>' +
      (a === 10 ? '<div class="ovcard" style="margin-top:18px"><b>Conquista: Gabaritou!</b><br><span class="mut small">Compartilhe com o time.</span><br><button class="btn wh sm" style="margin-top:10px" data-a="compartilharBadge" data-v="gabaritou|' + QZ.rid + '|' + QZ.n + '">📸 Compartilhar</button></div>' : '') +
      '</div>';
    var m = minhaRodada(QZ.rid);
    if (m.restantes > 0) h += '<button class="btn lar full" data-a="irCorrida">Agora a corrida 🏎️</button>';
    h += '<button class="btn gh full" style="margin-top:10px" data-a="fecharQuiz">Fechar</button>';
  }
  h += '</div>';
  abrirOv(h);
  if (QZ.fase === 'pergunta') animarTimer();
}
function comecarQuiz() {
  QZ.fase = 'carregando'; desenharQuiz();
  B.chamar('iniciarQuiz', { rodadaId: QZ.rid }).then(aplicarQuiz).catch(function (e) { if (!QZ) return; QZ.fase = 'erro'; QZ.erro = msgErro(e); desenharQuiz(); });
}
function aplicarQuiz(resp) {
  if (!QZ) return;
  QZ.resumo = resp.resumo;
  if (resp.fim) { QZ.fase = 'fim'; desenharQuiz(); return; }
  QZ.p = resp.pergunta; QZ.escolha = null; QZ.fb = null; QZ.fase = 'pergunta';
  QZ.t0 = performance.now(); QZ.lim = resp.pergunta.restanteMs || resp.pergunta.limiteMs;
  desenharQuiz();
}
function animarTimer() {
  var id = QZ.p.idx;
  function passo() {
    if (!QZ || QZ.fase !== 'pergunta' || QZ.p.idx !== id) return;
    var rest = Math.max(0, QZ.lim - (performance.now() - QZ.t0));
    var b = $('#qBar'), t = $('#qTempo');
    if (b) { b.style.width = (rest / QZ.p.limiteMs * 100) + '%'; }
    if (t) { t.textContent = Math.ceil(rest / 1000) + ' s'; t.style.color = rest < 5000 ? '#FF9C9C' : '#fff'; }
    if (rest <= 0) { responderQuiz(-1); return; }
    requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}
function responderQuiz(alt) {
  if (!QZ || QZ.fase !== 'pergunta') return;
  QZ.escolha = alt; QZ.fase = 'enviando'; desenharQuiz();
  B.chamar('responderQuiz', { rodadaId: QZ.rid, idx: QZ.p.idx, alt: alt }).then(function (r) {
    if (!QZ) return;
    QZ.fb = r; QZ.resumo = r.resumo; QZ.fase = 'feedback'; desenharQuiz();
    setTimeout(function () { if (!QZ) return; aplicarQuiz(r); }, 1600);
  }).catch(function (e) { if (!QZ) return; QZ.fase = 'erro'; QZ.erro = msgErro(e) + ' Toque em "Tentar de novo" para continuar de onde parou.'; desenharQuiz(); });
}

// atributos do carro (só valem no treino)
// mostra e esconde a tela de pausa (chamado pelo motor)
function aoPausa(p) { var el = $('#pausa'); if (el) el.hidden = !p; }
function barrasAtr(a, vale) {
  function barra(rot, v, txt) { return '<div class="atr"><span>' + rot + '</span><i><b style="width:' + Math.round(Math.max(8, Math.min(100, v)) ) + '%"></b></i><em>' + txt + '</em></div>'; }
  return '<div class="atrs">' + barra('Agilidade', 50 * a.faixa, Math.round(a.faixa * 100) + '%') + barra('Pneus', 50 / a.pneu, a.pneu < 1 ? 'duram mais' : a.pneu > 1 ? 'gastam mais' : 'normais') +
    barra('Seguro', a.seguro ? 100 : 8, a.seguro ? 'larga com 1' : 'sem') + barra(a.eletrico ? 'Bateria' : 'Tanque', a.eletrico ? 68 : 100, a.eletrico ? '🔋 elétrico' : '⛽ combustão') + '</div><div class="tiny" style="opacity:.7;margin-top:6px">' + (vale ? 'No treino, os atributos do carro valem.' : 'Na rodada todos os carros andam igual; os atributos valem só no treino.') + '</div>';
}
/* ================== CORRIDA ================== */
var CR = null;
function abrirCorrida(treino) {
  var r = rodadaAtual();
  if (!treino && !r) { toast('Nenhuma rodada aberta agora.'); return; }
  CR = { treino: !!treino, rid: r ? r.id : null, n: r ? r.n : null, fase: 'intro' };
  desenharCorrida();
}
function desenharCorrida() {
  if (!CR) return;
  var k = (tempAtiva() || {}).k || 40;
  var h = '<div class="ovw" style="padding-bottom:12px"><div class="ovtop"><div class="row" style="align-items:center">' + wm(22) + '<span class="pill-game">' + (CR.duelo ? 'DUELO' : CR.treino ? 'TREINO' : 'CORRIDA') + '</span></div><div class="row" style="gap:8px"><button class="xbtn" id="btMusica" data-a="musica" aria-label="Ligar ou desligar música e sons" title="Música e sons">' + (Musica.ligada() ? '♫' : '<s>♫</s>') + '</button><button class="xbtn" data-a="fecharCorrida">✕</button></div></div>';
  var m = CR.rid ? minhaRodada(CR.rid) : null;
  if (CR.fase === 'intro') {
    h += '<div style="flex:1;display:flex;flex-direction:column;justify-content:center"><div class="big">' + (CR.duelo ? '⚔️' : '🏎️') + '</div><h2 style="font-size:28px;font-weight:900;margin:12px 0 6px">' + (CR.duelo ? 'Duelo com ' + esc(CR.duelo.adv) + ' · corrida ' + (CR.duelo.n + 1) + ' de 3' : CR.treino ? 'Treino livre' : 'Corrida da rodada ' + CR.n) + '</h2>' +
      '<div class="ovcard"><ul style="margin:0;padding-left:18px;line-height:1.7"><li>Toque na <b>esquerda</b> ou <b>direita</b> da pista para trocar de faixa (no computador, ← →)</li><li>Pista com <b>5 faixas</b>: desvie de cones e carros parados. <b>Buraco</b> não encerra, mas tira 35% do pneu</li><li>Pegue o <b>Seguro Porto</b> (escudo azul): se bater, ele te salva e a corrida continua (acumula até 2)</li><li>Fique de olho no <b>combustível</b> (⛽) e pare no <b>posto</b> verde para abastecer; carro elétrico (🔋) dura menos e recarrega mais devagar</li><li>Toque em <b>❚❚</b> para pausar</li><li>Do nível 10 em diante aparece o <b>Poder Aura</b> (o "a" do logo): 5 segundos invencível</li><li>No <b>pedágio</b>, as 3 faixas do meio têm cancela: com <b>tag</b> você passa direto (cada tag vale 1 mensalidade, acumula até 3); sem tag, o carro para e perde 5 s. As 2 faixas laterais são <b>free flow</b>: com tag passa e paga; sem tag passa sem parar, mas leva <b>multa</b> (paga em créditos na Garagem)</li><li>Os <b>pneus gastam</b> com o tempo (veja o medidor). Entre no <b>CAP Porto</b>, que aparece na faixa da direita ou da esquerda, para trocar: custa 3 s e dá 15 s de revisão (passa por buracos). Se o pneu acabar, fura e a corrida termina</li><li>A velocidade sobe a cada 10 s e, depois de 2 min, vem a <b>reta final</b>: cada vez mais difícil. Ganha quem for mais longe</li></ul></div>';
    if (CR.duelo) h += '<p class="small" style="opacity:.8">A pista é a mesma para os dois. <b>Uma tentativa só</b>: sair no meio conta o tempo até ali. Valem os atributos do carro que você escolher.</p>';
    else if (!CR.treino) h += '<div class="ovcard"><div class="row between"><span>Tentativas restantes</span><b>' + m.restantes + ' de 3</b></div>' + (m.melhor ? '<div class="row between" style="margin-top:6px"><span>Seu melhor tempo</span><b>' + fmtSeg(m.melhor) + ' · ' + Logica.curva(m.melhor, k) + ' pts</b></div>' : '') + '</div><p class="small" style="opacity:.75">Ao começar, a tentativa conta. Sair do app no meio encerra a tentativa.</p>';
    else h += '<p class="small" style="opacity:.75">O treino usa pistas aleatórias e não vale ponto no ranking da rodada, mas rende <b>créditos</b> para a Garagem (40% dos pontos, e mais 1 a cada 15 s depois dos 3 minutos) e o seu melhor tempo entra no <b>ranking de treinos</b>.</p>';
    var vis = CR.visual || visualPreferido();
    h += '<div class="ovcard" style="padding:12px 14px"><div class="small" style="opacity:.8;margin-bottom:8px">Visual da pista (não muda a pontuação)</div><div class="seg" style="margin:0;background:rgba(255,255,255,.08);display:grid;grid-template-columns:1fr 1fr">' +
      [['3dreal', '3D realista'], ['realista', 'De cima realista']].map(function (v) { return '<button class="' + (vis === v[0] ? 'on' : '') + '" style="' + (vis === v[0] ? '' : 'color:#F4F1EA') + '" data-a="visual" data-v="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div></div>';
    var car = CR.carro || carroPreferido(), sel = carroSel(car), lista = meusCarros(); imgCima(sel.cat);
    h += '<div class="ovcard" style="padding:12px 14px"><div class="row between" style="margin-bottom:8px"><span class="small" style="opacity:.8">Seu carro</span><button class="lnk tiny" style="color:#9FD3FF" data-a="irGaragem">Comprar carros na Garagem →</button></div><div class="garagem rolar">' +
      lista.map(function (x) { var c = Garagem.CATALOGO[x.cat], f = window.FOTOS_CARROS && FOTOS_CARROS[x.cat]; return '<button class="gcar' + (car === x.key ? ' on' : '') + '" data-a="carro" data-v="' + esc(x.key) + '" aria-pressed="' + (car === x.key) + '">' + (f ? '<img src="' + f.foto + '" alt="">' : '') + '<b>' + esc(c.nome) + '</b><span>' + (x.origem === 'base' ? 'da casa' : x.origem === 'retomado' ? 'Retomado ' + (Garagem.ORIGENS[x.retomadoDe] || 'Porto') : x.origem === 'usado' ? 'usado' : '0 km') + '</span></button>'; }).join('') +
      '</div>' + barrasAtr(sel.atr, CR.treino || CR.duelo) + '</div>';
    h += '</div>';
    if (CR.duelo) h += '<button class="btn lar full" data-a="iniciarCorrida">Correr valendo</button>';
    else if (CR.treino) h += '<button class="btn lar full" data-a="iniciarCorrida">Começar treino</button>';
    else if (m.restantes > 0) h += '<button class="btn lar full" data-a="iniciarCorrida">Usar a tentativa ' + (m.usadas + 1) + ' de 3</button><button class="btn gh full" style="margin-top:10px" data-a="treinoDaqui">Treinar antes</button>';
    else h += '<button class="btn gh full" data-a="treinoDaqui">Treinar (não vale ponto)</button>';
  } else if (CR.fase === 'carregando') {
    h += '<div class="loading" style="color:#fff"><div class="spin"></div><div>Preparando a pista…</div></div>';
  } else if (CR.fase === 'erro') {
    h += '<div style="flex:1"><div class="ovcard"><h3>Ops</h3><p>' + esc(CR.erro) + '</p></div></div><button class="btn gh full" data-a="fecharCorrida">Fechar</button>';
  } else if (CR.fase === 'jogo') {
    h += '<div id="cvBox" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center"><div id="cvWrap" style="position:relative;border-radius:14px;overflow:hidden;touch-action:none"><div id="cv3d" style="position:absolute;inset:0"></div><canvas id="cv" style="position:relative;display:block;background:transparent"></canvas><button class="btpausa" data-a="pausarCorrida" onpointerdown="event.stopPropagation()" aria-label="Pausar">❚❚</button><div id="pausa" class="pausa" hidden onpointerdown="event.stopPropagation()"><div class="pausa-box"><div style="font-size:42px">⏸</div><h3>Pausado</h3><p class="small" style="opacity:.8">O tempo da corrida está parado.</p><button class="btn lar full" data-a="retomarCorrida">Continuar</button><button class="btn wh full" style="margin-top:8px" data-a="fecharCorrida">Sair da corrida</button></div></div></div><div class="hint">Toque à esquerda ou à direita · setas ← →</div></div>';
  } else if (CR.fase === 'salvando') {
    h += '<div class="loading" style="color:#fff"><div class="spin"></div><div>Registrando seu tempo…</div></div>';
  } else if (CR.fase === 'fim') {
    var t = CR.tempo, pts = Logica.curva(t, k);
    h += '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;text-align:center"><div style="font-size:60px">' + (t >= 120 ? '🏁' : t >= 60 ? '🔥' : '💥') + '</div>' +
      '<div class="big" style="margin-top:6px">' + fmtSeg(t) + '</div><div style="font-size:17px;font-weight:700;margin-top:4px">' + (CR.duelo ? 'corrida ' + (CR.duelo.n + 1) + ' de 3 do duelo' : CR.treino ? 'valeria ' + pts + ' pontos na rodada' : pts + ' pontos nesta tentativa') + '</div>';
    if (!CR.treino && CR.res) {
      h += '<div class="ovcard" style="margin-top:16px;text-align:left"><div class="row between"><span>Melhor tempo da rodada</span><b>' + fmtSeg(CR.res.melhor) + '</b></div><div class="row between" style="margin-top:6px"><span>Pontos que valem</span><b>' + Logica.curva(CR.res.melhor, k) + '</b></div><div class="row between" style="margin-top:6px"><span>Tentativas restantes</span><b>' + CR.res.restantes + '</b></div></div>';
      if (t >= 120) h += '<div class="ovcard"><b>Conquista: Piloto de Ouro!</b><br><button class="btn wh sm" style="margin-top:10px" data-a="compartilharBadge" data-v="piloto|' + CR.rid + '|' + CR.n + '">📸 Compartilhar</button></div>';
    }
    if (CR.treino && CR.resTreino) {
      var rt = CR.resTreino;
      h += '<div class="ovcard" style="margin-top:16px;text-align:left">' + (rt.creditos ? '<div style="font-weight:800;color:#7CE0B0;margin-bottom:6px">+' + rt.creditos + ' créditos para a Garagem</div>' : '') + (rt.recorde ? '<b style="color:#FFB27A">Novo recorde pessoal no treino!</b>' : rt.recordeSemana ? '<b style="color:#FFB27A">Seu melhor treino da semana!</b>' : '') +
        '<div class="row between" style="margin-top:6px"><span>Seu melhor treino da semana</span><b>' + fmtSeg(rt.melhorSemana) + '</b></div><div class="row between" style="margin-top:6px"><span>Seu recorde geral</span><b>' + fmtSeg(rt.melhor) + '</b></div>' +
        (rt.valido ? '' : '<div class="tiny" style="opacity:.7;margin-top:6px">Esse tempo não entrou no ranking (não bateu com o tempo real da partida).</div>') +
        '<button class="btn wh sm" style="margin-top:10px" data-a="verRankingTreino">Ver ranking de treinos</button></div>';
    }
    if (CR.duelo && CR.resDuelo) h += resultadoDuelo();
    var resX = CR.duelo ? CR.resDuelo : CR.treino ? CR.resTreino : CR.res;
    var nm = resX ? (resX.multas || 0) : 0;
    if (nm) h += '<div class="ovcard" style="margin-top:10px;text-align:left"><b style="color:#FFD07A">' + (nm === 1 ? '1 multa' : nm + ' multas') + ' por evasão de pedágio</b><div class="tiny" style="opacity:.8;margin-top:4px">Passou no free flow sem TAG. Pague na Garagem até ' + Garagem.MULTA.prazoDias + ' dias com ' + Math.round(Garagem.MULTA.desconto * 100) + '% de desconto. O tempo e o ranking não mudam.</div><button class="btn wh sm" style="margin-top:10px" data-a="verMultas">Ver multas</button></div>';
    h += '</div>';
    if (CR.duelo) h += '<button class="btn lar full" data-a="duelVerDepois">Ver o duelo</button>';
    else if (CR.treino) h += '<button class="btn lar full" data-a="iniciarCorrida">Treinar de novo</button>' + (CR.rid && m && m.restantes > 0 ? '<button class="btn wh full" style="margin-top:10px" data-a="paraValendo">Correr valendo</button>' : '');
    else if (CR.res && CR.res.restantes > 0) h += '<button class="btn lar full" data-a="iniciarCorrida">Usar a tentativa ' + (4 - CR.res.restantes) + ' de 3</button>';
    h += '<button class="btn gh full" style="margin-top:10px" data-a="fecharCorrida">Fechar</button>';
  }
  h += '</div>';
  abrirOv(h);
  if (CR.fase === 'jogo') montarMotor();
}
function iniciarCorrida() {
  if (CR.duelo) {
    CR.fase = 'carregando'; desenharCorrida();
    B.chamar('duelo', { op: 'iniciar', id: CR.duelo.id, n: CR.duelo.n, carro: CR.carro || carroPreferido() }).then(function (r) {
      if (!CR) return; CR.seed = r.seed; CR.fase = 'jogo'; desenharCorrida();
    }).catch(function (e) { if (!CR) return; CR.fase = 'erro'; CR.erro = msgErro(e); desenharCorrida(); });
    return;
  }
  if (CR.treino) {
    // o servidor marca o início para o tempo poder entrar no ranking de treinos; sem conexão, treina mesmo assim
    CR.fase = 'carregando'; CR.resTreino = null; desenharCorrida();
    B.chamar('treino', { op: 'iniciar', carro: CR.carro || carroPreferido() }).then(function (r) {
      if (!CR) return; CR.seed = r.seed; CR.semRecorde = false; CR.fase = 'jogo'; desenharCorrida();
    }).catch(function () { if (!CR) return; CR.seed = Math.floor(Math.random() * 4e9); CR.semRecorde = true; CR.fase = 'jogo'; desenharCorrida(); });
    return;
  }
  CR.fase = 'carregando'; desenharCorrida();
  B.chamar('iniciarCorrida', { rodadaId: CR.rid }).then(function (r) {
    if (!CR) return;
    CR.tn = r.n; CR.seed = r.seed; CR.fase = 'jogo'; desenharCorrida();
  }).catch(function (e) { if (!CR) return; CR.fase = 'erro'; CR.erro = msgErro(e); desenharCorrida(); });
}
// resumo do duelo depois de uma corrida: placar e, se acabou, quem levou as apostas
function resultadoDuelo() {
  var r = CR.resDuelo, d = D.duelos && D.duelos[CR.duelo.id], h = '<div class="ovcard" style="margin-top:16px;text-align:left">';
  if (!r || !r.placar) return h + '</div>';
  var lado = d ? Garagem.lado(d, S.user.uid) : '', o = lado ? Garagem.outro(lado) : '';
  var meu = lado ? r.placar.placar[lado] : 0, dele = lado ? r.placar.placar[o] : 0;
  h += '<div class="row between"><span>Placar do duelo</span><b>Você ' + meu + ' × ' + dele + ' ' + esc(CR.duelo.adv) + '</b></div>';
  if (r.status === 'fim') {
    if (!r.vencedor) h += '<div style="margin-top:8px;font-weight:800">Empate! As apostas voltaram.</div>';
    else if (r.vencedor === S.user.uid) h += '<div style="margin-top:8px;font-weight:800;color:#7CE0B0">🏆 Você venceu o duelo e levou as apostas!</div>';
    else h += '<div style="margin-top:8px;font-weight:800;color:#FFB2A0">' + esc(CR.duelo.adv) + ' venceu o duelo.</div>';
  } else {
    var ele = d && d.corridas[o][CR.duelo.n];
    h += '<div class="tiny" style="opacity:.8;margin-top:6px">' + (ele && ele.t != null ? esc(CR.duelo.adv) + ' fez ' + fmtSeg(ele.t) + ' nesta pista.' : esc(CR.duelo.adv) + ' ainda não correu esta pista.') + '</div>';
  }
  if (r.valido === false) h += '<div class="tiny" style="opacity:.7;margin-top:6px">O tempo foi ajustado: não bateu com o tempo real da partida.</div>';
  return h + '</div>';
}
function fimCorrida(t, info) {
  if (!CR) return;
  CR.tempo = t; CR.motor = null; CR.multas = (info && info.multas) || 0;
  var carroUsado = CR.carro || carroPreferido();
  if (CR.duelo) {
    CR.fase = 'salvando'; desenharCorrida();
    var tentarD = function (n) {
      B.chamar('duelo', { op: 'finalizar', id: CR.duelo.id, n: CR.duelo.n, tempo: t, multas: CR.multas }).then(function (r) { if (!CR) return; CR.resDuelo = r; CR.tempo = r.tempo; CR.fase = 'fim'; desenharCorrida(); })
        .catch(function (e) { if (!CR) return; if (n < 2) { setTimeout(function () { tentarD(n + 1); }, 1200); return; } CR.fase = 'erro'; CR.erro = 'Não consegui registrar o tempo (' + msgErro(e) + '). Verifique a conexão.'; desenharCorrida(); });
    };
    tentarD(0);
    return;
  }
  if (CR.treino) {
    if (CR.semRecorde) { CR.fase = 'fim'; desenharCorrida(); return; }
    CR.fase = 'salvando'; desenharCorrida();
    B.chamar('treino', { op: 'finalizar', tempo: t, multas: CR.multas }).then(function (r) { if (!CR) return; CR.resTreino = r; CR.tempo = r.tempo; CR.fase = 'fim'; desenharCorrida(); })
      .catch(function () { if (!CR) return; CR.fase = 'fim'; desenharCorrida(); });
    return;
  }
  CR.fase = 'salvando'; desenharCorrida();
  var tentar = function (n) {
    B.chamar('finalizarCorrida', { rodadaId: CR.rid, n: CR.tn, tempo: t, multas: CR.multas, carro: carroUsado }).then(function (r) {
      if (!CR) return; CR.res = r; CR.tempo = r.tempo; CR.fase = 'fim'; desenharCorrida();
    }).catch(function (e) {
      if (!CR) return;
      if (n < 2) { setTimeout(function () { tentar(n + 1); }, 1200); return; }
      CR.fase = 'erro'; CR.erro = 'Não consegui registrar o tempo (' + msgErro(e) + '). Verifique a conexão.'; desenharCorrida();
    });
  };
  tentar(0);
}
