/* Game icarros — lógica compartilhada (app em modo demo + Cloud Functions).
   Mantenha este arquivo idêntico ao bloco "LOGICA" do index.html. */
(function (root) {
  var L = {};
  L.TEMPO_PERGUNTA = 20000;   // ms por pergunta
  L.FOLGA = 2000;             // tolerância de rede
  L.PAUSA = 1800;             // pausa de feedback entre perguntas
  L.TENTATIVAS = 3;
  L.N_PERGUNTAS = 10;
  L.TEMAS = ['Carros e curiosidades', 'Mobilidade, pedágio e tag', 'ConectCar e sócios', 'icarros', 'Quem é quem'];
  L.MIX_PADRAO = { 'Carros e curiosidades': 6, 'Mobilidade, pedágio e tag': 4, 'ConectCar e sócios': 0, 'icarros': 0, 'Quem é quem': 0 };
  L.PREENCHIMENTO = ['Carros e curiosidades', 'Mobilidade, pedágio e tag', 'ConectCar e sócios', 'icarros'];
  L.DIA = 86400000;

  L.hash = function (s) {
    s = String(s);
    var h = 1779033703 ^ s.length;
    for (var i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
  L.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  L.shuffle = function (arr, r) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  L.curva = function (t, k) { if (!t || t <= 0) return 0; return Math.round(100 * (1 - Math.exp(-t / (k || 40)))); };
  L.erro = function (msg) { var e = new Error(msg); e.erroJogo = true; throw e; };
  L.clone = function (o) { return o == null ? o : JSON.parse(JSON.stringify(o)); };
  L.aberta = function (rod, now) { return !!rod && now >= rod.inicio && now <= rod.fim; };
  // segunda-feira 00:00 (horário de Brasília, UTC-3) da semana de "ms"
  L.inicioSemana = function (ms) {
    var d = new Date(ms - 3 * 3600000);
    var dow = (d.getUTCDay() + 6) % 7;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow, 3, 0, 0);
  };
  function primeiro(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
  L.entradaBase = function (jog) { return { a: jog.areaId || '', ap: jog.apelido || '', nm: primeiro(jog.nome) }; };
  function validar(c) {
    if (!c.jog || c.jog.status !== 'ativo') L.erro('Seu cadastro ainda não foi aprovado.');
    if (!c.rodada) L.erro('Rodada não encontrada.');
  }

  // ---------- QUIZ ----------
  function payload(q, gab, now) {
    var pid = q.ordem[q.idx];
    var p = gab.perguntas[pid];
    var perm = q.perm[pid];
    var restante = L.TEMPO_PERGUNTA - Math.max(0, now - q.servidaEm);
    return {
      idx: q.idx, total: q.ordem.length, texto: p.texto, tema: p.tema,
      alts: perm.map(function (i) { return p.alts[i]; }),
      limiteMs: L.TEMPO_PERGUNTA, restanteMs: Math.max(1000, Math.min(L.TEMPO_PERGUNTA, restante))
    };
  }
  function resumo(q) { return { acertos: q.acertos, tempoMs: q.tempoMs, finalizado: !!q.finalizado, idx: q.idx, total: q.ordem.length }; }
  function entradaQuiz(q, jog) { var e = L.entradaBase(jog); e.q = q.acertos; e.qms = q.tempoMs; e.qf = !!q.finalizado; return e; }
  function finalizar(q, now) { q.finalizado = true; q.finalizadoEm = now; }

  // c: {now, uid, jog, rodada(com id), gab, quiz}
  L.iniciarQuiz = function (c) {
    validar(c);
    if (!c.gab || !c.gab.perguntas) L.erro('As perguntas desta rodada ainda não foram montadas.');
    var q = L.clone(c.quiz);
    if (!q) {
      if (!L.aberta(c.rodada, c.now)) L.erro('Esta rodada não está aberta.');
      var r = L.rng(L.hash(c.uid + '|' + c.rodada.id + '|' + c.rodada.seed));
      var ordem = L.shuffle(Object.keys(c.gab.perguntas).sort(), r);
      var perm = {};
      ordem.forEach(function (pid) { perm[pid] = L.shuffle([0, 1, 2, 3], r); });
      q = { uid: c.uid, rodadaId: c.rodada.id, temporadaId: c.rodada.temporadaId, ordem: ordem, perm: perm, idx: 0,
        servidaEm: c.now, respostas: {}, acertos: 0, tempoMs: 0, finalizado: false, iniciadoEm: c.now };
    } else if (q.finalizado) {
      return { quiz: null, placar: null, resp: { fim: true, resumo: resumo(q) } };
    } else if (!L.aberta(c.rodada, c.now)) {
      finalizar(q, c.now);
    } else {
      // Retomada: se o tempo da pergunta em andamento já passou, ela conta como erro.
      var pid = q.ordem[q.idx];
      if (!q.respostas[pid] && c.now - q.servidaEm > L.TEMPO_PERGUNTA + L.FOLGA) {
        q.respostas[pid] = { alt: -1, certa: false, ms: L.TEMPO_PERGUNTA, abandono: true };
        q.idx++;
        if (q.idx >= q.ordem.length) finalizar(q, c.now); else q.servidaEm = c.now;
      }
    }
    var resp = { resumo: resumo(q), retomada: !!c.quiz };
    if (q.finalizado) resp.fim = true; else resp.pergunta = payload(q, c.gab, c.now);
    return { quiz: q, placar: entradaQuiz(q, c.jog), resp: resp };
  };

  // c: {now, uid, jog, rodada, gab, quiz, idx, alt}
  L.responderQuiz = function (c) {
    validar(c);
    var q = L.clone(c.quiz);
    if (!q) L.erro('O quiz ainda não foi iniciado.');
    if (q.finalizado) return { quiz: null, placar: null, resp: { fim: true, resumo: resumo(q) } };
    if (c.idx !== q.idx) L.erro('Resposta fora de ordem. Toque em continuar para retomar.');
    var pid = q.ordem[q.idx];
    var p = c.gab.perguntas[pid];
    var perm = q.perm[pid];
    var ms = Math.max(0, c.now - q.servidaEm);
    var alt = (typeof c.alt === 'number' && c.alt >= 0 && c.alt < 4) ? c.alt : -1;
    var expirou = ms > L.TEMPO_PERGUNTA + L.FOLGA;
    var certa = alt >= 0 && !expirou && perm[alt] === p.correta;
    var msC = Math.min(ms, L.TEMPO_PERGUNTA);
    q.respostas[pid] = { alt: alt, certa: certa, ms: msC, expirou: expirou };
    if (certa) { q.acertos++; q.tempoMs += msC; }
    q.idx++;
    if (q.idx >= q.ordem.length || !L.aberta(c.rodada, c.now)) finalizar(q, c.now);
    else q.servidaEm = c.now + L.PAUSA;
    var resp = { certa: certa, correta: perm.indexOf(p.correta), expirou: expirou, resumo: resumo(q) };
    if (q.finalizado) resp.fim = true; else resp.pergunta = payload(q, c.gab, q.servidaEm);
    return { quiz: q, placar: entradaQuiz(q, c.jog), resp: resp };
  };

  // ---------- CORRIDA ----------
  L.seedCorrida = function (rod, n) { return L.hash('corrida|' + rod.id + '|' + rod.seed + '|' + n); };
  L.melhorTempo = function (tent) {
    var m = 0;
    (tent || []).forEach(function (t) { if (t && t.status === 'finalizada' && !t.anulada && t.tempo > m) m = t.tempo; });
    return m;
  };
  function entradaCorrida(tent, jog) {
    var e = L.entradaBase(jog);
    e.c = Math.round(L.melhorTempo(tent) * 100) / 100;
    e.tn = tent.filter(function (t) { return !!t; }).length;
    return e;
  }
  // c: {now, uid, jog, rodada, tent:[d1,d2,d3]}
  L.iniciarCorrida = function (c) {
    validar(c);
    if (!L.aberta(c.rodada, c.now)) L.erro('Esta rodada não está aberta.');
    var n = 0;
    for (var i = 0; i < L.TENTATIVAS; i++) { if (!c.tent[i]) { n = i + 1; break; } }
    if (!n) L.erro('Você já usou as 3 tentativas desta rodada.');
    var doc = { uid: c.uid, rodadaId: c.rodada.id, temporadaId: c.rodada.temporadaId, n: n, status: 'iniciada',
      iniciadaEm: c.now, tempo: 0, anulada: false };
    var tent = c.tent.slice(); tent[n - 1] = doc;
    return { n: n, doc: doc, placar: entradaCorrida(tent, c.jog),
      resp: { n: n, seed: L.seedCorrida(c.rodada, n), restantes: L.TENTATIVAS - n } };
  };
  // c: {now, uid, jog, rodada, tent, n, tempo}
  L.finalizarCorrida = function (c) {
    if (!c.jog) L.erro('Cadastro não encontrado.');
    var t = c.tent[c.n - 1];
    if (!t) L.erro('Tentativa não encontrada.');
    if (t.status !== 'iniciada') L.erro('Esta tentativa já foi registrada.');
    var tempo = Number(c.tempo);
    if (!(tempo >= 0)) tempo = 0;
    var maxT = (c.now - t.iniciadaEm) / 1000 + 2;
    var susp = false;
    if (tempo > maxT) { tempo = maxT; susp = true; }
    if (tempo > 600) susp = true;
    tempo = Math.round(tempo * 100) / 100;
    var d = L.clone(t);
    d.status = 'finalizada'; d.tempo = tempo; d.finalizadaEm = c.now; d.suspeita = susp;
    var tent = c.tent.slice(); tent[c.n - 1] = d;
    return { doc: d, placar: entradaCorrida(tent, c.jog), resp: { tempo: tempo, melhor: L.melhorTempo(tent), restantes: L.TENTATIVAS - c.n } };
  };
  // c: {jog (dono), tent, n, anular}
  L.anularTentativa = function (c) {
    var t = c.tent[c.n - 1];
    if (!t) L.erro('Tentativa não encontrada.');
    var d = L.clone(t); d.anulada = !!c.anular;
    var tent = c.tent.slice(); tent[c.n - 1] = d;
    return { doc: d, placar: entradaCorrida(tent, c.jog) };
  };

  // ---------- MONTAGEM DE RODADAS ----------
  // o: {perguntas:[{id,tema,ativa}], usadas:{id:true}, ns:[1..], mix, seed}
  L.montarRodadas = function (o) {
    var r = L.rng(o.seed || 1);
    var mix = o.mix || L.MIX_PADRAO;
    var por = {};
    (o.perguntas || []).forEach(function (p) {
      if (p.ativa === false || (o.usadas && o.usadas[p.id])) return;
      (por[p.tema] = por[p.tema] || []).push(p.id);
    });
    Object.keys(por).forEach(function (t) { por[t] = L.shuffle(por[t].sort(), r); });
    var out = [];
    o.ns.forEach(function (n) {
      var sel = [];
      Object.keys(mix).forEach(function (t) {
        for (var i = 0; i < (mix[t] || 0); i++) { if (por[t] && por[t].length) sel.push(por[t].pop()); }
      });
      var guarda = 0;
      while (sel.length < L.N_PERGUNTAS && guarda < 200) {
        var t = L.PREENCHIMENTO[guarda % L.PREENCHIMENTO.length];
        if (por[t] && por[t].length) sel.push(por[t].pop());
        guarda++;
      }
      out.push({ n: n, ids: sel });
    });
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.Logica = L;
})(this);
