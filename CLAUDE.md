# MovieFlix — Site de Filmes TMDB

## O que é
Site de filmes usando TMDB API. Dark cinema theme. Express backend proxy + Vanilla JS SPA.

## Stack
- Node.js + Express + dotenv
- Vanilla JS (ZERO frameworks)
- TMDB API v3
- Testes: node:test

## TMDB API
Token em `.env` (TMDB_TOKEN). NUNCA expor no frontend — backend proxy todas chamadas.

Base: `https://api.themoviedb.org/3`
Imagens: `https://image.tmdb.org/t/p/w500{poster_path}`
Auth header: `Authorization: Bearer ${TMDB_TOKEN}`

### Endpoints proxy (server.js → TMDB)

| Route local | TMDB endpoint | Descrição |
|-------------|--------------|-----------|
| GET /api/trending | /trending/movie/week?language=pt-BR | Trending semana |
| GET /api/popular | /movie/popular?language=pt-BR | Populares |
| GET /api/top-rated | /movie/top_rated?language=pt-BR | Top avaliados |
| GET /api/search?q= | /search/movie?query={q}&language=pt-BR | Busca título |
| GET /api/movie/:id | /movie/{id}?append_to_response=credits,videos&language=pt-BR | Detalhes+elenco+trailer |

## Estrutura
```
movieflix/
├── CLAUDE.md
├── .env              ← TMDB_TOKEN (gitignored)
├── .gitignore
├── package.json
├── server.js         ← Express proxy TMDB + serve static
├── public/
│   ├── index.html    ← SPA shell
│   ├── style.css     ← Dark cinema theme
│   └── app.js        ← Client routing, fetch, UI
└── test/
    └── api.test.js   ← Testes node:test
```

## Frontend specs
- **Home**: hero banner (trending[0] como backdrop), carrosséis (popular, top_rated, trending)
- **Busca**: input no nav com debounce 300ms, grid de resultados
- **Detalhe filme**: poster, backdrop, sinopse, nota (⭐), gêneros, elenco top 10, trailer YouTube embed
- **Routing**: hash-based (#/, #/search/{query}, #/movie/{id})
- **Responsivo**: mobile-first, grid adapta de 2→4→6 colunas
- **Imagens**: fallback cinza se poster_path null
- **Loading**: skeleton/spinner em toda fetch
- **Erro**: mensagem visível pro usuário
- **XSS**: escapeHtml() em todo texto dinâmico
- **Idioma**: interface em pt-BR

## Regras obrigatórias
- Sem React/Vue/Svelte. Vanilla JS only
- Token TMDB SÓ no backend
- escapeHtml() em todo conteúdo dinâmico
- Error handling em todo fetch (try/catch + status check)
- Conventional commits (feat:, fix:, test:)
- Um commit por unidade lógica
- Não commitar .env

## Ao abrir este projeto, faça:

### Fase 1 — Construir (Agent Teams)
Crie agent team com 3 teammates em worktree:

1. **teammate "backend"** — Cria server.js:
   - Express proxy todos endpoints TMDB listados acima
   - dotenv pra TMDB_TOKEN
   - express.static('public')
   - Error handling, validação de params
   - Quando terminar: manda mensagem pro frontend com contrato finalizado

2. **teammate "frontend"** — ESPERA mensagem do backend. Cria public/:
   - index.html (SPA shell)
   - style.css (dark cinema theme completo, responsivo)
   - app.js (routing hash, fetch proxy API, render UI completo)
   - Segue specs do Frontend acima

3. **teammate "tester"** — ESPERA backend e frontend. Cria test/:
   - Testa todos endpoints proxy (trending, popular, top-rated, search, movie/:id)
   - Testa search query vazia → 400
   - Testa movie id inválido → 400
   - Testa movie id inexistente → resposta TMDB
   - Roda npm test e garante verde

### Fase 2 — Iterar (Ralph Loop)
Depois que teammates terminarem:
- Roda ralph-loop: testa, se falhar corrige, repete até verde

### Fase 3 — Monitorar (Loops)
- /loop 5m /check-tests — testa e auto-corrige
- /loop 5m /babysit — monitora PRs, auto-rebase, fix CI

## Telegram — Processar feedback em tempo real

Quando mensagem Telegram chegar (tag `<channel source="plugin:telegram:telegram">`), processa IMEDIATAMENTE:

1. Lê texto da mensagem
2. Categoriza:
   - Contém "bug"/"erro"/"quebrou"/"falhou" → Bug report
   - Contém "quero"/"precisava"/"adiciona"/"feature" → Feature request
   - Contém "status"/"testes"/"rodou" → Status check
   - Contém "?" → Pergunta
3. Age:
   - Bug → `gh issue create --title "Bug: {resumo}" --body "{msg}"` → responde no Telegram "Issue criada: {url}"
   - Feature → `gh issue create --title "Feature: {resumo}" --body "{msg}" --label enhancement` → responde no Telegram
   - Status → roda `npm test 2>&1` → responde resultado no Telegram
   - Pergunta → responde no Telegram com resposta útil baseada neste CLAUDE.md
   - Outro → responde normalmente no Telegram
4. Usa tool `mcp__plugin_telegram_telegram__reply` com chat_id da mensagem
5. SEMPRE responde no Telegram. NUNCA ignora mensagem.
