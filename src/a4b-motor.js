/* ================== MOTOR DA CORRIDA ==================
   Simulação em passo fixo, determinística pela semente (todos correm a mesma pista).
   Renderização em 3D (Three.js, câmera atrás do carro) com fallback 2D. */
var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
function carregarThree(cb) {
  if (window.THREE) { cb(true); return; }
  if (carregarThree._falhou) { cb(false); return; }
  var s = document.createElement('script'), feito = false;
  var fim = function (ok) { if (feito) return; feito = true; if (!ok) carregarThree._falhou = true; cb(ok && !!window.THREE); };
  s.src = THREE_URL; s.onload = function () { fim(true); }; s.onerror = function () { fim(false); };
  setTimeout(function () { fim(!!window.THREE); }, 8000);
  document.head.appendChild(s);
}
/* Garagem: modelos de carro do 3D realista */
var CARROS = {
  aura: { nome: 'Aura', desc: 'O carro da casa, laranja' },
  conceito: { nome: 'Conceito', desc: 'Esportivo vermelho', arquivo: 'assets/carros/conceito.glb', rotY: Math.PI },
  cyberpunk: { nome: 'Cyberpunk', desc: 'Muscle car grafite', arquivo: 'assets/carros/cyberpunk.glb', rotY: 0 }
};
var GLTF_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
var _modelosCache = {};
function carroPreferido() { var c = lerLS('gi_carro', 'aura'); return CARROS[c] ? c : 'aura'; }
function carregarGLTFLoader(cb) {
  if (window.THREE && THREE.GLTFLoader) { cb(true); return; }
  var sc = document.createElement('script'); sc.src = GLTF_URL;
  sc.onload = function () { cb(!!THREE.GLTFLoader); }; sc.onerror = function () { cb(false); };
  document.head.appendChild(sc);
}
// carrega o modelo, normaliza o porte (até 3,2 × 1,55 m), direção (frente para -z) e apoia no chão
function carregarModeloCarro(id, cb) {
  var cfg = CARROS[id]; if (!cfg || !cfg.arquivo) { cb(null); return; }
  carregarGLTFLoader(function (ok) {
    if (!ok) { cb(null); return; }
    var url = (window.MODELOS_EMBUTIDOS && MODELOS_EMBUTIDOS[id]) || cfg.arquivo;
    new THREE.GLTFLoader().load(url, function (g) {
      var raiz = new THREE.Group(), obj = g.scene; raiz.add(obj);
      obj.rotation.y = cfg.rotY || 0; raiz.updateMatrixWorld(true);
      var total = new THREE.Box3().setFromObject(obj), tz = total.getSize(new THREE.Vector3());
      var bx = new THREE.Box3(), achou = false, temRigida = false;
      // malhas com esqueleto (skinned) têm caixa da pose original, que não bate com o que aparece na tela: mede só as rígidas (rodas etc.)
      obj.traverse(function (m) { if (m.isMesh && !m.isSkinnedMesh) temRigida = true; });
      obj.traverse(function (m) {
        if (!m.isMesh || (temRigida && m.isSkinnedMesh)) return;
        var b = new THREE.Box3().setFromObject(m), z = b.getSize(new THREE.Vector3());
        if (z.y > Math.max(tz.x, tz.z) * 0.55) return; // ignora peças soltas/altas
        bx.union(b); achou = true;
      });
      if (!achou) bx = total;
      var sz = bx.getSize(new THREE.Vector3()), ce = bx.getCenter(new THREE.Vector3());
      // mesmo porte para todos: até 3,2 m de comprimento e 1,55 m de largura
      var k = Math.min(3.2 / Math.max(sz.z, 0.001), 1.55 / Math.max(sz.x, 0.001));
      obj.position.set(-ce.x, -bx.min.y, -ce.z);
      var esc = new THREE.Group(); esc.add(raiz); esc.scale.set(k, k, k);
      raiz.position.set(0, 0, 0);
      obj.position.multiplyScalar(1);
      var final = new THREE.Group(); final.add(esc);
      cb(final);
    }, undefined, function (e) { console.warn('modelo', id, e); cb(null); });
  });
}
// carro visto de cima (vista realista): Aura usa o desenho próprio; os outros, a foto gerada do modelo 3D
var _imgsCima = {};
function imgCima(id) {
  if (id === 'aura' || !window.FOTOS_CARROS || !FOTOS_CARROS[id]) return null;
  var im = _imgsCima[id];
  if (!im) { im = _imgsCima[id] = new Image(); im.src = FOTOS_CARROS[id].cima; }
  return im.complete && im.naturalWidth ? im : null;
}
function visualPreferido() { var v = lerLS('gi_visual', '3dreal'); return ['3dreal', '3d', 'classico', 'realista'].indexOf(v) >= 0 ? v : '3dreal'; }
function webglOk() {
  try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
}
function montarMotor() {
  var box = $('#cvBox'), wrap = $('#cvWrap'), hud = $('#cv');
  var dispW = Math.min(box.clientWidth, 480), dispH = window.innerHeight - 140;
  var w = Math.min(dispW, Math.floor(dispH * 9 / 16)), hgt = Math.floor(w * 16 / 9);
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  wrap.style.width = w + 'px'; wrap.style.height = hgt + 'px';
  hud.style.width = w + 'px'; hud.style.height = hgt + 'px';
  hud.width = Math.floor(w * dpr); hud.height = Math.floor(hgt * dpr);
  var iniciar = function (tres) {
    if (!CR || CR.fase !== 'jogo') return;
    CR.motor = new Motor(wrap, hud, tres ? $('#cv3d') : null, CR.seed, fimCorrida, w, hgt, dpr, CR.visual || visualPreferido());
  };
  var v = CR.visual || visualPreferido();
  if ((v === '3d' || v === '3dreal') && webglOk()) carregarThree(function (ok) { if (ok && v === '3dreal') carregarGLTFLoader(function () { iniciar(true); }); else iniciar(ok); }); else iniciar(false);
}

