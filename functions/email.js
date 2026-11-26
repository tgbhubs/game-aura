/* E-mails do Game Aura (Gmail tgbhubs@gmail.com, senha de app em GMAIL_SENHA, gravada no deploy).
   Sem a senha, nada é enviado (e o jogo segue normal). Cada pessoa pode desligar em Perfil (jogadores.emails === false). */
const nodemailer = require('nodemailer');
const REMETENTE = 'tgbhubs@gmail.com';
const LINK = 'https://tgbhubs.github.io/game-aura/';
let transp = null;
function transporte() {
  const senha = String(process.env.GMAIL_SENHA || '').replace(/\s+/g, '');
  if (!senha) return null;
  if (!transp) transp = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: REMETENTE, pass: senha } });
  return transp;
}
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function moldura(titulo, corpo, botao) {
  return '<!doctype html><html><body style="margin:0;background:#F4F1EA;font-family:Arial,Helvetica,sans-serif;color:#14235E">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EA;padding:24px 0"><tr><td align="center">' +
    '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden">' +
    '<tr><td style="background:#14235E;padding:22px 28px"><span style="font-size:28px;font-weight:800;font-style:italic;color:#F4F1EA;letter-spacing:-0.5px">aura</span>' +
    ' <span style="display:inline-block;margin-left:8px;background:#EC7000;color:#14235E;font-size:12px;font-weight:800;letter-spacing:3px;padding:4px 10px;border-radius:999px;vertical-align:middle">GAME</span></td></tr>' +
    '<tr><td style="padding:28px 28px 8px"><h1 style="margin:0 0 14px;font-size:24px;line-height:1.25;color:#14235E">' + titulo + '</h1>' + corpo + '</td></tr>' +
    (botao ? '<tr><td style="padding:8px 28px 28px"><a href="' + botao.href + '" style="display:inline-block;background:#EC7000;color:#14235E;font-weight:800;text-decoration:none;padding:14px 22px;border-radius:12px;font-size:16px">' + botao.txt + '</a></td></tr>' : '') +
    '<tr><td style="padding:16px 28px 24px;border-top:1px solid #DCD8CE;font-size:12px;color:#5A6482">Game Aura · jogo interno da ConectCar. Para não receber estes e-mails, desligue em Perfil › Avisos por e-mail.</td></tr>' +
    '</table></td></tr></table></body></html>';
}
const p = (t) => '<p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#14235E">' + t + '</p>';
const li = (t) => '<li style="margin:0 0 8px;font-size:15px;line-height:1.45">' + t + '</li>';

