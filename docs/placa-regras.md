# Placa! — Regras (v1.0)

Jogo de cartas online do Game Aura. Mesa de 2 a 6 pessoas, partidas rápidas, uma mão por partida.

## 1. Baralho (108 cartas)

**4 cores:** Laranja, Azul, Verde e Vermelho.

| Carta | Por cor | Total | O que faz |
|---|---|---|---|
| 0 | 1 | 4 | Número |
| 1 a 9 | 2 de cada | 72 | Número |
| **Pedágio** | 2 | 8 | O próximo jogador perde a vez |
| **Retorno** | 2 | 8 | Inverte o sentido do jogo (com 2 jogadores, funciona como Pedágio) |
| **Guincho +2** | 2 | 8 | O próximo compra 2 e perde a vez (pode acumular, ver item 4) |
| **Seguro** (curinga) | — | 4 | Quem joga escolhe a cor |
| **Seguro Total +4** (curinga) | — | 4 | Escolhe a cor; o próximo compra 4 e perde a vez |

## 2. Preparação

- Cada pessoa recebe **7 cartas** (os 7 caracteres da placa Mercosul).
- A primeira carta do monte vira na mesa. Se for especial, o efeito vale para o primeiro jogador; se for curinga, volta para o monte e vira outra.
- Quem começa é sorteado. O sentido inicial é horário.

## 3. Na sua vez

1. Jogue **uma** carta que combine com a da mesa: mesma **cor**, mesmo **número** ou mesmo **símbolo** (Pedágio com Pedágio, por exemplo).
2. Os curingas (Seguro e Seguro Total +4) podem ser jogados sobre qualquer carta.
3. Sem jogada possível (ou se preferir), **compre 1 carta**. Se ela servir, pode jogá-la na hora; se não, a vez passa.
4. Quando o monte acaba, as cartas da mesa (menos a de cima) são embaralhadas e viram o novo monte.

## 4. Guincho acumulado

- Quem recebe um **Guincho +2** pode responder com outro **Guincho +2** (de qualquer cor). A conta passa adiante somada: +4, +6, +8…
- Quem não tiver (ou não quiser jogar) um Guincho **compra tudo o que acumulou** e perde a vez.
- O **Seguro Total +4** não entra na soma: quem recebe compra 4 e perde a vez.

## 5. O grito: "Placa!"

- Ao jogar a **penúltima** carta, toque em **"Placa!"** (o botão aparece na hora).
- Se você ficar com 1 carta sem ter gritado, qualquer outro jogador pode tocar em **"Multa!"** até a próxima jogada acontecer. Você compra **2 cartas**.
- Depois que o próximo jogador joga, a multa não vale mais.

## 6. Fim da partida

- Vence quem **zerar as cartas** primeiro. Uma mão = uma partida.
- A última carta pode ser especial ou curinga; o efeito é aplicado normalmente, mas a partida já termina.

## 7. Ranking e conquistas (separados do quiz e da corrida)

- **Ranking do Placa!:** vitórias na temporada, com desempate pela taxa de vitória (vitórias ÷ partidas). Só entra quem jogou pelo menos 5 partidas.
- **Conquistas sugeridas:**
  - 🪪 **Primeira Placa:** primeira vitória
  - 🔥 **Sequência:** 3 vitórias seguidas
  - 🚛 **Guincheiro:** fez alguém comprar 8 ou mais com Guincho acumulado
  - 🛡️ **Segurado:** venceu jogando um Seguro como última carta
  - 👮 **Fiscal:** aplicou 5 multas de "Placa!"

## 8. Mesa online (mesma dinâmica do Buraco)

- Qualquer jogador aprovado cria uma mesa e escolhe o número de lugares (2 a 6). Os outros entram nos lugares livres.
- **Sem limite de tempo** por jogada.
- **Pausa:** qualquer jogador pode pausar; o jogo volta quando ele retomar.
- **Encerrar antes:** só com o aceite de todos da mesa. Partida encerrada assim não conta no ranking.
- Jogar e comprar **tocando na carta**, com sons e animações; a tela não rola no celular.
- Se alguém sair do app, a mesa espera. Depois de 10 minutos sem jogar, os outros podem votar para remover a pessoa; as cartas dela voltam para o monte.

## 9. Decisões validadas (12/11/2026)

- Remoção de quem fica 10 minutos sem jogar na própria vez: aprovada. Precisa da maioria dos outros jogadores da mesa.
- Conquistas do item 7: aprovadas como estão.

## 10. Detalhes de implementação

- A mesa abre com 2 a 6 lugares e começa sozinha quando lota; quem criou pode começar antes, com pelo menos 2 pessoas. Os lugares são sorteados.
- "Placa!" pode ser gritado antes (com 2 cartas, na sua vez) ou logo depois de ficar com 1 carta, enquanto ninguém multou.
- Depois de comprar 1 carta que serve, você pode jogá-la ou passar.
- Pausa: só quem pausou retoma; depois de 10 minutos, qualquer um retoma.
- Ao fim, "Revanche" abre uma mesa nova com o mesmo número de lugares.
- Toda jogada é validada no servidor; ninguém vê a mão dos outros nem o monte.
