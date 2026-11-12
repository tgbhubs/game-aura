/* ================== ADMINISTRAÇÃO ================== */
var ADM_ABAS = [['temporada', 'Temporada'], ['perguntas', 'Perguntas'], ['pessoas', 'Pessoas'], ['areas', 'Áreas'], ['corrida', 'Corrida'], ['qeq', 'Quem é quem']];
function telaAdm() {
  var h = '<div class="row between" style="margin-top:16px"><h2 style="font-size:22px;font-weight:900">Administração</h2>' + (ehMaster() ? '<span class="tag gold">Master</span>' : '<span class="tag nv">Adm</span>') + '</div><div class="chips">';
  ADM_ABAS.forEach(function (a) { h += '<button class="chip' + (S.admTab === a[0] ? ' on' : '') + '" data-a="admTab" data-v="' + a[0] + '">' + a[1] + '</button>'; });
  h += '</div>';
  var t = S.admTab;
  if (t === 'temporada') h += admTemporada();
  else if (t === 'perguntas') h += admPerguntas();
  else if (t === 'pessoas') h += admPessoas();
  else if (t === 'areas') h += admAreas();
  else if (t === 'corrida') h += admCorrida();
  else if (t === 'qeq') h += admQeq();
  return h;
}

/* ---------- Temporada ---------- */
function admTemporada() {
  var t = tempAtiva(), tid = tempAtivaId(), h = '';
  h += '<div class="card"><div class="row between"><h3 style="margin:0">Código de acesso</h3><button class="btn gh sm" data-a="editarCodigo">Alterar</button></div>' +
    '<p class="small mut" style="margin:6px 0 0">Quem se cadastra com o código entra aprovado na hora.</p>' +
    '<div class="mont" style="font-size:22px;font-weight:900;margin-top:8px;letter-spacing:.06em">' + (D.segredo && D.segredo.codigo ? esc(D.segredo.codigo) : '<span class="mut" style="font-size:15px">Nenhum código definido</span>') + '</div></div>';
  if (!t) {
    return h + '<div class="card"><h3>Nenhuma temporada ativa</h3><p class="small mut">Crie a primeira temporada. Antes, importe as perguntas na aba Perguntas.</p><button class="btn lar full" data-a="novaTemporada">Criar temporada</button></div>';
  }
  var rods = rodadasDe(tid), now = Date.now();
  var iniciou = rods.some(function (r) { return now >= r.inicio; });
  h += '<div class="card"><div class="row between"><h3 style="margin:0">' + esc(t.nome) + '</h3><span class="tag ' + (t.status === 'ativa' ? 'ok' : '') + '">' + (t.status === 'ativa' ? 'ativa' : 'encerrada') + '</span></div>' +
    '<table class="t" style="margin-top:8px"><tr><td>Início</td><td class="n">' + fmtDia(t.inicio) + '</td></tr><tr><td>Semanas</td><td class="n">' + t.semanas + '</td></tr>' +
    '<tr><td>Fator da curva da corrida (k)</td><td class="n">' + t.k + ' <button class="lnk small" data-a="editarK"' + (iniciou ? ' disabled title="Só antes da 1ª rodada"' : '') + '>' + (iniciou ? '' : 'editar') + '</button></td></tr>' +
    '<tr><td>Mix por rodada</td><td class="n small">' + TEMAS.map(function (x) { return (t.mix && t.mix[x] || 0) + ' ' + x.split(/[ ,]/)[0]; }).join(' · ') + '</td></tr></table>' +
    (iniciou ? '<p class="tiny mut">O fator k só pode mudar entre temporadas.</p>' : '') + '</div>';
  if (!rods.length) {
    h += '<div class="card"><h3>Rodadas ainda não montadas</h3><p class="small mut">O app sorteia 10 perguntas por rodada seguindo o mix, sem repetir pergunta na temporada.</p>' +
      '<p class="small">Perguntas disponíveis: <b>' + Object.keys(D.perguntas).filter(function (k) { return D.perguntas[k].ativa !== false; }).length + '</b> (precisa de ' + (t.semanas * 10) + ' para não faltar)</p>' +
      '<button class="btn lar full" data-a="gerarRodadas">Montar as ' + t.semanas + ' rodadas</button></div>';
  } else {
    h += '<div class="sec">Rodadas</div><div class="card" style="padding:6px 16px">';
    rods.forEach(function (r) {
      var st = now < r.inicio ? '<span class="tag">futura</span>' : now > r.fim ? '<span class="tag">fechada</span>' : '<span class="tag ok">aberta</span>';
      var P = D.placares[r.id] && D.placares[r.id].p ? Object.keys(D.placares[r.id].p).length : 0;
      h += '<div class="rk"><span class="pos">' + r.n + '</span><div class="nm"><b>' + fmtDia(r.inicio) + ' a ' + fmtDia(r.fim) + '</b><span>' + r.total + ' perguntas · ' + P + ' jogador' + (P === 1 ? '' : 'es') + '</span></div>' + st +
        '<button class="btn gh sm" data-a="verRodada" data-v="' + r.id + '">Ver</button></div>';
    });
    h += '</div>';
  }
  h += '<div class="sec">Ações</div><div class="card">';
  if (t.status === 'ativa') h += '<button class="btn red full" data-a="encerrarTemporada">Encerrar temporada</button><p class="tiny mut">Encerrar fecha o ranking final e libera o badge Líder da Temporada.</p>';
  h += '<button class="btn gh full" style="margin-top:8px" data-a="novaTemporada">Criar nova temporada</button><p class="tiny mut">A nova temporada passa a ser a ativa. O histórico da anterior continua no Ranking.</p></div>';
  return h;
}
function formTemporada() {
  var hoje = Logica.inicioSemana(Date.now() + 7 * DIA);
  var h = '<h3>Nova temporada</h3><label class="f">Nome</label><input class="inp" id="tNome" value="Temporada ' + (Object.keys(D.temporadas).length + 1) + '">' +
    '<label class="f">Começa na semana de (a rodada abre na segunda 00:00)</label><input class="inp" id="tIni" type="date" value="' + msParaData(hoje) + '">' +
    '<div class="grid2"><div><label class="f">Semanas</label><input class="inp" id="tSem" type="number" min="1" max="26" value="10"></div><div><label class="f">Fator k da corrida</label><input class="inp" id="tK" type="number" min="10" max="120" value="' + ((tempAtiva() || {}).k || 40) + '"></div></div>' +
    '<label class="f">Mix por rodada (soma 10)</label>';
  TEMAS.forEach(function (x, i) { h += '<div class="row between" style="margin:6px 0"><span class="small">' + esc(x) + '</span><input class="inp" style="width:80px" type="number" min="0" max="10" id="tMix' + i + '" value="' + Logica.MIX_PADRAO[x] + '"></div>'; });
  h += '<label class="f">Novo código de acesso (opcional)</label><input class="inp" id="tCod" autocapitalize="characters" placeholder="ex.: ICARROS-T2">' +
    '<div id="tErr"></div><div class="mact"><button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="salvarTemporada">Criar</button></div>';
  return h;
}
function salvarTemporada() {
  var nome = $('#tNome').value.trim(), ini = $('#tIni').value, sem = parseInt($('#tSem').value, 10), k = parseFloat($('#tK').value);
  var mix = {}, soma = 0;
  TEMAS.forEach(function (x, i) { var v = parseInt($('#tMix' + i).value, 10) || 0; mix[x] = v; soma += v; });
  var err = '';
  if (!nome) err = 'Dê um nome à temporada.'; else if (!ini) err = 'Escolha a data de início.'; else if (!(sem >= 1)) err = 'Número de semanas inválido.';
  else if (!(k >= 10)) err = 'Fator k inválido.'; else if (soma !== 10) err = 'O mix precisa somar 10 (está em ' + soma + ').';
  if (err) { $('#tErr').innerHTML = '<div class="err">' + err + '</div>'; return; }
  var inicio = Logica.inicioSemana(dataParaMs(ini) + 12 * 3600000);
  var tid = 'T' + ymd(inicio);
  if (D.temporadas[tid]) { $('#tErr').innerHTML = '<div class="err">Já existe uma temporada começando nessa semana.</div>'; return; }
  var ops = [];
  var atual = tempAtivaId();
  if (atual && D.temporadas[atual] && D.temporadas[atual].status === 'ativa') ops.push({ path: 'temporadas/' + atual, data: { status: 'encerrada', encerradaEm: Date.now() }, merge: true });
  ops.push({ path: 'temporadas/' + tid, data: { nome: nome, inicio: inicio, semanas: sem, k: k, mix: mix, status: 'ativa', criadaEm: Date.now(), criadaPor: S.user.uid } });
  ops.push({ path: 'config/geral', data: { temporadaAtiva: tid }, merge: true });
  var cod = $('#tCod').value.trim().toUpperCase();
  if (cod) ops.push({ path: 'segredos/acesso', data: { codigo: cod } });
  B.lote(ops).then(function () { fecharModal(); toast('Temporada criada. Agora monte as rodadas.'); S.admTab = 'temporada'; R(); })
    .catch(function (e) { $('#tErr').innerHTML = '<div class="err">' + esc(msgErro(e)) + '</div>'; });
}
function listaPerguntasAtivas() {
  return Object.keys(D.perguntas).filter(function (k) { return D.perguntas[k].ativa !== false; })
    .map(function (k) { return { id: k, tema: D.perguntas[k].tema, ativa: true }; });
}
function gerarRodadas() {
  var tid = tempAtivaId(), t = tempAtiva();
  var lista = listaPerguntasAtivas();
  if (lista.length < 10) { toast('Importe ou cadastre perguntas antes (mínimo 10).'); return; }
  var ns = []; for (var n = 1; n <= t.semanas; n++) ns.push(n);
  var m = Logica.montarRodadas({ perguntas: lista, ns: ns, mix: t.mix, seed: Math.floor(Math.random() * 1e9) });
  var ops = [], curtas = 0;
  m.forEach(function (x) {
    var rid = tid + '_R' + pad(x.n), inicio = t.inicio + (x.n - 1) * 7 * DIA;
    if (x.ids.length < 10) curtas++;
    if (!x.ids.length) return;
    var g = {}; x.ids.forEach(function (id) { var p = D.perguntas[id]; g[id] = { texto: p.texto, alts: p.alts, correta: p.correta, tema: p.tema }; });
    ops.push({ path: 'rodadas/' + rid, data: { temporadaId: tid, n: x.n, inicio: inicio, fim: inicio + 7 * DIA - 1000, seed: Math.floor(Math.random() * 1e9), total: x.ids.length } });
    ops.push({ path: 'gabarito/' + rid, data: { temporadaId: tid, perguntas: g } });
  });
  S.ocupado = true;
  B.lote(ops).then(function () { S.ocupado = false; toast(curtas ? ('Rodadas montadas. Atenção: ' + curtas + ' ficaram com menos de 10 perguntas.') : 'Rodadas montadas!', 4000); R(); })
    .catch(function (e) { S.ocupado = false; toast(msgErro(e)); });
}
function verRodada(rid) {
  B.get('gabarito/' + rid).then(function (g) {
    var r = D.rodadas[rid]; if (!g || !r) { toast('Rodada não encontrada.'); return; }
    var futura = Date.now() < r.inicio;
    var h = '<h3>Rodada ' + r.n + '</h3><p class="small mut" style="margin-top:0">' + fmtDia(r.inicio) + ' a ' + fmtDia(r.fim) + '</p>';
    Object.keys(g.perguntas).forEach(function (pid, i) {
      var p = g.perguntas[pid];
      h += '<div style="border-top:1px solid var(--line);padding:10px 0"><div class="tiny mut">' + (i + 1) + '. ' + esc(p.tema) + ' · ' + esc(pid) + '</div><b class="small">' + esc(p.texto) + '</b><div class="small" style="color:var(--ok)">✓ ' + esc(p.alts[p.correta]) + '</div></div>';
    });
    h += '<div class="mact">' + (futura ? '<button class="btn gh" data-a="regerarRodada" data-v="' + rid + '">Sortear de novo</button>' : '') + '<button class="btn" data-a="fecharModal">Fechar</button></div>';
    if (!futura) h += '<p class="tiny mut">Rodadas abertas ou fechadas não podem ser alteradas.</p>';
    abrirModal(h);
  }).catch(function (e) { toast(msgErro(e)); });
}
function regerarRodada(rid) {
  var r = D.rodadas[rid], tid = r.temporadaId, t = D.temporadas[tid];
  B.getCol('gabarito', [['temporadaId', '==', tid]]).then(function (gs) {
    var usadas = {};
    Object.keys(gs).forEach(function (g) { if (g === rid) return; Object.keys(gs[g].perguntas || {}).forEach(function (p) { usadas[p] = true; }); });
    var m = Logica.montarRodadas({ perguntas: listaPerguntasAtivas(), usadas: usadas, ns: [r.n], mix: t.mix, seed: Math.floor(Math.random() * 1e9) })[0];
    if (!m.ids.length) { toast('Não há perguntas novas suficientes.'); return; }
    var g = {}; m.ids.forEach(function (id) { var p = D.perguntas[id]; g[id] = { texto: p.texto, alts: p.alts, correta: p.correta, tema: p.tema }; });
    return B.lote([{ path: 'gabarito/' + rid, data: { temporadaId: tid, perguntas: g } }, { path: 'rodadas/' + rid, data: { total: m.ids.length, seed: Math.floor(Math.random() * 1e9) }, merge: true }])
      .then(function () { toast('Rodada sorteada de novo.'); verRodada(rid); });
  }).catch(function (e) { toast(msgErro(e)); });
}

