/* ================== 3D REALISTA ==================
   Mesma simulação do Motor; só a renderização muda.
   Materiais físicos (PBR), sombras do sol, céu com reflexo na lataria, carros modelados,
   cenário de rodovia e efeitos de batida. Reduz a qualidade sozinho em celular fraco. */
function criar3DReal(E) {
  var T = window.THREE, s = E.s, K = 0.035, N = E.N, LANE = E.LANE, ROAD = E.ROAD, CENTRO = E.CENTRO, CARH = E.CARH;
  var renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(E.dpr); renderer.setSize(E.cssW, E.cssH);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  E.box3d.appendChild(renderer.domElement);
  function cor(hex) { return new T.Color(hex).convertSRGBToLinear(); }
  function canvasTex(w, h, fn, rep, srgb) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c); t.anisotropy = 8; if (srgb !== false) t.encoding = T.sRGBEncoding;
    if (rep) { t.wrapS = T.RepeatWrapping; t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // ---------- céu, sol, neblina e reflexo ----------
  var HORIZ = 0xF0D2B0, TOPO = 0x4A80C4;
  var scene = new T.Scene();
  scene.fog = new T.Fog(cor(0xDCC8B0), 55, 235);
  var ceuMat = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: { topo: { value: cor(TOPO) }, hor: { value: cor(HORIZ) }, sol: { value: new T.Vector3(-0.35, 0.18, -1).normalize() } },
    vertexShader: 'varying vec3 vP0; void main(){ vP0 = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 topo; uniform vec3 hor; uniform vec3 sol; varying vec3 vP0; void main(){ vec3 vP = normalize(vP0); float h = max(vP.y,0.0); vec3 c = mix(hor, topo, pow(h,0.55)); float d = max(dot(vP, sol),0.0); c += vec3(1.0,0.8,0.55)*pow(d,600.0)*3.0 + vec3(1.0,0.65,0.35)*pow(d,28.0)*0.22; if(vP.y<0.0) c = hor*0.9; gl_FragColor = vec4(c,1.0); }'
  });
  var ceu = new T.Mesh(new T.SphereGeometry(400, 64, 32), ceuMat); scene.add(ceu);
  // mapa de ambiente para reflexos (a partir do próprio céu)
  try {
    var pm = new T.PMREMGenerator(renderer), cenaCeu = new T.Scene(); cenaCeu.add(new T.Mesh(new T.SphereGeometry(400, 32, 16), ceuMat));
    scene.environment = pm.fromScene(cenaCeu, 0.02).texture; pm.dispose();
  } catch (e) { }
  var cam = new T.PerspectiveCamera(62, E.cssW / E.cssH, 0.1, 600);
  scene.add(new T.HemisphereLight(cor(0xCFE2FF), cor(0x5C4A36), 0.55));
  var sol = new T.DirectionalLight(cor(0xFFE2BC), 2.2);
  sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024);
  var sc = sol.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 22; sc.bottom = -10; sc.near = 1; sc.far = 80; sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.02;
  scene.add(sol); scene.add(sol.target);

  // ---------- pista ----------
  var RW = ROAD * K, COMP = 260, PER = 12, REP = COMP / PER;
  function desenharAsfalto(g, w, h, comFaixas) {
    g.fillStyle = '#4A4E55'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 26000; i++) { var v = 55 + Math.random() * 45; g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 4) + ',' + (0.25 + Math.random() * 0.35) + ')'; var t = Math.random() < 0.9 ? 1 : 2; g.fillRect(Math.random() * w, Math.random() * h, t, t); }
    for (var p = 0; p < 7; p++) { g.fillStyle = 'rgba(30,32,36,' + (0.12 + Math.random() * 0.12) + ')'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 90, 12 + Math.random() * 40, Math.random() * 3, 0, 7); g.fill(); }
    // trilhas de pneu
    for (var l = 0; l < N; l++) { var cx = (l + 0.5) * w / N; g.fillStyle = 'rgba(25,26,30,.18)'; g.fillRect(cx - w / N * 0.28, 0, w / N * 0.12, h); g.fillRect(cx + w / N * 0.16, 0, w / N * 0.12, h); }
    if (!comFaixas) return;
    g.fillStyle = '#EDEBE4'; g.fillRect(10, 0, 9, h); g.fillRect(w - 19, 0, 9, h);
    for (var k = 1; k < N; k++) { var x = k * w / N - 4; g.fillRect(x, h * 0.05, 8, h * 0.42); }
    g.globalCompositeOperation = 'destination-out';
    for (var j = 0; j < 900; j++) { g.fillStyle = 'rgba(0,0,0,' + Math.random() * 0.35 + ')'; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    g.globalCompositeOperation = 'source-over';
  }
  var texRua = canvasTex(1024, 1024, function (g, w, h) { desenharAsfalto(g, w, h, true); }, [1, REP]);
  var bumpRua = canvasTex(512, 512, function (g, w, h) { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (var i = 0; i < 30000; i++) { var v = Math.floor(Math.random() * 255); g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); } }, [3, REP * 2], false);
  var matRua = new T.MeshStandardMaterial({ map: texRua, bumpMap: bumpRua, bumpScale: 0.025, roughness: 0.92, metalness: 0 });
  var rua = new T.Mesh(new T.PlaneGeometry(RW, COMP), matRua);
  rua.rotation.x = -Math.PI / 2; rua.position.set(0, 0, -COMP / 2 + 20); rua.receiveShadow = true; scene.add(rua);
  var texAc = canvasTex(256, 512, function (g, w, h) { desenharAsfalto(g, w, h, false); g.fillStyle = 'rgba(160,150,130,.25)'; g.fillRect(0, 0, w, h); }, [1, REP]);
  var texGrama = canvasTex(512, 512, function (g, w, h) {
    g.fillStyle = '#5B7F3C'; g.fillRect(0, 0, w, h);
    var tons = ['#6A8F45', '#4F7334', '#7A9A4F', '#476A30', '#8A9A55', '#5E8A3E'];
    for (var i = 0; i < 40000; i++) { g.fillStyle = tons[i % tons.length]; g.globalAlpha = 0.35 + Math.random() * 0.4; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 2 + Math.random() * 4); }
    g.globalAlpha = 1;
    for (var p = 0; p < 10; p++) { g.fillStyle = 'rgba(140,130,80,.18)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 60, 20 + Math.random() * 40, 0, 0, 7); g.fill(); }
  }, [14, REP]);
  var matGrama = new T.MeshStandardMaterial({ map: texGrama, roughness: 1 });
  var grama = new T.Mesh(new T.PlaneGeometry(260, COMP), matGrama);
  grama.rotation.x = -Math.PI / 2; grama.position.set(0, -0.03, -COMP / 2 + 20); grama.receiveShadow = true; scene.add(grama);
  var matAc = new T.MeshStandardMaterial({ map: texAc, roughness: 0.95 });
  var matMetal = new T.MeshStandardMaterial({ color: cor(0xC8CDD5), metalness: 0.85, roughness: 0.35 });
  var matPosteDef = new T.MeshStandardMaterial({ color: cor(0x8A9099), metalness: 0.6, roughness: 0.5 });
  [-1, 1].forEach(function (lado) {
    var ac = new T.Mesh(new T.PlaneGeometry(2.6, COMP), matAc); ac.rotation.x = -Math.PI / 2; ac.position.set(lado * (RW / 2 + 1.3), 0.002, -COMP / 2 + 20); ac.receiveShadow = true; scene.add(ac);
    var def = new T.Mesh(new T.BoxGeometry(0.06, 0.32, COMP), matMetal); def.position.set(lado * (RW / 2 + 2.7), 0.62, -COMP / 2 + 20); def.castShadow = true; scene.add(def);
    var meio = new T.Mesh(new T.BoxGeometry(0.02, 0.06, COMP), matPosteDef); meio.position.set(lado * (RW / 2 + 2.67), 0.62, -COMP / 2 + 20); scene.add(meio);
  });
  // morros no horizonte
  var morros = new T.Group(), matMorro = new T.MeshStandardMaterial({ color: cor(0x6F8A66), roughness: 1, flatShading: true });
  for (var m = 0; m < 14; m++) {
    var geo = new T.ConeGeometry(30 + (m * 37 % 40), 18 + (m * 13 % 22), 7);
    var mm = new T.Mesh(geo, matMorro); mm.position.set(-200 + m * 32, 4, -175 - (m * 53 % 40)); mm.scale.z = 0.6; morros.add(mm);
  }
  scene.add(morros);

  // ---------- cenário que rola ----------
  var ESP = 10, QT = 26, LOOP = ESP * QT, rolam = [];
  var matTronco = new T.MeshStandardMaterial({ color: cor(0x5A4130), roughness: 1 });
  var matFolhas = [0x3D6B33, 0x4A7A3A, 0x557F3B, 0x35602E].map(function (c) { return new T.MeshStandardMaterial({ color: cor(c), roughness: 0.95, flatShading: true }); });
  var geoFolha = new T.IcosahedronGeometry(1, 1), geoTronco = new T.CylinderGeometry(0.16, 0.24, 2.2, 7);
  function arvore(semente) {
    var g = new T.Group(), rn = Logica.rng(semente);
    var tr = new T.Mesh(geoTronco, matTronco); tr.position.y = 1.1; tr.castShadow = true; g.add(tr);
    var nb = 4 + Math.floor(rn() * 3);
    for (var i = 0; i < nb; i++) {
      var f = new T.Mesh(geoFolha, matFolhas[Math.floor(rn() * matFolhas.length)]);
      var esc = 0.9 + rn() * 0.8; f.scale.set(esc, esc * (0.8 + rn() * 0.4), esc);
      f.position.set((rn() - 0.5) * 1.6, 2.6 + rn() * 1.4, (rn() - 0.5) * 1.6); f.castShadow = true; g.add(f);
    }
    var e = 0.8 + rn() * 0.7; g.scale.set(e, e, e);
    return g;
  }
  var matPoste = new T.MeshStandardMaterial({ color: cor(0x9AA0A8), metalness: 0.7, roughness: 0.4 });
  var matLamp = new T.MeshStandardMaterial({ color: cor(0xFFF1D0), emissive: cor(0xFFE6B0), emissiveIntensity: 1.2 });
  function poste(lado) {
    var g = new T.Group();
    var h = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 7, 8), matPoste); h.position.y = 3.5; h.castShadow = true; g.add(h);
    var b = new T.Mesh(new T.BoxGeometry(2.2, 0.08, 0.08), matPoste); b.position.set(-lado * 1.05, 6.95, 0); g.add(b);
    var l = new T.Mesh(new T.BoxGeometry(0.6, 0.12, 0.28), matLamp); l.position.set(-lado * 2.05, 6.85, 0); g.add(l);
    return g;
  }
  var texPlaca = canvasTex(512, 256, function (g, w, h) {
    g.fillStyle = '#1F6B3A'; rr(g, 4, 4, w - 8, h - 8, 18); g.fill(); g.strokeStyle = '#F4F1EA'; g.lineWidth = 8; rr(g, 16, 16, w - 32, h - 32, 12); g.stroke();
    g.fillStyle = '#F4F1EA'; g.font = '800 54px Montserrat, Arial, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('Pedágio', 44, 92); g.fillText('2 km', 44, 170); g.font = '800 44px Montserrat, Arial, sans-serif'; g.textAlign = 'right'; g.fillText('↑', w - 50, 130);
  });
  function placa() {
    var g = new T.Group();
    [-1.6, 1.6].forEach(function (x) { var p = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 4.2, 8), matPoste); p.position.set(x, 2.1, 0); p.castShadow = true; g.add(p); });
    var pl = new T.Mesh(new T.BoxGeometry(4, 2, 0.08), new T.MeshStandardMaterial({ map: texPlaca, roughness: 0.6 })); pl.position.y = 4.4; pl.castShadow = true; g.add(pl);
    return g;
  }
  for (var i = 0; i < QT; i++) {
    [-1, 1].forEach(function (lado) {
      var hs = Logica.hash('a' + i + lado);
      var a = arvore(hs); a.position.x = lado * (RW / 2 + 6 + (hs % 9)); a.userData.base = i * ESP + (lado > 0 ? 4 : 0) + (hs % 4); scene.add(a); rolam.push(a);
      if (hs % 3 === 0) { var a2 = arvore(hs + 7); a2.position.x = lado * (RW / 2 + 15 + (hs % 12)); a2.userData.base = i * ESP + 6; scene.add(a2); rolam.push(a2); }
      if (i % 3 === 0) { var p = poste(lado); p.position.x = lado * (RW / 2 + 3.2); p.userData.base = i * ESP; scene.add(p); rolam.push(p); }
      var pd = new T.Mesh(new T.BoxGeometry(0.1, 0.62, 0.1), matPosteDef); pd.position.set(lado * (RW / 2 + 2.74), 0.31, 0); pd.userData.base = i * ESP; scene.add(pd); rolam.push(pd);
      var pd2 = pd.clone(); pd2.userData.base = i * ESP + ESP / 2; scene.add(pd2); rolam.push(pd2);
    });
    if (i % 13 === 5) { var pl = placa(); pl.position.x = RW / 2 + 4.5; pl.rotation.y = -0.15; pl.userData.base = i * ESP; scene.add(pl); rolam.push(pl); }
  }

  // ---------- carros modelados ----------
  function extrude(pts, larg, bevel, arcos) {
    var sh = new T.Shape();
    pts.forEach(function (p, i) { if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]); });
    if (arcos) { sh.lineTo(1.1, 0.24); sh.absarc(0.92, 0.24, 0.39, 0, Math.PI, false); sh.lineTo(-0.55, 0.24); sh.absarc(-0.92, 0.24, 0.39, 0, Math.PI, false); }
    sh.closePath();
    var gg = new T.ExtrudeGeometry(sh, bevel ? { depth: larg, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 4, curveSegments: 18 } : { depth: larg, bevelEnabled: false, curveSegments: 12 });
    gg.translate(0, 0, -larg / 2); gg.rotateY(-Math.PI / 2); return gg;
  }
  var LARG = 1.5;
  // parte de baixo da carroceria (até a linha da cintura), com caixas de roda
  var geoCorpo = extrude([[-1.45, 0.24], [-1.48, 0.5], [-1.4, 0.62], [-0.62, 0.72], [-0.4, 0.76], [0.98, 0.79], [1.38, 0.74], [1.48, 0.6], [1.46, 0.24]], LARG, true, true);
  // estufa de vidro (para-brisa, laterais e vidro traseiro)
  var geoJanela = extrude([[-0.44, 0.76], [-0.03, 1.1], [0.56, 1.11], [0.98, 0.79]], LARG - 0.06, false);
  // teto e colunas na cor do carro
  var geoTeto = extrude([[-0.06, 1.1], [0.6, 1.11], [0.6, 1.17], [-0.04, 1.16]], LARG - 0.04, true);
  var geoColA = extrude([[-0.45, 0.76], [-0.04, 1.11], [0.03, 1.11], [-0.35, 0.76]], 0.09, false);
  var geoColC = extrude([[0.99, 0.79], [0.57, 1.12], [0.47, 1.12], [0.86, 0.79]], 0.09, false);
  var matVidro = new T.MeshStandardMaterial({ color: cor(0x0B1018), metalness: 0.15, roughness: 0.06, envMapIntensity: 0.45 });
  var matPneu = new T.MeshStandardMaterial({ color: cor(0x18191C), roughness: 0.85 });
  var matAro = new T.MeshStandardMaterial({ color: cor(0xC9CED6), metalness: 1, roughness: 0.25 });
  var matFarol = new T.MeshStandardMaterial({ color: cor(0xFFF8E0), emissive: cor(0xFFF1C8), emissiveIntensity: 2 });
  var matPreto = new T.MeshStandardMaterial({ color: cor(0x15171A), roughness: 0.6 });
  var geoPneu = new T.CylinderGeometry(0.34, 0.34, 0.26, 22), geoAro = new T.CylinderGeometry(0.21, 0.21, 0.27, 12);
  var texGlow = canvasTex(64, 64, function (g, w, h) { var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  function brilho(corHex, tam) { var sp = new T.Sprite(new T.SpriteMaterial({ map: texGlow, color: corHex, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); sp.scale.set(tam, tam, 1); return sp; }
  function carro(corHex, opts) {
    opts = opts || {};
    var g = new T.Group();
    var pintura = new T.MeshStandardMaterial({ color: cor(corHex), metalness: 0.55, roughness: 0.28, envMapIntensity: 1.2 });
    var corpo = new T.Mesh(geoCorpo, pintura); corpo.castShadow = true; corpo.receiveShadow = true; g.add(corpo);
    var vid = new T.Mesh(geoJanela, matVidro); vid.castShadow = true; g.add(vid);
    var teto = new T.Mesh(geoTeto, pintura); teto.castShadow = true; g.add(teto);
    [geoColA, geoColC].forEach(function (gg) { [-1, 1].forEach(function (ld) { var m = new T.Mesh(gg, pintura); m.position.x = ld * (LARG / 2 - 0.06); g.add(m); }); });
    [-1, 1].forEach(function (ld) { var colB = new T.Mesh(new T.BoxGeometry(0.09, 0.34, 0.08), pintura); colB.position.set(ld * (LARG / 2 - 0.06), 0.93, 0.27); g.add(colB); });
    var pc1 = new T.Mesh(new T.BoxGeometry(LARG + 0.12, 0.14, 0.16), matPreto); pc1.position.set(0, 0.3, -1.53); g.add(pc1);
    var pc2 = pc1.clone(); pc2.position.z = 1.53; g.add(pc2);
    g.userData.rodas = [];
    [[-0.84, -0.92], [0.84, -0.92], [-0.84, 0.92], [0.84, 0.92]].forEach(function (p) {
      var r = new T.Group(); var pn = new T.Mesh(geoPneu, matPneu); pn.castShadow = true; r.add(pn); var aro = new T.Mesh(geoAro, matAro); r.add(aro);
      r.rotation.z = Math.PI / 2; r.position.set(p[0], 0.34, p[1]); g.add(r); g.userData.rodas.push(r);
    });
    [-0.5, 0.5].forEach(function (x) {
      var f = new T.Mesh(new T.BoxGeometry(0.36, 0.1, 0.06), matFarol); f.position.set(x, 0.55, -1.52); g.add(f);
    });
    g.userData.lant = [];
    [-0.55, 0.55].forEach(function (x) {
      var m = new T.MeshStandardMaterial({ color: cor(0x9E1C14), emissive: cor(0xC0251A), emissiveIntensity: 0.6 });
      var l = new T.Mesh(new T.BoxGeometry(0.38, 0.12, 0.06), m); l.position.set(x, 0.62, 1.52); g.add(l); g.userData.lant.push(l);
      var b = brilho(0xFF5A3C, 0.55); b.position.set(x, 0.62, 1.6); b.visible = !!opts.freio; g.add(b); l.userData.glow = b;
    });
    return g;
  }
  var meu = carro(0x2F7FE0, { farois: true }); scene.add(meu);
  // carro escolhido na garagem: troca o modelo do Aura pelo modelo 3D quando ele terminar de carregar
  var cfgCarro = CARROS[E.carro] || CARROS.aura;
  if (cfgCarro.arquivo) carregarModeloCarro(E.carro, function (modelo) {
    if (!modelo) return;
    var manter = [bolha];
    meu.children.slice().forEach(function (ch) { if (manter.indexOf(ch) < 0) meu.remove(ch); });
    modelo.traverse(function (m) { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; if (m.material && m.material.isMeshStandardMaterial) m.material.envMapIntensity = 1.1;
      // vidros escuros (insulfilm): esconde a cabine vazia do modelo
      if (m.material && (m.material.transparent || /glass|vidro|window/i.test(m.material.name || ''))) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = Math.max(m.material.opacity || 0, 0.9); m.material.color = new T.Color(0x0B1018); if ('metalness' in m.material) { m.material.metalness = 0.2; m.material.roughness = 0.05; } }
    } });
    meu.add(modelo);
    var somb = new T.Mesh(new T.PlaneGeometry(2.4, 3.8), new T.MeshBasicMaterial({ map: texGlow, color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })); somb.rotation.x = -Math.PI / 2; somb.position.y = 0.012; meu.add(somb);
    meu.userData.somb = somb; meu.userData.modelo = true;
    meu.userData.rodas = []; meu.userData.lant = [];
  });
  var bolha = new T.Mesh(new T.SphereGeometry(2.1, 24, 16), new T.MeshStandardMaterial({ color: cor(0x499EF2), transparent: true, opacity: 0.18, emissive: cor(0x499EF2), emissiveIntensity: 0.6, depthWrite: false }));
  bolha.scale.set(0.75, 0.55, 1); bolha.visible = false; meu.add(bolha); bolha.position.y = 0.6;
  // fotografa o carro escolhido sem cenário (usado para gerar as fotos da garagem e o carro da vista de cima)
  E.fotoCarro = function (vista, w, h) {
    var rd = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    rd.outputEncoding = T.sRGBEncoding; rd.toneMapping = T.ACESFilmicToneMapping; rd.toneMappingExposure = 1.1;
    rd.setPixelRatio(1); rd.setSize(w, h, false); rd.setClearColor(0x000000, 0);
    var cena = new T.Scene();
    try { var pm2 = new T.PMREMGenerator(rd), cc = new T.Scene(); cc.add(new T.Mesh(new T.SphereGeometry(400, 32, 16), ceuMat)); cena.environment = pm2.fromScene(cc, 0.02).texture; pm2.dispose(); } catch (e) { }
    cena.add(new T.HemisphereLight(cor(0xE4EEFF), cor(0x6A5A48), 0.9));
    var luz = new T.DirectionalLight(cor(0xFFF1DE), vista === 'cima' ? 1.6 : 2.4); luz.position.set(vista === 'cima' ? 2 : -4, 9, vista === 'cima' ? 3 : -6); cena.add(luz);
    var pai = meu.parent, pos = meu.position.clone(), rot = meu.rotation.clone();
    if (meu.userData.somb) meu.userData.somb.visible = false;
    pai.remove(meu); cena.add(meu); meu.position.set(0, 0, 0); meu.rotation.set(0, 0, 0);
    var cam2;
    if (vista === 'cima') { cam2 = new T.OrthographicCamera(-0.9, 0.9, 1.6, -1.6, 0.1, 50); cam2.position.set(0, 20, 0); cam2.up.set(0, 0, -1); cam2.lookAt(0, 0, 0); }
    else { cam2 = new T.PerspectiveCamera(30, w / h, 0.1, 100); cam2.position.set(-5.2, 2.6, -6.2); cam2.lookAt(0, 0.45, 0); }
    rd.render(cena, cam2);
    var url = rd.domElement.toDataURL('image/png');
    rd.dispose();
    cena.remove(meu); pai.add(meu); meu.position.copy(pos); meu.rotation.copy(rot);
    if (meu.userData.somb) meu.userData.somb.visible = true;
    return url;
  };

  // ---------- objetos da pista ----------
  var texTag = canvasTex(128, 96, function (g, w, h) { g.fillStyle = '#14235E'; rr(g, 4, 4, w - 8, h - 8, 16); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#EC7000'; g.font = '900 44px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TAG', w / 2, h / 2 + 2); });
  var texSeg = canvasTex(128, 160, function (g, w, h) {
    g.save(); g.translate(w / 2, 62); g.scale(3.3, 3.3); g.beginPath(); g.moveTo(0, -15); g.lineTo(12, -10); g.lineTo(12, 0); g.quadraticCurveTo(12, 11, 0, 16); g.quadraticCurveTo(-12, 11, -12, 0); g.lineTo(-12, -10); g.closePath();
    g.fillStyle = '#499EF2'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.stroke(); g.beginPath(); g.moveTo(-5, 0); g.lineTo(-1, 5); g.lineTo(6, -5); g.lineWidth = 2.4; g.lineCap = 'round'; g.stroke(); g.restore();
    g.fillStyle = '#14235E'; rr(g, 8, 122, w - 16, 32, 10); g.fill(); g.fillStyle = '#fff'; g.font = '800 19px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SEGURO', w / 2, 139);
  });
  var texAviso = canvasTex(512, 96, function (g, w, h) { g.fillStyle = 'rgba(237,235,228,.92)'; g.font = '900 64px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PEDÁGIO', w / 2, h / 2); });
  var texBarra = canvasTex(256, 32, function (g, w, h) { for (var i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#F4F1EA' : '#D8342B'; g.fillRect(i * w / 8, 0, w / 8, h); } });
  var texBuraco = canvasTex(256, 256, function (g, w, h) {
    var rn = Logica.rng(77), pts = [];
    for (var i = 0; i < 14; i++) { var a = i / 14 * 6.283, k = 0.7 + rn() * 0.28; pts.push([w / 2 + Math.cos(a) * w * 0.46 * k, h / 2 + Math.sin(a) * h * 0.46 * k]); }
    g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath();
    g.fillStyle = '#6B6760'; g.fill();
    g.save(); g.scale(0.86, 0.86); g.translate(w * 0.08, h * 0.08);
    g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath();
    var gr = g.createRadialGradient(w * 0.45, h * 0.42, 4, w / 2, h / 2, w * 0.45); gr.addColorStop(0, '#08090B'); gr.addColorStop(1, '#2C2D30'); g.fillStyle = gr; g.fill(); g.restore();
    g.strokeStyle = 'rgba(20,20,22,.8)'; g.lineWidth = 3;
    for (var t = 0; t < 7; t++) { var a2 = rn() * 6.28; g.beginPath(); g.moveTo(w / 2 + Math.cos(a2) * w * 0.4, h / 2 + Math.sin(a2) * h * 0.4); g.lineTo(w / 2 + Math.cos(a2 + 0.25) * w * 0.5, h / 2 + Math.sin(a2 + 0.25) * h * 0.5); g.stroke(); }
  });
  var matCone = new T.MeshStandardMaterial({ color: cor(0xFF6A10), roughness: 0.55 });
  var matRefl = new T.MeshStandardMaterial({ color: cor(0xF4F4F4), roughness: 0.25, metalness: 0.2, emissive: cor(0x555555) });
  var matCabine = new T.MeshStandardMaterial({ color: cor(0x14235E), roughness: 0.5, metalness: 0.2 });
  var matCobertura = new T.MeshStandardMaterial({ color: cor(0x1B2C70), roughness: 0.45, metalness: 0.3 });
  var matLaranja = new T.MeshStandardMaterial({ color: cor(0xEC7000), roughness: 0.5, emissive: cor(0x6A2E00), emissiveIntensity: 0.4 });
  var matVidroCab = new T.MeshStandardMaterial({ color: cor(0x9CC9FF), metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.65 });
  var CORES_PARADOS = [0xE6E8EC, 0x8E97A6, 0x202329, 0xC9CDD3, 0x4F5A4C, 0x6B6F55];
  function criarMesh(o) {
    var g = new T.Group(), wm = o.w * K, lm = o.h * K;
    if (o.tipo === 'cone') {
      var cone = new T.Mesh(new T.ConeGeometry(0.3, 0.8, 24), matCone); cone.position.y = 0.46; cone.castShadow = true; g.add(cone);
      var f1 = new T.Mesh(new T.CylinderGeometry(0.17, 0.215, 0.12, 24), matRefl); f1.position.y = 0.58; g.add(f1);
      var f2 = new T.Mesh(new T.CylinderGeometry(0.235, 0.27, 0.1, 24), matRefl); f2.position.y = 0.3; g.add(f2);
      var base = new T.Mesh(new T.BoxGeometry(0.72, 0.06, 0.72), matCone); base.position.y = 0.03; base.castShadow = true; g.add(base);
    } else if (o.tipo === 'buraco') {
      var b = new T.Mesh(new T.PlaneGeometry(wm * 1.15, lm * 1.5), new T.MeshStandardMaterial({ map: texBuraco, transparent: true, roughness: 1, depthWrite: false }));
      b.rotation.x = -Math.PI / 2; b.rotation.z = (o.d % 7) * 0.4; b.position.y = 0.006; b.receiveShadow = true; g.add(b);
    } else if (o.tipo === 'carro') {
      var cc = carro(CORES_PARADOS[Logica.hash('p' + Math.floor(o.d) + o.lane) % CORES_PARADOS.length], { freio: true }); g.add(cc); g.userData.pisca = cc.userData.lant;
    } else if (o.tipo === 'cancela') {
      var poste = new T.Mesh(new T.BoxGeometry(0.22, 1.1, 0.22), matCabine); poste.position.set(-LANE * K / 2 + 0.16, 0.55, 0); poste.castShadow = true; g.add(poste);
      var piv = new T.Group(); piv.position.set(-LANE * K / 2 + 0.16, 0.98, 0); g.add(piv);
      var barra = new T.Mesh(new T.BoxGeometry(LANE * K - 0.32, 0.13, 0.08), new T.MeshStandardMaterial({ map: texBarra, roughness: 0.4 })); barra.position.x = (LANE * K - 0.32) / 2; barra.castShadow = true; piv.add(barra);
      g.userData.piv = piv;
      if (o.lane === 0) {
        var praca = new T.Group();
        var cob = new T.Mesh(new T.BoxGeometry(RW + 7, 0.35, 4.2), matCobertura); cob.position.set(RW / 2 - LANE * K / 2, 4.6, 0.6); cob.castShadow = true; praca.add(cob);
        var fx = new T.Mesh(new T.BoxGeometry(RW + 7.05, 0.32, 0.06), matLaranja); fx.position.set(RW / 2 - LANE * K / 2, 4.6, 2.72); praca.add(fx);
        [-1, 1].forEach(function (lado) {
          var bx = (lado < 0 ? -LANE * K / 2 - 1.6 : RW - LANE * K / 2 + 1.6);
          var cab = new T.Mesh(new T.BoxGeometry(1.8, 2.5, 2.6), matCabine); cab.position.set(bx, 1.25, 0.6); cab.castShadow = true; praca.add(cab);
          var vd = new T.Mesh(new T.BoxGeometry(1.84, 0.8, 1.8), matVidroCab); vd.position.set(bx, 1.6, 0.6); praca.add(vd);
          var col = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 4.5, 10), matPoste); col.position.set(bx, 2.25, 2.2); col.castShadow = true; praca.add(col);
        });
        g.add(praca);
      }
    } else if (o.tipo === 'tag' || o.tipo === 'seguro') {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: o.tipo === 'tag' ? texTag : texSeg, transparent: true, depthWrite: false }));
      if (o.tipo === 'tag') sp.scale.set(1.3, 0.98, 1); else sp.scale.set(1.25, 1.56, 1);
      sp.position.y = 1.05; g.add(sp); g.userData.sp = sp;
      var gl = brilho(o.tipo === 'tag' ? 0xFFB27A : 0x7FB6F5, 2.6); gl.position.y = 1.05; g.add(gl); g.userData.gl = gl;
    } else if (o.tipo === 'aviso') {
      var av = new T.Mesh(new T.PlaneGeometry(RW * 0.72, RW * 0.72 * 96 / 512), new T.MeshStandardMaterial({ map: texAviso, transparent: true, roughness: 0.8, depthWrite: false }));
      av.rotation.x = -Math.PI / 2; av.position.y = 0.008; av.receiveShadow = true; g.add(av);
    }
    scene.add(g);
    var antigo = o._rm; o._rm = function () { scene.remove(g); if (antigo) antigo(); };
    return g;
  }
  function lx(x) { return (x - ROAD / 2) * K; }

  // ---------- partículas (batida e seguro) ----------
  var parts = [], texFum = canvasTex(64, 64, function (g, w, h) { var gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(200,200,200,.7)'); gr.addColorStop(1, 'rgba(200,200,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  function explodir(x, z, tipo) {
    for (var i = 0; i < (tipo === 'seguro' ? 26 : 40); i++) {
      var faisca = i % 3 !== 0;
      var sp = new T.Sprite(new T.SpriteMaterial({ map: faisca ? texGlow : texFum, color: tipo === 'seguro' ? 0x7FB6F5 : (faisca ? 0xFFB040 : 0xBBBBBB), transparent: true, depthWrite: false, blending: faisca ? T.AdditiveBlending : T.NormalBlending }));
      var t = faisca ? 0.25 : 0.9; sp.scale.set(t, t, 1); sp.position.set(x, 0.7, z - 1.2);
      sp.userData = { v: new T.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.3) * 5), vida: 0.8 + Math.random() * 0.6, faisca: faisca, t0: t };
      scene.add(sp); parts.push(sp);
    }
  }
  var ultimoT = null, invAnt = 0, faseAnt = s.fase, frames = 0, somaDt = 0, qualidade = 'alta';
  function render(tempoReal) {
    var dt = ultimoT == null ? 0.016 : Math.min(0.05, tempoReal - ultimoT); ultimoT = tempoReal;
    // qualidade automática: mede os primeiros quadros
    if (qualidade === 'alta' && frames < 90) { frames++; somaDt += dt; if (frames === 90 && somaDt / 90 > 0.03) { qualidade = 'baixa'; sol.castShadow = false; renderer.setPixelRatio(1); } }
    var desl = (s.dist * K) / PER;
    texRua.offset.y = desl % 1; bumpRua.offset.y = (desl * 2) % 1; texGrama.offset.y = desl % 1; texAc.offset.y = desl % 1;
    rolam.forEach(function (g) { var z = ((g.userData.base - s.dist * K) % LOOP + LOOP) % LOOP; g.position.z = -(z - 18); });
    var cx = lx(s.x), v = s.parada > 0 ? 0 : Math.min(300 * Math.pow(1.12, Math.floor(s.t / 10)), 1150) * K;
    meu.position.set(cx, 0, (CARH / 2) * K);
    var inc = (CENTRO[s.lane] - s.x) * 0.004;
    meu.rotation.y = inc; meu.rotation.z = -inc * 0.35;
    meu.userData.rodas.forEach(function (r) { r.rotation.x -= v * dt / 0.34; });
    var piscaInv = s.invul > 0;
    bolha.visible = piscaInv; if (piscaInv) bolha.material.opacity = 0.12 + Math.abs(Math.sin(tempoReal * 10)) * 0.15;
    meu.userData.lant.forEach(function (l) { l.userData.glow.visible = s.parada > 0; });
    if (s.invul > invAnt + 0.5) explodir(cx, 0, 'seguro');
    invAnt = s.invul;
    if (s.fase === 'batida' && faseAnt !== 'batida') explodir(cx, 0, 'batida');
    faseAnt = s.fase;
    s.obst.forEach(function (o) {
      if (!o._mesh3r) o._mesh3r = criarMesh(o);
      var g = o._mesh3r, a = o.d - s.dist + o.h / 2;
      g.position.set(o.tipo === 'aviso' ? 0 : lx(CENTRO[o.lane]), 0, -a * K);
      g.visible = !o.pego && !(o.batido && o.tipo !== 'buraco');
      if (g.userData.piv) { var alvo = o.aberta ? -1.3 : 0; g.userData.piv.rotation.z += (alvo - g.userData.piv.rotation.z) * 0.15; }
      if (g.userData.sp) { var yy = 1.05 + Math.sin(tempoReal * 4 + o.lane) * 0.12; g.userData.sp.position.y = yy; g.userData.gl.position.y = yy; g.userData.gl.material.opacity = 0.6 + Math.sin(tempoReal * 6) * 0.25; }
      if (g.userData.pisca) { var on = Math.floor(tempoReal * 2.5) % 2 === 0; g.userData.pisca.forEach(function (l) { l.material.emissive.setHex(on ? 0xFF9A1A : 0x200800); l.material.emissiveIntensity = on ? 2.4 : 0.2; l.userData.glow.visible = on; l.userData.glow.material.color.setHex(0xFFA030); }); }
    });
    parts = parts.filter(function (p) {
      var u = p.userData; u.vida -= dt;
      if (u.vida <= 0) { scene.remove(p); return false; }
      u.v.y -= (u.faisca ? 12 : -1) * dt; p.position.addScaledVector(u.v, dt);
      if (!u.faisca) { var k2 = p.scale.x + dt * 2; p.scale.set(k2, k2, 1); }
      p.material.opacity = Math.min(1, u.vida * 1.5); return true;
    });
    // câmera: segue o carro, abre o campo de visão com a velocidade e treme na batida
    var nv = Math.floor(s.t / 10);
    cam.fov = 62 + Math.min(12, nv * 1.5); cam.updateProjectionMatrix();
    var tr = s.tremor > 0 ? s.tremor : 0;
    var tx = (Math.random() - 0.5) * tr * 0.8, ty = (Math.random() - 0.5) * tr * 0.5;
    cam.position.set(cx * 0.8 + tx, 6.2 + ty, 10.8);
    cam.lookAt(cx * 0.8, 0.4, -14);
    sol.position.set(cx - 9, 16, 9); sol.target.position.set(cx, 0, -6);
    ceu.position.copy(cam.position);
    renderer.render(scene, cam);
  }
  function destruir() { try { renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); } catch (e) { } }
  return { render: render, destruir: destruir, foto: E.fotoCarro, pronto: function () { return !cfgCarro.arquivo || !!meu.userData.modelo; } };
}
