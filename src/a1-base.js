/* ================== CONFIGURAÇÃO ==================
   Cole aqui o firebaseConfig do seu projeto. Com apiKey vazio o app roda em MODO DEMONSTRAÇÃO
   (dados fictícios, salvos só neste navegador). */
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyByZPr7QZcA0eU4sepY-yunTutXxvXt6vo",
  authDomain: "game-aura-59bf8.firebaseapp.com",
  projectId: "game-aura-59bf8",
  storageBucket: "game-aura-59bf8.firebasestorage.app",
  messagingSenderId: "545618885083",
  appId: "1:545618885083:web:d3449c6a14ab3be72b0ffe"
};
var REGIAO = 'southamerica-east1';
var BUILD = '2026-11-27b';
var DEMO = !FIREBASE_CONFIG.apiKey;
var FB_OK = typeof firebase !== 'undefined';
var DIA = 86400000;
var TEMAS = Logica.TEMAS;

/* ================== UTILIDADES ================== */
function $(s) { return document.querySelector(s); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function brt(ms) { return new Date(ms - 3 * 3600000); }
function fmtDia(ms) { var d = brt(ms); return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth() + 1); }
function fmtDiaHora(ms) { var d = brt(ms); return fmtDia(ms) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
function fmtDur(ms) {
  if (ms <= 0) return 'agora';
  var m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + mi + 'min';
  return Math.max(1, mi) + 'min';
}
function fmtSeg(s) { return (Math.round((s || 0) * 10) / 10).toFixed(1).replace('.', ',') + ' s'; }
function ymd(ms) { var d = brt(ms); return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()); }
function dataParaMs(v) { var p = String(v).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2], 3, 0, 0); }
function msParaData(ms) { var d = brt(ms); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
function slug(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || ('a' + Date.now()); }
function primeiroNome(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
function iniciais(n) { var p = String(n || '?').replace(/\([^)]*\)/g, '').replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
var CORES_AV = ['#1F3686', '#ED6C42', '#01A0FB', '#17935F', '#8E44AD', '#C0392B', '#D68910', '#2E86C1', '#5D6D7E'];
function corDe(uid) { return CORES_AV[Logica.hash(uid || 'x') % CORES_AV.length]; }
function nomeExib(j) {
  if (!j) return '—';
  var pn = primeiroNome(j.nome);
  var sem = function (x) { return String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase(); };
  // apelido igual ao primeiro nome (mesmo sem acento, ex.: Tarcisio x Tarcísio) não repete
  if (j.apelido && sem(j.apelido) !== sem(pn)) return j.apelido + ' · ' + pn;
  return j.apelido || pn || '—';
}
function avatar(j, uid, cls) {
  cls = cls ? ' ' + cls : '';
  if (j && j.foto) return '<img class="av' + cls + '" src="' + esc(j.foto) + '" alt="">';
  var nm = j ? (j.apelido || j.nome) : '?';
  return '<span class="av' + cls + '" style="background:' + corDe(uid) + '">' + esc(iniciais(nm)) + '</span>';
}
function toast(msg, ms) {
  var t = $('#toast'); t.textContent = msg; t.className = 'on';
  clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = ''; }, ms || 2600);
}
function lerLS(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
function gravarLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
function msgErro(e) { return (e && e.message) ? e.message.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/[^)]+\)\.?$/, '') : 'Algo deu errado.'; }
function traduzAuth(e) {
  var c = (e && e.code) || '';
  var m = {
    'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'Não encontramos uma conta com esse e-mail.', 'auth/email-already-in-use': 'Já existe uma conta com esse e-mail. Use "Entrar".',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.', 'auth/invalid-email': 'E-mail inválido.',
    'auth/popup-closed-by-user': 'Login com Google cancelado.', 'auth/network-request-failed': 'Sem conexão. Verifique a internet e tente de novo.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.'
  };
  return m[c] || msgErro(e);
}
function deepMerge(a, b) {
  Object.keys(b).forEach(function (k) {
    var v = b[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) deepMerge(a[k], v);
    else a[k] = (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
  });
  return a;
}

/* ================== BACKEND: FIREBASE ================== */
function criarFirebase() {
  firebase.initializeApp(FIREBASE_CONFIG);
  var auth = firebase.auth(), db = firebase.firestore(), fns = firebase.app().functions(REGIAO);
  function consulta(col, where) {
    var r = db.collection(col);
    (where || []).forEach(function (w) { r = r.where(w[0], w[1], w[2]); });
    return r;
  }
  function logErr(e) { console.warn('[firestore]', e && e.message); }
  return {
    modo: 'fb',
    onAuth: function (cb) { auth.onAuthStateChanged(function (u) { cb(u ? { uid: u.uid, email: u.email || '', nome: u.displayName || '', foto: u.photoURL || '' } : null); }); },
    entrarEmail: function (e, s) { return auth.signInWithEmailAndPassword(e, s); },
    criarConta: function (e, s) { return auth.createUserWithEmailAndPassword(e, s); },
    entrarGoogle: function () { return auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); },
    sair: function () { return auth.signOut(); },
    redefinir: function (e) { return auth.sendPasswordResetEmail(e); },
    ouvirDoc: function (path, cb) { return db.doc(path).onSnapshot(function (s) { cb(s.exists ? s.data() : null); }, logErr); },
    ouvirCol: function (col, where, cb) {
      return consulta(col, where).onSnapshot(function (s) { var m = {}; s.forEach(function (d) { m[d.id] = d.data(); }); cb(m); }, logErr);
    },
    get: function (path) { return db.doc(path).get().then(function (s) { return s.exists ? s.data() : null; }); },
    getCol: function (col, where) { return consulta(col, where).get().then(function (s) { var m = {}; s.forEach(function (d) { m[d.id] = d.data(); }); return m; }); },
    set: function (path, data, merge) { return db.doc(path).set(data, merge ? { merge: true } : {}); },
    update: function (path, data) { return db.doc(path).update(data); },
    del: function (path) { return db.doc(path).delete(); },
    lote: function (ops) {
      var partes = [];
      for (var i = 0; i < ops.length; i += 400) partes.push(ops.slice(i, i + 400));
      return partes.reduce(function (p, parte) {
        return p.then(function () {
          var b = db.batch();
          parte.forEach(function (o) {
            if (o.op === 'del') b.delete(db.doc(o.path));
            else b.set(db.doc(o.path), o.data, o.merge ? { merge: true } : {});
          });
          return b.commit();
        });
      }, Promise.resolve());
    },
    chamar: function (nome, dados) {
      return fns.httpsCallable(nome)(dados).then(function (r) { return r.data; })
        .catch(function (e) { throw new Error((e && e.message) || 'Erro no servidor'); });
    }
  };
}