/* ---------- Perguntas ---------- */
function admPerguntas() {
  var ids = Object.keys(D.perguntas);
  var cont = {}; TEMAS.forEach(function (t) { cont[t] = 0; });
  ids.forEach(function (k) { var p = D.perguntas[k]; if (p.ativa !== false) cont[p.tema] = (cont[p.tema] || 0) + 1; });
  var h = '<div class="card"><h3>Banco de perguntas</h3><div class="grid2" style="grid-template-columns:repeat(2,1fr);gap:8px">';
  TEMAS.forEach(function (t) { h += '<div class="kp" style="text-align:left"><b>' + (cont[t] || 0) + '</b><span>' + esc(t) + '</span></div>'; });
  h += '<div class="kp" style="text-align:left;background:#E6ECFF"><b>' + ids.length + '</b><span>total no banco</span></div></div>' +
    '<div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn lar sm" data-a="novaPergunta">+ Nova pergunta</button>' +
    '<label class="btn gh sm" style="margin:0">📥 Importar planilha revisada<input type="file" accept=".xlsx,.xls" data-c="importarPlanilha" style="display:none"></label>' +
    (BANCO_INICIAL.length ? '<button class="btn gh sm" data-a="importarBanco">Importar banco inicial (' + BANCO_INICIAL.length + ')</button>' : '') + '</div>' +
    '<p class="tiny mut">A planilha importa só as linhas marcadas como <b>Aprovada</b> na coluna Revisão. Perguntas com o mesmo ID são atualizadas.</p></div>';
  h += '<div class="chips">' + ['Todos'].concat(TEMAS).map(function (t) { return '<button class="chip' + (S.pergFiltro === t ? ' on' : '') + '" data-a="pergFiltro" data-v="' + esc(t) + '">' + esc(t === 'Todos' ? 'Todos' : t.split(',')[0]) + '</button>'; }).join('') + '</div>' +
    '<input class="inp" placeholder="Buscar pergunta…" data-i="pergBusca" value="' + esc(S.pergBusca) + '">';
  var q = S.pergBusca.toLowerCase();
  var lista = ids.filter(function (k) {
    var p = D.perguntas[k];
    return (S.pergFiltro === 'Todos' || p.tema === S.pergFiltro) && (!q || (p.texto + ' ' + k).toLowerCase().indexOf(q) >= 0);
  }).sort();
  h += '<div class="card" style="padding:6px 16px">';
  if (!lista.length) h += '<div class="empty">Nenhuma pergunta aqui ainda.</div>';
  lista.slice(0, 200).forEach(function (k) {
    var p = D.perguntas[k];
    h += '<div class="rk" style="align-items:flex-start"><div class="nm"><span>' + esc(k) + ' · ' + esc(p.tema) + ' · ' + esc(p.dificuldade || '') + (p.ativa === false ? ' · <b style="color:var(--err)">inativa</b>' : '') + '</span><b style="white-space:normal">' + esc(p.texto) + '</b><span style="color:var(--ok)">✓ ' + esc(p.alts[p.correta]) + '</span></div><button class="btn gh sm" data-a="editarPergunta" data-v="' + esc(k) + '">Editar</button></div>';
  });
  if (lista.length > 200) h += '<div class="empty">Mostrando 200 de ' + lista.length + '. Use a busca.</div>';
  return h + '</div>';
}
function formPergunta(id) {
  var p = id ? D.perguntas[id] : { tema: TEMAS[0], dificuldade: 'Média', texto: '', alts: ['', '', '', ''], correta: 0, obs: '', ativa: true };
  var h = '<h3>' + (id ? 'Editar pergunta' : 'Nova pergunta') + '</h3>' + (id ? '<div class="tiny mut">' + esc(id) + '</div>' : '') +
    '<label class="f">Tema</label><select class="inp" id="pTema">' + TEMAS.map(function (t) { return '<option' + (t === p.tema ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>' +
    '<label class="f">Dificuldade</label><select class="inp" id="pDif">' + ['Fácil', 'Média', 'Difícil'].map(function (t) { return '<option' + (t === p.dificuldade ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>' +
    '<label class="f">Pergunta</label><textarea class="inp" id="pTexto">' + esc(p.texto) + '</textarea><label class="f">Alternativas (marque a correta)</label>';
  for (var i = 0; i < 4; i++) h += '<div class="row" style="margin:6px 0"><input type="radio" name="pCor" value="' + i + '"' + (p.correta === i ? ' checked' : '') + ' style="width:20px;height:20px"><input class="inp" id="pAlt' + i + '" value="' + esc(p.alts[i] || '') + '" placeholder="Alternativa ' + LETRAS[i] + '"></div>';
  h += '<label class="f">Observação (só admin vê)</label><input class="inp" id="pObs" value="' + esc(p.obs || '') + '">' +
    '<label class="row small" style="margin-top:12px"><input type="checkbox" id="pAtiva"' + (p.ativa !== false ? ' checked' : '') + ' style="width:18px;height:18px"> Ativa (pode ser sorteada)</label><div id="pErr"></div>' +
    '<div class="mact">' + (id ? '<button class="btn red" data-a="excluirPergunta" data-v="' + esc(id) + '">Excluir</button>' : '') + '<button class="btn gh" data-a="fecharModal">Cancelar</button><button class="btn lar" data-a="salvarPergunta" data-v="' + esc(id || '') + '">Salvar</button></div>';
  return h;
}
function salvarPergunta(id) {
  var alts = [0, 1, 2, 3].map(function (i) { return $('#pAlt' + i).value.trim(); });
  var cor = document.querySelector('input[name=pCor]:checked');
  var texto = $('#pTexto').value.trim();
  var err = !texto ? 'Escreva a pergunta.' : alts.some(function (a) { return !a; }) ? 'Preencha as 4 alternativas.' : !cor ? 'Marque a alternativa correta.' : '';
  if (!err && new Set(alts.map(function (a) { return a.toLowerCase(); })).size < 4) err = 'As alternativas precisam ser diferentes.';
  if (err) { $('#pErr').innerHTML = '<div class="err">' + err + '</div>'; return; }
  var tema = $('#pTema').value;
  var novoId = id || ({ 'Carros e curiosidades': 'CAR', 'Mobilidade, pedágio e tag': 'MOB', 'ConectCar e sócios': 'SOC', 'icarros': 'ICA', 'Quem é quem': 'QEQ' }[tema] + '-N' + Date.now().toString(36).toUpperCase());
  var base = id ? D.perguntas[id] : {};
  var dados = { tema: tema, dificuldade: $('#pDif').value, texto: texto, alts: alts, correta: parseInt(cor.value, 10), obs: $('#pObs').value.trim(), ativa: $('#pAtiva').checked, atualizadaEm: Date.now() };
  if (base.sobreUid) { dados.sobreUid = base.sobreUid; dados.curiosidade = base.curiosidade || ''; }
  if (S._qeqNovo && !id) { dados.sobreUid = S._qeqNovo.uid; dados.curiosidade = S._qeqNovo.cur; }
  B.set('perguntas/' + novoId, dados).then(function () { S._qeqNovo = null; fecharModal(); toast('Pergunta salva.'); })
    .catch(function (e) { $('#pErr').innerHTML = '<div class="err">' + esc(msgErro(e)) + '</div>'; });
}
function importarBanco() {
  var ops = [], novas = 0;
  BANCO_INICIAL.forEach(function (b) {
    if (D.perguntas[b[0]]) return;
    novas++;
    ops.push({ path: 'perguntas/' + b[0], data: { tema: b[1], dificuldade: b[2], texto: b[3], alts: b[4], correta: b[5], obs: b[6] || '', ativa: true, origem: 'banco inicial', atualizadaEm: Date.now() } });
  });
  if (!novas) { toast('Todas as perguntas do banco inicial já estão importadas.'); return; }
  abrirConfirma('Importar ' + novas + ' perguntas do banco inicial?', 'Elas entram como estão, sem a sua revisão. Se preferir, revise a planilha e use "Importar planilha revisada".', 'Importar', function () {
    B.lote(ops).then(function () { toast(novas + ' perguntas importadas.'); }).catch(function (e) { toast(msgErro(e)); });
  });
}
function carregarXLSX(cb) {
  if (window.XLSX) { cb(); return; }
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = cb; s.onerror = function () { toast('Não consegui carregar o leitor de planilhas.'); };
  document.head.appendChild(s);
}
function importarPlanilha(input) {
  var f = input.files && input.files[0]; if (!f) return;
  carregarXLSX(function () {
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var wb = XLSX.read(new Uint8Array(rd.result), { type: 'array' });
        var ws = wb.Sheets['Perguntas'] || wb.Sheets[wb.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        var cab = rows[0].map(function (c) { return String(c).trim().toLowerCase(); });
        function col(n) { return cab.indexOf(n); }
        var iId = col('id'), iTema = col('tema'), iDif = col('dificuldade'), iP = col('pergunta'), iA = col('a'), iCor = col('correta'), iObs = col('observação'), iRev = col('revisão');
        if (iP < 0 || iA < 0 || iCor < 0) throw new Error('Não reconheci as colunas da planilha (ID, Tema, Dificuldade, Pergunta, A, B, C, D, Correta, Observação, Revisão).');
        var ops = [], ign = 0, inval = 0;
        rows.slice(1).forEach(function (r) {
          if (!String(r[iP]).trim()) return;
          var rev = iRev >= 0 ? String(r[iRev]).trim().toLowerCase() : 'aprovada';
          if (rev !== 'aprovada') { ign++; return; }
          var alts = [0, 1, 2, 3].map(function (j) { return String(r[iA + j]).trim(); });
          var cor = 'ABCD'.indexOf(String(r[iCor]).trim().toUpperCase());
          var tema = String(r[iTema]).trim();
          if (cor < 0 || alts.some(function (a) { return !a; }) || TEMAS.indexOf(tema) < 0) { inval++; return; }
          var id = String(r[iId]).trim() || ('IMP-' + Logica.hash(r[iP]));
          ops.push({ path: 'perguntas/' + id.replace(/\//g, '-'), data: { tema: tema, dificuldade: String(r[iDif]).trim() || 'Média', texto: String(r[iP]).trim(), alts: alts, correta: cor, obs: iObs >= 0 ? String(r[iObs]).trim() : '', ativa: true, origem: 'planilha', atualizadaEm: Date.now() } });
        });
        input.value = '';
        if (!ops.length) { toast('Nenhuma linha "Aprovada" encontrada (' + ign + ' ignoradas).', 4000); return; }
        abrirConfirma('Importar ' + ops.length + ' perguntas aprovadas?', ign + ' linhas não aprovadas serão ignoradas' + (inval ? ' e ' + inval + ' com problema (tema, alternativas ou gabarito)' : '') + '. Perguntas com o mesmo ID serão atualizadas.', 'Importar', function () {
          B.lote(ops).then(function () { toast(ops.length + ' perguntas importadas.'); }).catch(function (e) { toast(msgErro(e)); });
        });
      } catch (e) { input.value = ''; toast(msgErro(e), 5000); }
    };
    rd.readAsArrayBuffer(f);
  });
}

/* ---------- Pessoas ---------- */
function admPessoas() {
  var todos = Object.keys(D.jogadores).map(function (k) { var j = D.jogadores[k]; j._id = k; return j; });
  var cont = { pendente: 0, ativo: 0, bloqueado: 0 };
  todos.forEach(function (j) { cont[j.status] = (cont[j.status] || 0) + 1; });
  var h = '<div class="seg">' + [['pendente', 'Pendentes'], ['ativo', 'Ativos'], ['bloqueado', 'Bloqueados']].map(function (x) {
    return '<button class="' + (S.pessoasFiltro === x[0] ? 'on' : '') + '" data-a="pessoasFiltro" data-v="' + x[0] + '">' + x[1] + ' (' + (cont[x[0]] || 0) + ')</button>';
  }).join('') + '</div><div class="card" style="padding:6px 16px">';
  var lista = todos.filter(function (j) { return j.status === S.pessoasFiltro; }).sort(function (a, b) { return (a.apelido || a.nome || '').localeCompare(b.apelido || b.nome || ''); });
  if (!lista.length) h += '<div class="empty">Ninguém aqui.</div>';
  lista.forEach(function (j) {
    var m = D.config && D.config.masterUid === j._id;
    var papel = m ? '<span class="tag gold">Master</span>' : j.papel === 'adm' ? '<span class="tag nv">Adm</span>' : '';
    h += '<div class="rk" style="flex-wrap:wrap">' + avatar(j, j._id) + '<div class="nm"><b>' + esc(nomeExib(j)) + ' ' + papel + '</b><span>' + esc(j.nome) + ' · ' + esc(areaNome(j.areaId)) + '<br>' + esc(j.email || '') + '</span></div><div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">';
    if (!m) {
      if (j.status === 'pendente') h += '<button class="btn sm" data-a="statusPessoa" data-v="' + j._id + '|ativo">Aprovar</button><button class="btn red sm" data-a="statusPessoa" data-v="' + j._id + '|bloqueado">Recusar</button>';
      if (j.status === 'ativo') { h += '<button class="btn red sm" data-a="statusPessoa" data-v="' + j._id + '|bloqueado">Bloquear</button>'; if (ehMaster()) h += '<button class="btn gh sm" data-a="papelPessoa" data-v="' + j._id + '">' + (j.papel === 'adm' ? 'Tirar Adm' : 'Tornar Adm') + '</button>'; }
      if (j.status === 'bloqueado') h += '<button class="btn gh sm" data-a="statusPessoa" data-v="' + j._id + '|ativo">Reativar</button>';
    }
    h += '</div></div>';
  });
  return h + '</div>';
}

/* ---------- Áreas ---------- */
function admAreas() {
  var ids = Object.keys(D.areas).sort(function (a, b) { return D.areas[a].nome.localeCompare(D.areas[b].nome); });
  var uso = {}; Object.keys(D.jogadores).forEach(function (k) { var a = D.jogadores[k].areaId; uso[a] = (uso[a] || 0) + 1; });
  var h = '<div class="card"><div class="row between"><h3 style="margin:0">Áreas</h3><button class="btn lar sm" data-a="novaArea">+ Nova área</button></div></div>';
  var pend = ids.filter(function (k) { return D.areas[k].status === 'pendente'; });
  if (pend.length) {
    h += '<div class="sec">Sugeridas pelos jogadores</div><div class="card" style="padding:6px 16px">';
    pend.forEach(function (k) { h += '<div class="rk"><div class="nm"><b>' + esc(D.areas[k].nome) + '</b><span>' + (uso[k] || 0) + ' pessoa(s)</span></div><button class="btn sm" data-a="aprovarArea" data-v="' + k + '">Aprovar</button><button class="btn gh sm" data-a="renomearArea" data-v="' + k + '">Renomear</button></div>'; });
    h += '</div>';
  }
  h += '<div class="sec">Ativas</div><div class="card" style="padding:6px 16px">';
  ids.filter(function (k) { return D.areas[k].status === 'ativa'; }).forEach(function (k) {
    h += '<div class="rk"><span class="av sm" style="background:' + corDe(k) + '">' + esc(iniciais(D.areas[k].nome)) + '</span><div class="nm"><b>' + esc(D.areas[k].nome) + '</b><span>' + (uso[k] || 0) + ' pessoa(s)</span></div><button class="btn gh sm" data-a="renomearArea" data-v="' + k + '">Renomear</button>' + (!uso[k] ? '<button class="btn red sm" data-a="excluirArea" data-v="' + k + '">Excluir</button>' : '') + '</div>';
  });
  return h + '</div>';
}

/* ---------- Corrida ---------- */
function admCorrida() {
  var tid = tempAtivaId(); if (!tid) return '<div class="empty">Sem temporada ativa.</div>';
  var rods = rodadasDe(tid).filter(function (r) { return Date.now() >= r.inicio; });
  if (!rods.length) return '<div class="empty">Nenhuma rodada começou ainda.</div>';
  var rid = S.admRodadaCorrida || rods[rods.length - 1].id;
  var h = '<div class="chips">' + rods.map(function (r) { return '<button class="chip' + (r.id === rid ? ' on' : '') + '" data-a="admRodadaCorrida" data-v="' + r.id + '">R' + r.n + '</button>'; }).join('') + '</div>';
  if (!D.admCorridas || D.admCorridas.rid !== rid) {
    D.admCorridas = { rid: rid, dados: null };
    B.getCol('corrida', [['rodadaId', '==', rid]]).then(function (m) { if (D.admCorridas && D.admCorridas.rid === rid) { D.admCorridas.dados = m; R(); } }).catch(function (e) { toast(msgErro(e)); });
  }
  if (!D.admCorridas.dados) return h + carregando('Carregando tentativas…');
  var lista = Object.keys(D.admCorridas.dados).map(function (k) { return D.admCorridas.dados[k]; })
    .sort(function (a, b) { return (b.suspeita - a.suspeita) || b.tempo - a.tempo; });
  h += '<div class="card"><p class="small mut" style="margin-top:0">Tempos marcados como <span class="tag err">revisar</span> passaram de 10 minutos ou foram maiores que o tempo real da tentativa. Anular remove a tentativa do melhor tempo (ela continua contando como usada).</p><button class="btn gh sm" data-a="recarregarCorridas">Atualizar</button></div>' +
    '<div class="card" style="padding:6px 16px">';
  if (!lista.length) h += '<div class="empty">Nenhuma tentativa nesta rodada.</div>';
  lista.forEach(function (t) {
    var j = D.jogadores[t.uid];
    h += '<div class="rk">' + avatar(j, t.uid, 'sm') + '<div class="nm"><b>' + esc(nomeExib(j)) + ' · tentativa ' + t.n + '</b><span>' + (t.status === 'finalizada' ? fmtSeg(t.tempo) : 'não terminou (conta como usada)') + ' · ' + fmtDiaHora(t.iniciadaEm) + '</span></div>' +
      (t.suspeita ? '<span class="tag err">revisar</span>' : '') + (t.anulada ? '<span class="tag">anulada</span>' : '') +
      (t.status === 'finalizada' ? '<button class="btn ' + (t.anulada ? 'gh' : 'red') + ' sm" data-a="anular" data-v="' + rid + '|' + t.uid + '|' + t.n + '|' + (t.anulada ? '0' : '1') + '">' + (t.anulada ? 'Restaurar' : 'Anular') + '</button>' : '') + '</div>';
  });
  return h + '</div>';
}

/* ---------- Quem é quem ---------- */
function admQeq() {
  var pergs = Object.keys(D.perguntas).filter(function (k) { return D.perguntas[k].sobreUid; }).map(function (k) { var p = D.perguntas[k]; p._id = k; return p; });
  var h = '<div class="card"><p class="small mut" style="margin:0">Curiosidades que os jogadores cadastraram no perfil. Transforme em perguntas "Quem do time…?" com 4 colegas como alternativas.</p></div>';
  var orf = pergs.filter(function (p) { var j = D.jogadores[p.sobreUid]; return !j || (j.curiosidades || []).indexOf(p.curiosidade) < 0 || j.status !== 'ativo'; });
  if (orf.length) {
    h += '<div class="sec">Curiosidades retiradas</div><div class="card" style="padding:6px 16px"><p class="tiny mut">A pessoa removeu a curiosidade (ou saiu do jogo). Exclua a pergunta para respeitar a escolha dela.</p>';
    orf.forEach(function (p) { h += '<div class="rk"><div class="nm"><b style="white-space:normal">' + esc(p.texto) + '</b><span>' + esc(p._id) + '</span></div><button class="btn red sm" data-a="excluirPerguntaDireto" data-v="' + esc(p._id) + '">Excluir</button></div>'; });
    h += '</div>';
  }
  h += '<div class="sec">Curiosidades cadastradas</div><div class="card" style="padding:6px 16px">';
  var tem = false;
  Object.keys(D.jogadores).forEach(function (uid) {
    var j = D.jogadores[uid];
    if (j.status !== 'ativo') return;
    (j.curiosidades || []).forEach(function (c, i) {
      tem = true;
      var ja = pergs.some(function (p) { return p.sobreUid === uid && p.curiosidade === c; });
      h += '<div class="rk">' + avatar(j, uid, 'sm') + '<div class="nm"><b style="white-space:normal">' + esc(c) + '</b><span>' + esc(nomeExib(j)) + '</span></div>' +
        (ja ? '<span class="tag ok">já é pergunta</span>' : '<button class="btn sm" data-a="gerarQeq" data-v="' + uid + '|' + i + '">Gerar pergunta</button>') + '</div>';
    });
  });
  if (!tem) h += '<div class="empty">Ninguém cadastrou curiosidades ainda. Incentive o time a preencher no Perfil.</div>';
  return h + '</div>';
}
function gerarQeq(v) {
  var p = v.split('|'), uid = p[0], j = D.jogadores[uid], cur = (j.curiosidades || [])[+p[1]];
  if (!cur) return;
  var outros = Object.keys(D.jogadores).filter(function (k) { return k !== uid && D.jogadores[k].status === 'ativo'; });
  var mesma = outros.filter(function (k) { return D.jogadores[k].areaId === j.areaId; });
  var r = Logica.rng(Date.now() % 1e9);
  var esc3 = Logica.shuffle(mesma, r).concat(Logica.shuffle(outros.filter(function (k) { return mesma.indexOf(k) < 0; }), r)).slice(0, 3);
  var frase = cur.charAt(0).toLowerCase() + cur.slice(1);
  frase = frase.replace(/[.!]+$/, '');
  S._qeqNovo = { uid: uid, cur: cur };
  var form = formPergunta(null);
  abrirModal(form);
  $('#pTema').value = 'Quem é quem';
  $('#pTexto').value = 'Quem do time ' + frase + '?';
  $('#pAlt0').value = nomeExib(j);
  esc3.forEach(function (k, i) { $('#pAlt' + (i + 1)).value = nomeExib(D.jogadores[k]); });
  document.querySelector('input[name=pCor][value="0"]').checked = true;
  if (esc3.length < 3) $('#pErr').innerHTML = '<div class="err">Faltam colegas ativos para completar as alternativas. Preencha à mão.</div>';
}
