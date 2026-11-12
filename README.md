# Game Aura

Jogo interno de integração: **quiz + corrida** toda semana, com ranking individual, por área e conquistas para compartilhar.

- `index.html`: o app inteiro (GitHub Pages). Sem configuração, abre em **modo demonstração**, com dados fictícios salvos só no navegador.
- `functions/`: Cloud Functions que corrigem o quiz, validam a corrida e controlam as mesas do Placa! (monte e mãos ficam no servidor). O gabarito nunca vai para o navegador do jogador.
- `firestore.rules`: regras de segurança.
- `.github/workflows/deploy-rules.yml`: publica as regras sozinho a cada envio (mesmo padrão do Fute da Firma).
- `src/` + `build.py`: código-fonte em partes. O `index.html` é gerado com `python3 build.py`.

## Colocar no ar (passo a passo)

### 1. GitHub
1. Crie o repositório (ex.: `game-aura`) e suba todos os arquivos desta pasta.
2. Em **Settings → Pages**, publique a branch `main` (pasta raiz).
3. Abra o endereço do Pages: o app já funciona em modo demonstração.

### 2. Firebase
1. Crie o projeto no console do Firebase e ative o plano **Blaze** (as Functions exigem; no volume do jogo o custo esperado é R$ 0).
2. **Firestore Database** → criar banco em `southamerica-east1` (São Paulo), modo produção.
3. **Authentication** → ativar **Google** e **E-mail/senha**. Em *Settings → Authorized domains*, adicione o domínio do GitHub Pages (`<seu-usuario>.github.io`).
4. **Configurações do projeto → Seus apps → Web**: registre um app e copie o `firebaseConfig`.
5. Cole o `firebaseConfig` no topo do `index.html` (bloco `FIREBASE_CONFIG`) e também em `src/a1-base.js`, se for gerar o app de novo.
6. Troque `COLE-AQUI-O-ID-DO-PROJETO` no arquivo `.firebaserc` pelo ID do projeto.

### 3. Functions e regras (Google Cloud Shell)
```bash
git clone https://github.com/tgbhubs/game-aura.git
cd game-aura/functions && npm install && cd ..
npx -y firebase-tools@latest deploy --only functions,firestore:rules
```
Depois disso, as regras passam a ser publicadas pelo GitHub Actions: crie o secret `FIREBASE_SERVICE_ACCOUNT` com a chave da conta de serviço (papéis **Administrador do Firebase** e **Consumidor do Service Usage**), como no Fute.

### 4. Primeiro acesso
1. **Você entra primeiro**: a primeira conta criada vira **Master** automaticamente.
2. Administração → **Perguntas** → *Importar planilha revisada* (só entram as linhas **Aprovada**) ou *Importar banco inicial*.
3. Administração → **Temporada** → *Criar temporada* (defina o código de acesso) → *Montar as rodadas*.
4. Divulgue o link e o código para o time.

## Como o jogo protege o resultado
- As perguntas são entregues uma a uma pelo servidor, que marca o tempo; o navegador nunca recebe a resposta certa antes de responder.
- A corrida usa a mesma pista para todos na rodada (semente fixa) e o servidor recusa tempo maior que o tempo real decorrido. Tempos acima de 10 min ficam marcados para revisão e o Adm pode anular.
- Resultados (`quiz`, `corrida`, `placar`) só são gravados pelas Functions; cada pessoa só lê o próprio quiz e as próprias tentativas.

## Alterar o app
Edite os arquivos em `src/` e rode `python3 build.py` para gerar o `index.html`. A lógica de jogo fica em `functions/logica.js` e o motor do Placa! em `functions/placa.js`; os dois são usados pelas Functions e copiados para dentro do app pelo build. Regras do Placa!: `docs/placa-regras.md`.
