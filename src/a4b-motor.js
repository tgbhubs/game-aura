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
/* Modelos 3D dos carros (o catálogo com preços e cores fica em functions/garagem.js) */
var CARROS = {
  aura: { forma: 'sedan' }, hatch: { forma: 'hatch' }, suv: { forma: 'suv' }, picape: { forma: 'picape' },
  conceito: { arquivo: 'assets/carros/conceito.glb', rotY: Math.PI, pintura: 'body' },
  cyberpunk: { arquivo: 'assets/carros/cyberpunk.glb', rotY: 0 },
  besouro: { arquivo: 'assets/carros/besouro.glb', rotY: 0 },
  perua: { arquivo: 'assets/carros/perua.glb', rotY: Math.PI },
  diplomata: { arquivo: 'assets/carros/diplomata.glb', rotY: -Math.PI / 2 },
  serpente: { arquivo: 'assets/carros/serpente.glb', rotY: Math.PI },
  granturismo: { arquivo: 'assets/carros/granturismo.glb', rotY: Math.PI },
  gaivota: { arquivo: 'assets/carros/gaivota.glb', rotY: Math.PI },
  felino: { arquivo: 'assets/carros/felino.glb', rotY: 0 },
  neon: { arquivo: 'assets/carros/neon.glb', rotY: Math.PI },
  veloce: { arquivo: 'assets/carros/veloce.glb', rotY: Math.PI },
  touro: { arquivo: 'assets/carros/touro.glb', rotY: 0 },
  monoposto: { arquivo: 'assets/carros/monoposto.glb', rotY: Math.PI },
  viajante: { arquivo: 'assets/carros/viajante.glb', rotY: 0 },
  rali: { arquivo: 'assets/carros/rali.glb', rotY: Math.PI },
  hibrido: { arquivo: 'assets/carros/hibrido.glb', rotY: Math.PI },
  serra: { arquivo: 'assets/carros/serra.glb', rotY: Math.PI },
  berlinetta: { arquivo: 'assets/carros/berlinetta.glb', rotY: Math.PI },
  samurai: { arquivo: 'assets/carros/samurai.glb', rotY: Math.PI },
  trovao: { arquivo: 'assets/carros/trovao.glb', rotY: Math.PI },
  brisa: { arquivo: 'assets/carros/brisa.glb', rotY: Math.PI },
  patrulha: { arquivo: 'assets/carros/patrulha.glb', rotY: Math.PI },
  vento: { arquivo: 'assets/carros/vento.glb', rotY: 0 },
  roadster: { arquivo: 'assets/carros/roadster.glb', rotY: -2.142 },
  trilha: { arquivo: 'assets/carros/trilha.glb', rotY: Math.PI }
};
var GLTF_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
var _modelosCache = {};
// carro escolhido: um dos três de base (aura, conceito, cyberpunk) ou um carro comprado (id da garagem)
function meusCarros() {
  var l = Garagem.BASE.map(function (cat) { return { key: cat, cat: cat, origem: 'base', km: 0 }; });
  var g = (typeof D !== 'undefined' && D.garagem && D.garagem.carros) || {};
  Object.keys(g).sort(function (a, b) { return (g[a].compradoEm || 0) - (g[b].compradoEm || 0); }).forEach(function (iid) { if (Garagem.CATALOGO[g[iid].cat]) l.push({ key: iid, cat: g[iid].cat, origem: g[iid].origem, retomadoDe: g[iid].retomadoDe || '', km: g[iid].km || 0, de: g[iid].de || '' }); });
  return l;
}
function carroPreferido() { var c = lerLS('gi_carro', 'aura'); return meusCarros().some(function (x) { return x.key === c; }) ? c : 'aura'; }
// Poder Aura: o "a" do logo em três cores (mesmo efeito do Seguro Porto), a partir do nível 10
var IMG_AURA = (function () { var i = new Image(); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ICONE_SVG); return i; })();
function desenharPoderAura(ctx, x, y, tam) {
  ctx.save(); ctx.shadowColor = '#FF8A3C'; ctx.shadowBlur = 18;
  if (IMG_AURA.complete && IMG_AURA.naturalWidth) ctx.drawImage(IMG_AURA, x - tam / 2, y - tam / 2, tam, tam);
  else { ctx.fillStyle = '#14235E'; ctx.beginPath(); ctx.arc(x, y, tam / 2, 0, 7); ctx.fill(); ctx.fillStyle = '#FF6200'; ctx.font = '900 ' + Math.round(tam * 0.6) + 'px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('a', x, y); }
  ctx.restore();
}
function carroSel(key) {
  key = key || carroPreferido();
  var x = meusCarros().filter(function (y) { return y.key === key; })[0] || { key: 'aura', cat: 'aura' };
  var c = Garagem.CATALOGO[x.cat];
  return { key: x.key, cat: x.cat, nome: c.nome, modelo: c.modelo, cor: c.cor, atr: c.atr };
}
function carregarGLTFLoader(cb) {
  if (window.THREE && THREE.GLTFLoader) { cb(true); return; }
  var sc = document.createElement('script'); sc.src = GLTF_URL;
  sc.onload = function () { cb(!!THREE.GLTFLoader); }; sc.onerror = function () { cb(false); };
  document.head.appendChild(sc);
}
// carrega o modelo, normaliza o porte (até 3,2 × 1,55 m), direção (frente para -z) e apoia no chão
function carregarModeloCarro(id, cb, corPintura) {
  var cfg = CARROS[id]; if (!cfg || !cfg.arquivo) { cb(null); return; }
  carregarGLTFLoader(function (ok) {
    if (!ok) { cb(null); return; }
    var url = (window.MODELOS_EMBUTIDOS && MODELOS_EMBUTIDOS[id]) || cfg.arquivo;
    new THREE.GLTFLoader().load(url, function (g) {
      var raiz = new THREE.Group(), obj = g.scene; raiz.add(obj);
      obj.rotation.y = cfg.rotY || 0; raiz.updateMatrixWorld(true);
      var total = new THREE.Box3().setFromObject(obj), tz = total.getSize(new THREE.Vector3());
      if (cfg.pintura && corPintura != null) obj.traverse(function (m) {
        if (!m.isMesh) return;
        // pintura um pouco mais escura que a cor da marca: o reflexo do céu clareia bastante no 3D
        var c3 = new THREE.Color(corPintura); c3.multiplyScalar(0.75);
        (Array.isArray(m.material) ? m.material : [m.material]).forEach(function (mt) { if (mt && mt.name === cfg.pintura) { mt.color.setRGB(c3.r, c3.g, c3.b).convertSRGBToLinear(); } });
      });
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
  if (!window.FOTOS_CARROS || !FOTOS_CARROS[id]) return null;
  var im = _imgsCima[id];
  if (!im) { im = _imgsCima[id] = new Image(); im.src = FOTOS_CARROS[id].cima; }
  return im.complete && im.naturalWidth ? im : null;
}
// só os visuais realistas: 3D realista e de cima realista (quem tinha escolhido um dos simples vai para o 3D realista)
function visualPreferido() { var v = lerLS('gi_visual', '3dreal'); return v === 'realista' ? 'realista' : '3dreal'; }
function webglOk() {
  try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
}
// textura do piso do CAP Porto (usada pelas visões 3D)
function capTextura(g, w, h) {
  function rr2(x, y, ww, hh, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); }
  g.fillStyle = 'rgba(73,158,242,.92)'; rr2(4, 4, w - 8, h - 8, 26); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 8; g.setLineDash([26, 18]); rr2(18, 18, w - 36, h - 36, 18); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 78px Montserrat, Arial, sans-serif'; g.fillText('CAP', w / 2, 92);
  g.font = '800 40px Montserrat, Arial, sans-serif'; g.fillText('PORTO', w / 2, 150);
  g.strokeStyle = '#fff'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round';
  for (var i = 0; i < 2; i++) { var y = h - 150 + i * 62; g.beginPath(); g.moveTo(w / 2 - 50, y + 26); g.lineTo(w / 2, y - 14); g.lineTo(w / 2 + 50, y + 26); g.stroke(); }
}
// piso do posto de abastecimento (combustível e recarga elétrica)
function postoTextura(g, w, h) {
  function rr2(x, y, ww, hh, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); }
  g.fillStyle = 'rgba(23,147,95,.92)'; rr2(4, 4, w - 8, h - 8, 26); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 8; g.setLineDash([26, 18]); rr2(18, 18, w - 36, h - 36, 18); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 66px Montserrat, Arial, sans-serif'; g.fillText('POSTO', w / 2, 92);
  g.font = '900 56px Arial, sans-serif'; g.fillText('⛽ ⚡', w / 2, 160);
  g.strokeStyle = '#fff'; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round';
  for (var i = 0; i < 2; i++) { var y = h - 150 + i * 62; g.beginPath(); g.moveTo(w / 2 - 50, y + 26); g.lineTo(w / 2, y - 14); g.lineTo(w / 2 + 50, y + 26); g.stroke(); }
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
  var PENALIDADE = 5, PARADA = 1.5, MAX_VIDAS = 2, INVUL = 1.5, MAX_TAGS = 3, AURA_DUR = 5;
  var TAM = { cone: [38, 44], buraco: [64, 46], carro: [52, 90], cancela: [96, 22], tag: [40, 30], seguro: [40, 34], aura: [42, 42], aviso: [400, 40], posto: [92, 150], cap: [92, 150] };
  // pneus e pit stop no CAP Porto: o pneu gasta com o tempo; parar no CAP troca os pneus e dá 15 s de revisão (passa por buracos)
  var SEL = carroSel(CR && CR.carro);
  var ATR = (CR && (CR.treino || CR.duelo)) ? SEL.atr : { faixa: 1, pneu: 1, seguro: 0 };   // atributos do carro valem no treino e nos duelos
  var COR_EU = SEL.cor == null ? 0x3A3F4B : SEL.cor;
  function hexCss(n, f) { var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; f = f || 1; return 'rgb(' + Math.round(r * f) + ',' + Math.round(g * f) + ',' + Math.round(b * f) + ')'; }
  function escurecer(n, f) { var r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f); return (r << 16) | (g << 8) | b; }
  var GASTO_PNEU = 1.6 * ATR.pneu, PNEU_GASTO = 35, CAP_PEN = 3, CAP_PARADA = 2, REVISAO = 15, BURACO = 35;
  // abastecimento: tanque dura ~95 s (elétrico ~65 s); no posto, combustão para 2 s e elétrico 3,5 s.
  // Na rodada todos andam a combustão.
  var TANQUE = true, ELETRICO = !!ATR.eletrico;   // posto vale em todas as corridas (na rodada todos a combustão)
  var CONSUMO = ELETRICO ? 100 / 65 : 100 / 95, POSTO_PARADA = ELETRICO ? 3.5 : 2, POSTO_PEN = ELETRICO ? 3.5 : 2, COMB_BAIXO = 25;
  var rnd = Logica.rng(seed);
  var s = { t: 0, dist: 0, lane: 2, x: CENTRO[2], obst: [], prox: 700, tag: false, vivo: true, fase: 'contagem', cont: 3, acc: 0, flash: 0,
    pen: 0, parada: 0, msg: null, pracas: 0, ultPraca: -99, ultSeguro: -99, ultAura: -99, aura: 0, vidas: ATR.seguro || 0, invul: 0, usouSeguro: 0, tremor: 0,
    pneu: 100, revisao: 0, ultCap: 0, caps: 0, pits: 0, furou: false, capLivreAte: -1, capLane: 4, tags: 0, multas: 0, segExtra: 0, comb: 100, ultPosto: 0, postos: 0, panes: 0, semComb: false, pausado: false };
  var raf = null, ultimo = null, parado = false, fimDisparado = false;
  // depois de 2 minutos a corrida entra na reta final: tudo fica mais difícil até não dar mais
  function extra(t) { return Math.max(0, (t - 120) / 60); }
  function vel(t) { return Math.min(300 * Math.pow(1.12, Math.floor(t / 10)), 1150 + Math.min(350, 45 * extra(t))); }
  function nivel(t) { return Math.floor(t / 10) + 1; }
  function placar() { return Math.max(0, s.t - s.pen); }
  function add(tipo, lane, d) { var o = { tipo: tipo, lane: lane, d: d, w: TAM[tipo][0], h: TAM[tipo][1], aberta: false, pego: false, batido: false, id: Math.random() }; s.obst.push(o); return o; }
  function gerarLinha(d) {
    var r = rnd();
    if (s.t > 10 && s.t - s.ultPraca > 12 && r < 0.3 && d > s.capLivreAte + 300) {
      // praça de pedágio: cancelas nas 3 faixas do meio (com tag passa direto, sem tag para e perde tempo)
      // e free flow nas 2 laterais (com tag passa e paga; sem tag passa, mas leva multa por evasão)
      s.ultPraca = s.t; s.pracas++;
      for (var l = 0; l < N; l++) add('cancela', l, d).ff = (l === 0 || l === N - 1);
      add('aviso', 2, d - 230);
      if (rnd() < 0.7) add('tag', Math.floor(rnd() * N), d - 130);
      // Seguro Porto perto do free flow (antes ou depois do pórtico) para compensar o risco da multa.
      // Usa um sorteio próprio, sem mexer na sequência da pista: o resto das pistas continua igual.
      var hp = (Logica.hash('ff|' + seed + '|' + s.pracas) >>> 0) / 4294967296, hq = (Logica.hash('ffl|' + seed + '|' + s.pracas) >>> 0) / 4294967296;
      if (hp < Math.max(0.3, 0.55 - 0.08 * extra(s.t))) {
        var lf = hq < 0.5 ? 0 : N - 1;
        add('seguro', lf, hq % 0.5 < 0.25 ? d - 200 : d + 150);
      }
      return;
    }
    var ex = extra(s.t);
    if (TANQUE && s.t > 20 && s.t - s.ultPosto > 26 + 4 * ex && d > s.capLivreAte) {
      var hpo = (Logica.hash('posto|' + seed + '|' + Math.round(d)) >>> 0) / 4294967296;
      if (hpo < 0.35) {
        // posto na faixa da direita ou da esquerda; a faixa fica livre até a entrada
        s.ultPosto = s.t; s.capLane = hpo < 0.175 ? 0 : N - 1;
        add('posto', s.capLane, d + 640);
        s.capLivreAte = d + 640 + TAM.cap[1] + 40;
      }
    }
    if (s.t > 14 && s.t - s.ultCap > 18 + 4 * ex && r < 0.42 && d > s.capLivreAte) {
      // entrada do CAP Porto na faixa da direita ou da esquerda, um pouco à frente; essa faixa fica livre até lá
      s.ultCap = s.t; s.caps++; s.capLane = rnd() < 0.5 ? 0 : N - 1;
      add('cap', s.capLane, d + 640);
      s.capLivreAte = d + 640 + TAM.cap[1] + 40;
    }
    var reservada = d <= s.capLivreAte ? s.capLane : -1;
    var faixas = Logica.shuffle([0, 1, 2, 3, 4].filter(function (l) { return l !== reservada; }), rnd);
    var x = rnd(), qtd = x < 0.35 ? 1 : x < 0.75 ? 2 : 3;
    if (ex > 0 && rnd() < Math.min(0.75, 0.25 * ex)) qtd++;          // reta final: mais obstáculos por linha
    qtd = Math.min(qtd, faixas.length - 1);                           // sempre sobra uma faixa livre
    for (var i = 0; i < qtd; i++) { var y = rnd(); add(y < 0.42 ? 'cone' : y < 0.74 ? 'buraco' : 'carro', faixas[i], d); }
    var livres = faixas.slice(qtd);
    var z = rnd();
    if (s.t > 6 && s.t - s.ultSeguro > 18 + 10 * ex && z < 0.14) { s.ultSeguro = s.t; add('seguro', livres[Math.floor(rnd() * livres.length)], d + 170); }
    else if (z > 0.91) add('tag', livres[Math.floor(rnd() * livres.length)], d + 170);
    // Poder Aura a partir do nível 10 (sorteio próprio, sem mudar o resto da pista)
    if (nivel(s.t) >= 10 && s.t - s.ultAura > 14 && livres.length) {
      var ha = (Logica.hash('aura|' + seed + '|' + Math.round(d)) >>> 0) / 4294967296;
      if (ha < 0.16) { s.ultAura = s.t; add('aura', livres[Math.floor(ha * 1e6) % livres.length], d + 90); }
    }
  }
  function passo(dt) {
    s.t += dt;
    if (s.invul > 0) s.invul -= dt;
    if (s.aura > 0) s.aura = Math.max(0, s.aura - dt);
    if (s.tremor > 0) s.tremor -= dt;
    if (s.parada > 0) { s.parada -= dt; return; }
    if (s.revisao > 0) s.revisao -= dt;
    s.pneu -= GASTO_PNEU * (1 + 0.2 * extra(s.t)) * dt;
    if (TANQUE) {
      s.comb -= CONSUMO * (1 + 0.15 * extra(s.t)) * dt;
      if (s.comb <= 0) {
        if (s.vidas > 0) { som('furou'); s.vidas--; s.usouSeguro++; s.panes++; s.comb = 35; s.invul = INVUL; s.msg = { txt: ELETRICO ? 'Bateria zerou! O seguro rebocou' : 'Pane seca! O seguro trouxe combustível', cor: '#9FD3FF', ate: s.t + 1.8 }; }
        else { som('furou'); som('batida'); s.comb = 0; s.semComb = true; s.vivo = false; s.fase = 'batida'; s.flash = 1; s.tremor = 0.3; return; }
      }
    }
    if (s.pneu <= 0) {
      if (s.vidas > 0) { som('furou'); s.vidas--; s.usouSeguro++; s.pneu = 30; s.invul = INVUL; s.tremor = 0.35; s.msg = { txt: 'Pneu furou! O seguro trocou', cor: '#9FD3FF', ate: s.t + 1.8 }; }
      else { som('furou'); som('batida'); s.pneu = 0; s.furou = true; s.vivo = false; s.fase = 'batida'; s.flash = 1; s.tremor = 0.5; return; }
    }
    var v = vel(s.t);
    s.dist += v * dt;
    var alvo = CENTRO[s.lane], mv = (s.pneu < PNEU_GASTO ? 560 : 950) * ATR.faixa * dt;
    if (Math.abs(alvo - s.x) <= mv) s.x = alvo; else s.x += alvo > s.x ? mv : -mv;
    while (s.prox < s.dist + HORIZ) { var ex2 = Math.min(1, extra(s.t) / 3); gerarLinha(s.prox); s.prox += Math.max(260 - 50 * ex2, v * (0.65 - 0.17 * ex2)) + rnd() * 160 * (1 - 0.4 * ex2); }
    var cx0 = s.x - CARW / 2 + 5, cx1 = s.x + CARW / 2 - 5;
    for (var i = 0; i < s.obst.length; i++) {
      var o = s.obst[i];
      if (o.pego || o.aberta || o.passou || o.batido || o.tipo === 'aviso') continue;
      var a = o.d - s.dist; // distância à frente do para-choque
      if (!(a < -6 && a > -(CARH - 6) - o.h)) continue;
      var ox = CENTRO[o.lane], ox0 = ox - o.w / 2 + 4, ox1 = ox + o.w / 2 - 4;
      if (!(ox1 > cx0 && ox0 < cx1)) continue;
      if (o.tipo === 'cap') {
        som('pit'); o.pego = true; s.pits++; s.pneu = 100; s.revisao = REVISAO; s.pen += CAP_PEN; s.parada = CAP_PARADA;
        s.msg = { txt: 'CAP Porto: pneus novos (−' + CAP_PEN + ' s)', cor: '#9FD3FF', ate: s.t + CAP_PARADA + 1 };
        continue;
      }
      if (o.tipo === 'posto') {
        som('pit'); o.pego = true; s.postos++; s.comb = 100; s.pen += POSTO_PEN; s.parada = Math.max(s.parada, POSTO_PARADA);
        s.msg = { txt: (ELETRICO ? 'Recarga completa' : 'Tanque cheio') + ' (−' + String(POSTO_PEN).replace('.', ',') + ' s)', cor: '#7CE0B0', ate: s.t + POSTO_PARADA + 1 };
        continue;
      }
      if (o.tipo === 'buraco') {
        // buraco não encerra: estraga o pneu (a revisão do CAP e o Poder Aura protegem)
        if (s.revisao > 0 || s.aura > 0) continue;
        o.batido = true; som('buraco'); s.pneu -= BURACO; s.tremor = 0.4; s.buracos = (s.buracos || 0) + 1;
        s.msg = { txt: 'Buraco! Pneu −' + BURACO + '%', cor: '#FFD07A', ate: s.t + 1.3 };
        continue;
      }
      if (o.tipo === 'tag') { o.pego = true; if (s.tags < MAX_TAGS) { s.tags++; s.msg = { txt: 'Tag: +1 mensalidade (' + s.tags + ')', cor: '#9FD3FF', ate: s.t + 1.1 }; } else s.msg = { txt: 'Tag em dia (' + MAX_TAGS + ' mensalidades)', cor: '#9FD3FF', ate: s.t + 1 }; continue; }
      if (o.tipo === 'aura') {
        // Poder Aura: alguns segundos invencível (atravessa cones, carros, buracos e cancelas)
        o.pego = true; som('seguro'); s.aura = AURA_DUR; s.auras = (s.auras || 0) + 1;
        s.msg = { txt: 'Poder Aura: invencível por ' + AURA_DUR + ' s!', cor: '#FFB27A', ate: s.t + 1.6 };
        continue;
      }
      if (o.tipo === 'seguro') {
        o.pego = true;
        if (s.vidas < MAX_VIDAS) { s.vidas++; s.msg = { txt: 'Seguro Porto: +1 vida', cor: '#9FD3FF', ate: s.t + 1.4 }; }
        else { s.segExtra++; s.msg = { txt: 'Seguro extra: +' + (window.Garagem ? Garagem.SEGURO_CREDITO : 5) + ' créditos', cor: '#7CE0B0', ate: s.t + 1.2 }; }
        continue;
      }
      if (o.tipo === 'cancela' && o.ff) {
        // free flow: o pórtico lê a TAG sem parar o carro
        s.obst.forEach(function (q) { if (q.tipo === 'cancela' && q.d === o.d) q.passou = true; });
        if (s.tags > 0) { s.tags--; som('seguro'); s.msg = { txt: 'Free flow: TAG cobrada' + (s.tags ? ' (restam ' + s.tags + ')' : ''), cor: '#7CE0B0', ate: s.t + 1.4 }; }
        else { s.multas++; som('buraco'); s.msg = { txt: 'Sem TAG no free flow: multa!', cor: '#FFD07A', ate: s.t + 1.6 }; }
        continue;
      }
      if (o.tipo === 'cancela') {
        s.obst.forEach(function (q) { if (q.tipo === 'cancela' && q.d === o.d) { q.aberta = true; q.passou = true; } });
        if (s.aura > 0) { s.msg = { txt: 'Aura! Cancela aberta', cor: '#FFB27A', ate: s.t + 1.2 }; continue; }
        if (s.tags > 0) { s.tags--; s.msg = { txt: 'Tag! Passou direto' + (s.tags ? ' (restam ' + s.tags + ')' : ''), cor: '#7CE0B0', ate: s.t + 1.4 }; }
        else { s.pen += PENALIDADE; s.parada = PARADA; s.msg = { txt: 'Sem tag: −' + PENALIDADE + ' s', cor: '#FF9C9C', ate: s.t + PARADA + 0.8 }; }
        continue;
      }
      if (s.aura > 0) { o.batido = true; som('batida'); s.tremor = 0.15; continue; }   // com a Aura, o obstáculo sai voando
      if (s.invul > 0) continue;
      if (s.vidas > 0) {
        som('seguro'); s.vidas--; s.usouSeguro++; o.batido = true; s.invul = INVUL; s.tremor = 0.35; s.pneu = Math.max(1, s.pneu - 15);
        s.msg = { txt: 'Seguro acionado! Segue o jogo', cor: '#9FD3FF', ate: s.t + 1.6 };
        continue;
      }
      som('batida'); s.vivo = false; s.fase = 'batida'; s.flash = 1; s.tremor = 0.5; return;
    }
    s.obst = s.obst.filter(function (o) { var fora = s.dist - o.d > 400; if (fora && o._rm) o._rm(); return !fora; });
  }
  function som(t) { if (window.Musica && !parado) Musica.efeito(t); }
  function mover(d) { if (s.fase !== 'rodando' || !s.vivo || s.parada > 0) return; s.lane = Math.max(0, Math.min(N - 1, s.lane + d)); }

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
  // piso do CAP Porto (2D): faixa azul com "CAP PORTO" e setas
  function capPiso(ctx, cx, bot, w, h, real) {
    ctx.save();
    ctx.fillStyle = real ? 'rgba(73,158,242,.82)' : '#499EF2'; rr(ctx, cx - w / 2, bot - h, w, h, 10); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); rr(ctx, cx - w / 2 + 4, bot - h + 4, w - 8, h - 8, 8); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 26px Montserrat, Arial, sans-serif'; ctx.fillText('CAP', cx, bot - h + 34);
    ctx.font = '800 13px Montserrat, Arial, sans-serif'; ctx.fillText('PORTO', cx, bot - h + 56);
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = 0; i < 2; i++) { var y = bot - 50 + i * 20; ctx.beginPath(); ctx.moveTo(cx - 14, y + 8); ctx.lineTo(cx, y - 4); ctx.lineTo(cx + 14, y + 8); ctx.stroke(); }
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
    ctx.globalAlpha = s.tags ? 1 : 0.25;
    ctx.fillStyle = '#14235E'; rr(ctx, ix + 74, iy - 12, 58, 24, 6); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#EC7000'; ctx.font = '900 12px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TAG', ix + 96, iy + 1);
    ctx.fillStyle = '#fff'; ctx.font = '900 11px Montserrat, Arial, sans-serif'; ctx.fillText('×' + s.tags, ix + 120, iy + 1);
    ctx.globalAlpha = 1;
    if (s.aura > 0) {
      var aw = 118, ah = 10, ay = iy + 22;
      ctx.fillStyle = 'rgba(20,35,94,.85)'; rr(ctx, ix, ay, aw + 46, 20, 6); ctx.fill();
      desenharPoderAura(ctx, ix + 11, ay + 10, 16);
      ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(ctx, ix + 24, ay + 5, aw, ah, 4); ctx.fill();
      var gA = ctx.createLinearGradient(ix + 24, 0, ix + 24 + aw, 0); gA.addColorStop(0, '#FF6200'); gA.addColorStop(0.5, '#499EF2'); gA.addColorStop(1, '#FF6535');
      ctx.fillStyle = gA; rr(ctx, ix + 24, ay + 5, aw * (s.aura / AURA_DUR), ah, 4); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '900 10px Montserrat, Arial, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(Math.ceil(s.aura) + ' s', ix + aw + 28, ay + 13);
    }
    // pneu
    var px = HW - 112, py = 64, pw = 102, gasto = s.pneu < PNEU_GASTO, pisca = gasto && Math.floor(s.t * 3) % 2 === 0;
    ctx.fillStyle = 'rgba(13,24,64,.78)'; rr(ctx, px, py, pw, 34, 10); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 15, py + 17, 9, 0, 7); ctx.fillStyle = '#20232B'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = pisca ? '#FFB27A' : '#C9CDD3'; ctx.stroke();
    ctx.beginPath(); ctx.arc(px + 15, py + 17, 3.5, 0, 7); ctx.fillStyle = '#C9CDD3'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(ctx, px + 30, py + 12, pw - 40, 10, 5); ctx.fill();
    ctx.fillStyle = s.pneu > 60 ? '#7CE0B0' : s.pneu > PNEU_GASTO ? '#FFD07A' : '#FF9C5A';
    rr(ctx, px + 30, py + 12, Math.max(6, (pw - 40) * Math.max(0, s.pneu) / 100), 10, 5); ctx.fill();
    var ay = py + 40;
    if (TANQUE) {
      var baixo = s.comb < COMB_BAIXO, piscaC = baixo && Math.floor(s.t * 3) % 2 === 0;
      ctx.fillStyle = 'rgba(13,24,64,.78)'; rr(ctx, px, ay, pw, 30, 10); ctx.fill();
      ctx.font = '15px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = piscaC ? 0.4 : 1; ctx.fillText(ELETRICO ? '🔋' : '⛽', px + 15, ay + 16); ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(ctx, px + 30, ay + 10, pw - 40, 10, 5); ctx.fill();
      ctx.fillStyle = s.comb > 50 ? (ELETRICO ? '#7FD3F5' : '#7CE0B0') : s.comb > COMB_BAIXO ? '#FFD07A' : '#FF9C5A';
      rr(ctx, px + 30, ay + 10, Math.max(6, (pw - 40) * Math.max(0, s.comb) / 100), 10, 5); ctx.fill();
      ay += 36;
    }
    if (s.revisao > 0) { ctx.fillStyle = 'rgba(13,24,64,.78)'; rr(ctx, px, ay, pw, 24, 8); ctx.fill(); ctx.fillStyle = '#9FD3FF'; ctx.font = '800 11px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('REVISÃO ' + Math.ceil(s.revisao) + ' s', px + pw / 2, ay + 12); ay += 30; }
    else if (gasto && s.fase === 'rodando') { ctx.fillStyle = 'rgba(13,24,64,.78)'; rr(ctx, px, ay, pw, 24, 8); ctx.fill(); ctx.fillStyle = pisca ? '#FFB27A' : '#fff'; ctx.font = '800 11px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PARE NO CAP', px + pw / 2, ay + 12); ay += 30; }
    if (TANQUE && s.comb < COMB_BAIXO && s.fase === 'rodando') { var pc = Math.floor(s.t * 3) % 2 === 0; ctx.fillStyle = 'rgba(13,24,64,.78)'; rr(ctx, px, ay, pw, 24, 8); ctx.fill(); ctx.fillStyle = pc ? '#FFB27A' : '#fff'; ctx.font = '800 11px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ELETRICO ? 'RECARREGUE' : 'ABASTEÇA', px + pw / 2, ay + 12); ay += 30; }
    // tempo até o próximo CAP e o próximo posto (pela velocidade atual)
    if (s.fase === 'rodando') {
      // já na pista: tempo exato; ainda não sorteado: estimativa pelo intervalo mínimo entre um e outro (CAP e posto saem logo depois desse intervalo)
      var vAt = Math.max(vel(s.t), 1), exA = extra(s.t), prox = function (tp) {
        var md = Infinity; for (var q = 0; q < s.obst.length; q++) { var oq = s.obst[q]; if (oq.tipo === tp && !oq.pego && oq.d > s.dist && oq.d - s.dist < md) md = oq.d - s.dist; }
        if (md !== Infinity) return md / vAt;
        var libera = tp === 'cap' ? Math.max(14, s.ultCap + 18 + 4 * exA) : Math.max(20, s.ultPosto + 26 + 4 * exA);
        return Math.max(0, libera - s.t) + (s.prox - s.dist + 640) / vAt;
      };
      [['cap', '🔧 CAP'], TANQUE ? ['posto', ELETRICO ? '🔋 Recarga' : '⛽ Posto'] : null].forEach(function (it) {
        if (!it) return; var tq = prox(it[0]); if (tq == null || tq > 60) return;
        ctx.fillStyle = 'rgba(13,24,64,.7)'; rr(ctx, px, ay, pw, 22, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 11px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(it[1] + ' em ' + Math.max(1, Math.ceil(tq)) + ' s', px + pw / 2, ay + 11); ay += 26;
      });
    }
    if (s.msg && s.t < s.msg.ate) { ctx.fillStyle = 'rgba(13,24,64,.85)'; rr(ctx, HW / 2 - 140, 140, 280, 44, 12); ctx.fill(); ctx.fillStyle = s.msg.cor; ctx.textAlign = 'center'; ctx.font = '900 17px Montserrat, Arial, sans-serif'; ctx.fillText(s.msg.txt, HW / 2, 163); }
    if (s.fase === 'contagem') {
      ctx.fillStyle = 'rgba(13,24,64,.55)'; ctx.fillRect(0, 0, HW, HH);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 120px Montserrat, Arial, sans-serif'; ctx.fillText(String(Math.ceil(s.cont)), HW / 2, HH / 2 - 40);
      ctx.font = '700 16px "Public Sans", Arial, sans-serif'; ctx.fillText('Toque à esquerda ou à direita', HW / 2, HH / 2 + 50);
    }
    if (s.fase === 'batida') {
      ctx.fillStyle = 'rgba(226,59,59,' + (0.5 * s.flash) + ')'; ctx.fillRect(0, 0, HW, HH);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 46px Montserrat, Arial, sans-serif'; ctx.fillText(s.furou ? 'FUROU!' : s.semComb ? (ELETRICO ? 'SEM BATERIA!' : 'PANE SECA!') : 'BATEU!', HW / 2, HH / 2 - 20);
      ctx.font = '900 30px Montserrat, Arial, sans-serif'; ctx.fillText(fmtSeg(placar()), HW / 2, HH / 2 + 26);
    } else if (s.invul > 0 && Math.floor(s.invul * 8) % 2 === 0) {
      ctx.strokeStyle = 'rgba(73,158,242,.8)'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, HW - 6, HH - 6);
    }
  }

  // ---------- RENDER 3D ----------
  var R3 = null;
  if (box3d && window.THREE) {
    try { R3 = visual === '3dreal' ? criar3DReal({ s: s, N: N, LANE: LANE, ROAD: ROAD, CENTRO: CENTRO, CARH: CARH, cssW: cssW, cssH: cssH, dpr: dpr, box3d: box3d, sel: SEL }) : criar3D(); }
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
    var meu = carro(COR_EU, escurecer(COR_EU, 0.7)); scene.add(meu);
    // texturas dos itens
    var texTag = canvasTex(128, 96, function (g, w, h) { g.fillStyle = '#14235E'; rr(g, 4, 4, w - 8, h - 8, 16); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#EC7000'; g.font = '900 44px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TAG', w / 2, h / 2 + 2); });
    var texSeg = canvasTex(128, 160, function (g, w, h) {
      g.save(); g.translate(w / 2, 62); g.scale(3.3, 3.3); g.beginPath(); g.moveTo(0, -15); g.lineTo(12, -10); g.lineTo(12, 0); g.quadraticCurveTo(12, 11, 0, 16); g.quadraticCurveTo(-12, 11, -12, 0); g.lineTo(-12, -10); g.closePath();
      g.fillStyle = '#499EF2'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.stroke();
      g.beginPath(); g.moveTo(-5, 0); g.lineTo(-1, 5); g.lineTo(6, -5); g.lineWidth = 2.4; g.lineCap = 'round'; g.stroke(); g.restore();
      g.fillStyle = '#14235E'; rr(g, 8, 122, w - 16, 32, 10); g.fill(); g.fillStyle = '#fff'; g.font = '800 19px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SEGURO', w / 2, 139);
    });
    var texAviso = canvasTex(512, 96, function (g, w, h) { g.fillStyle = '#F4F1EA'; g.font = '900 64px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PEDÁGIO', w / 2, h / 2); });
    var texCap = canvasTex(256, 416, function (g, w, h) { capTextura(g, w, h); });
    var texBarra = canvasTex(256, 32, function (g, w, h) { for (var i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#F4F1EA' : '#E23B3B'; g.fillRect(i * w / 8, 0, w / 8, h); } });
    var matCone = new T.MeshLambertMaterial({ color: 0xFF7A1A }), matBranco = new T.MeshLambertMaterial({ color: 0xF4F1EA });
    var matBuraco = new T.MeshBasicMaterial({ color: 0x1A1C22 }), matBordaB = new T.MeshLambertMaterial({ color: 0x555B69 });
    var matCabine = new T.MeshLambertMaterial({ color: 0x14235E }), matFaixaLar = new T.MeshLambertMaterial({ color: 0xEC7000 });
    var texFF = canvasTex(512, 128, function (g, w, h) { g.fillStyle = '#1C5FB8'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '900 64px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FREE FLOW', w / 2, h / 2 + 4); });
    var texPisoFF = canvasTex(256, 256, function (g, w, h) { g.fillStyle = 'rgba(73,158,242,.55)'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '900 54px Montserrat, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('FREE', w / 2, h / 2 - 30); g.fillText('FLOW', w / 2, h / 2 + 34); });
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
        var cc = carro(0x9AA1AC, 0x666C76); cc.rotation.y = 0; g.add(cc); g.userData.pisca = cc.userData.lanternas;
      } else if (o.tipo === 'cancela' && o.ff) {
        // faixa de free flow: piso azul e pórtico com leitor de TAG, sem cancela
        var pf = new T.Mesh(new T.PlaneGeometry(LANE * K - 0.2, 3.2), new T.MeshBasicMaterial({ map: texPisoFF, transparent: true, depthWrite: false }));
        pf.rotation.x = -Math.PI / 2; pf.position.y = 0.013; g.add(pf);
        [-1, 1].forEach(function (lado) { var pp = new T.Mesh(new T.BoxGeometry(0.16, 4.2, 0.16), matBranco); pp.position.set(lado * (LANE * K / 2 - 0.1), 2.1, 0); g.add(pp); });
        var vg = new T.Mesh(new T.BoxGeometry(LANE * K, 0.55, 0.22), [matCabine, matCabine, matCabine, matCabine, new T.MeshBasicMaterial({ map: texFF }), matCabine]); vg.position.y = 4.1; g.add(vg);
        var sen = new T.Mesh(new T.BoxGeometry(0.5, 0.22, 0.3), matFaixaLar); sen.position.set(0, 3.7, 0.05); g.add(sen);
      } else if (o.tipo === 'cancela') {
        var poste = new T.Mesh(new T.BoxGeometry(0.2, 1.1, 0.2), matBranco); poste.position.set(-LANE * K / 2 + 0.15, 0.55, 0); g.add(poste);
        var piv = new T.Group(); piv.position.set(-LANE * K / 2 + 0.15, 0.95, 0); g.add(piv);
        var barra = new T.Mesh(new T.BoxGeometry(LANE * K - 0.3, 0.14, 0.1), new T.MeshLambertMaterial({ map: texBarra })); barra.position.x = (LANE * K - 0.3) / 2; piv.add(barra);
        g.userData.piv = piv;
        if (o.lane === 1 || o.lane === N - 2) {
          // cabines finas entre a praça e as faixas de free flow; cobertura só sobre as 3 faixas do meio
          var cab = new T.Group(); var corpo = new T.Mesh(new T.BoxGeometry(0.5, 2.4, 2.2), matCabine); corpo.position.y = 1.2; cab.add(corpo);
          var fx = new T.Mesh(new T.BoxGeometry(0.55, 0.3, 2.25), matFaixaLar); fx.position.y = 2.2; cab.add(fx);
          cab.position.x = (o.lane === 1 ? -1 : 1) * (LANE * K / 2); g.add(cab);
          if (o.lane === 1) { var teto = new T.Mesh(new T.BoxGeometry(LANE * K * 3 + 0.6, 0.25, 3), matCabine); teto.position.set(LANE * K, 3.6, 0); g.add(teto); }
        }
      } else if (o.tipo === 'tag' || o.tipo === 'seguro') {
        var sp = new T.Sprite(new T.SpriteMaterial({ map: o.tipo === 'tag' ? texTag : texSeg, transparent: true, depthWrite: false }));
        if (o.tipo === 'tag') sp.scale.set(1.3, 0.98, 1); else sp.scale.set(1.25, 1.56, 1);
        sp.position.y = 1.0; g.add(sp); g.userData.sp = sp; g.add(sombra(1.0, 1.0));
      } else if (o.tipo === 'cap') {
        var cp = new T.Mesh(new T.PlaneGeometry(wm, lm), new T.MeshBasicMaterial({ map: texCap, transparent: true, depthWrite: false }));
        cp.rotation.x = -Math.PI / 2; cp.position.y = 0.014; g.add(cp);
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
      meu.rotation.y = -(CENTRO[s.lane] - s.x) * 0.0035;   // a frente aponta para a faixa de destino
      meu.visible = !(s.invul > 0 && Math.floor(s.invul * 10) % 2 === 0);
      s.obst.forEach(function (o) {
        if (!o._mesh) o._mesh = criarMesh(o);
        var g = o._mesh, a = o.d - s.dist + o.h / 2;
        g.position.set(o.tipo === 'aviso' ? 0 : lx(CENTRO[o.lane]), 0, -a * K);
        g.visible = !(o.pego && o.tipo !== 'cap' && o.tipo !== 'posto') && !(o.batido && o.tipo !== 'buraco');
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
      if ((o.pego && o.tipo !== 'cap' && o.tipo !== 'posto') || (o.batido && o.tipo !== 'buraco')) return;
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
      } else if (o.tipo === 'cap') capPiso(ctx, cx, bot, o.w, o.h, false);
      else if (o.tipo === 'posto') { var cvq = document.createElement('canvas'); cvq.width = 256; cvq.height = 416; postoTextura(cvq.getContext('2d'), 256, 416); ctx.drawImage(cvq, cx - o.w / 2, bot - o.h, o.w, o.h); }
      else if (o.tipo === 'carro') carroClassico(ctx, cx, top, '#9AA1AC', '#666C76', true);
      else if (o.tipo === 'cancela' && o.ff) {
        ctx.fillStyle = 'rgba(73,158,242,.45)'; ctx.fillRect(cx - LANE / 2 + 4, top - 30, LANE - 8, o.h + 50);
        ctx.fillStyle = '#1C5FB8'; ctx.fillRect(cx - LANE / 2, top + 4, LANE, 12);
        ctx.fillStyle = '#F4F1EA'; ctx.font = '900 13px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FREE FLOW', cx, top - 12);
      } else if (o.tipo === 'cancela') {
        if (o.lane === 1) { ctx.fillStyle = '#14235E'; rr(ctx, 2, top - 18, R0 - 4, o.h + 30, 4); ctx.fill(); rr(ctx, W - R0 + 2, top - 18, R0 - 4, o.h + 30, 4); ctx.fill(); ctx.fillStyle = '#EC7000'; ctx.fillRect(2, top - 18, R0 - 4, 6); ctx.fillRect(W - R0 + 2, top - 18, R0 - 4, 6); }
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
    if (!(s.invul > 0 && Math.floor(s.invul * 10) % 2 === 0)) carroClassico(ctx, R0 + s.x, CY, hexCss(COR_EU), hexCss(COR_EU, 0.7), false);
    if (s.tags) { ctx.fillStyle = '#14235E'; rr(ctx, R0 + s.x - 11, CY + 30, 22, 14, 4); ctx.fill(); ctx.fillStyle = '#EC7000'; ctx.font = '900 8px Montserrat, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAG', R0 + s.x, CY + 37); }
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
      eu: spriteCarro('#2F7FE0', '#1A4E99'),
      p: [spriteCarro('#E9ECF1', '#A9AFBA'), spriteCarro('#8E97A6', '#59606C'), spriteCarro('#23262D', '#0D0F12'), spriteCarro('#C9CDD3', '#8C929C'), spriteCarro('#4F5A4C', '#2F372E')]
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
      } else if (o.tipo === 'cap') {
        capPiso(ctx, cx, bot, o.w, o.h, true);
      } else if (o.tipo === 'posto') {
        if (!REAL.posto) { var cvp = document.createElement('canvas'); cvp.width = 256; cvp.height = 416; postoTextura(cvp.getContext('2d'), 256, 416); REAL.posto = cvp; }
        ctx.drawImage(REAL.posto, cx - o.w / 2, bot - o.h, o.w, o.h);
      } else if (o.tipo === 'aviso') {
        ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = '#F4F1EA'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '900 40px Montserrat, Arial, sans-serif';
        ctx.fillText('PEDÁGIO', R0 + ROAD / 2, bot - 22); ctx.fillRect(R0 + 14, bot - 2, ROAD - 28, 5); ctx.restore();
      }
    });
    // objetos com altura (sombras + corpo)
    s.obst.forEach(function (o) {
      if (o.pego || (o.batido && o.tipo !== 'buraco') || o.tipo === 'buraco' || o.tipo === 'aviso' || o.tipo === 'cap' || o.tipo === 'posto') return;
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
      } else if (o.tipo === 'cancela' && o.ff) {
        // free flow: piso azul e pórtico com leitor de TAG
        ctx.fillStyle = 'rgba(73,158,242,.42)'; ctx.fillRect(cx - LANE / 2 + 4, top - 40, LANE - 8, o.h + 70);
        ctx.fillStyle = '#F4F1EA'; ctx.font = '900 15px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('FREE', cx, top - 18); ctx.fillText('FLOW', cx, top + 2);
        ctx.fillStyle = '#1C5FB8'; ctx.fillRect(cx - LANE / 2, top + 16, LANE, 9); ctx.fillStyle = '#EC7000'; ctx.fillRect(cx - 6, top + 14, 12, 13);
      } else if (o.tipo === 'cancela') {
        var py = top + 10;
        ctx.fillStyle = '#5F646D'; rr(ctx, cx - 50, py - 7, 12, 14, 3); ctx.fill();
        ctx.save(); ctx.translate(cx - 44, py);
        o._ang = (o._ang || 0) + ((o.aberta ? -1.35 : 0) - (o._ang || 0)) * 0.2; ctx.rotate(o._ang);
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(4, 3, 88, 8);
        for (var b = 0; b < 8; b++) { ctx.fillStyle = b % 2 ? '#F4F1EA' : '#D8342B'; ctx.fillRect(b * 11, -4, 11, 8); }
        ctx.restore();
        if (o.lane === 1) {
          // cabines entre a praça e as faixas de free flow
          [R0 + LANE - 29, R0 + ROAD - LANE - 29].forEach(function (bx) {
            ctx.save(); ctx.filter = 'blur(4px)'; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(bx + 8, py - 22, 58, 60); ctx.restore();
            ctx.fillStyle = '#14235E'; rr(ctx, bx, py - 30, 58, 58, 6); ctx.fill();
            ctx.fillStyle = '#EC7000'; ctx.fillRect(bx, py - 30, 58, 8);
            ctx.fillStyle = '#9CC9FF'; ctx.fillRect(bx + 8, py - 14, 42, 10);
          });
        }
      } else if (o.tipo === 'aura') {
        var cya = bot - o.h / 2, pa = 1 + Math.sin(s.t * 8) * 0.09;
        ctx.save(); ctx.filter = 'blur(4px)'; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(cx + 8, cya + 14, 19, 10, 0, 0, 7); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(cx, cya); ctx.scale(pa, pa); ctx.rotate(Math.sin(s.t * 3) * 0.12); desenharPoderAura(ctx, 0, 0, 42); ctx.restore();
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
    var px = R0 + s.x, inclin = (CENTRO[s.lane] - s.x) * 0.004;   // a frente aponta para a faixa de destino; gira em torno do eixo traseiro
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var fg = ctx.createRadialGradient(px, CY - 60, 4, px, CY - 60, 90); fg.addColorStop(0, 'rgba(255,240,190,.22)'); fg.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(px - 18, CY + 2); ctx.lineTo(px - 70, CY - 150); ctx.lineTo(px + 70, CY - 150); ctx.lineTo(px + 18, CY + 2); ctx.closePath(); ctx.fill(); ctx.restore();
    if (s.aura > 0) {
      var pa2 = 1 + Math.sin(s.t * 12) * 0.06, fim = s.aura < 1.2 && Math.floor(s.aura * 8) % 2 === 0;
      if (!fim) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; var hg = ctx.createRadialGradient(px, CY + 46, 10, px, CY + 46, 70 * pa2); hg.addColorStop(0, 'rgba(255,140,60,.55)'); hg.addColorStop(0.55, 'rgba(73,158,242,.35)'); hg.addColorStop(1, 'rgba(73,158,242,0)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(px, CY + 46, 72 * pa2, 0, 7); ctx.fill(); ctx.restore(); }
    }
    if (!(s.invul > 0 && Math.floor(s.invul * 10) % 2 === 0)) {
      ctx.save(); ctx.translate(px, CY + 72); ctx.rotate(inclin); ctx.translate(0, -26);
      ctx.drawImage(REAL.sombraCarro, -26 - 9 + 5, -46 - 6 + 6, 66, 106);
      var spEu = SEL.cat === 'aura' ? null : imgCima(SEL.cat); ctx.drawImage(spEu || REAL.carros.eu, -26, -46, 52, 92);
      if (s.tags) { ctx.fillStyle = '#14235E'; rr(ctx, -10, -4, 20, 12, 3); ctx.fill(); ctx.fillStyle = '#EC7000'; ctx.font = '900 7px Montserrat, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAG', 0, 2); }
      ctx.restore();
    }
    // cobertura da praça de pedágio (por cima dos carros)
    s.obst.forEach(function (o) {
      if (o.tipo !== 'cancela' || o.lane !== 1) return;
      var top = CY - (o.d - s.dist) - o.h;
      if (top < -200 || top > H + 200) return;
      // cobertura só sobre as 3 faixas do meio
      ctx.fillStyle = 'rgba(20,35,94,.82)'; ctx.fillRect(R0 + LANE - 10, top - 70, LANE * 3 + 20, 64);
      ctx.fillStyle = '#EC7000'; ctx.fillRect(R0 + LANE - 10, top - 12, LANE * 3 + 20, 6);
      ctx.fillStyle = '#F4F1EA'; ctx.font = '800 20px Montserrat, Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PEDÁGIO', R0 + ROAD / 2, top - 40);
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

  // sem WebGL, o 3D realista cai para o de cima realista
  var VISUAL = (visual === '3dreal' && R3) ? '3dreal' : 'realista';
  function desenhar(tempoReal) {
    if (VISUAL === '3d' || VISUAL === '3dreal') { R3.render(tempoReal); desenharHUD(true); }
    else if (VISUAL === 'realista') { desenharRealista(); desenharHUD(false); }
    else { desenharClassico(); desenharHUD(false); }
  }
  function quadro(ts) {
    if (parado) return;
    if (ultimo == null) ultimo = ts;
    var dt = Math.min(0.05, (ts - ultimo) / 1000); ultimo = ts;
    if (s.fase === 'contagem' && !s.pausado) {
      var antesC = Math.ceil(s.cont); s.cont -= dt;
      if (s.cont <= 0) { s.fase = 'rodando'; if (window.Musica) { Musica.bip(true); Musica.tocar(); } }
      else if (Math.ceil(s.cont) !== antesC && window.Musica) Musica.bip(false);
    }
    else if (s.pausado) { /* pausado: só redesenha */ }
    else if (s.fase === 'rodando') { if (window.Musica) Musica.ritmo(nivel(s.t)); s.acc += dt; while (s.acc >= STEP && s.vivo) { passo(STEP); s.acc -= STEP; } }
    else if (s.fase === 'batida') {
      s.flash = Math.max(0, s.flash - dt * 1.4); if (s.tremor > 0) s.tremor -= dt;
      if (!fimDisparado) { fimDisparado = true; if (window.Musica) Musica.parar(true); setTimeout(function () { parar(); aoFim(Math.round(placar() * 100) / 100, { multas: s.multas, segExtra: s.segExtra }); }, 1100); }
    }
    desenhar(ts / 1000);
    raf = requestAnimationFrame(quadro);
  }
  function tecla(e) {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { e.preventDefault(); pausaJogo(!s.pausado); return; }
    if (s.pausado) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); mover(-1); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); mover(1); }
  }
  function toque(e) {
    if (s.pausado) return;
    e.preventDefault();
    var rect = wrap.getBoundingClientRect();
    var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    mover(x < rect.width / 2 ? -1 : 1);
  }
  // saiu do app no meio da corrida: pausa (antes encerrava)
  function oculto() { if (document.hidden && (s.fase === 'rodando' || s.fase === 'contagem') && s.vivo) pausaJogo(true); }
  function pausaJogo(p) {
    if (!(s.fase === 'rodando' || s.fase === 'contagem') || !s.vivo || s.pausado === p) return;
    s.pausado = p;
    if (window.Musica) { if (p) Musica.parar(); else if (s.fase === 'rodando') Musica.tocar(); }
    if (typeof aoPausa === 'function') aoPausa(p);
  }
  function parar() {
    parado = true; if (raf) cancelAnimationFrame(raf); if (window.Musica) Musica.parar();
    document.removeEventListener('keydown', tecla); document.removeEventListener('visibilitychange', oculto);
    wrap.removeEventListener('pointerdown', toque);
    if (R3) { R3.destruir(); R3 = null; }
  }
  document.addEventListener('keydown', tecla);
  document.addEventListener('visibilitychange', oculto);
  wrap.addEventListener('pointerdown', toque);
  raf = requestAnimationFrame(quadro);
  this.parar = parar;
  this.pausaJogo = pausaJogo;
  this.r3 = function () { return R3; };
  this.pausar = function () { parado = true; if (raf) cancelAnimationFrame(raf); };
  this.abortar = function () { if (s.pausado) { s.pausado = false; if (typeof aoPausa === 'function') aoPausa(false); } if (s.fase === 'rodando' && s.vivo) { s.vivo = false; s.fase = 'batida'; s.flash = 1; } else if (s.fase === 'contagem') { s.fase = 'batida'; s.vivo = false; } };
  this.estado = s;
  this.modo = VISUAL;
  this._passo = passo;
  this._desenhar = function () { desenhar(performance.now() / 1000); };
  this.N = N; this.CENTRO = CENTRO;
}
