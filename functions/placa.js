/* Placa! — motor de regras (compartilhado: Cloud Functions + modo demonstração).
   Regras: docs/placa-regras.md. Mantenha idêntico ao bloco "PLACA" do index.html. */
(function (root) {
  var P = {};
  var L = (typeof module !== 'undefined' && module.exports) ? require('./logica') : root.Logica;

  P.CORES = ['L', 'A', 'V', 'R'];                      // Laranja, Azul, Verde, Vermelho
  P.NOME_COR = { L: 'Laranja', A: 'Azul', V: 'Verde', R: 'Vermelho' };
  P.NOME_V = { ped: 'Pedágio', ret: 'Retorno', g2: 'Guincho +2', seg: 'Seguro', s4: 'Seguro Total +4' };
  P.MAO_INICIAL = 7;
  P.MIN = 2; P.MAX = 6;
  P.AUSENTE_MS = 10 * 60 * 1000;                       // 10 min sem jogar: dá para votar remoção
  P.PAUSA_MAX_MS = 10 * 60 * 1000;                     // depois disso qualquer um retoma

  function erro(m) { return L.erro(m); }
  function clone(o) { return L.clone(o); }

  // ---------- baralho ----------
  // id: "<cor>.<valor>.<cópia>"  ex.: L.5.1, A.g2.2, W.s4.3
  P.baralho = function () {
    var b = [];
    P.CORES.forEach(function (c) {
      b.push(c + '.0.1');
      for (var n = 1; n <= 9; n++) { b.push(c + '.' + n + '.1'); b.push(c + '.' + n + '.2'); }
      ['ped', 'ret', 'g2'].forEach(function (v) { b.push(c + '.' + v + '.1'); b.push(c + '.' + v + '.2'); });
    });
    for (var i = 1; i <= 4; i++) { b.push('W.seg.' + i); b.push('W.s4.' + i); }
    return b;
  };
  P.carta = function (id) { var p = String(id).split('.'); return { id: id, cor: p[0] === 'W' ? null : p[0], v: p[1], curinga: p[0] === 'W' }; };
  P.nomeCarta = function (id) {
    var c = P.carta(id);
    if (c.curinga) return P.NOME_V[c.v];
    return (P.NOME_V[c.v] || c.v) + ' ' + P.NOME_COR[c.cor];
  };

  function rngDe(E) { E.rc = (E.rc || 0) + 1; return L.rng(L.hash(E.seed + '|' + E.rc)); }
  function seatDe(E, uid) { for (var i = 0; i < E.jogadores.length; i++) if (E.jogadores[i].uid === uid) return i; return -1; }
  function n(E) { return E.jogadores.length; }
  function prox(E, s, passos) { var N = n(E); return (((s + E.sentido * (passos || 1)) % N) + N) % N; }
  function topo(E) { return E.descarte[E.descarte.length - 1]; }
  function uidVez(E) { return E.jogadores[E.vez].uid; }

  function repor(E) {
    if (E.monte.length) return;
    if (E.descarte.length <= 1) return;
    var t = E.descarte.pop();
    E.monte = L.shuffle(E.descarte, rngDe(E));
    E.descarte = [t];
    E.reembaralhou = (E.reembaralhou || 0) + 1;
  }
  function comprar(E, uid, qtd) {
    var got = [];
    for (var i = 0; i < qtd; i++) {
      repor(E);
      if (!E.monte.length) break;
      var c = E.monte.pop();
      E.maos[uid].push(c); got.push(c);
    }
    if (E.maos[uid].length > 2) E.gritou[uid] = false;
    if (E.maos[uid].length > 1 && E.multavel === uid) E.multavel = '';
    return got;
  }
  function log(E, txt, extra) {
    E.seq = (E.seq || 0) + 1;
    var ev = { s: E.seq, t: txt };
    if (extra) Object.keys(extra).forEach(function (k) { ev[k] = extra[k]; });
    E.ultimo = ev;
    E.hist = (E.hist || []).concat([ev]).slice(-12);
  }
  function apelido(E, uid) { var s = seatDe(E, uid); return s >= 0 ? (E.jogadores[s].ap || E.jogadores[s].nm || 'Alguém') : 'Alguém'; }
  function ehRobo(E, uid) { var s = seatDe(E, uid); return s >= 0 && !!E.jogadores[s].bot; }
  function humanos(E) { return E.uids.filter(function (u) { return !ehRobo(E, u); }); }
  P.ehRobo = function (m, uid) { return (m.jogadores || []).some(function (j) { return j.uid === uid && j.bot; }); };
  function stat(E, uid) { return (E.stats[uid] = E.stats[uid] || { multas: 0, guincho8: 0 }); }

  // ---------- mesa (sala de espera) ----------
  P.jogadorDe = function (uid, jog) { return { uid: uid, ap: (jog && jog.apelido) || '', nm: String((jog && jog.nome) || '').trim().split(/\s+/)[0] || '', a: (jog && jog.areaId) || '' }; };
  P.novaMesa = function (o) {
    var lug = Math.floor(Number(o.lugares));
    if (!(lug >= P.MIN && lug <= P.MAX)) erro('Escolha de 2 a 6 lugares.');
    if (!o.jog || o.jog.status !== 'ativo') erro('Seu cadastro ainda não foi aprovado.');
    return { tipo: 'placa', status: 'aguardando', aberta: true, lugares: lug, dono: o.uid, criadaEm: o.now, atualizadaEm: o.now,
      jogadores: [P.jogadorDe(o.uid, o.jog)], uids: [o.uid], temporadaId: o.temporadaId || '' };
  };
  P.entrar = function (m, uid, jog, now) {
    m = clone(m);
    if (!jog || jog.status !== 'ativo') erro('Seu cadastro ainda não foi aprovado.');
    if (m.status !== 'aguardando') erro('Esta mesa já começou.');
    if (m.uids.indexOf(uid) >= 0) return m;
    if (m.jogadores.length >= m.lugares) erro('A mesa está cheia.');
    m.jogadores.push(P.jogadorDe(uid, jog)); m.uids.push(uid); m.atualizadaEm = now;
    return m;
  };
  P.NOMES_ROBO = ['Robô Turbo', 'Robô Pistão', 'Robô Faísca', 'Robô Radar', 'Robô Embreagem'];
  P.addRobos = function (m, uid, now) {
    m = clone(m);
    if (m.status !== 'aguardando') erro('Esta mesa já começou.');
    if (m.dono !== uid) erro('Só quem criou a mesa pode chamar robôs.');
    var usados = m.jogadores.map(function (j) { return j.ap; }), k = 0;
    while (m.jogadores.length < m.lugares) {
      var nome = P.NOMES_ROBO.filter(function (x) { return usados.indexOf(x) < 0; })[0] || ('Robô ' + (k + 1));
      usados.push(nome); k++;
      var id = 'bot-' + m.jogadores.length + '-' + (now % 100000);
      m.jogadores.push({ uid: id, ap: nome, nm: nome, a: '', bot: true }); m.uids.push(id);
    }
    m.temRobo = true; m.atualizadaEm = now;
    return m;
  };
  P.sair = function (m, uid, now) {
    m = clone(m);
    if (m.status !== 'aguardando') erro('A partida já começou. Use "Encerrar partida" no menu da mesa.');
    var i = m.uids.indexOf(uid); if (i < 0) return m;
    m.jogadores.splice(i, 1); m.uids.splice(i, 1); m.atualizadaEm = now;
    if (!m.jogadores.some(function (j) { return !j.bot; })) { m.status = 'cancelada'; m.aberta = false; }
    else if (m.dono === uid) m.dono = m.uids[0];
    return m;
  };

  // ---------- início da partida ----------
  // m: mesa em "aguardando"; seed: número; retorna o estado completo E
  P.iniciar = function (m, uid, seed, now) {
    if (m.status !== 'aguardando') erro('Esta mesa já começou.');
    if (uid && uid !== m.dono && m.jogadores.length < m.lugares) erro('Só quem criou a mesa pode começar antes de lotar.');
    if (m.jogadores.length < P.MIN) erro('Precisa de pelo menos 2 pessoas na mesa.');
    var E = clone(m);
    E.status = 'jogando'; E.seed = seed >>> 0; E.rc = 0; E.seq = 0; E.hist = [];
    E.lugares = E.jogadores.length; E.iniciadaEm = now; E.ultimaJogadaEm = now; E.atualizadaEm = now;
    var r = rngDe(E);
    E.jogadores = L.shuffle(E.jogadores, r);                 // lugares sorteados
    E.uids = E.jogadores.map(function (j) { return j.uid; });
    E.monte = L.shuffle(P.baralho(), r);
    E.descarte = []; E.maos = {}; E.gritou = {}; E.stats = {};
    E.jogadores.forEach(function (j) { E.maos[j.uid] = []; E.gritou[j.uid] = false; stat(E, j.uid); });
    for (var k = 0; k < P.MAO_INICIAL; k++) E.jogadores.forEach(function (j) { E.maos[j.uid].push(E.monte.pop()); });
    var primeira;
    for (var g = 0; g < 50; g++) {
      primeira = E.monte.pop();
      if (!P.carta(primeira).curinga) break;
      E.monte.splice(Math.floor(r() * E.monte.length), 0, primeira);  // curinga volta para o monte
    }
    E.descarte.push(primeira);
    var c = P.carta(primeira);
    E.cor = c.cor; E.sentido = 1; E.acumulo = 0; E.acumuloDe = ''; E.comprou = ''; E.multavel = '';
    E.vez = Math.floor(r() * n(E));
    E.votosEncerrar = []; E.votosRemover = {}; E.vencedor = ''; E.pausadaPor = ''; E.pausadaEm = 0;
    var quem = apelido(E, uidVez(E));
    if (c.v === 'ped') { log(E, 'A mesa abriu com Pedágio: ' + quem + ' perde a vez.'); E.vez = prox(E, E.vez); }
    else if (c.v === 'ret') { E.sentido = -1; if (n(E) === 2) { log(E, 'A mesa abriu com Retorno: ' + quem + ' perde a vez.'); E.vez = prox(E, E.vez); } else log(E, 'A mesa abriu com Retorno: o jogo vai no sentido anti-horário.'); }
    else if (c.v === 'g2') { E.acumulo = 2; log(E, 'A mesa abriu com Guincho +2: ' + quem + ' compra 2 ou responde com outro Guincho.'); }
    else log(E, 'Partida começou. ' + quem + ' abre o jogo.');
    return E;
  };

  // ---------- jogadas válidas ----------
  P.podeJogar = function (E, cartaId) {
    var c = P.carta(cartaId), t = P.carta(topo(E));
    if (E.acumulo > 0) return c.v === 'g2';
    if (E.comprou && cartaId !== E.comprou) return false;
    if (c.curinga) return true;
    return c.cor === E.cor || c.v === t.v;
  };
  P.validas = function (E, uid) {
    if (E.status !== 'jogando' || uidVez(E) !== uid) return [];
    return (E.maos[uid] || []).filter(function (id) { return P.podeJogar(E, id); });
  };

  function terminar(E, uid, now) {
    E.status = 'fim'; E.aberta = false; E.vencedor = uid; E.fimEm = now; E.multavel = '';
  }

  // ---------- ações ----------
  // a: {op, carta, cor, alvo, sim}
  P.acao = function (E0, uid, a, now) {
    var E = clone(E0);
    a = a || {};
    var me = seatDe(E, uid);
    if (me < 0) erro('Você não está nesta mesa.');
    var op = a.op;
    if (E.status === 'fim' || E.status === 'encerrada') erro('Esta partida já terminou.');

    if (op === 'votarEncerrar') {
      var v = E.votosEncerrar.filter(function (x) { return x !== uid; });
      if (a.sim !== false) v.push(uid);
      E.votosEncerrar = v;
      if (humanos(E).every(function (u) { return v.indexOf(u) >= 0; })) {
        E.status = 'encerrada'; E.aberta = false; E.fimEm = now; E.multavel = '';
        log(E, 'Todos concordaram: partida encerrada sem resultado.');
      } else if (a.sim !== false) log(E, apelido(E, uid) + ' propôs encerrar a partida (' + v.length + ' de ' + humanos(E).length + ').');
      E.atualizadaEm = now; return E;
    }
    if (op === 'pausar') {
      if (E.status !== 'jogando') erro('A partida não está em andamento.');
      E.status = 'pausada'; E.pausadaPor = uid; E.pausadaEm = now;
      log(E, apelido(E, uid) + ' pausou a partida.'); E.atualizadaEm = now; return E;
    }
    if (op === 'retomar') {
      if (E.status !== 'pausada') erro('A partida não está pausada.');
      if (E.pausadaPor !== uid && now - E.pausadaEm < P.PAUSA_MAX_MS) erro('Só quem pausou pode retomar (ou qualquer um depois de 10 minutos).');
      E.status = 'jogando'; E.pausadaPor = ''; E.ultimaJogadaEm = now;
      log(E, apelido(E, uid) + ' retomou a partida.'); E.atualizadaEm = now; return E;
    }
    if (op === 'votarRemover') {
      var alvo = a.alvo;
      var sa = seatDe(E, alvo);
      if (sa < 0) erro('Essa pessoa não está na mesa.');
      if (alvo === uid) erro('Você não pode votar em você.');
      if (sa !== E.vez || E.status !== 'jogando') erro('Só dá para remover quem está com a vez parada.');
      if (now - E.ultimaJogadaEm < P.AUSENTE_MS) erro('Ainda não passaram 10 minutos sem jogar.');
      var vr = (E.votosRemover[alvo] || []).filter(function (x) { return x !== uid; }); vr.push(uid);
      E.votosRemover[alvo] = vr;
      if (ehRobo(E, alvo)) erro('Robôs não ficam ausentes.');
      var precisa = Math.floor((humanos(E).length - 1) / 2) + 1;
      if (vr.length < precisa) { log(E, apelido(E, uid) + ' votou para remover ' + apelido(E, alvo) + ' (' + vr.length + ' de ' + precisa + ').'); E.atualizadaEm = now; return E; }
      // remove
      var nome = apelido(E, alvo);
      E.monte = L.shuffle(E.monte.concat(E.maos[alvo]), rngDe(E));
      delete E.maos[alvo]; delete E.gritou[alvo]; delete E.votosRemover[alvo];
      E.jogadores.splice(sa, 1); E.uids.splice(sa, 1);
      E.votosEncerrar = E.votosEncerrar.filter(function (x) { return x !== alvo; });
      E.removidos = (E.removidos || []).concat([alvo]);
      if (E.multavel === alvo) E.multavel = '';
      E.acumulo = 0; E.acumuloDe = ''; E.comprou = '';
      if (n(E) < 2 || !humanos(E).length) { E.status = 'encerrada'; E.aberta = false; E.fimEm = now; log(E, nome + ' foi removido. Sem adversários, a partida foi encerrada sem resultado.'); }
      else { E.vez = E.sentido === 1 ? sa % n(E) : (sa - 1 + n(E)) % n(E); E.ultimaJogadaEm = now; log(E, nome + ' foi removido da mesa por ausência. As cartas voltaram para o monte.'); }
      E.atualizadaEm = now; return E;
    }
    if (op === 'placa') {
      var nm = E.maos[uid].length;
      if (nm === 2 && E.status === 'jogando' && uidVez(E) === uid) { E.gritou[uid] = true; log(E, apelido(E, uid) + ' gritou PLACA!', { grito: uid }); E.atualizadaEm = now; return E; }
      if (nm === 1 && !E.gritou[uid]) { E.gritou[uid] = true; if (E.multavel === uid) E.multavel = ''; log(E, apelido(E, uid) + ' gritou PLACA!', { grito: uid }); E.atualizadaEm = now; return E; }
      erro('Você só grita "Placa!" com 2 cartas na sua vez ou com 1 carta na mão.');
    }
    if (op === 'multa') {
      var al = a.alvo;
      if (al === uid) erro('Não dá para se multar.');
      if (!al || E.multavel !== al || E.gritou[al]) erro('Não cabe multa agora.');
      comprar(E, al, 2);
      E.multavel = '';
      stat(E, uid).multas++;
      log(E, apelido(E, uid) + ' aplicou MULTA em ' + apelido(E, al) + ': +2 cartas.', { multa: al, por: uid });
      E.atualizadaEm = now; return E;
    }

    // ações da vez
    if (E.status === 'pausada') erro('A partida está pausada.');
    if (E.status !== 'jogando') erro('A partida ainda não começou.');
    if (uidVez(E) !== uid) erro('Não é a sua vez.');
    var quem = apelido(E, uid);

    if (op === 'comprar') {
      if (E.comprou) erro('Você já comprou nesta vez. Jogue a carta comprada ou passe.');
      if (E.multavel && E.multavel !== uid) E.multavel = '';
      if (E.acumulo > 0) {
        var q = E.acumulo, got = comprar(E, uid, q);
        if (q >= 8 && E.acumuloDe) stat(E, E.acumuloDe).guincho8++;
        E.acumulo = 0; E.acumuloDe = '';
        log(E, quem + ' foi guinchado: comprou ' + got.length + ' carta' + (got.length === 1 ? '' : 's') + '.', { compra: uid, qtd: got.length });
        E.vez = prox(E, E.vez);
      } else {
        var g = comprar(E, uid, 1);
        if (g.length && P.podeJogar(E, g[0])) { E.comprou = g[0]; log(E, quem + ' comprou 1 carta.', { compra: uid, qtd: 1 }); }
        else { log(E, quem + ' comprou 1 carta e passou.', { compra: uid, qtd: g.length }); E.vez = prox(E, E.vez); }
      }
      E.ultimaJogadaEm = now; E.atualizadaEm = now; E.votosRemover = {};
      return E;
    }
    if (op === 'passar') {
      if (!E.comprou) erro('Compre uma carta antes de passar.');
      E.comprou = ''; log(E, quem + ' passou.'); E.vez = prox(E, E.vez);
      E.ultimaJogadaEm = now; E.atualizadaEm = now; E.votosRemover = {};
      return E;
    }
    if (op === 'jogar') {
      var id = a.carta, mao = E.maos[uid], idx = mao.indexOf(id);
      if (idx < 0) erro('Essa carta não está na sua mão.');
      if (!P.podeJogar(E, id)) erro('Essa carta não combina com a da mesa.');
      var c = P.carta(id);
      var cor = c.cor;
      if (c.curinga) { if (P.CORES.indexOf(a.cor) < 0) erro('Escolha a cor.'); cor = a.cor; }
      if (E.multavel && E.multavel !== uid) E.multavel = '';
      mao.splice(idx, 1);
      E.descarte.push(id); E.cor = cor; E.comprou = '';
      E.ultimaJogadaEm = now; E.atualizadaEm = now; E.votosRemover = {};
      var desc = quem + ' jogou ' + P.nomeCarta(id) + (c.curinga ? ' e escolheu ' + P.NOME_COR[cor] : '') + '.';
      if (!mao.length) {
        if (c.curinga) E.ultimaSeguro = uid;
        log(E, desc + ' ' + quem + ' zerou as cartas e venceu!', { jogou: uid, carta: id });
        terminar(E, uid, now);
        return E;
      }
      if (mao.length === 1) {
        if (!E.gritou[uid]) {
          E.multavel = uid; E.multaRoboEm = 0;
          var fiscais = E.uids.filter(function (u) { return u !== uid && ehRobo(E, u); });
          if (fiscais.length && rngDe(E)() < (ehRobo(E, uid) ? 0.5 : 0.6)) E.multaRoboEm = now + 2500;
        }
      }
      else E.gritou[uid] = false;
      var nx = prox(E, E.vez), alvoN = apelido(E, E.jogadores[nx].uid);
      if (c.v === 'ped') { desc += ' ' + alvoN + ' perde a vez.'; E.vez = prox(E, E.vez, 2); }
      else if (c.v === 'ret') {
        E.sentido *= -1;
        if (n(E) === 2) { desc += ' ' + alvoN + ' perde a vez.'; E.vez = prox(E, E.vez, 2); }
        else { desc += ' O sentido do jogo inverteu.'; E.vez = prox(E, E.vez); }
      } else if (c.v === 'g2') {
        E.acumulo += 2; E.acumuloDe = uid;
        desc += ' Guincho acumulado: +' + E.acumulo + ' para ' + alvoN + '.';
        E.vez = nx;
      } else if (c.v === 's4') {
        var gt = comprar(E, E.jogadores[nx].uid, 4);
        desc += ' ' + alvoN + ' comprou ' + gt.length + ' e perdeu a vez.';
        E.vez = prox(E, E.vez, 2);
      } else E.vez = nx;
      log(E, desc, { jogou: uid, carta: id });
      return E;
    }
    erro('Ação desconhecida.');
  };

  // ---------- separar o estado para o banco ----------
  // público (mesas/{id}): todos da mesa veem; privado (montes/{id}): só o servidor; mãos (maos/{id}_{uid}): só o dono.
  var PRIVADOS = ['monte', 'descarte', 'maos', 'seed', 'rc'];
  P.publico = function (E) {
    var m = {};
    Object.keys(E).forEach(function (k) { if (PRIVADOS.indexOf(k) < 0) m[k] = clone(E[k]); });
    if (E.descarte) {
      m.topo = topo(E); m.nMonte = E.monte.length; m.nDescarte = E.descarte.length;
      m.nCartas = {}; E.jogadores.forEach(function (j) { m.nCartas[j.uid] = (E.maos[j.uid] || []).length; });
      m.anteriores = E.descarte.slice(-4, -1);
    }
    return m;
  };
  P.privado = function (E) { return { monte: E.monte.slice(), descarte: E.descarte.slice(), seed: E.seed, rc: E.rc }; };
  P.compor = function (mesa, priv, maos) {
    var E = clone(mesa);
    ['topo', 'nMonte', 'nDescarte', 'nCartas', 'anteriores'].forEach(function (k) { delete E[k]; });
    E.monte = priv.monte.slice(); E.descarte = priv.descarte.slice(); E.seed = priv.seed; E.rc = priv.rc;
    E.maos = {}; E.jogadores.forEach(function (j) { E.maos[j.uid] = (maos[j.uid] || []).slice(); });
    return E;
  };

  // resultado para o ranking (placaPartidas/{id})
  P.resultado = function (E, mesaId) {
    var st = {};
    E.jogadores.forEach(function (j) { var s = E.stats[j.uid] || {}; st[j.uid] = { multas: s.multas || 0, guincho8: s.guincho8 || 0 }; });
    return { mesaId: mesaId, temporadaId: E.temporadaId || '', fimEm: E.fimEm, iniciadaEm: E.iniciadaEm, vencedor: E.vencedor,
      uids: E.uids.slice(), jogadores: clone(E.jogadores), stats: st, segurado: E.ultimaSeguro === E.vencedor, temRobo: !!E.temRobo };
  };

  // ---------- robôs na mesa ----------
  // Quem está na mesa pede ao servidor; o servidor decide se algum robô deve agir agora.
  // ehRoboFn (opcional) permite tratar outras pessoas como robôs (modo demonstração).
  P.ESPERA_ROBO = 900;
  P.acaoRobo = function (E, now, ehRoboFn) {
    var eh = ehRoboFn || function (u) { return ehRobo(E, u); };
    if (E.status !== 'jogando') return null;
    // multa em quem esqueceu de gritar
    if (E.multavel && !E.gritou[E.multavel] && E.multaRoboEm && now >= E.multaRoboEm) {
      var fiscal = E.uids.filter(function (u) { return u !== E.multavel && eh(u); })[0];
      if (fiscal) { var M = P.acao(E, fiscal, { op: 'multa', alvo: E.multavel }, now); M.multaRoboEm = 0; return M; }
    }
    // multa agendada ainda não venceu: o robô da vez espera, para dar a chance de alguém gritar ou multar
    if (E.multavel && !E.gritou[E.multavel] && E.multaRoboEm && now < E.multaRoboEm) return null;
    var vez = E.jogadores[E.vez].uid;
    if (!eh(vez)) return null;
    if (now - (E.ultimaJogadaEm || 0) < P.ESPERA_ROBO) return null;
    var r = rngDe(E);
    if (E.maos[vez].length === 2 && !E.gritou[vez] && !E.comprou && P.validas(E, vez).length && r() < 0.7) return P.acao(E, vez, { op: 'placa' }, now);
    return P.acao(E, vez, P.bot(E, vez, r), now);
  };
  P.roboPendente = function (m) {
    if (!m || m.status !== 'jogando') return 0;
    var j = m.jogadores[m.vez];
    if (m.multavel && !(m.gritou || {})[m.multavel] && m.multaRoboEm) return Math.max(m.multaRoboEm, 1);
    if (j && j.bot) return (m.ultimaJogadaEm || 0) + P.ESPERA_ROBO + 400;
    return 0;
  };

  // ---------- estratégia do robô (nível médio) ----------
  P.bot = function (E, uid, r) {
    r = r || Math.random;
    var mao = E.maos[uid];
    if (E.comprou) {
      return P.podeJogar(E, E.comprou) ? jogada(E.comprou) : { op: 'passar' };
    }
    var v = P.validas(E, uid);
    if (!v.length) return { op: 'comprar' };
    // prefere especiais quando o próximo tem poucas cartas, guarda curingas
    var nx = E.jogadores[prox(E, E.vez)].uid, perigo = (E.maos[nx] || []).length <= 2;
    v.sort(function (a, b) { return peso(b) - peso(a); });
    function peso(id) {
      var c = P.carta(id);
      if (c.curinga) return perigo ? 50 : (mao.length <= 2 ? 40 : 1);
      if (c.v === 'g2' || c.v === 's4' || c.v === 'ped') return perigo ? 45 : 20 + r() * 5;
      if (c.v === 'ret') return 15 + r() * 5;
      return 10 + Number(c.v) / 3 + r() * 4;
    }
    return jogada(v[0]);
    function jogada(id) {
      var c = P.carta(id), a = { op: 'jogar', carta: id };
      if (c.curinga) {
        var cont = { L: 0, A: 0, V: 0, R: 0 };
        mao.forEach(function (x) { var k = P.carta(x); if (k.cor) cont[k.cor]++; });
        a.cor = P.CORES.slice().sort(function (p, q) { return cont[q] - cont[p]; })[0];
      }
      return a;
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.Placa = P;
})(this);