function boasVindas(nome) {
  const corpo = p('Oi, ' + esc(nome) + '! Que bom ter você no Game Aura.') +
    p('O jogo nasceu para a gente se conhecer melhor e aprender, brincando, sobre o nosso negócio: ConectCar, icarros, Itaú e Porto. Cada semana é uma rodada, e as rodadas formam uma temporada.') +
    '<h2 style="margin:18px 0 8px;font-size:17px;color:#14235E">Como funciona a temporada</h2><ul style="margin:0 0 12px;padding-left:20px;color:#14235E">' +
    li('<b>Rodada semanal</b>, de segunda 00h a domingo 23h59.') +
    li('<b>Quiz</b>: 10 perguntas por rodada, valendo pontos por acerto e rapidez.') +
    li('<b>Corrida valendo</b>: 3 tentativas por rodada na rodovia, com pedágio, TAG, free flow e CAP Porto. Vale a melhor.') +
    li('<b>Ranking</b> por pessoa e por área. Os 5 primeiros da temporada ganham brinde.') + '</ul>' +
    '<h2 style="margin:18px 0 8px;font-size:17px;color:#14235E">Para ir além</h2><ul style="margin:0 0 12px;padding-left:20px;color:#14235E">' +
    li('<b>Treino</b> livre, que rende créditos para a Garagem.') +
    li('<b>Garagem</b>: compre carros 0 km, retomados ou de colegas.') +
    li('<b>Duelos</b>: desafie alguém numa melhor de 3, valendo créditos ou carro.') +
    li('<b>Placa!</b>: o jogo de cartas para jogar com o time.') + '</ul>' +
    p('Dica: coloque uma foto no perfil. É assim que o time se reconhece no ranking.');
  return { assunto: 'Bem-vindo ao Game Aura', html: moldura('Bem-vindo ao Game Aura', corpo, { href: LINK, txt: 'Abrir o jogo' }) };
}
function desafio(de, apostaTxt, horas) {
  const corpo = p('<b>' + esc(de) + '</b> te desafiou para um duelo: melhor de 3 corridas, valendo <b>' + esc(apostaTxt) + '</b>.') +
    p('Você tem <b>' + horas + ' horas</b> para aceitar ou recusar. Ao aceitar, escolha sua aposta do mesmo tipo e faça as 3 corridas no seu tempo, em até 48 h.');
  return { assunto: de + ' te desafiou no Game Aura', html: moldura('Você foi desafiado!', corpo, { href: LINK, txt: 'Ver o desafio' }) };
}
function contraproposta(outro, antes, novo) {
  const corpo = p('<b>' + esc(outro) + '</b> recebeu o seu desafio de <b>' + antes + ' créditos</b> e propôs outro valor: <b>' + novo + ' créditos</b>.') +
    p('Se você aceitar, o duelo começa valendo ' + novo + ' créditos de cada lado. Se recusar, o duelo é cancelado e sua aposta volta.');
  return { assunto: outro + ' propôs ' + novo + ' créditos no duelo', html: moldura('Contraproposta no duelo', corpo, { href: LINK, txt: 'Responder' }) };
}
function dueloAceito(outro, apostaOutro) {
  const corpo = p('<b>' + esc(outro) + '</b> aceitou o seu desafio e apostou <b>' + esc(apostaOutro) + '</b>.') +
    p('Agora são 3 corridas para cada um, no seu tempo, em até 48 horas. As pistas são as mesmas para os dois.');
  return { assunto: outro + ' aceitou o seu duelo', html: moldura('Duelo valendo!', corpo, { href: LINK, txt: 'Correr agora' }) };
}
function dueloPrazo(outro, faltam) {
  const corpo = p('Faltam menos de <b>12 horas</b> para o fim do seu duelo com <b>' + esc(outro) + '</b>, e você ainda tem <b>' + faltam + (faltam === 1 ? ' corrida' : ' corridas') + '</b> para fazer.') +
    p('Corrida não feita no prazo vale 0.');
  return { assunto: 'Seu duelo com ' + outro + ' termina em menos de 12 h', html: moldura('O prazo do duelo está acabando', corpo, { href: LINK, txt: 'Fazer as corridas' }) };
}
function dueloResultado(res, outro, placar, apostaTxt) {
  const tit = res === 'venceu' ? 'Você venceu o duelo!' : res === 'perdeu' ? 'Não foi dessa vez' : 'O duelo empatou';
  const corpo = res === 'venceu' ? p('Você venceu <b>' + esc(outro) + '</b> por <b>' + placar + '</b> e levou <b>' + esc(apostaTxt) + '</b>.')
    : res === 'perdeu' ? p('<b>' + esc(outro) + '</b> venceu o duelo por <b>' + placar + '</b> e levou <b>' + esc(apostaTxt) + '</b>.') + p('Que tal uma revanche?')
    : p('Você e <b>' + esc(outro) + '</b> empataram. Cada um recebeu a própria aposta de volta.');
  return { assunto: res === 'venceu' ? 'Você venceu o duelo com ' + outro : res === 'perdeu' ? outro + ' venceu o duelo' : 'Seu duelo com ' + outro + ' empatou', html: moldura(tit, corpo + p('O resumo completo está em Garagem › Duelos.'), { href: LINK, txt: 'Ver o resumo' }) };
}
function carroVendido(carro, preco, comprador) {
  const corpo = p('O <b>' + esc(carro) + '</b> que você anunciou no Mercado foi comprado por <b>' + esc(comprador) + '</b>.') +
    p('Os <b>' + preco + ' créditos</b> já estão na sua carteira.');
  return { assunto: 'Você vendeu o ' + carro, html: moldura('Carro vendido!', corpo, { href: LINK, txt: 'Ver a carteira' }) };
}
function rodadaAberta(nome, n, temporada, fimTxt, total) {
  const corpo = p('Oi, ' + esc(nome) + '! A <b>Rodada ' + n + (total ? ' de ' + total : '') + '</b> da ' + esc(temporada) + ' começou.') +
    (n === 1 ? p('É a largada da temporada: os pontos começam do zero para todo mundo.') : '') +
    '<ul style="margin:0 0 12px;padding-left:20px;color:#14235E">' + li('<b>Quiz</b>: 10 perguntas novas.') + li('<b>Corrida valendo</b>: 3 tentativas, vale a melhor.') + '</ul>' +
    p('A rodada fecha ' + esc(fimTxt) + '.');
  return { assunto: 'Rodada ' + n + ' aberta no Game Aura', html: moldura('Rodada ' + n + ' no ar', corpo, { href: LINK, txt: 'Jogar a rodada' }) };
}
function lembrete(nome, n) {
  const corpo = p('Oi, ' + esc(nome) + '! A <b>Rodada ' + n + '</b> fecha <b>hoje às 23h59</b> e você ainda não jogou.') +
    p('São uns 5 minutos: 10 perguntas e a corrida. Cada rodada conta para o ranking da temporada e para a sua área.');
  return { assunto: 'A Rodada ' + n + ' fecha hoje', html: moldura('Última chance nesta rodada', corpo, { href: LINK, txt: 'Jogar agora' }) };
}
function lancamentos(carros, mesTxt) {
  const lista = '<ul style="margin:0 0 12px;padding-left:20px;color:#14235E">' + carros.map((c) => li('<b>' + esc(c.nome) + '</b> · ' + esc(c.tipo) + ' · ' + c.preco + ' créditos')).join('') + '</ul>';
  const corpo = p('Chegaram ' + carros.length + ' carros novos ao showroom da Garagem em ' + esc(mesTxt) + ':') + lista + p('Os créditos vêm da rodada, do treino, do Placa! e dos duelos.');
  return { assunto: 'Lançamentos de ' + mesTxt + ' na Garagem', html: moldura('Lançamentos do mês', corpo, { href: LINK, txt: 'Ver o showroom' }) };
}
function fimTemporada(nome, temporada, top, minha, premio) {
  const lista = '<ol style="margin:0 0 12px;padding-left:22px;color:#14235E">' + top.map((t) => li('<b>' + esc(t.nome) + '</b> · ' + t.pts + ' pts')).join('') + '</ol>';
  const corpo = p('Oi, ' + esc(nome) + '! A <b>' + esc(temporada) + '</b> terminou. O pódio final:') + lista +
    (minha ? p('Você terminou em <b>' + minha.pos + 'º lugar</b>, com ' + minha.pts + ' pontos.') : '') +
    (premio ? p('Os 5 primeiros ganham brinde: a organização do jogo vai entrar em contato.') : '') +
    p('Seus carros e créditos continuam com você para a próxima temporada.');
  return { assunto: temporada + ': o resultado final', html: moldura(esc(temporada) + ' encerrada', corpo, { href: LINK, txt: 'Ver o ranking final' }) };
}
async function enviar(para, msg) {
  const t = transporte();
  if (!t || !para || !/@/.test(para)) return false;
  try { await t.sendMail({ from: '"Game Aura" <' + REMETENTE + '>', to: para, subject: msg.assunto, html: msg.html }); return true; }
  catch (e) { console.error('email', para, e && e.message); return false; }
}
module.exports = { enviar, boasVindas, desafio, contraproposta, dueloAceito, dueloPrazo, dueloResultado, carroVendido, rodadaAberta, lembrete, lancamentos, fimTemporada, moldura };
