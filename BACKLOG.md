# Backlog do Game Aura

Melhorias anotadas para fazer juntas no próximo pacote.

## Pendentes

1. **Canal de sugestões, melhorias e problemas**
   - Botão no app (Perfil ou Regras) para enviar sugestão, melhoria ou problema, com tipo, texto e opcionalmente a tela onde aconteceu.
   - Envio pela Function (gravando quem enviou, versão do app e aparelho); leitura e status (novo, em análise, feito) na área de administração.

2. **Foto obrigatória no cadastro**
   - O objetivo é interação: todo jogador precisa ter foto.
   - Quem entra com Google usa a foto da conta; quem não tem foto (ou entrou com e-mail e senha) precisa enviar uma antes de concluir o cadastro.
   - Quem já está cadastrado sem foto recebe um aviso para colocar foto antes de jogar.
   - Não deixar remover a foto sem colocar outra.

3. **Retomados Itaú e Porto**
   - A aba Retomados (hoje só "Retomados Porto") passa a ter carros de origem Itaú (retomada de financiamento) e Porto (recuperados do seguro).
   - Cada carro do lote mostra a origem com selo próprio (Itaú ou Porto); textos, confirmação de compra, histórico de transações e Preço Aura passam a citar a origem certa.
   - O Mercado entre colegas (usados de PF) continua como está.

4. **Multas (proposta, a validar)**
   - Na corrida: pórtico de *free flow* atravessando a pista. Passar sem TAG gera multa por evasão de pedágio; com TAG, a passagem é cobrada normalmente e não tem multa. Outras fontes possíveis: radar em trecho de velocidade, faixa exclusiva de ônibus.
   - A multa não muda o tempo nem os pontos do ranking; vale só na Garagem, em créditos.
   - Fica em "Multas pendentes" com vencimento (ex.: 7 dias). Pagou antes do vencimento, tem desconto (ex.: 20%); venceu, o valor sobe.
   - Carro com multa pendente não pode ser anunciado no Mercado até quitar (como na transferência real de veículo).
   - Histórico das multas pagas entra nas transações.

5. **Mais carros detalhados (no nível do cyberpunk e do conceito)**
   - Trocar a ideia de carros genéricos por modelos 3D detalhados: ex. esportivo, SUV premium, picape, elétrico, clássico, hatch moderno.
   - Origem: modelos com licença livre (CC0 ou CC-BY, com crédito ao autor), como os dois atuais, que vieram do Sketchfab. O download exige login, então o Tarcísio baixa os .glb escolhidos e eu otimizo, gero foto e visão de cima e encaixo no catálogo.
   - Cada carro novo ganha preço e atributos (faixa, pneu, seguro) no catálogo da Garagem.

## Feito recentemente

- 2026-11-20b: carro vira de frente para a faixa de destino; não troca de faixa parado no CAP ou no pedágio.
- 2026-11-20a: compartilhar imagem (foto do Google com CORS; share direto no toque no iPhone).
- 2026-11-13g: reta final após 2 min, TAG cumulativa (até 3), CAP dos dois lados, treino sem limite de 600 s.
- Deploy automático das Functions e regras pelo GitHub Actions.