/* ================== BACKEND: DEMONSTRAÇÃO ================== */
function criarDemo() {
  var CH = 'gameicarros_demo_v9';
  var db = lerLS(CH, null);
  var subs = [], authCbs = [];
  var usuario = lerLS(CH + '_u', null);
  function salvar() { gravarLS(CH, db); }
  function parte(path) { var p = path.split('/'); return { col: p[0], id: p[1] }; }
  function col(c) { if (!db.cols[c]) db.cols[c] = {}; return db.cols[c]; }
  function bate(doc, where) {
    return (where || []).every(function (w) { var v = doc[w[0]]; if (w[1] === '==') return v === w[2]; if (w[1] === 'in') return w[2].indexOf(v) >= 0; if (w[1] === 'array-contains') return (v || []).indexOf(w[2]) >= 0; return true; });
  }
  function clone(o) { return o == null ? null : JSON.parse(JSON.stringify(o)); }
  function notificar(c) { setTimeout(function () { subs.forEach(function (s) { if (s.col === c) s.fire(); }); }, 0); }
  function lerDoc(path) { var p = parte(path); return clone(col(p.col)[p.id]); }
  function regras(path, data) {
    // simula a regra do código de acesso no cadastro
    var p = parte(path);
    if (p.col === 'jogadores' && data.status === 'ativo' && data.papel === 'jogador' && !col('jogadores')[p.id]) {
      var seg = col('segredos').acesso;
      if (!seg || !data.codigoAcesso || seg.codigo !== data.codigoAcesso) { var e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; throw e; }
    }
    var atual = col('config')[p.id];
    if (p.col === 'config' && atual && data.masterUid && data.masterUid !== atual.masterUid) { throw new Error('Missing or insufficient permissions.'); }
  }
  function gravar(path, data, merge) {
    regras(path, data);
    var p = parte(path); var c = col(p.col);
    if (merge && c[p.id]) deepMerge(c[p.id], data); else c[p.id] = clone(data);
    salvar(); notificar(p.col);
  }
  var api = {
    modo: 'demo',
    onAuth: function (cb) { authCbs.push(cb); setTimeout(function () { cb(usuario); }, 0); },
    entrarComo: function (u) { usuario = u; gravarLS(CH + '_u', u); authCbs.forEach(function (cb) { cb(u); }); },
    entrarEmail: function (e, s) {
      var c = db.contas[String(e).toLowerCase()];
      if (!c || c.s !== s) { var er = new Error('E-mail ou senha incorretos.'); er.code = 'auth/invalid-credential'; return Promise.reject(er); }
      api.entrarComo({ uid: c.uid, email: e, nome: '' }); return Promise.resolve();
    },
    criarConta: function (e, s) {
      e = String(e).toLowerCase();
      if (db.contas[e]) { var er = new Error('x'); er.code = 'auth/email-already-in-use'; return Promise.reject(er); }
      if (String(s).length < 6) { var er2 = new Error('x'); er2.code = 'auth/weak-password'; return Promise.reject(er2); }
      var uid = 'u' + Math.random().toString(36).slice(2, 10);
      db.contas[e] = { uid: uid, s: s }; salvar();
      api.entrarComo({ uid: uid, email: e, nome: '' }); return Promise.resolve();
    },
    entrarGoogle: function () { var e = new Error('demo-google'); e.code = 'demo-google'; return Promise.reject(e); },
    sair: function () { usuario = null; gravarLS(CH + '_u', null); authCbs.forEach(function (cb) { cb(null); }); return Promise.resolve(); },
    redefinir: function () { return Promise.resolve(); },
    ouvirDoc: function (path, cb) {
      var p = parte(path);
      var s = { col: p.col, fire: function () { if (s.ativo) cb(lerDoc(path)); }, ativo: true };
      subs.push(s); setTimeout(s.fire, 0);
      return function () { s.ativo = false; subs = subs.filter(function (x) { return x !== s; }); };
    },
    ouvirCol: function (c, where, cb) {
      var s = { col: c, ativo: true, fire: function () {
        if (!s.ativo) return;
        var m = {}, cc = col(c);
        Object.keys(cc).forEach(function (id) { if (bate(cc[id], where)) m[id] = clone(cc[id]); });
        cb(m);
      } };
      subs.push(s); setTimeout(s.fire, 0);
      return function () { s.ativo = false; subs = subs.filter(function (x) { return x !== s; }); };
    },
    get: function (path) { return Promise.resolve(lerDoc(path)); },
    getCol: function (c, where) {
      var m = {}, cc = col(c);
      Object.keys(cc).forEach(function (id) { if (bate(cc[id], where)) m[id] = clone(cc[id]); });
      return Promise.resolve(m);
    },
    set: function (path, data, merge) { try { gravar(path, data, merge); return Promise.resolve(); } catch (e) { return Promise.reject(e); } },
    update: function (path, data) {
      var p = parte(path); var c = col(p.col);
      if (!c[p.id]) return Promise.reject(new Error('Documento não encontrado.'));
      Object.keys(data).forEach(function (k) { c[p.id][k] = clone(data[k]); });
      salvar(); notificar(p.col); return Promise.resolve();
    },
    del: function (path) { var p = parte(path); delete col(p.col)[p.id]; salvar(); notificar(p.col); return Promise.resolve(); },
    lote: function (ops) {
      try { ops.forEach(function (o) { if (o.op === 'del') { var p = parte(o.path); delete col(p.col)[p.id]; notificar(p.col); } else gravar(o.path, o.data, o.merge); }); salvar(); return Promise.resolve(); }
      catch (e) { return Promise.reject(e); }
    },
    chamar: function (nome, dados) {
      return new Promise(function (res, rej) {
        setTimeout(function () {
          try { res(demoFuncao(nome, dados || {})); } catch (e) { rej(e); }
        }, 220);
      });
    },
    resetar: function () { try { localStorage.removeItem(CH); localStorage.removeItem(CH + '_u'); } catch (e) { } location.reload(); }
  };
  function placarSet(rodada, uid, entrada) {
    var p = {}; p[uid] = entrada;
    gravar('placar/' + rodada.id, { temporadaId: rodada.temporadaId, rodadaId: rodada.id, p: p }, true);
  }
  function rodadaCom(id) { var r = lerDoc('rodadas/' + id); if (r) r.id = id; return r; }
  function tentativas(rid, uid) { var t = []; for (var n = 1; n <= 3; n++) t.push(lerDoc('corrida/' + rid + '_' + uid + '_' + n)); return t; }
  function demoFuncao(nome, d) {
    if (!usuario) Logica.erro('Faça login.');
    var uid = usuario.uid, now = Date.now(), jog = lerDoc('jogadores/' + uid), r;
    if (nome === 'iniciarQuiz' || nome === 'responderQuiz') {
      var rod = rodadaCom(d.rodadaId);
      var ctx = { now: now, uid: uid, jog: jog, rodada: rod, gab: lerDoc('gabarito/' + d.rodadaId), quiz: lerDoc('quiz/' + d.rodadaId + '_' + uid), idx: d.idx, alt: d.alt };
      r = nome === 'iniciarQuiz' ? Logica.iniciarQuiz(ctx) : Logica.responderQuiz(ctx);
      if (r.quiz) gravar('quiz/' + d.rodadaId + '_' + uid, r.quiz);
      if (r.placar) placarSet(rod, uid, r.placar);
      return r.resp;
    }
    if (nome === 'iniciarCorrida') {
      var rod2 = rodadaCom(d.rodadaId);
      r = Logica.iniciarCorrida({ now: now, uid: uid, jog: jog, rodada: rod2, tent: tentativas(d.rodadaId, uid) });
      gravar('corrida/' + d.rodadaId + '_' + uid + '_' + r.n, r.doc);
      placarSet(rod2, uid, r.placar);
      return r.resp;
    }
    if (nome === 'finalizarCorrida') {
      var rod3 = rodadaCom(d.rodadaId);
      r = Logica.finalizarCorrida({ now: now, uid: uid, jog: jog, rodada: rod3, tent: tentativas(d.rodadaId, uid), n: d.n, tempo: d.tempo });
      gravar('corrida/' + d.rodadaId + '_' + uid + '_' + d.n, r.doc);
      placarSet(rod3, uid, r.placar);
      if (Number(d.multas) > 0) {
        var carroM = String(d.carro || 'aura'), catM = Garagem.catDoCarro(carroM, lerDoc('garagens/' + uid));
        var mm = Garagem.registrarMultas(lerDoc('carteira/' + uid), Math.min(Number(d.multas), Garagem.maxMultas(r.resp.tempo)), catM === 'aura' && carroM !== 'aura' ? 'aura' : carroM, catM, 'corrida', now);
        if (mm.novas) gravar('carteira/' + uid, mm.carteira); r.resp.multas = mm.novas;
      }
      if (Number(d.segExtra) > 0) { var sx = Garagem.creditarSeguros(lerDoc('carteira/' + uid), d.segExtra, r.resp.tempo, 'corrida', now); if (sx.creditos) { gravar('carteira/' + uid, sx.carteira); r.resp.segCreditos = sx.creditos; } }
      return r.resp;
    }
    if (nome === 'anularTentativa') {
      var cfg = lerDoc('config/geral');
      if (!jog || !(jog.papel === 'adm' || (cfg && cfg.masterUid === uid))) Logica.erro('Apenas administradores.');
      var rod4 = rodadaCom(d.rodadaId), dono = lerDoc('jogadores/' + d.uid);
      r = Logica.anularTentativa({ jog: dono, tent: tentativas(d.rodadaId, d.uid), n: d.n, anular: d.anular });
      gravar('corrida/' + d.rodadaId + '_' + d.uid + '_' + d.n, r.doc);
      placarSet(rod4, d.uid, r.placar);
      return { ok: true };
    }
    if (nome === 'placa') return demoPlaca(uid, jog, d, now);
    if (nome === 'garagem') return demoGaragem(uid, jog, d, now);
    if (nome === 'duelo') return demoDuelo(uid, jog, d, now);
    if (nome === 'treino') {
      var tr0 = lerDoc('treinos/' + uid);
      var rt = d.op === 'iniciar' ? Garagem.iniciarTreino({ now: now, uid: uid, jog: jog, doc: tr0, carro: String(d.carro || ''), garagem: lerDoc('garagens/' + uid) })
        : Garagem.finalizarTreino({ now: now, doc: tr0, tempo: d.tempo });
      gravar('treinos/' + uid, rt.doc);
      if (d.op === 'finalizar' && rt.resp.valido && Number(d.multas) > 0) {
        var mt = Garagem.registrarMultas(lerDoc('carteira/' + uid), Math.min(Number(d.multas), Garagem.maxMultas(rt.resp.tempo)), rt.sessao.carro || rt.sessao.cat, rt.sessao.cat, 'treino', now);
        if (mt.novas) gravar('carteira/' + uid, mt.carteira); rt.resp.multas = mt.novas;
      }
      if (d.op === 'finalizar' && rt.resp.valido && Number(d.segExtra) > 0) { var st2 = Garagem.creditarSeguros(lerDoc('carteira/' + uid), d.segExtra, rt.resp.tempo, 'treino', now); if (st2.creditos) { gravar('carteira/' + uid, st2.carteira); rt.resp.segCreditos = st2.creditos; } }
      return rt.resp;
    }
    Logica.erro('Função desconhecida: ' + nome);
  }
  /* ---- Garagem no modo demonstração: mesma lógica das Cloud Functions ---- */
  function demoSaldo(uid) {
    var plac = Object.keys(col('placar')).map(function (k) { return col('placar')[k]; });
    var vit = Object.keys(col('placaPartidas')).filter(function (k) { var p = col('placaPartidas')[k]; return p.vencedor === uid && !p.temRobo; }).length;
    var ganhos = Garagem.ganhos(uid, plac, col('temporadas'), vit, (lerDoc('treinos/' + uid) || {}).creditos || 0), carteira = lerDoc('carteira/' + uid) || {};
    return { uid: uid, ganhos: ganhos, carteira: carteira, garagem: lerDoc('garagens/' + uid) || { carros: {} }, saldo: Garagem.saldo(ganhos, carteira) };
  }
  // mesmo motor dos duelos do servidor, gravando no armazenamento do demo
  function demoDuelo(uid, jog, d, now) {
    var ap = function (j) { return (j && (j.apelido || String(j.nome || '').split(/\s+/)[0])) || ''; };
    var anunciados = function (u) { var a = col('anuncios'); return Object.keys(a).map(function (k) { return a[k]; }).filter(function (x) { return x.vendedor === u && x.status === 'ativo'; }).map(function (x) { return x.iid; }); };
    var op = d.op;
    if (op === 'desafiar') {
      var outro = lerDoc('jogadores/' + d.para), todos = col('duelos');
      var abertos = Object.keys(todos).map(function (k) { return todos[k]; }).filter(function (x) { return (x.uids || []).indexOf(uid) >= 0 && Garagem.duelAtivo(x); });
      var id = 'd' + now.toString(36);
      var r = Garagem.desafiar({ id: id, now: now, uid: uid, ap: ap(jog), para: d.para, paraAp: ap(outro), paraAtivo: !!outro && outro.status === 'ativo', aposta: d.aposta, st: demoSaldo(uid), anunciados: anunciados(uid),
        meusAtivos: abertos.length, entreNos: abertos.some(function (x) { return x.uids.indexOf(d.para) >= 0; }) });
      gravar('duelos/' + id, r.doc); gravar('carteira/' + uid, r.carteira); gravar('garagens/' + uid, r.garagem);
      return { id: id };
    }
    var du = lerDoc('duelos/' + d.id); if (!du) Logica.erro('Duelo não encontrado.');
    var lados = function () { return { carts: { de: lerDoc('carteira/' + du.de) || {}, para: lerDoc('carteira/' + du.para) || {} }, gars: { de: lerDoc('garagens/' + du.de) || { carros: {} }, para: lerDoc('garagens/' + du.para) || { carros: {} } } }; };
    if (op === 'aceitar') { var ra = Garagem.aceitar({ id: d.id, now: now, uid: uid, d: du, aposta: d.aposta, st: demoSaldo(uid), anunciados: anunciados(uid) }); gravar('duelos/' + d.id, ra.doc); gravar('carteira/' + uid, ra.carteira); gravar('garagens/' + uid, ra.garagem); return { ok: true }; }
    if (op === 'contrapropor') { gravar('duelos/' + d.id, Garagem.contrapropor({ now: now, uid: uid, d: du, valor: d.valor, st: demoSaldo(uid) }).doc); return { ok: true }; }
    if (op === 'aceitarContra') { var rc = Garagem.aceitarContra({ id: d.id, now: now, uid: uid, d: du, stDe: demoSaldo(du.de), stPara: demoSaldo(du.para) }); gravar('duelos/' + d.id, rc.doc); gravar('carteira/' + du.de, rc.carteiraDe); gravar('carteira/' + du.para, rc.carteiraPara); return { ok: true }; }
    if (op === 'recusar' || op === 'cancelar') {
      var rd = Garagem.desfazer({ now: now, d: du, motivo: op === 'recusar' ? 'recusado' : 'cancelado', cartDe: lerDoc('carteira/' + du.de), garDe: lerDoc('garagens/' + du.de) });
      gravar('duelos/' + d.id, rd.doc); gravar('carteira/' + du.de, rd.carteira); gravar('garagens/' + du.de, rd.garagem); return { ok: true };
    }
    if (op === 'iniciar') { var ri = Garagem.iniciarDuelo({ now: now, uid: uid, d: du, n: d.n, carro: String(d.carro || ''), garagem: lerDoc('garagens/' + uid) }); gravar('duelos/' + d.id, ri.doc); return ri.resp; }
    if (op === 'finalizar' || op === 'atualizar') {
      var L2 = lados(), doc = du, resp = {};
      if (op === 'finalizar') {
        var f = Garagem.finalizarDuelo({ now: now, uid: uid, d: du, n: d.n, tempo: d.tempo }); doc = f.doc; resp = { tempo: f.tempo, valido: f.valido };
        var lado = Garagem.lado(du, uid), x = doc.corridas[lado][Math.floor(Number(d.n))];
        if (f.valido) { var td = lerDoc('treinos/' + uid) || {}, rr = Garagem.gravarRecordes(td, { t: f.tempo, cat: (x && x.cat) || 'aura', em: now, duelo: true }, now); gravar('treinos/' + uid, td); resp.recorde = rr.recorde; }
        if (Number(d.multas) > 0 && f.valido) { var m = Garagem.registrarMultas(L2.carts[lado], Math.min(Number(d.multas), Garagem.maxMultas(f.tempo)), x.carro, x.cat, 'duelo', now); if (m.novas) { L2.carts[lado] = m.carteira; resp.multas = m.novas; } }
        if (Number(d.segExtra) > 0 && f.valido) { var sd = Garagem.creditarSeguros(L2.carts[lado], d.segExtra, f.tempo, 'duelo', now); if (sd.creditos) { L2.carts[lado] = sd.carteira; resp.segCreditos = sd.creditos; } }
      }
      if (doc.status === 'pendente' && now > doc.prazo) { var re = Garagem.desfazer({ now: now, d: doc, motivo: 'expirado', cartDe: L2.carts.de, garDe: L2.gars.de }); doc = re.doc; L2.carts.de = re.carteira; L2.gars.de = re.garagem; }
      var liq = Garagem.liquidarDuelo(doc, L2.carts, L2.gars, now); if (liq) { doc = liq.doc; L2.carts = liq.carteiras; L2.gars = liq.garagens; }
      gravar('duelos/' + d.id, doc); ['de', 'para'].forEach(function (sd) { gravar('carteira/' + doc[sd], L2.carts[sd]); gravar('garagens/' + doc[sd], L2.gars[sd]); });
      resp.status = doc.status; resp.vencedor = doc.vencedor || ''; resp.placar = Garagem.placarDuelo(doc, now); return resp;
    }
    Logica.erro('Operação desconhecida.');
  }
  function demoGaragem(uid, jog, d, now) {
    var sid = Garagem.semana(now), op = d.op;
    if (op === 'saldo') { var st = demoSaldo(uid); return { saldo: st.saldo, ganhos: st.ganhos, gasto: st.carteira.gasto || 0, recebido: st.carteira.recebido || 0, mov: st.carteira.mov || [] }; }
    if (op === 'pagarMulta') { var sm = demoSaldo(uid), rm = Garagem.pagarMulta(sm, String(d.id || ''), now); gravar('carteira/' + uid, rm.carteira); return { valor: rm.valor, saldo: sm.saldo - rm.valor }; }
    if (op === 'vitrine') { if (!lerDoc('estoque/' + sid)) gravar('estoque/' + sid, Garagem.lote(now)); return { semana: sid }; }
    if (op === 'comprar0km') { var st1 = demoSaldo(uid); st1.apelido = jog.apelido || jog.nome; var r1 = Garagem.comprar0km(st1, String(d.cat || ''), now); gravar('garagens/' + uid, r1.garagem); gravar('carteira/' + uid, r1.carteira); gravar('transacoes/T' + now.toString(36), r1.transacao); return { iid: r1.iid }; }
    if (op === 'comprarRetomado') {
      var lote = lerDoc('estoque/' + sid) || Garagem.lote(now), st2 = demoSaldo(uid); st2.apelido = jog.apelido || jog.nome; var r2 = Garagem.comprarRetomado(st2, lote, String(d.item || ''), now); gravar('transacoes/T' + now.toString(36), r2.transacao);
      gravar('estoque/' + sid, r2.lote); gravar('garagens/' + uid, r2.garagem); gravar('carteira/' + uid, r2.carteira); return { iid: r2.iid };
    }
    if (op === 'anunciar') {
      var meus = Object.keys(col('anuncios')).map(function (k) { return col('anuncios')[k]; }).filter(function (a) { return a.vendedor === uid; });
      var an = Garagem.anunciar({ uid: uid, apelido: jog.apelido || jog.nome, garagem: lerDoc('garagens/' + uid) || { carros: {} }, carteira: lerDoc('carteira/' + uid) || {} }, String(d.iid || ''), d.preco, meus, now);
      var aid = 'A' + now.toString(36); gravar('anuncios/' + aid, an); return { anuncioId: aid };
    }
    if (op === 'cancelarAnuncio') {
      var a1 = lerDoc('anuncios/' + d.anuncioId); if (!a1 || a1.vendedor !== uid) Logica.erro('Esse anúncio não é seu.');
      a1.status = 'cancelado'; gravar('anuncios/' + d.anuncioId, a1); return { ok: true };
    }
    if (op === 'comprarUsado') {
      var a2 = lerDoc('anuncios/' + d.anuncioId); if (!a2) Logica.erro('Anúncio não encontrado.');
      var vend = { uid: a2.vendedor, garagem: lerDoc('garagens/' + a2.vendedor) || { carros: {} }, carteira: lerDoc('carteira/' + a2.vendedor) || {} };
      var cp3 = demoSaldo(uid); cp3.apelido = jog.apelido || jog.nome; var r3 = Garagem.comprarUsado(cp3, vend, a2, now); gravar('transacoes/T' + now.toString(36), r3.transacao);
      gravar('garagens/' + uid, r3.garagemComprador); gravar('garagens/' + a2.vendedor, r3.garagemVendedor);
      gravar('carteira/' + uid, r3.carteiraComprador); gravar('carteira/' + a2.vendedor, r3.carteiraVendedor);
      gravar('anuncios/' + d.anuncioId, r3.anuncio); return { iid: r3.iid, taxa: r3.taxa };
    }
    Logica.erro('Operação desconhecida.');
  }
  /* ---- Placa! no modo demonstração: mesmo motor do servidor + robôs jogando pelas pessoas fictícias ---- */
  function placaGravar(mid, E, antes) {
    gravar('mesas/' + mid, Placa.publico(E));
    gravar('montes/' + mid, Placa.privado(E));
    E.uids.forEach(function (u) { gravar('maos/' + mid + '_' + u, { uid: u, mesaId: mid, cartas: E.maos[u] }); });
    (E.removidos || []).forEach(function (u) { delete col('maos')[mid + '_' + u]; });
    if (E.status === 'fim' && !E.temRobo && (!antes || antes.status !== 'fim')) gravar('placaPartidas/' + mid, Placa.resultado(E, mid));
  }
  function placaEstado(mid) {
    var mesa = lerDoc('mesas/' + mid), priv = lerDoc('montes/' + mid), maos = {};
    if (!mesa || !priv) return null;
    mesa.uids.forEach(function (u) { maos[u] = (lerDoc('maos/' + mid + '_' + u) || {}).cartas || []; });
    return Placa.compor(mesa, priv, maos);
  }
  function semente() { return Math.floor(Math.random() * 2147483646) + 1; }
  function demoPlaca(uid, jog, d, now) {
    var cfg = lerDoc('config/geral') || {};
    if (d.op === 'criar') {
      var m = Placa.novaMesa({ uid: uid, jog: jog, lugares: d.lugares, now: now, temporadaId: cfg.temporadaAtiva || '' });
      var id = 'M' + now.toString(36) + Math.floor(Math.random() * 1e4);
      gravar('mesas/' + id, m); return { mesaId: id };
    }
    var mid = d.mesaId, mesa = lerDoc('mesas/' + mid);
    if (!mesa) Logica.erro('Mesa não encontrada.');
    if (d.op === 'entrar') {
      var m2 = Placa.entrar(mesa, uid, jog, now);
      if (m2.jogadores.length === m2.lugares) placaGravar(mid, Placa.iniciar(m2, null, semente(), now)); else gravar('mesas/' + mid, m2);
    } else if (d.op === 'sair') gravar('mesas/' + mid, Placa.sair(mesa, uid, now));
    else if (d.op === 'iniciar') placaGravar(mid, Placa.iniciar(mesa, uid, semente(), now));
    else if (d.op === 'robos') placaGravar(mid, Placa.iniciar(Placa.addRobos(mesa, uid, now), null, semente(), now));
    else if (d.op === 'robo') {
      var ER = placaEstado(mid), R2 = ER && ER.temRobo ? Placa.acaoRobo(ER, now) : null;
      if (R2) placaGravar(mid, R2, mesa);
      robos(mid);
      return { feito: !!R2 };
    } else if (d.op === 'revanche') {
      if (mesa.revanche) return { mesaId: mesa.revanche };
      var nova = Placa.novaMesa({ uid: uid, jog: jog, lugares: mesa.lugares, now: now, temporadaId: cfg.temporadaAtiva || '' });
      var nid = 'M' + now.toString(36) + Math.floor(Math.random() * 1e4);
      // na demonstração, os robôs da mesa anterior entram na revanche
      mesa.uids.forEach(function (u) { if (u !== uid && /^demo-/.test(u) && col('jogadores')[u]) nova = Placa.entrar(nova, u, col('jogadores')[u], now); });
      if (mesa.temRobo && nova.jogadores.length < nova.lugares) nova = Placa.addRobos(nova, uid, now);
      gravar('mesas/' + nid, nova); mesa.revanche = nid; gravar('mesas/' + mid, mesa);
      if (nova.jogadores.length === nova.lugares) placaGravar(nid, Placa.iniciar(nova, null, semente(), now));
      robos(nid); return { mesaId: nid };
    } else if (d.op === 'fecharMesa') {
      mesa.status = 'encerrada'; mesa.aberta = false; mesa.fimEm = now; gravar('mesas/' + mid, mesa);
    } else {
      var E = placaEstado(mid); if (!E) Logica.erro('A partida ainda não começou.');
      var E2 = Placa.acao(E, uid, { op: d.op, carta: d.carta, cor: d.cor, alvo: d.alvo, sim: d.sim }, now);
      placaGravar(mid, E2, mesa);
    }
    robos(mid);
    return { ok: true };
  }
  var _robo = {};
  function robos(mid) {
    clearTimeout(_robo[mid]);
    _robo[mid] = setTimeout(function () {
      var E = placaEstado(mid); if (!E || !usuario) return;
      var eu = usuario.uid, now = Date.now(), antes = lerDoc('mesas/' + mid);
      function ehRobo(u) { return u !== eu && /^demo-/.test(u); }
      // propostas de encerrar: os robôs concordam
      if (E.votosEncerrar && E.votosEncerrar.length && E.status !== 'fim' && E.status !== 'encerrada') {
        var r0 = E.uids.filter(function (u) { return ehRobo(u) && E.votosEncerrar.indexOf(u) < 0; })[0];
        if (r0) { placaGravar(mid, Placa.acao(E, r0, { op: 'votarEncerrar' }, now), antes); robos(mid); return; }
      }
      if (E.status !== 'jogando') return;
      // multa em quem esqueceu de gritar
      if (E.multavel && !E.gritou[E.multavel]) {
        var fiscal = E.uids.filter(function (u) { return ehRobo(u) && u !== E.multavel; })[0];
        if (fiscal && Math.random() < (E.multavel === eu ? 0.75 : 0.5)) { placaGravar(mid, Placa.acao(E, fiscal, { op: 'multa', alvo: E.multavel }, now), antes); robos(mid); return; }
      }
      var vez = E.jogadores[E.vez].uid;
      if (!ehRobo(vez)) return;
      if (E.maos[vez].length === 2 && !E.gritou[vez] && Math.random() < 0.7) E = Placa.acao(E, vez, { op: 'placa' }, now);
      placaGravar(mid, Placa.acao(E, vez, Placa.bot(E, vez), now), antes);
      robos(mid);
    }, 1100 + Math.random() * 700);
  }
  api.placaRobos = robos;
  if (!db || !db.cols) { db = { cols: {}, contas: {} }; semearDemo(db); salvar(); }
  return api;
}