function Motor(wrap, hud, box3d, seed, aoFim, cssW, cssH, dpr, visual) {
  // ---------- constantes da simulação ----------
  var N = 5, LANE = 100, ROAD = N * LANE, CARW = 44, CARH = 78, STEP = 1 / 120, HORIZ = 2400;
  var CENTRO = []; for (var c = 0; c < N; c++) CENTRO.push(LANE / 2 + c * LANE);
  var PENALIDADE = 5, PARADA = 1.5, MAX_VIDAS = 2, INVUL = 1.5;
  var TAM = { cone: [38, 44], buraco: [64, 46], carro: [52, 90], cancela: [96, 22], tag: [40, 30], seguro: [40, 34], aviso: [400, 40] };
  var rnd = Logica.rng(seed);
  var s = { t: 0, dist: 0, lane: 2, x: CENTRO[2], obst: [], prox: 700, tag: false, vivo: true, fase: 'contagem', cont: 3, acc: 0, flash: 0,
    pen: 0, parada: 0, msg: null, pracas: 0, ultPraca: -99, ultSeguro: -99, vidas: 0, invul: 0, usouSeguro: 0, tremor: 0 };
  var raf = null, ultimo = null, parado = false, fimDisparado = false;
  function vel(t) { return Math.min(300 * Math.pow(1.12, Math.floor(t / 10)), 1150); }
  function nivel(t) { return Math.floor(t / 10) + 1; }
  function placar() { return Math.max(0, s.t - s.pen); }
  function add(tipo, lane, d) { var o = { tipo: tipo, lane: lane, d: d, w: TAM[tipo][0], h: TAM[tipo][1], aberta: false, pego: false, batido: false, id: Math.random() }; s.obst.push(o); return o; }
  function gerarLinha(d) {
    var r = rnd();
    if (s.t > 10 && s.t - s.ultPraca > 12 && r < 0.3) {
      // praça de pedágio: fecha todas as faixas; com tag passa direto, sem tag paga penalidade
      s.ultPraca = s.t; s.pracas++;
      for (var l = 0; l < N; l++) add('cancela', l, d);
      add('aviso', 2, d - 230);
      if (rnd() < 0.7) add('tag', Math.floor(rnd() * N), d - 130);
      return;
    }
    var faixas = Logica.shuffle([0, 1, 2, 3, 4], rnd);
    var x = rnd(), qtd = x < 0.35 ? 1 : x < 0.75 ? 2 : 3;
    for (var i = 0; i < qtd; i++) { var y = rnd(); add(y < 0.42 ? 'cone' : y < 0.74 ? 'buraco' : 'carro', faixas[i], d); }
    var livres = faixas.slice(qtd);
    var z = rnd();
    if (s.t > 6 && s.t - s.ultSeguro > 18 && z < 0.14) { s.ultSeguro = s.t; add('seguro', livres[Math.floor(rnd() * livres.length)], d + 170); }
    else if (z > 0.91) add('tag', livres[Math.floor(rnd() * livres.length)], d + 170);
  }
  function passo(dt) {
    s.t += dt;
    if (s.invul > 0) s.invul -= dt;
    if (s.tremor > 0) s.tremor -= dt;
    if (s.parada > 0) { s.parada -= dt; return; }
    var v = vel(s.t);
    s.dist += v * dt;
    var alvo = CENTRO[s.lane], mv = 950 * dt;
    if (Math.abs(alvo - s.x) <= mv) s.x = alvo; else s.x += alvo > s.x ? mv : -mv;
    while (s.prox < s.dist + HORIZ) { gerarLinha(s.prox); s.prox += Math.max(260, v * 0.65) + rnd() * 160; }
    var cx0 = s.x - CARW / 2 + 5, cx1 = s.x + CARW / 2 - 5;
    for (var i = 0; i < s.obst.length; i++) {
      var o = s.obst[i];
      if (o.pego || o.aberta || o.batido || o.tipo === 'aviso') continue;
      var a = o.d - s.dist; // distância à frente do para-choque
      if (!(a < -6 && a > -(CARH - 6) - o.h)) continue;
      var ox = CENTRO[o.lane], ox0 = ox - o.w / 2 + 4, ox1 = ox + o.w / 2 - 4;
      if (!(ox1 > cx0 && ox0 < cx1)) continue;
      if (o.tipo === 'tag') { o.pego = true; s.tag = true; s.msg = { txt: 'Tag ativada', cor: '#9FD3FF', ate: s.t + 1 }; continue; }
      if (o.tipo === 'seguro') {
        o.pego = true;
        if (s.vidas < MAX_VIDAS) { s.vidas++; s.msg = { txt: 'Seguro Porto: +1 vida', cor: '#9FD3FF', ate: s.t + 1.4 }; }
        else s.msg = { txt: 'Seguro já no máximo', cor: '#9FD3FF', ate: s.t + 1 };
        continue;
      }
      if (o.tipo === 'cancela') {
        s.obst.forEach(function (q) { if (q.tipo === 'cancela' && q.d === o.d) q.aberta = true; });
        if (s.tag) { s.tag = false; s.msg = { txt: 'Tag! Passou direto', cor: '#7CE0B0', ate: s.t + 1.4 }; }
        else { s.pen += PENALIDADE; s.parada = PARADA; s.msg = { txt: 'Sem tag: −' + PENALIDADE + ' s', cor: '#FF9C9C', ate: s.t + PARADA + 0.8 }; }
        continue;
      }
      if (s.invul > 0) continue;
      if (s.vidas > 0) {
        s.vidas--; s.usouSeguro++; o.batido = true; s.invul = INVUL; s.tremor = 0.35;
        s.msg = { txt: 'Seguro acionado! Segue o jogo', cor: '#9FD3FF', ate: s.t + 1.6 };
        continue;
      }
      s.vivo = false; s.fase = 'batida'; s.flash = 1; s.tremor = 0.5; return;
    }
    s.obst = s.obst.filter(function (o) { var fora = s.dist - o.d > 400; if (fora && o._rm) o._rm(); return !fora; });
  }
  function mover(d) { if (s.fase !== 'rodando' || !s.vivo) return; s.lane = Math.max(0, Math.min(N - 1, s.lane + d)); }

  // ---------- HUD (canvas 2D por cima) ----------
  var hctx = hud.getContext('2d'), HW = 360, HH = 640, hs = hud.width / HW;
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function escudo(ctx, x, y, t, cor) {
    ctx.save(); ctx.translate(x, y); ctx.scale(t / 30, t / 30);
    ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(12, -10); ctx.lineTo(12, 0); ctx.quadraticCurveTo(12, 11, 0, 16); ctx.quadraticCurveTo(-12, 11, -12, 0); ctx.lineTo(-12, -10); ctx.closePath();
    ctx.fillStyle = cor; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-1, 5); ctx.lineTo(6, -5); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }
  function desenharHUD(limpar) {
    var ctx = hctx;
    ctx.setTransform(hs, 0, 0, hs, 0, 0);
    if (limpar) ctx.clearRect(0, 0, HW, HH);
    ctx.fillStyle = 'rgba(13,24,64,.78)'; rr(ctx, 10, 10, 132, 46, 12); ctx.fill(); rr(ctx, HW - 112, 10, 102, 46, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '900 24px Montserrat, Arial, sans-serif'; ctx.fillText(fmtSeg(placar()).replace(' s', 's'), 22, 34);
    ctx.textAlign = 'right'; ctx.font = '700 11px "Public Sans", Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText('VELOCIDADE', HW - 22, 24);
    ctx.font = '900 18px Montserrat, Arial, sans-serif'; ctx.fillStyle = '#FFB27A'; ctx.fillText('Nível ' + nivel(s.t), HW - 22, 42);
    // itens: vidas (seguro) e tag
    var ix = 14, iy = 76;
    for (var i = 0; i < MAX_VIDAS; i++) { ctx.globalAlpha = i < s.vidas ? 1 : 0.25; escudo(ctx, ix + 14 + i * 32, iy, 26, '#499EF2'); }
    ctx.globalAlpha = s.tag ? 1 : 0.25;
    ctx.fillStyle = '#14235E'; rr(ctx, ix + 74, iy - 12, 40, 24, 6); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#EC7000'; ctx.font = '900 12px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TAG', ix + 94, iy + 1);
    ctx.globalAlpha = 1;
    if (s.msg && s.t < s.msg.ate) { ctx.fillStyle = 'rgba(13,24,64,.85)'; rr(ctx, HW / 2 - 130, 104, 260, 44, 12); ctx.fill(); ctx.fillStyle = s.msg.cor; ctx.textAlign = 'center'; ctx.font = '900 18px Montserrat, Arial, sans-serif'; ctx.fillText(s.msg.txt, HW / 2, 127); }
    if (s.fase === 'contagem') {
      ctx.fillStyle = 'rgba(13,24,64,.55)'; ctx.fillRect(0, 0, HW, HH);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 120px Montserrat, Arial, sans-serif'; ctx.fillText(String(Math.ceil(s.cont)), HW / 2, HH / 2 - 40);
      ctx.font = '700 16px "Public Sans", Arial, sans-serif'; ctx.fillText('Toque à esquerda ou à direita', HW / 2, HH / 2 + 50);
    }
    if (s.fase === 'batida') {
      ctx.fillStyle = 'rgba(226,59,59,' + (0.5 * s.flash) + ')'; ctx.fillRect(0, 0, HW, HH);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 46px Montserrat, Arial, sans-serif'; ctx.fillText('BATEU!', HW / 2, HH / 2 - 20);
      ctx.font = '900 30px Montserrat, Arial, sans-serif'; ctx.fillText(fmtSeg(placar()), HW / 2, HH / 2 + 26);
    } else if (s.invul > 0 && Math.floor(s.invul * 8) % 2 === 0) {
      ctx.strokeStyle = 'rgba(73,158,242,.8)'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, HW - 6, HH - 6);
    }
  }

  // ---------- RENDER 3D ----------
  var R3 = null;
  if (box3d && window.THREE) {
    try { R3 = visual === '3dreal' ? criar3DReal({ s: s, N: N, LANE: LANE, ROAD: ROAD, CENTRO: CENTRO, CARH: CARH, cssW: cssW, cssH: cssH, dpr: dpr, box3d: box3d, carro: (CR && CR.carro) || carroPreferido() }) : criar3D(); }
    catch (e) { console.warn('3D indisponível', e); R3 = null; }
  }
  function criar3D() {
    var T = window.THREE, K = 0.035; // metros por unidade
    var renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr); renderer.setSize(cssW, cssH);
    box3d.appendChild(renderer.domElement);
    var CEU = 0xA9CFEF;
    var scene = new T.Scene(); scene.background = new T.Color(CEU); scene.fog = new T.Fog(CEU, 38, 95);
    var cam = new T.PerspectiveCamera(66, cssW / cssH, 0.1, 200);
    scene.add(new T.HemisphereLight(0xEAF4FF, 0x4A6B3A, 0.85));
    var sol = new T.DirectionalLight(0xFFF2DE, 0.9); sol.position.set(-6, 14, 4); scene.add(sol);
    function lx(x) { return (x - ROAD / 2) * K; }
    function canvasTex(w, h, fn, rep) {
      var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
      var t = new T.CanvasTexture(c); t.anisotropy = 4;
      if (rep) { t.wrapS = T.RepeatWrapping; t.wrapT = T.RepeatWrapping; t.repeat.set(1, rep); }
      return t;
    }
    var RW = ROAD * K, COMP = 180, REP = 18, PERIODO = COMP / REP; // asfalto repete a cada 10 m
    var texRua = canvasTex(512, 512, function (g, w, h) {
      g.fillStyle = '#3B4150'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2600; i++) { var v = 50 + Math.random() * 30; g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 10) + ',.35)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = '#F4F1EA'; g.fillRect(6, 0, 7, h); g.fillRect(w - 13, 0, 7, h);
      for (var l = 1; l < N; l++) { var x = l * w / N - 3; g.fillRect(x, 0, 6, h * 0.45); }
    }, REP);
    var rua = new T.Mesh(new T.PlaneGeometry(RW, COMP), new T.MeshLambertMaterial({ map: texRua }));
    rua.rotation.x = -Math.PI / 2; rua.position.set(0, 0, -COMP / 2 + 15); scene.add(rua);
    var texGrama = canvasTex(256, 256, function (g, w, h) {
      g.fillStyle = '#4E8A3E'; g.fillRect(0, 0, w, h); g.fillStyle = '#467F37'; g.fillRect(0, 0, w, h / 2);
      for (var i = 0; i < 900; i++) { g.fillStyle = 'rgba(30,70,25,.25)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 3); }
    }, REP);
    texGrama.repeat.set(6, REP);
    var grama = new T.Mesh(new T.PlaneGeometry(120, COMP), new T.MeshLambertMaterial({ map: texGrama }));
    grama.rotation.x = -Math.PI / 2; grama.position.set(0, -0.02, -COMP / 2 + 15); scene.add(grama);
    // acostamento e zebra
    var texZebra = canvasTex(64, 128, function (g, w, h) { g.fillStyle = '#E24B3A'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#F4F1EA'; g.fillRect(0, h / 2, w, h / 2); }, REP * 2);
    [-1, 1].forEach(function (lado) {
      var z = new T.Mesh(new T.PlaneGeometry(0.5, COMP), new T.MeshLambertMaterial({ map: texZebra }));
      z.rotation.x = -Math.PI / 2; z.position.set(lado * (RW / 2 + 0.25), 0.005, -COMP / 2 + 15); scene.add(z);
      var ac = new T.Mesh(new T.PlaneGeometry(2.2, COMP), new T.MeshLambertMaterial({ color: 0x6E6A60 }));
      ac.rotation.x = -Math.PI / 2; ac.position.set(lado * (RW / 2 + 1.6), 0.003, -COMP / 2 + 15); scene.add(ac);
    });
    // cenário que rola: árvores, postes e defensas
    var ESP = 9, QT = 22, cenario = [];
    var matTronco = new T.MeshLambertMaterial({ color: 0x6B4A2E }), matCopa = new T.MeshLambertMaterial({ color: 0x2F6B3A }), matCopa2 = new T.MeshLambertMaterial({ color: 0x3C7D44 });
    var matPoste = new T.MeshLambertMaterial({ color: 0xBFC5D2 }), matDef = new T.MeshLambertMaterial({ color: 0xD9DDE5 });
    var geoTronco = new T.CylinderGeometry(0.18, 0.22, 1.6, 6), geoCopa = new T.ConeGeometry(1.4, 3.6, 7), geoCopaR = new T.IcosahedronGeometry(1.5, 0);
    for (var i = 0; i < QT; i++) {
      [-1, 1].forEach(function (lado) {
        var g = new T.Group();
        var tr = new T.Mesh(geoTronco, matTronco); tr.position.y = 0.8; g.add(tr);
        var cp = (i + (lado > 0 ? 1 : 0)) % 2 ? new T.Mesh(geoCopa, matCopa) : new T.Mesh(geoCopaR, matCopa2); cp.position.y = (cp.geometry === geoCopa) ? 3.2 : 2.6; g.add(cp);
        var off = 5 + ((i * 7 + (lado > 0 ? 3 : 0)) % 5) * 1.6;
        g.position.x = lado * (RW / 2 + off); g.userData.base = i * ESP + (lado > 0 ? ESP / 2 : 0);
        scene.add(g); cenario.push(g);
        var p = new T.Group();
        var haste = new T.Mesh(new T.BoxGeometry(0.12, 0.7, 0.12), matPoste); haste.position.y = 0.35; p.add(haste);
        var def = new T.Mesh(new T.BoxGeometry(0.08, 0.28, ESP * 0.98), matDef); def.position.set(0, 0.62, 0); p.add(def);
        p.position.x = lado * (RW / 2 + 0.9); p.userData.base = i * ESP; scene.add(p); cenario.push(p);
      });
    }
    var LOOP = QT * ESP;
    // sombras de contato (blob)
    var texSombra = canvasTex(128, 128, function (g, w, h) { var gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    var matSombra = new T.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false });
    function sombra(wm, lm) { var m = new T.Mesh(new T.PlaneGeometry(wm, lm), matSombra); m.rotation.x = -Math.PI / 2; m.position.y = 0.012; return m; }
    // carro
    function carro(cor, teto) {
      var g = new T.Group();
      var mCor = new T.MeshLambertMaterial({ color: cor }), mTeto = new T.MeshLambertMaterial({ color: teto });
      var mVidro = new T.MeshLambertMaterial({ color: 0x9CC9FF, emissive: 0x1A3350 }), mPneu = new T.MeshLambertMaterial({ color: 0x1B1D22 });
      var corpo = new T.Mesh(new T.BoxGeometry(1.6, 0.48, 2.8), mCor); corpo.position.y = 0.48; g.add(corpo);
      var capo = new T.Mesh(new T.BoxGeometry(1.5, 0.12, 0.9), mCor); capo.position.set(0, 0.76, -0.85); capo.rotation.x = 0.12; g.add(capo);
      var cab = new T.Mesh(new T.BoxGeometry(1.32, 0.46, 1.35), mTeto); cab.position.set(0, 0.95, 0.2); g.add(cab);
      var pb = new T.Mesh(new T.BoxGeometry(1.24, 0.38, 0.05), mVidro); pb.position.set(0, 0.95, -0.48); pb.rotation.x = -0.35; g.add(pb);
      var tr = new T.Mesh(new T.BoxGeometry(1.24, 0.34, 0.05), mVidro); tr.position.set(0, 0.95, 0.88); tr.rotation.x = 0.35; g.add(tr);
      [[-0.8, -0.9], [0.8, -0.9], [-0.8, 0.9], [0.8, 0.9]].forEach(function (p) {
        var r = new T.Mesh(new T.CylinderGeometry(0.33, 0.33, 0.26, 14), mPneu); r.rotation.z = Math.PI / 2; r.position.set(p[0], 0.33, p[1]); g.add(r);
      });
      var farol = new T.MeshBasicMaterial({ color: 0xFFF4C2 });
      [-0.55, 0.55].forEach(function (x) { var f = new T.Mesh(new T.BoxGeometry(0.32, 0.1, 0.04), farol); f.position.set(x, 0.56, -1.41); g.add(f); });
      var lant = new T.MeshBasicMaterial({ color: 0xC0392B });
      g.userData.lanternas = [];
      [-0.6, 0.6].forEach(function (x) { var f = new T.Mesh(new T.BoxGeometry(0.32, 0.12, 0.04), lant.clone()); f.position.set(x, 0.56, 1.41); g.add(f); g.userData.lanternas.push(f); });
      g.add(sombra(2.4, 3.6));
      return g;
    }
    var meu = carro(0xEC7000, 0xB85600); scene.add(meu);
    // texturas dos itens
    var texTag = canvasTex(128, 96, function (g, w, h) { g.fillStyle = '#14235E'; rr(g, 4, 4, w - 8, h - 8, 16); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#EC7000'; g.font = '900 44px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TAG', w / 2, h / 2 + 2); });
    var texSeg = canvasTex(128, 160, function (g, w, h) {
      g.save(); g.translate(w / 2, 62); g.scale(3.3, 3.3); g.beginPath(); g.moveTo(0, -15); g.lineTo(12, -10); g.lineTo(12, 0); g.quadraticCurveTo(12, 11, 0, 16); g.quadraticCurveTo(-12, 11, -12, 0); g.lineTo(-12, -10); g.closePath();
      g.fillStyle = '#499EF2'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.stroke();
      g.beginPath(); g.moveTo(-5, 0); g.lineTo(-1, 5); g.lineTo(6, -5); g.lineWidth = 2.4; g.lineCap = 'round'; g.stroke(); g.restore();
      g.fillStyle = '#14235E'; rr(g, 8, 122, w - 16, 32, 10); g.fill(); g.fillStyle = '#fff'; g.font = '800 19px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SEGURO', w / 2, 139);
    });
    var texAviso = canvasTex(512, 96, function (g, w, h) { g.fillStyle = '#F4F1EA'; g.font = '900 64px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PEDÁGIO', w / 2, h / 2); });
    var texBarra = canvasTex(256, 32, function (g, w, h) { for (var i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#F4F1EA' : '#E23B3B'; g.fillRect(i * w / 8, 0, w / 8, h); } });
    var matCone = new T.MeshLambertMaterial({ color: 0xFF7A1A }), matBranco = new T.MeshLambertMaterial({ color: 0xF4F1EA });
    var matBuraco = new T.MeshBasicMaterial({ color: 0x1A1C22 }), matBordaB = new T.MeshLambertMaterial({ color: 0x555B69 });
    var matCabine = new T.MeshLambertMaterial({ color: 0x14235E }), matFaixaLar = new T.MeshLambertMaterial({ color: 0xEC7000 });
    function criarMesh(o) {
      var g = new T.Group(), wm = o.w * K, lm = o.h * K;
      if (o.tipo === 'cone') {
        var cone = new T.Mesh(new T.ConeGeometry(0.34, 0.85, 14), matCone); cone.position.y = 0.47; g.add(cone);
        var faixa = new T.Mesh(new T.CylinderGeometry(0.2, 0.24, 0.13, 14), matBranco); faixa.position.y = 0.55; g.add(faixa);
        var base = new T.Mesh(new T.BoxGeometry(0.75, 0.07, 0.75), matCone); base.position.y = 0.035; g.add(base);
        g.add(sombra(1.1, 1.1));
      } else if (o.tipo === 'buraco') {
        var b1 = new T.Mesh(new T.CircleGeometry(0.5, 20), matBordaB); b1.rotation.x = -Math.PI / 2; b1.scale.set(wm, lm * 1.4, 1); b1.position.y = 0.008; g.add(b1);
        var b2 = new T.Mesh(new T.CircleGeometry(0.42, 20), matBuraco); b2.rotation.x = -Math.PI / 2; b2.scale.set(wm, lm * 1.4, 1); b2.position.y = 0.01; g.add(b2);
      } else if (o.tipo === 'carro') {
        var cc = carro(0x5E7FA8, 0x3F5C82); cc.rotation.y = 0; g.add(cc); g.userData.pisca = cc.userData.lanternas;
      } else if (o.tipo === 'cancela') {
        var poste = new T.Mesh(new T.BoxGeometry(0.2, 1.1, 0.2), matBranco); poste.position.set(-LANE * K / 2 + 0.15, 0.55, 0); g.add(poste);
        var piv = new T.Group(); piv.position.set(-LANE * K / 2 + 0.15, 0.95, 0); g.add(piv);
        var barra = new T.Mesh(new T.BoxGeometry(LANE * K - 0.3, 0.14, 0.1), new T.MeshLambertMaterial({ map: texBarra })); barra.position.x = (LANE * K - 0.3) / 2; piv.add(barra);
        g.userData.piv = piv;
        if (o.lane === 0 || o.lane === N - 1) {
          var cab = new T.Group(); var corpo = new T.Mesh(new T.BoxGeometry(1.4, 2.4, 2.2), matCabine); corpo.position.y = 1.2; cab.add(corpo);
          var fx = new T.Mesh(new T.BoxGeometry(1.45, 0.3, 2.25), matFaixaLar); fx.position.y = 2.2; cab.add(fx);
          var teto = new T.Mesh(new T.BoxGeometry(RW + 4, 0.25, 3), matCabine); teto.position.set(o.lane === 0 ? (RW / 2 + 0.2) : -(RW / 2 + 0.2), 3.6, 0);
          cab.position.x = (o.lane === 0 ? -1 : 1) * (LANE * K / 2 + 1.1); g.add(cab);
          if (o.lane === 0) { teto.position.set(RW / 2 - LANE * K / 2, 3.6, 0); g.add(teto); }
        }
      } else if (o.tipo === 'tag' || o.tipo === 'seguro') {
        var sp = new T.Sprite(new T.SpriteMaterial({ map: o.tipo === 'tag' ? texTag : texSeg, transparent: true, depthWrite: false }));
        if (o.tipo === 'tag') sp.scale.set(1.3, 0.98, 1); else sp.scale.set(1.25, 1.56, 1);
        sp.position.y = 1.0; g.add(sp); g.userData.sp = sp; g.add(sombra(1.0, 1.0));
      } else if (o.tipo === 'aviso') {
        var av = new T.Mesh(new T.PlaneGeometry(RW * 0.7, RW * 0.7 * 96 / 512), new T.MeshBasicMaterial({ map: texAviso, transparent: true, depthWrite: false }));
        av.rotation.x = -Math.PI / 2; av.position.y = 0.012; g.add(av);
      }
      scene.add(g);
      o._rm = function () { scene.remove(g); };
      return g;
    }
    function render(tempoReal) {
      var tr = texRua.offset, desl = (s.dist * K) / PERIODO;
      texRua.offset.y = desl % 1; texGrama.offset.y = desl % 1; texZebra.offset.y = (desl * 2) % 1;
      cenario.forEach(function (g) { var z = ((g.userData.base - s.dist * K) % LOOP + LOOP) % LOOP; g.position.z = -(z - 12); });
      var cx = lx(s.x);
      meu.position.set(cx, 0, (CARH / 2) * K);
      meu.rotation.y = (CENTRO[s.lane] - s.x) * 0.0035;
      meu.visible = !(s.invul > 0 && Math.floor(s.invul * 10) % 2 === 0);
      s.obst.forEach(function (o) {
        if (!o._mesh) o._mesh = criarMesh(o);
        var g = o._mesh, a = o.d - s.dist + o.h / 2;
        g.position.set(o.tipo === 'aviso' ? 0 : lx(CENTRO[o.lane]), 0, -a * K);
        g.visible = !(o.pego) && !(o.batido && o.tipo !== 'buraco');
        if (g.userData.piv) { var alvo = o.aberta ? -1.25 : 0; g.userData.piv.rotation.z += (alvo - g.userData.piv.rotation.z) * 0.18; }
        if (g.userData.sp) { g.userData.sp.position.y = 1.0 + Math.sin(tempoReal * 4 + o.lane) * 0.12; }
        if (g.userData.pisca) { var on = Math.floor(tempoReal * 3) % 2 === 0; g.userData.pisca.forEach(function (l) { l.material.color.setHex(on ? 0xFFB020 : 0x7A4A00); }); }
      });
      var tremX = s.tremor > 0 ? (Math.random() - 0.5) * 0.35 : 0, tremY = s.tremor > 0 ? (Math.random() - 0.5) * 0.25 : 0;
      cam.position.set(cx * 0.8 + tremX, 7.4 + tremY, 11.5);
      cam.lookAt(cx * 0.8, 0, -13);
      renderer.render(scene, cam);
    }
    function destruir() { try { renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); } catch (e) { } }
    return { render: render, destruir: destruir };
  }

  // ---------- RENDER 2D: CLÁSSICO (vista de cima, estilo original) ----------
  function mundo2D(margem) { var W = ROAD + margem * 2; return { W: W, H: W * 16 / 9, R0: margem, esc: hud.width / W }; }
  var MC = mundo2D(30);
  function carroClassico(ctx, x, y, cor, teto, pisca) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(ctx, x - 24, y + 4, 48, 84, 12); ctx.fill();
    ctx.fillStyle = cor; rr(ctx, x - 22, y, 44, 80, 12); ctx.fill();
    ctx.fillStyle = teto; rr(ctx, x - 16, y + 24, 32, 30, 7); ctx.fill();
    ctx.fillStyle = '#9CC9FF'; rr(ctx, x - 15, y + 14, 30, 11, 4); ctx.fill();
    ctx.fillStyle = '#6E8FB8'; rr(ctx, x - 14, y + 56, 28, 9, 3); ctx.fill();
    ctx.fillStyle = '#FFF4C2'; ctx.fillRect(x - 18, y + 2, 9, 4); ctx.fillRect(x + 9, y + 2, 9, 4);
    ctx.fillStyle = pisca ? ((Math.floor(s.t * 3) % 2) ? '#FFB020' : '#7A4A00') : '#C0392B';
    ctx.fillRect(x - 18, y + 74, 9, 4); ctx.fillRect(x + 9, y + 74, 9, 4);
  }
  function desenharClassico() {
    var M = MC, W = M.W, H = M.H, R0 = M.R0, CY = H - 170, ctx = hctx;
    ctx.setTransform(M.esc, 0, 0, M.esc, 0, 0);
    ctx.fillStyle = '#2F7D46'; ctx.fillRect(0, 0, W, H);
    var off = s.dist % 80; ctx.fillStyle = '#2A7140';
    for (var g = -80; g < H + 80; g += 80) { ctx.fillRect(0, g + off, R0, 40); ctx.fillRect(W - R0, g + off, R0, 40); }
    ctx.fillStyle = '#3A4150'; ctx.fillRect(R0, 0, ROAD, H);
    var zo = s.dist % 40;
    for (var z = -40; z < H + 40; z += 40) {
      var par = Math.floor((z - zo) / 40) % 2 === 0;
      ctx.fillStyle = par ? '#E24B3A' : '#F4F4F4'; ctx.fillRect(R0 - 7, z + zo, 7, 20); ctx.fillRect(R0 + ROAD, z + zo, 7, 20);
      ctx.fillStyle = par ? '#F4F4F4' : '#E24B3A'; ctx.fillRect(R0 - 7, z + zo + 20, 7, 20); ctx.fillRect(R0 + ROAD, z + zo + 20, 7, 20);
    }
    var fo = s.dist % 70; ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (var f = -70; f < H + 70; f += 70) for (var l = 1; l < N; l++) ctx.fillRect(R0 + l * LANE - 2, f + fo, 4, 36);
    s.obst.forEach(function (o) {
      if (o.pego || (o.batido && o.tipo !== 'buraco')) return;
      var bot = CY - (o.d - s.dist), top = bot - o.h, cx = R0 + CENTRO[o.lane];
      if (bot < -40 || top > H + 40) return;
      if (o.tipo === 'cone') {
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, bot - 2, 20, 6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#FF7A1A'; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx + 17, bot - 4); ctx.lineTo(cx - 17, bot - 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(cx - 9, top + 18, 18, 6); ctx.fillStyle = '#E2601A'; ctx.fillRect(cx - 19, bot - 6, 38, 6);
      } else if (o.tipo === 'buraco') {
        ctx.fillStyle = '#23262E'; ctx.beginPath(); ctx.ellipse(cx, bot - o.h / 2, o.w / 2, o.h / 2, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#555B69'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#15171C'; ctx.beginPath(); ctx.ellipse(cx + 4, bot - o.h / 2 + 3, o.w / 3, o.h / 3.2, 0, 0, 7); ctx.fill();
      } else if (o.tipo === 'carro') carroClassico(ctx, cx, top, '#5E7FA8', '#3F5C82', true);
      else if (o.tipo === 'cancela') {
        if (o.lane === 0) { ctx.fillStyle = '#14235E'; rr(ctx, 2, top - 18, R0 - 4, o.h + 30, 4); ctx.fill(); rr(ctx, W - R0 + 2, top - 18, R0 - 4, o.h + 30, 4); ctx.fill(); ctx.fillStyle = '#EC7000'; ctx.fillRect(2, top - 18, R0 - 4, 6); ctx.fillRect(W - R0 + 2, top - 18, R0 - 4, 6); }
        ctx.fillStyle = '#C9CED8'; rr(ctx, cx - 50, top - 6, 10, o.h + 12, 3); ctx.fill();
        if (o.aberta) { ctx.save(); ctx.translate(cx - 45, top + 4); ctx.rotate(-1.2); for (var i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#E23B3B'; ctx.fillRect(i * 15, -5, 15, 10); } ctx.restore(); }
        else for (var j = 0; j < 6; j++) { ctx.fillStyle = j % 2 ? '#fff' : '#E23B3B'; ctx.fillRect(cx - 42 + j * 15, top + 6, 15, 10); }
      } else if (o.tipo === 'tag') {
        var pul = 1 + Math.sin(s.t * 8) * 0.06;
        ctx.save(); ctx.translate(cx, bot - o.h / 2); ctx.scale(pul, pul); ctx.shadowColor = '#FFB27A'; ctx.shadowBlur = 14;
        ctx.fillStyle = '#14235E'; rr(ctx, -20, -15, 40, 30, 7); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#EC7000'; ctx.font = '900 13px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAG', 0, 1); ctx.restore();
      } else if (o.tipo === 'seguro') {
        var p2 = 1 + Math.sin(s.t * 8) * 0.06;
        ctx.save(); ctx.shadowColor = '#9FD3FF'; ctx.shadowBlur = 14; escudo(ctx, cx, bot - o.h / 2, 34 * p2, '#499EF2'); ctx.restore();
      } else if (o.tipo === 'aviso') {
        ctx.save(); ctx.fillStyle = 'rgba(244,241,234,.9)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 34px Montserrat, Arial, sans-serif';
        ctx.fillText('PEDÁGIO', W / 2, bot - 20); ctx.fillRect(R0 + 12, bot - 2, ROAD - 24, 4); ctx.restore();
      }
    });
    if (!(s.invul > 0 && Math.floor(s.invul * 10) % 2 === 0)) carroClassico(ctx, R0 + s.x, CY, '#EC7000', '#B85600', false);
    if (s.tag) { ctx.fillStyle = '#14235E'; rr(ctx, R0 + s.x - 11, CY + 30, 22, 14, 4); ctx.fill(); ctx.fillStyle = '#EC7000'; ctx.font = '900 8px Montserrat, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAG', R0 + s.x, CY + 37); }
  }

  // ---------- RENDER 2D: REALISTA (vista de cima com texturas, sombras e iluminação) ----------
  var MR = mundo2D(48), REAL = null;
  function ruido(w, h, base, var1, qtd, tam) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    var rr0 = Logica.rng(w * 31 + h);
    for (var i = 0; i < qtd; i++) { var a = var1[Math.floor(rr0() * var1.length)]; g.fillStyle = a; var t = 1 + rr0() * tam; g.fillRect(rr0() * w, rr0() * h, t, t); }
    return c;
  }
  function spriteCarro(cor, corEscura, escala) {
    var E = escala || 2, w = 52, h = 92, c = document.createElement('canvas'); c.width = w * E; c.height = h * E;
    var g = c.getContext('2d'); g.scale(E, E);
    var x = 4, y = 4, cw = 44, ch = 84;
    // carroceria com sombreamento lateral
    var lg = g.createLinearGradient(x, 0, x + cw, 0);
    lg.addColorStop(0, corEscura); lg.addColorStop(0.18, cor); lg.addColorStop(0.5, cor); lg.addColorStop(0.82, cor); lg.addColorStop(1, corEscura);
    g.fillStyle = lg; rr(g, x, y, cw, ch, 13); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke();
    // brilho do capô
    var cap = g.createLinearGradient(0, y, 0, y + 26); cap.addColorStop(0, 'rgba(255,255,255,.28)'); cap.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = cap; rr(g, x + 6, y + 3, cw - 12, 22, 8); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(x + 13, y + 6); g.lineTo(x + 15, y + 22); g.moveTo(x + cw - 13, y + 6); g.lineTo(x + cw - 15, y + 22); g.stroke();
    // para-brisa
    var pb = g.createLinearGradient(0, y + 24, 0, y + 36); pb.addColorStop(0, '#2B3A52'); pb.addColorStop(1, '#101828');
    g.fillStyle = pb; g.beginPath(); g.moveTo(x + 7, y + 36); g.lineTo(x + 10, y + 24); g.lineTo(x + cw - 10, y + 24); g.lineTo(x + cw - 7, y + 36); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(x + 12, y + 34); g.lineTo(x + 15, y + 26); g.lineTo(x + 21, y + 26); g.lineTo(x + 17, y + 34); g.closePath(); g.fill();
    // teto
    var tt = g.createLinearGradient(x + 7, 0, x + cw - 7, 0); tt.addColorStop(0, corEscura); tt.addColorStop(0.5, cor); tt.addColorStop(1, corEscura);
    g.fillStyle = tt; rr(g, x + 7, y + 36, cw - 14, 26, 5); g.fill();
    // vidro traseiro
    g.fillStyle = '#18233A'; g.beginPath(); g.moveTo(x + 8, y + 62); g.lineTo(x + cw - 8, y + 62); g.lineTo(x + cw - 10, y + 72); g.lineTo(x + 10, y + 72); g.closePath(); g.fill();
    // janelas laterais
    g.fillStyle = '#1C2638'; g.fillRect(x + 4, y + 37, 3, 24); g.fillRect(x + cw - 7, y + 37, 3, 24);
    // retrovisores
    g.fillStyle = corEscura; rr(g, x - 3, y + 30, 5, 6, 2); g.fill(); rr(g, x + cw - 2, y + 30, 5, 6, 2); g.fill();
    // faróis e lanternas
    g.fillStyle = '#FFF6D0'; rr(g, x + 4, y + 1, 10, 4, 2); g.fill(); rr(g, x + cw - 14, y + 1, 10, 4, 2); g.fill();
    g.fillStyle = '#B3261E'; rr(g, x + 4, y + ch - 4, 10, 3, 1.5); g.fill(); rr(g, x + cw - 14, y + ch - 4, 10, 3, 1.5); g.fill();
    return c;
  }
  function spriteSombra(w, h) {
    var c = document.createElement('canvas'); c.width = w + 30; c.height = h + 30; var g = c.getContext('2d');
    g.filter = 'blur(6px)'; g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 15, 15, w, h, 14); g.fill(); return c;
  }
  function spriteArvore(r, seedA) {
    var c = document.createElement('canvas'), t = Math.ceil(r * 2.6); c.width = t; c.height = t; var g = c.getContext('2d');
    var rn = Logica.rng(seedA), cx = t / 2, cy = t / 2;
    g.save(); g.filter = 'blur(5px)'; g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(cx + r * 0.25, cy + r * 0.3, r, 0, 7); g.fill(); g.restore();
    for (var i = 0; i < 9; i++) {
      var a = rn() * 6.28, d = rn() * r * 0.45, rr1 = r * (0.45 + rn() * 0.35), px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d;
      var gr = g.createRadialGradient(px - rr1 * 0.35, py - rr1 * 0.35, rr1 * 0.1, px, py, rr1);
      gr.addColorStop(0, '#6FAE4E'); gr.addColorStop(0.6, '#3E7D33'); gr.addColorStop(1, '#2A5A26');
      g.fillStyle = gr; g.beginPath(); g.arc(px, py, rr1, 0, 7); g.fill();
    }
    return c;
  }
  function criarReal() {
    var A = {};
    A.asfalto = ruido(256, 256, '#3E434C', ['#474C55', '#363A42', '#4B505A', '#30343B'], 5200, 2.2);
    var g = A.asfalto.getContext('2d'); g.globalAlpha = 0.18; g.fillStyle = '#2A2D33';
    for (var i = 0; i < 6; i++) { g.beginPath(); g.ellipse(Math.random() * 256, Math.random() * 256, 20 + Math.random() * 40, 8 + Math.random() * 20, Math.random() * 3, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    A.grama = ruido(256, 256, '#4E7F3A', ['#5A8C43', '#44733A', '#5F9246', '#3E6A33', '#6B9A4C'], 7000, 3);
    A.terra = ruido(128, 128, '#9C8E77', ['#A89A82', '#8F826C', '#B1A48C'], 1800, 2);
    A.carros = {
      eu: spriteCarro('#EC7000', '#A84E00'),
      p: [spriteCarro('#E9ECF1', '#A9AFBA'), spriteCarro('#8E97A6', '#59606C'), spriteCarro('#23262D', '#0D0F12'), spriteCarro('#A8322B', '#6E1C17'), spriteCarro('#2F5D9A', '#1B3A63')]
    };
    A.sombraCarro = spriteSombra(44, 84);
    A.arvores = [spriteArvore(34, 11), spriteArvore(42, 23), spriteArvore(28, 37), spriteArvore(38, 51)];
    var vg = document.createElement('canvas'); vg.width = MR.W; vg.height = Math.ceil(MR.H); var gv = vg.getContext('2d');
    var rg = gv.createRadialGradient(MR.W / 2, MR.H * 0.55, MR.W * 0.35, MR.W / 2, MR.H * 0.55, MR.H * 0.75);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.38)'); gv.fillStyle = rg; gv.fillRect(0, 0, vg.width, vg.height);
    A.vinheta = vg;
    A.pat = {};
    return A;
  }
  function padrao(ctx, nome) { if (!REAL.pat[nome]) REAL.pat[nome] = ctx.createPattern(REAL[nome], 'repeat'); return REAL.pat[nome]; }
  function preencher(ctx, nome, x, y, w, h, off) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(0, off % 256);
    ctx.fillStyle = padrao(ctx, nome); ctx.fillRect(x, y - 256, w, h + 512); ctx.restore();
  }
  function buracoForma(ctx, cx, cy, w, h, sd) {
    var rn = Logica.rng(sd), pts = [];
    for (var i = 0; i < 11; i++) { var a = i / 11 * 6.283, k = 0.75 + rn() * 0.35; pts.push([cx + Math.cos(a) * w / 2 * k, cy + Math.sin(a) * h / 2 * k]); }
    ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath();
    return rn;
  }
  function desenharRealista() {
    if (!REAL) REAL = criarReal();
    var M = MR, W = M.W, H = M.H, R0 = M.R0, CY = H - 190, ctx = hctx, off = s.dist;
    ctx.setTransform(M.esc, 0, 0, M.esc, 0, 0);
    // grama, acostamento de terra/concreto e asfalto
    preencher(ctx, 'grama', 0, 0, W, H, off);
    preencher(ctx, 'terra', R0 - 34, 0, 26, H, off); preencher(ctx, 'terra', R0 + ROAD + 8, 0, 26, H, off);
    ctx.fillStyle = '#8D9098'; ctx.fillRect(R0 - 8, 0, 8, H); ctx.fillRect(R0 + ROAD, 0, 8, H);
    preencher(ctx, 'asfalto', R0, 0, ROAD, H, off);
    // marcas de pneu (trilhas mais escuras no centro das faixas)
    ctx.fillStyle = 'rgba(20,22,26,.16)';
    for (var l = 0; l < N; l++) { ctx.fillRect(R0 + CENTRO[l] - 22, 0, 12, H); ctx.fillRect(R0 + CENTRO[l] + 10, 0, 12, H); }
    // defensa metálica com postes
    ctx.fillStyle = '#C9CDD4'; ctx.fillRect(R0 - 22, 0, 4, H); ctx.fillRect(R0 + ROAD + 18, 0, 4, H);
    ctx.fillStyle = '#7E838C'; var po = off % 60;
    for (var p = -60; p < H + 60; p += 60) { ctx.fillRect(R0 - 24, p + po, 8, 5); ctx.fillRect(R0 + ROAD + 16, p + po, 8, 5); }
    // faixas pintadas (bordas contínuas e divisórias tracejadas, com desgaste)
    ctx.fillStyle = 'rgba(244,241,234,.92)'; ctx.fillRect(R0 + 6, 0, 5, H); ctx.fillRect(R0 + ROAD - 11, 0, 5, H);
    var fo = off % 90; ctx.fillStyle = 'rgba(244,241,234,.82)';
    for (var f = -90; f < H + 90; f += 90) for (var k = 1; k < N; k++) ctx.fillRect(R0 + k * LANE - 2.5, f + fo, 5, 44);
    // árvores nas laterais (rolam com a pista)
    var ESP = 150, base = Math.floor(off / ESP);
    for (var i = -2; i < Math.ceil(H / ESP) + 3; i++) {
      var idx = base - i;
      [0, 1].forEach(function (lado) {
        var hsh = Logica.hash('arv' + idx + '_' + lado), spr = REAL.arvores[hsh % REAL.arvores.length];
        if (hsh % 5 === 0) return;
        var y = (off - idx * ESP) + CY - (hsh % 40);
        var x = lado ? (R0 + ROAD + 34 + (hsh % 18)) : (R0 - 34 - (hsh % 18));
        ctx.drawImage(spr, x - spr.width / 2, y - spr.height / 2);
      });
    }
    // objetos no chão (buracos, aviso) primeiro
    s.obst.forEach(function (o) {
      var bot = CY - (o.d - s.dist), top = bot - o.h, cx = R0 + CENTRO[o.lane];
      if (bot < -60 || top > H + 60) return;
      if (o.tipo === 'buraco') {
        var cy = bot - o.h / 2;
        buracoForma(ctx, cx, cy, o.w + 6, o.h + 6, Math.floor(o.d)); ctx.fillStyle = '#5C5A55'; ctx.fill();
        var rn = buracoForma(ctx, cx, cy, o.w, o.h, Math.floor(o.d));
        var gb = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, o.w / 2); gb.addColorStop(0, '#0E0F12'); gb.addColorStop(1, '#2A2B2F');
        ctx.fillStyle = gb; ctx.fill();
        ctx.strokeStyle = 'rgba(15,16,19,.7)'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (var t = 0; t < 4; t++) { var a = rn() * 6.28, r1 = o.w / 2, r2 = r1 + 8 + rn() * 14; ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.7); ctx.lineTo(cx + Math.cos(a + 0.2) * r2, cy + Math.sin(a + 0.2) * r2 * 0.7); }
        ctx.stroke();
      } else if (o.tipo === 'aviso') {
        ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#F4F1EA'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 40px Montserrat, Arial, sans-serif';
        ctx.fillText('PEDÁGIO', R0 + ROAD / 2, bot - 22); ctx.fillRect(R0 + 14, bot - 2, ROAD - 28, 5); ctx.restore();
      }
    });
    // objetos com altura (sombras + corpo)
    s.obst.forEach(function (o) {
      if (o.pego || (o.batido && o.tipo !== 'buraco') || o.tipo === 'buraco' || o.tipo === 'aviso') return;
      var bot = CY - (o.d - s.dist), top = bot - o.h, cx = R0 + CENTRO[o.lane];
      if (bot < -60 || top > H + 60) return;
      if (o.tipo === 'cone') {
        var cy2 = bot - o.h / 2;
        ctx.save(); ctx.filter = 'blur(3px)'; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(cx + 6, cy2 + 7, 17, 0, 7); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#D9561A'; rr(ctx, cx - 17, cy2 - 17, 34, 34, 5); ctx.fill();
        var gc = ctx.createRadialGradient(cx - 4, cy2 - 4, 1, cx, cy2, 15); gc.addColorStop(0, '#FFB070'); gc.addColorStop(1, '#F06A12');
        ctx.fillStyle = gc; ctx.beginPath(); ctx.arc(cx, cy2, 14, 0, 7); ctx.fill();
        ctx.strokeStyle = '#F4F1EA'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(cx, cy2, 8.5, 0, 7); ctx.stroke();
        ctx.fillStyle = '#FFD2A8'; ctx.beginPath(); ctx.arc(cx, cy2, 3, 0, 7); ctx.fill();
      } else if (o.tipo === 'carro') {
        var spr = REAL.carros.p[Logica.hash('c' + Math.floor(o.d) + o.lane) % REAL.carros.p.length];
        var sx = cx - 26, sy = bot - o.h - 1;
        ctx.drawImage(REAL.sombraCarro, sx - 9, sy - 6, 66, 106);
        ctx.drawImage(spr, sx, sy, 52, 92);
        if (Math.floor(s.t * 3) % 2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,170,30,.85)'; ctx.shadowColor = '#FFB020'; ctx.shadowBlur = 12;
          [[sx + 9, sy + 5], [sx + 43, sy + 5], [sx + 9, sy + 87], [sx + 43, sy + 87]].forEach(function (q) { ctx.beginPath(); ctx.arc(q[0], q[1], 3.5, 0, 7); ctx.fill(); }); ctx.restore(); }
      } else if (o.tipo === 'cancela') {
        var py = top + 10;
        ctx.fillStyle = '#5F646D'; rr(ctx, cx - 50, py - 7, 12, 14, 3); ctx.fill();
        ctx.save(); ctx.translate(cx - 44, py);
        o._ang = (o._ang || 0) + ((o.aberta ? -1.35 : 0) - (o._ang || 0)) * 0.2; ctx.rotate(o._ang);
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(4, 3, 88, 8);
        for (var b = 0; b < 8; b++) { ctx.fillStyle = b % 2 ? '#F4F1EA' : '#D8342B'; ctx.fillRect(b * 11, -4, 11, 8); }
        ctx.restore();
        if (o.lane === 0) {
          // cabines nas laterais
          [R0 - 50, R0 + ROAD - 8].forEach(function (bx) {
            ctx.save(); ctx.filter = 'blur(4px)'; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(bx + 8, py - 22, 58, 60); ctx.restore();
            ctx.fillStyle = '#14235E'; rr(ctx, bx, py - 30, 58, 58, 6); ctx.fill();
            ctx.fillStyle = '#EC7000'; ctx.fillRect(bx, py - 30, 58, 8);
            ctx.fillStyle = '#9CC9FF'; ctx.fillRect(bx + 8, py - 14, 42, 10);
          });
        }
      } else if (o.tipo === 'tag' || o.tipo === 'seguro') {
        var cy3 = bot - o.h / 2, pul = 1 + Math.sin(s.t * 7) * 0.07;
        ctx.save(); ctx.filter = 'blur(4px)'; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(cx + 8, cy3 + 12, 18, 10, 0, 0, 7); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(cx, cy3); ctx.scale(pul, pul);
        if (o.tipo === 'tag') { ctx.shadowColor = '#FFB27A'; ctx.shadowBlur = 16; ctx.fillStyle = '#14235E'; rr(ctx, -21, -15, 42, 30, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#F4F1EA'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#EC7000'; ctx.font = '900 13px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAG', 0, 1); }
        else { ctx.shadowColor = '#9FD3FF'; ctx.shadowBlur = 18; escudo(ctx, 0, 0, 36, '#499EF2'); }
        ctx.restore();
      }
    });
    // carro do jogador (sombra, faróis e corpo)
    var px = R0 + s.x, inclin = (CENTRO[s.lane] - s.x) * -0.004;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var fg = ctx.createRadialGradient(px, CY - 60, 4, px, CY - 60, 90); fg.addColorStop(0, 'rgba(255,240,190,.22)'); fg.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(px - 18, CY + 2); ctx.lineTo(px - 70, CY - 150); ctx.lineTo(px + 70, CY - 150); ctx.lineTo(px + 18, CY + 2); ctx.closePath(); ctx.fill(); ctx.restore();
    if (!(s.invul > 0 && Math.floor(s.invul * 10) % 2 === 0)) {
      ctx.save(); ctx.translate(px, CY + 46); ctx.rotate(inclin);
      ctx.drawImage(REAL.sombraCarro, -26 - 9 + 5, -46 - 6 + 6, 66, 106);
      var spEu = imgCima(CARRO_ID); ctx.drawImage(spEu || REAL.carros.eu, -26, -46, 52, 92);
      if (s.tag) { ctx.fillStyle = '#14235E'; rr(ctx, -10, -4, 20, 12, 3); ctx.fill(); ctx.fillStyle = '#EC7000'; ctx.font = '900 7px Montserrat, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAG', 0, 2); }
      ctx.restore();
    }
    // cobertura da praça de pedágio (por cima dos carros)
    s.obst.forEach(function (o) {
      if (o.tipo !== 'cancela' || o.lane !== 0) return;
      var top = CY - (o.d - s.dist) - o.h;
      if (top < -200 || top > H + 200) return;
      ctx.fillStyle = 'rgba(20,35,94,.82)'; ctx.fillRect(R0 - 80, top - 70, ROAD + 160, 64);
      ctx.fillStyle = '#EC7000'; ctx.fillRect(R0 - 80, top - 12, ROAD + 160, 6);
      ctx.fillStyle = '#F4F1EA'; ctx.font = '800 22px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PRAÇA DE PEDÁGIO', R0 + ROAD / 2, top - 40);
    });
    // linhas de velocidade em níveis altos
    var nv = nivel(s.t);
    if (nv >= 4 && s.fase === 'rodando') {
      ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(0.18, 0.04 * (nv - 3)) + ')'; ctx.lineWidth = 2; ctx.beginPath();
      for (var q = 0; q < 10; q++) { var lxq = R0 + ((q * 97 + Math.floor(off / 7)) % ROAD), lyq = ((q * 173 + off * 1.3) % H); ctx.moveTo(lxq, lyq); ctx.lineTo(lxq, lyq + 60); }
      ctx.stroke();
    }
    ctx.drawImage(REAL.vinheta, 0, 0, W, H);
  }

  var CARRO_ID = (CR && CR.carro) || carroPreferido();
  var VISUAL = ((visual === '3d' || visual === '3dreal') && R3) ? visual : (visual === 'realista' ? 'realista' : 'classico');
  function desenhar(tempoReal) {
    if (VISUAL === '3d' || VISUAL === '3dreal') { R3.render(tempoReal); desenharHUD(true); }
    else if (VISUAL === 'realista') { desenharRealista(); desenharHUD(false); }
    else { desenharClassico(); desenharHUD(false); }
  }
  function quadro(ts) {
    if (parado) return;
    if (ultimo == null) ultimo = ts;
    var dt = Math.min(0.05, (ts - ultimo) / 1000); ultimo = ts;
    if (s.fase === 'contagem') { s.cont -= dt; if (s.cont <= 0) s.fase = 'rodando'; }
    else if (s.fase === 'rodando') { s.acc += dt; while (s.acc >= STEP && s.vivo) { passo(STEP); s.acc -= STEP; } }
    else if (s.fase === 'batida') {
      s.flash = Math.max(0, s.flash - dt * 1.4); if (s.tremor > 0) s.tremor -= dt;
      if (!fimDisparado) { fimDisparado = true; setTimeout(function () { parar(); aoFim(Math.round(placar() * 100) / 100); }, 1100); }
    }
    desenhar(ts / 1000);
    raf = requestAnimationFrame(quadro);
  }
  function tecla(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); mover(-1); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); mover(1); }
  }
  function toque(e) {
    e.preventDefault();
    var rect = wrap.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    mover(x < rect.width / 2 ? -1 : 1);
  }
  function oculto() { if (document.hidden && s.fase === 'rodando' && s.vivo) { s.vivo = false; s.fase = 'batida'; s.flash = 1; } }
  function parar() {
    parado = true; if (raf) cancelAnimationFrame(raf);
    document.removeEventListener('keydown', tecla); document.removeEventListener('visibilitychange', oculto);
    wrap.removeEventListener('pointerdown', toque);
    if (R3) { R3.destruir(); R3 = null; }
  }
  document.addEventListener('keydown', tecla);
  document.addEventListener('visibilitychange', oculto);
  wrap.addEventListener('pointerdown', toque);
  raf = requestAnimationFrame(quadro);
  this.parar = parar;
  this.r3 = function () { return R3; };
  this.pausar = function () { parado = true; if (raf) cancelAnimationFrame(raf); };
  this.abortar = function () { if (s.fase === 'rodando' && s.vivo) { s.vivo = false; s.fase = 'batida'; s.flash = 1; } else if (s.fase === 'contagem') { s.fase = 'batida'; s.vivo = false; } };
  this.estado = s;
  this.modo = VISUAL;
  this._passo = passo;
  this._desenhar = function () { desenhar(performance.now() / 1000); };
  this.N = N; this.CENTRO = CENTRO;
}
