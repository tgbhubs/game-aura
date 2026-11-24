/* ================== TRILHA DA CORRIDA ==================
   Música original no estilo dos jogos de corrida 8/16 bits (chiptune), gerada na hora com Web Audio:
   sem arquivo de áudio. Lá menor, ~150 BPM, duas partes (A e B) em loop; acelera um pouco a cada nível. */
var Musica = (function () {
  var ctx = null, master = null, sfx = null, ruido = null, timer = null, tocando = false;
  var passo16 = 0, proxT = 0, tempoBase = 150, fator = 1;
  function ligada() { return lerLS('gi_musica', '1') !== '0'; }
  function preparar() {
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
        master = ctx.createGain(); master.gain.value = 0.34; master.connect(comp); comp.connect(ctx.destination);
        sfx = ctx.createGain(); sfx.gain.value = 0.5; sfx.connect(comp);
        var n = ctx.sampleRate * 0.5, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        ruido = buf;
      }
      // iPhone: o contexto pode ficar 'suspended' ou 'interrupted' (ligação, notificação, app em segundo plano)
      if (ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () { });
    } catch (e) { ctx = null; }
  }
  // ---------- desbloqueio do som no iPhone ----------
  // 1) pede ao Safari para tratar como reprodução de mídia (toca mesmo com a chave do silencioso, iOS 17+);
  // 2) a cada toque, retoma o contexto e toca um áudio mudo em loop, que mantém a sessão de áudio ativa em iPhones mais antigos.
  var mudo = null;
  function wavMudo() {
    var n = 4410, b = new Uint8Array(44 + n * 2), v = new DataView(b.buffer);
    function str(o, t) { for (var i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); }
    str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
    var bin = ''; for (var k = 0; k < b.length; k++) bin += String.fromCharCode(b[k]); return 'data:audio/wav;base64,' + btoa(bin);
  }
  function desbloquear() {
    try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { }
    if (!ligada()) return;
    try {
      if (!mudo) { mudo = document.createElement('audio'); mudo.src = wavMudo(); mudo.loop = true; mudo.setAttribute('playsinline', ''); mudo.volume = 0.01; }
      if (mudo.paused) { var pr = mudo.play(); if (pr && pr.catch) pr.catch(function () { }); }
    } catch (e) { }
    if (ctx) {
      if (ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () { });
      try { var src = ctx.createBufferSource(); src.buffer = ctx.createBuffer(1, 1, 22050); src.connect(ctx.destination); src.start(0); } catch (e) { }
    }
  }
  ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) { document.addEventListener(ev, desbloquear, true); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && ctx && ctx.state !== 'running' && ctx.resume) ctx.resume().catch(function () { }); });
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function env(g, t, a, v, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function osc(tipo, m, t, dur, vol, destino, detune) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.value = hz(m); if (detune) o.detune.value = detune;
    env(g, t, 0.006, vol, dur); o.connect(g); g.connect(destino || master); o.start(t); o.stop(t + dur + 0.02);
    return o;
  }
  // ---------- instrumentos ----------
  function lead(m, t, dur) {
    var o = osc('square', m, t, dur, 0.16), o2 = osc('sawtooth', m, t, dur, 0.05, null, -9);
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(6, t + Math.min(dur, 0.25));
    lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune); lfo.start(t); lfo.stop(t + dur + 0.02);
  }
  var filtroBaixo = null;
  function baixo(m, t, dur) {
    if (!filtroBaixo) { filtroBaixo = ctx.createBiquadFilter(); filtroBaixo.type = 'lowpass'; filtroBaixo.frequency.value = 950; filtroBaixo.Q.value = 6; filtroBaixo.connect(master); }
    osc('sawtooth', m, t, dur, 0.22, filtroBaixo); osc('square', m - 12, t, dur, 0.08, filtroBaixo);
  }
  function arp(m, t) { osc('square', m, t, 0.07, 0.045); }
  function bumbo(t) {
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    env(g, t, 0.003, 0.9, 0.16); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.2);
  }
  function chiado(t, dur, corte, vol) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido; f.type = 'highpass'; f.frequency.value = corte; env(g, t, 0.002, vol, dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  function caixa(t) { chiado(t, 0.14, 1400, 0.35); osc('triangle', 50, t, 0.08, 0.18); }
  function chimbal(t, aberto) { chiado(t, aberto ? 0.12 : 0.035, 7000, aberto ? 0.12 : 0.09); }

  // ---------- partitura (original) ----------
  // acordes por compasso: [nota do baixo, notas do arpejo]
  var AC = {
    Am: [45, [57, 60, 64]], F: [41, [53, 57, 60]], C: [48, [55, 60, 64]], G: [43, [55, 59, 62]],
    E: [40, [56, 59, 64]], Em: [40, [55, 59, 64]]
  };
  var A = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'], Bp = ['F', 'G', 'Em', 'Am', 'F', 'G', 'Am', 'E'];
  // melodia: [passo (1/16), nota MIDI, duração em 1/16]
  var MA = [
    [[0, 76, 3], [3, 74, 1], [4, 72, 2], [6, 71, 2], [8, 72, 4], [12, 69, 4]],
    [[0, 72, 2], [2, 74, 2], [4, 76, 4], [8, 77, 2], [10, 76, 2], [12, 72, 4]],
    [[0, 79, 3], [3, 77, 1], [4, 76, 2], [6, 74, 2], [8, 76, 4], [12, 72, 4]],
    [[0, 74, 2], [2, 71, 2], [4, 74, 2], [6, 79, 2], [8, 74, 4], [12, 71, 4]],
    [[0, 76, 2], [2, 81, 2], [4, 79, 2], [6, 76, 2], [8, 77, 2], [10, 76, 2], [12, 74, 2], [14, 72, 2]],
    [[0, 72, 4], [4, 69, 2], [6, 72, 2], [8, 77, 4], [12, 76, 4]],
    [[0, 74, 2], [2, 76, 2], [4, 77, 2], [6, 79, 2], [8, 81, 4], [12, 79, 4]],
    [[0, 80, 4], [4, 76, 4], [8, 71, 4], [12, 68, 4]]
  ];
  var MB = [
    [[0, 81, 6], [6, 79, 2], [8, 77, 4], [12, 76, 4]],
    [[0, 79, 6], [6, 77, 2], [8, 76, 4], [12, 74, 4]],
    [[0, 76, 2], [2, 79, 2], [4, 83, 4], [8, 81, 2], [10, 79, 2], [12, 76, 4]],
    [[0, 81, 8], [8, 76, 4], [12, 72, 4]],
    [[0, 77, 2], [2, 81, 2], [4, 84, 4], [8, 83, 2], [10, 81, 2], [12, 77, 4]],
    [[0, 79, 2], [2, 83, 2], [4, 86, 4], [8, 84, 2], [10, 83, 2], [12, 79, 4]],
    [[0, 81, 4], [4, 84, 4], [8, 88, 6], [14, 86, 2]],
    [[0, 83, 4], [4, 80, 4], [8, 76, 4], [12, 71, 4]]
  ];
  var BASS = [0, 0, 12, 0, 0, 12, 0, 12]; // em colcheias: tônica e oitava
  function tocarPasso(i, t, d16) {
    var comp = Math.floor(i / 16) % 32, p = i % 16;   // 32 compassos: A A B B
    var parte = comp < 8 ? 0 : comp < 16 ? 1 : comp < 24 ? 2 : 3, c = comp % 8;
    var nomeAc = (parte < 2 ? A : Bp)[c], ac = AC[nomeAc];
    // bateria
    if (p === 0 || p === 8 || (p === 6 && parte >= 2) || (p === 10 && c === 7)) bumbo(t);
    if (p === 4 || p === 12) caixa(t);
    if (c === 7 && p >= 12) caixa(t);  // virada no fim da frase
    if (p % 2 === 0) chimbal(t, p % 4 === 2);
    // baixo em colcheias
    if (p % 2 === 0) baixo(ac[0] + BASS[p / 2], t, d16 * 1.7);
    // arpejo (só a partir da segunda passada)
    if (parte !== 0) { var nt = ac[1], ordem = [0, 1, 2, 1]; arp(nt[ordem[p % 4]] + 12, t); }
    // melodia (parte A tocada duas vezes; na segunda, uma oitava acima no último compasso)
    var mel = (parte < 2 ? MA : MB)[c];
    mel.forEach(function (n) { if (n[0] === p) lead(n[1], t, d16 * n[2] * 0.95); });
  }
  function agendar() {
    if (!ctx) return;
    var d16 = 60 / (tempoBase * fator) / 4;
    while (proxT < ctx.currentTime + 0.15) { tocarPasso(passo16, proxT, d16); passo16++; proxT += d16; }
  }
  function tocar() {
    if (!ligada() || tocando) return;
    preparar(); if (!ctx) return;
    tocando = true; passo16 = 0; fator = 1; proxT = ctx.currentTime + 0.05;
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.34, ctx.currentTime);
    timer = setInterval(agendar, 25); agendar();
  }
  function parar(suave) {
    if (!tocando) return;
    tocando = false; clearInterval(timer); timer = null;
    if (ctx && master) {
      var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0.0001, t + (suave ? 0.8 : 0.08));
      setTimeout(function () { if (!tocando && master) master.gain.value = 0.34; }, suave ? 900 : 120);
    }
  }
  function ritmo(nivel) { fator = 1 + Math.min(0.16, Math.max(0, nivel - 1) * 0.02); }
  // bipe da contagem (3, 2, 1, já)
  function bip(final) {
    if (!ligada()) return; preparar(); if (!ctx) return;
    var t = ctx.currentTime + 0.01; osc('square', final ? 81 : 69, t, final ? 0.35 : 0.14, 0.12);
  }
  function alternar() { var on = !ligada(); gravarLS('gi_musica', on ? '1' : '0'); if (!on) { parar(); try { if (mudo) mudo.pause(); } catch (e) { } } else desbloquear(); return on; }
  // ---------- efeitos sonoros ----------
  function efeito(tipo) {
    if (!ligada()) return; preparar(); if (!ctx || !sfx) return;
    // efeitos saem por um canal próprio: não somem quando a música baixa no fim da corrida
    var m0 = master; master = sfx;
    try { efeitoEm(tipo, ctx.currentTime + 0.005); } finally { master = m0; }
  }
  function efeitoEm(tipo, t) {
    if (tipo === 'batida') {
      // pancada grave + estilhaço metálico + chiado de vidro
      var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.35);
      env(g, t, 0.003, 1.2, 0.45); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.5);
      chiado(t, 0.5, 300, 0.9); chiado(t + 0.04, 0.7, 4000, 0.45);
      [311, 466, 587, 740].forEach(function (f, i) { var m = ctx.createOscillator(), mg = ctx.createGain(); m.type = 'square'; m.frequency.setValueAtTime(f, t); m.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.4); env(mg, t + i * 0.012, 0.002, 0.07, 0.42); m.connect(mg); mg.connect(master); m.start(t); m.stop(t + 0.5); });
    } else if (tipo === 'seguro') {
      // batida mais leve + escudo (acorde subindo)
      chiado(t, 0.22, 500, 0.6); var o2 = ctx.createOscillator(), g2 = ctx.createGain(); o2.type = 'sine'; o2.frequency.setValueAtTime(110, t); o2.frequency.exponentialRampToValueAtTime(40, t + 0.2); env(g2, t, 0.003, 0.8, 0.25); o2.connect(g2); g2.connect(master); o2.start(t); o2.stop(t + 0.3);
      [76, 81, 88].forEach(function (m, i) { osc('triangle', m, t + 0.12 + i * 0.07, 0.25, 0.12); });
    } else if (tipo === 'buraco') {
      // baque seco + chacoalhar
      var o3 = ctx.createOscillator(), g3 = ctx.createGain(); o3.type = 'sine'; o3.frequency.setValueAtTime(90, t); o3.frequency.exponentialRampToValueAtTime(35, t + 0.18); env(g3, t, 0.003, 1.0, 0.22); o3.connect(g3); g3.connect(master); o3.start(t); o3.stop(t + 0.3);
      chiado(t, 0.12, 200, 0.5); chiado(t + 0.1, 0.06, 1500, 0.25); chiado(t + 0.18, 0.05, 1500, 0.2);
    } else if (tipo === 'furou') {
      // estouro + ar escapando
      chiado(t, 0.08, 800, 1.0); chiado(t + 0.06, 0.9, 2500, 0.25);
    } else if (tipo === 'pit') {
      // parafusadeira pneumática: rajadas curtas
      for (var i = 0; i < 4; i++) { var tt = t + i * 0.22; chiado(tt, 0.12, 3000, 0.22); osc('sawtooth', 52 + (i % 2), tt, 0.12, 0.06); }
    }
  }
  // gera um trecho da trilha offline (usado para testes e prévias)
  function gravar(seg) {
    var sr = 44100, off = new OfflineAudioContext(2, sr * seg, sr), salvo = [ctx, master, ruido, filtroBaixo];
    ctx = off; filtroBaixo = null;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.34; master.connect(comp); comp.connect(ctx.destination);
    var n = sr * 0.5, buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; ruido = buf;
    var d16 = 60 / tempoBase / 4, t = 0.05, k = 0; while (t < seg - 0.3) { tocarPasso(k, t, d16); k++; t += d16; }
    var pr = off.startRendering();
    ctx = salvo[0]; master = salvo[1]; ruido = salvo[2]; filtroBaixo = salvo[3];
    return pr;
  }
  return { efeito: efeito, gravar: gravar, preparar: preparar, tocar: tocar, parar: parar, ritmo: ritmo, bip: bip, ligada: ligada, alternar: alternar, tocando: function () { return tocando; } };
})();