/* Dados fictícios do modo demonstração */
function semearDemo(db) {
  var r = Logica.rng(20261110);
  var agora = Date.now();
  var ini = Logica.inicioSemana(agora) - 3 * 7 * DIA;
  var tid = 'T' + ymd(ini);
  function put(c, id, d) { (db.cols[c] = db.cols[c] || {})[id] = d; }
  put('config', 'geral', { masterUid: 'demo-master', temporadaAtiva: tid });
  put('segredos', 'acesso', { codigo: 'ICARROS2026' });
  [['icarros', 'icarros'], ['tecnologia', 'Tecnologia'], ['operacoes', 'Operações'], ['comercial', 'Comercial'], ['financeiro', 'Financeiro']].forEach(function (a) {
    put('areas', a[0], { nome: a[1], status: 'ativa' });
  });
  put('areas', 'juridico', { nome: 'Jurídico', status: 'pendente', criadaPor: 'demo-marina' });
  var pessoas = [
    ['demo-master', 'Você (Master)', 'Master', 'icarros', 'master', []],
    ['demo-ana', 'Ana Lima', 'Aninha', 'icarros', 'jogador', ['Já morou no Japão por dois anos']],
    ['demo-bruna', 'Bruna Castro', 'Bru', 'tecnologia', 'jogador', ['Coleciona miniaturas de carros antigos']],
    ['demo-caio', 'Caio Mendes', 'Caio', 'tecnologia', 'adm', ['Faz trilhas de bike nos fins de semana']],
    ['demo-diego', 'Diego Rocha', 'Dieguinho', 'operacoes', 'jogador', ['Toca bateria numa banda de rock']],
    ['demo-elisa', 'Elisa Prado', 'Lis', 'operacoes', 'jogador', []],
    ['demo-felipe', 'Felipe Nunes', 'Fê', 'comercial', 'jogador', ['Já correu três maratonas']],
    ['demo-gabi', 'Gabriela Reis', 'Gabi', 'comercial', 'jogador', []],
    ['demo-henrique', 'Henrique Sales', 'Rique', 'icarros', 'jogador', []],
    ['demo-isa', 'Isabela Torres', 'Isa', 'financeiro', 'jogador', []],
    ['demo-joao', 'João Vitor Alves', 'JV', 'icarros', 'jogador', []],
    ['demo-karina', 'Karina Duarte', 'Ka', 'tecnologia', 'jogador', []],
    ['demo-leo', 'Leonardo Pires', 'Léo', 'operacoes', 'jogador', []]
  ];
  pessoas.forEach(function (p) {
    put('jogadores', p[0], { uid: p[0], nome: p[1], apelido: p[2], email: p[0].replace('demo-', '') + '@exemplo.com', areaId: p[3], papel: p[4], status: 'ativo', foto: '', curiosidades: p[5], criadoEm: ini });
  });
  put('jogadores', 'demo-marina', { uid: 'demo-marina', nome: 'Marina Costa', apelido: 'Mari', email: 'marina@exemplo.com', areaId: 'juridico', papel: 'jogador', status: 'pendente', foto: '', curiosidades: [], criadoEm: agora });
  // banco de perguntas
  var perg = {};
  BANCO_INICIAL.forEach(function (b) { perg[b[0]] = { tema: b[1], dificuldade: b[2], texto: b[3], alts: b[4], correta: b[5], obs: b[6] || '', ativa: true, origem: 'banco inicial' }; });
  var qq = [
    ['QEQ-001', 'Quem do time já morou no Japão por dois anos?', 'demo-ana', ['Aninha · Ana', 'Bru · Bruna', 'Isa · Isabela', 'Ka · Karina']],
    ['QEQ-002', 'Quem do time coleciona miniaturas de carros antigos?', 'demo-bruna', ['Bru · Bruna', 'Lis · Elisa', 'Gabi · Gabriela', 'Aninha · Ana']],
    ['QEQ-003', 'Quem do time faz trilhas de bike nos fins de semana?', 'demo-caio', ['Caio', 'Léo · Leonardo', 'Rique · Henrique', 'JV · João']],
    ['QEQ-004', 'Quem do time toca bateria numa banda de rock?', 'demo-diego', ['Dieguinho · Diego', 'Fê · Felipe', 'Caio', 'Léo · Leonardo']],
    ['QEQ-005', 'Quem do time já correu três maratonas?', 'demo-felipe', ['Fê · Felipe', 'Dieguinho · Diego', 'JV · João', 'Rique · Henrique']]
  ];
  qq.forEach(function (q, i) { perg[q[0]] = { tema: 'Quem é quem', dificuldade: 'Média', texto: q[1], alts: q[3], correta: 0, obs: '', ativa: true, sobreUid: q[2], curiosidade: pessoas.filter(function (p) { return p[0] === q[2]; })[0][5][0] }; });
  db.cols.perguntas = perg;
  // temporada e rodadas
  put('temporadas', tid, { nome: 'Temporada 1 · Piloto', inicio: ini, semanas: 13, k: 40, mix: Logica.MIX_PADRAO, status: 'ativa', criadaEm: ini });
  var lista = Object.keys(perg).map(function (id) { var p = perg[id]; return { id: id, tema: p.tema, ativa: true }; });
  var ns = []; for (var n = 1; n <= 13; n++) ns.push(n);
  Logica.montarRodadas({ perguntas: lista, ns: ns, seed: 99 }).forEach(function (m) {
    var rid = tid + '_R' + pad(m.n);
    var inicio = ini + (m.n - 1) * 7 * DIA;
    put('rodadas', rid, { temporadaId: tid, n: m.n, inicio: inicio, fim: inicio + 7 * DIA - 1000, seed: Math.floor(r() * 1e9), total: m.ids.length });
    var g = {}; m.ids.forEach(function (id) { var p = perg[id]; g[id] = { texto: p.texto, alts: p.alts, correta: p.correta, tema: p.tema }; });
    put('gabarito', rid, { temporadaId: tid, perguntas: g });
  });
  // resultados fictícios das rodadas 1 a 3 e parte da 4
  var habil = {};
  pessoas.slice(1).forEach(function (p) { habil[p[0]] = { q: 0.45 + r() * 0.45, c: 25 + r() * 80 }; });
  for (var rn = 1; rn <= 4; rn++) {
    var rid2 = tid + '_R' + pad(rn), P = {};
    pessoas.slice(1).forEach(function (p) {
      if (rn === 4 && ['demo-ana', 'demo-bruna', 'demo-diego', 'demo-joao', 'demo-leo', 'demo-gabi'].indexOf(p[0]) >= 0) return;
      if (r() < 0.12) return;
      var h = habil[p[0]];
      var q = Math.max(2, Math.min(10, Math.round(h.q * 10 + (r() - 0.5) * 4)));
      var c = Math.max(8, Math.round((h.c + (r() - 0.5) * 50) * 10) / 10);
      if (rn === 4 && r() < 0.4) c = 0;
      P[p[0]] = { a: p[3], ap: p[2], nm: primeiroNome(p[1]), q: q, qms: Math.round(q * (3000 + r() * 6000)), qf: true, c: c, tn: c ? 1 + Math.floor(r() * 3) : 0 };
    });
    put('placar', rid2, { temporadaId: tid, rodadaId: rid2, p: P });
  }
  // Histórico fictício de compras e vendas (para o Preço Aura já ter referência)
  var tcats = ['hatch-verde', 'sedan-prata', 'suv-porto', 'picape-laranja', 'hatch-branco', 'suv-areia', 'sedan-grafite'];
  for (var ti = 0; ti < 34; ti++) {
    var tc = tcats[ti % tcats.length], tp = Garagem.CATALOGO[tc].preco, tipo = ti % 5 === 0 ? '0km' : ti % 3 === 0 ? 'retomado' : 'usado';
    var km = tipo === '0km' ? 0 : Math.round(15 + r() * 70) * 1000, preco = tipo === '0km' ? tp : Math.round(tp * (tipo === 'retomado' ? 0.55 : 0.62 + r() * 0.25) * (1 - 0.003 * (km - 30000) / 1000) / 5) * 5;
    var pc = pessoas[1 + (ti % (pessoas.length - 1))], pv = pessoas[1 + ((ti + 3) % (pessoas.length - 1))];
    put('transacoes', 'Tdemo' + ti, { tipo: tipo, cat: tc, modelo: Garagem.CATALOGO[tc].modelo, km: km, preco: preco, taxa: tipo === 'usado' ? Garagem.taxa(preco) : 0, comprador: pc[0], compradorAp: pc[2],
      vendedor: tipo === 'usado' ? pv[0] : '', vendedorAp: tipo === 'usado' ? pv[2] : tipo === '0km' ? 'Concessionária' : 'Porto', em: agora - (34 - ti) * 9 * 3600000, semana: Garagem.semana(agora - (34 - ti) * 9 * 3600000) });
  }
  // Treinos: recordes fictícios desta semana e gerais
  var sidT = Garagem.semana(agora);
  pessoas.slice(1).forEach(function (p, i) {
    if (r() < 0.25) return;
    var tg = Math.round((40 + r() * 140) * 100) / 100, ts = Math.round(tg * (0.55 + r() * 0.45) * 100) / 100, cats = ['aura', 'conceito', 'cyberpunk', 'suv-porto', 'hatch-verde'];
    var semanas = {}; if (r() < 0.75) semanas[sidT] = { t: ts, cat: cats[i % cats.length], em: agora - i * 3600000 };
    var pcar = {}, catsN = ['monoposto', 'touro', 'veloce', 'neon', 'felino', 'gaivota', 'besouro', 'perua', 'diplomata', 'serpente', 'granturismo'];
    for (var q = 0; q < 3; q++) { var cq = catsN[(i * 3 + q) % catsN.length]; pcar[cq] = { t: Math.round(tg * (0.5 + r() * 0.5) * 100) / 100, em: agora - 86400000 * q }; }
    put('treinos', p[0], { uid: p[0], ap: p[2], nm: primeiroNome(p[1]), a: p[3], treinos: 3 + Math.floor(r() * 20), melhor: { t: tg, cat: cats[(i + 1) % cats.length], em: agora - 86400000 * (3 + i) }, semanas: semanas, porCarro: pcar });
  });
  // Duelos: um desafio esperando o Diego e um duelo em andamento
  var sd = function (n) { return (Logica.hash('duelo-demo' + n) >>> 0) || 1; };
  put('duelos', 'dd1', { de: 'demo-ana', para: 'demo-diego', ap: { de: 'Aninha', para: 'Dieguinho' }, uids: ['demo-ana', 'demo-diego'], status: 'pendente', criadoEm: agora - 3 * 3600000, prazo: agora + 45 * 3600000,
    aposta: { de: { tipo: 'creditos', valor: 40 }, para: null }, seeds: [], corridas: { de: [null, null, null], para: [null, null, null] }, placar: { de: 0, para: 0 }, vencedor: '' });
  put('duelos', 'dd2', { de: 'demo-diego', para: 'demo-caio', ap: { de: 'Dieguinho', para: 'Caio' }, uids: ['demo-diego', 'demo-caio'], status: 'andamento', criadoEm: agora - 26 * 3600000, aceitoEm: agora - 20 * 3600000, prazo: agora + 28 * 3600000,
    aposta: { de: { tipo: 'creditos', valor: 25 }, para: { tipo: 'creditos', valor: 25 } }, seeds: [sd(1), sd(2), sd(3)],
    corridas: { de: [{ inicio: agora - 19 * 3600000, fim: agora - 19 * 3600000 + 90000, t: 84.6, cat: 'aura', carro: 'aura' }, null, null], para: [{ inicio: agora - 10 * 3600000, fim: agora - 10 * 3600000 + 70000, t: 66.2, cat: 'hatch-verde', carro: 'x' }, { inicio: agora - 9 * 3600000, fim: agora - 9 * 3600000 + 110000, t: 102.9, cat: 'hatch-verde', carro: 'x' }, null] },
    placar: { de: 0, para: 0 }, vencedor: '' });
  put('duelos', 'dprazo', { de: 'demo-diego', para: 'demo-joao', ap: { de: 'Dieguinho', para: 'Jão' }, uids: ['demo-diego', 'demo-joao'], status: 'fim', criadoEm: agora - 50 * 3600000, aceitoEm: agora - 49 * 3600000, prazo: agora - 3600000, fimEm: agora - 1800000,
    aposta: { de: { tipo: 'creditos', valor: 20 }, para: { tipo: 'creditos', valor: 20 } }, seeds: [1, 2, 3], corridas: { de: [{ t: 248.99, cat: 'aura', inicio: agora - 2 * 3600000 }, null, null], para: [{ t: 296.67, cat: 'touro', inicio: agora - 48 * 3600000 }, null, null] },
    placar: { de: 0, para: 1 }, venceu: ['para', 'empate', 'empate'], vencedor: 'demo-joao' });
  // Duelos já encerrados (para o ranking e as conquistas da demo)
  var nomesD = { 'demo-ana': 'Aninha', 'demo-caio': 'Caio', 'demo-diego': 'Dieguinho', 'demo-leo': 'Léo', 'demo-bruna': 'Bru', 'demo-joao': 'Jão' };
  [['demo-diego', 'demo-leo', 'de', [1, 1, 0], 30, 30, null], ['demo-ana', 'demo-diego', 'para', [0, 1, 1], 50, 40, null], ['demo-diego', 'demo-bruna', 'de', [1, 1, -1], 100, 20, null],
   ['demo-caio', 'demo-joao', 'de', [1, 0, 1], 25, 0, 'hatch-branco'], ['demo-leo', 'demo-ana', 'para', [1, 0, 0], 15, 15, null], ['demo-joao', 'demo-diego', 'de', [1, 1, -1], 20, 20, null]].forEach(function (x, i) {
    var fimEm = agora - (6 - i) * 86400000 + 3600000, w = x[2], l = w === 'de' ? 'para' : 'de';
    var venc = x[3].filter(function (v) { return v >= 0; }).map(function (v) { return v === 1 ? w : l; });
    var pl = { de: venc.filter(function (v) { return v === 'de'; }).length, para: venc.filter(function (v) { return v === 'para'; }).length };
    put('duelos', 'df' + i, { de: x[0], para: x[1], ap: { de: nomesD[x[0]], para: nomesD[x[1]] }, uids: [x[0], x[1]], status: 'fim', criadoEm: fimEm - 2 * 86400000, aceitoEm: fimEm - 1.5 * 86400000, prazo: fimEm + 86400000, fimEm: fimEm,
      aposta: { de: { tipo: 'creditos', valor: x[4] }, para: x[6] ? { tipo: 'carro', iid: 'x', cat: x[6] } : { tipo: 'creditos', valor: x[5] || 10 } }, seeds: [1, 2, 3], corridas: { de: [null, null, null], para: [null, null, null] }, placar: pl, venceu: venc.concat(['', '', '']).slice(0, 3), vencedor: x[w === 'de' ? 0 : 1] });
  });
  // Garagem: algumas pessoas fictícias já compraram carros e anunciaram no mercado
  [['demo-ana', 'suv-porto', 0, 620], ['demo-caio', 'hatch-verde', 35000, 260], ['demo-bruna', 'picape-laranja', 52000, 540], ['demo-ana', 'sedan-prata', 61000, 230]].forEach(function (x, i) {
    var gid = 'garagens/' + x[0], g0 = (db.cols.garagens && db.cols.garagens[x[0]]) || { carros: {}, seq: 0 };
    g0.seq++; var iid = 'c' + g0.seq + '-demo' + i; g0.carros[iid] = { cat: x[1], origem: x[2] ? 'retomado' : '0km', km: x[2], compradoEm: agora - (10 - i) * 86400000, de: '' };
    put('garagens', x[0], g0);
    var pe = pessoas.filter(function (p) { return p[0] === x[0]; })[0];
    put('anuncios', 'Ademo' + i, { vendedor: x[0], vendedorAp: pe ? pe[2] : '', iid: iid, cat: x[1], km: x[2], origem: x[2] ? 'retomado' : '0km', preco: x[3], criadoEm: agora - (5 - i) * 3600000, status: 'ativo', compradoPor: '' });
  });
  // Placa!: uma mesa esperando gente e partidas já jogadas na temporada
  function jp(id) { var p = pessoas.filter(function (x) { return x[0] === id; })[0]; return { uid: id, ap: p[2], nm: primeiroNome(p[1]), a: p[3] }; }
  put('mesas', 'Mdemo1', { tipo: 'placa', status: 'aguardando', aberta: true, lugares: 4, dono: 'demo-ana', criadaEm: agora - 6 * 60000, atualizadaEm: agora - 4 * 60000,
    jogadores: [jp('demo-ana'), jp('demo-caio')], uids: ['demo-ana', 'demo-caio'], temporadaId: tid });
  var forca = {}; pessoas.slice(1).forEach(function (p) { forca[p[0]] = 0.5 + r() * 1.5; });
  for (var pn = 0; pn < 46; pn++) {
    var qtd = 2 + Math.floor(r() * 3), pool = Logica.shuffle(pessoas.slice(1).map(function (p) { return p[0]; }), r).slice(0, qtd);
    var tot = 0; pool.forEach(function (u) { tot += forca[u]; });
    var x = r() * tot, venc = pool[0]; for (var q = 0; q < pool.length; q++) { x -= forca[pool[q]]; if (x <= 0) { venc = pool[q]; break; } }
    var st = {}; pool.forEach(function (u) { st[u] = { multas: r() < 0.25 ? 1 : 0, guincho8: r() < 0.04 ? 1 : 0 }; });
    var fim = ini + Math.floor(r() * (agora - ini - 3600000)), mid = 'Mh' + pn;
    put('placaPartidas', mid, { mesaId: mid, temporadaId: tid, fimEm: fim, iniciadaEm: fim - 600000, vencedor: venc, uids: pool, jogadores: pool.map(jp), stats: st, segurado: r() < 0.12 });
  }
}
