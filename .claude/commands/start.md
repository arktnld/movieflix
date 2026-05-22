---
description: Inicia projeto completo — Agent Teams constroem, loops monitoram. Roda tudo autônomo.
---

Executa em sequência:

## 1. Agent Teams — Construir app

Crie agent team com 3 teammates em worktree isolada:

### teammate "backend"
- npm install (express, dotenv)
- Cria server.js: Express proxy TMDB API (endpoints no CLAUDE.md)
- dotenv pra TMDB_TOKEN do .env
- express.static('public')
- Validação de params, error handling
- Quando terminar: manda mensagem pro teammate "frontend" com contrato da API finalizado (rotas, formato resposta)

### teammate "frontend"
- ESPERA mensagem do backend com contrato
- Cria public/index.html: SPA shell
- Cria public/style.css: dark cinema theme completo, responsivo, animações
- Cria public/app.js: hash routing, fetch proxy API, render completo (home, busca, detalhe)
- Segue specs do CLAUDE.md

### teammate "tester"
- ESPERA backend e frontend terminarem
- Cria test/api.test.js: testa todos endpoints, edge cases, erros
- Roda npm test e garante TODOS passando

## 2. Ralph Loop — Iterar até verde

Depois que Agent Teams terminar, roda:
/ralph-loop "Roda npm test. Se falhar, lê erro, corrige código, roda de novo. Repete até TODOS passarem. Quando verde, diz DONE." --completion-promise "DONE" --max-iterations 10

## 3. Loops — Monitoramento contínuo

Depois que ralph loop terminar, ativa:
- /loop 5m /check-tests
- /loop 10m /telegram-feedback
- /loop 5m /babysit
