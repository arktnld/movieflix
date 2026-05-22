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

### Fase 4 — Refinamento Visual (Agent Teams)
Crie agent team com 3 teammates para polish profissional:

1. **teammate "animator"** — Animações e transições:
   - Page transitions suaves entre rotas (fade in/out)
   - Skeleton loading animado (shimmer effect) em vez de spinner simples
   - Cards com animação staggered ao carregar (aparecem um por um)
   - Hover effects sofisticados nos cards (scale + glow + shadow)
   - Hero banner com parallax sutil no scroll
   - Smooth scroll automático ao navegar
   - Animação de entrada no modal/detalhe do filme
   - Transição suave no search input (expand on focus)
   - Todas animações respeitam prefers-reduced-motion

2. **teammate "ux-polish"** — UX e navegação profissional:
   - Footer com créditos TMDB (obrigatório pela API), links, copyright
   - Scroll-to-top button com fade in/out
   - Navbar que esconde no scroll down e reaparece no scroll up
   - Infinite scroll ou pagination nos carrosséis
   - Lazy loading de imagens com IntersectionObserver
   - Breadcrumb visual na página de detalhe
   - Keyboard navigation (Enter na busca, Escape fecha detalhe)
   - Toast/snackbar pra erros em vez de bloco estático
   - Indicador visual de carregamento na navbar durante fetches
   - Favicon e meta tags OG (Open Graph)
   - Quando terminar: manda mensagem pro animator com lista de elementos novos

3. **teammate "visual-polish"** — Design premium:
   - Tipografia refinada (Google Fonts — Inter ou Poppins)
   - Gradient overlays mais cinematográficos no hero e backdrop
   - Rating com stars visuais (não só emoji)
   - Badge "Novo" ou "Em alta" nos filmes trending
   - Melhoria no color scheme — accent colors mais sofisticados
   - Box shadows com depth layers (elevation system)
   - Micro-interações (botões, inputs, links)
   - Empty states bonitos (busca sem resultado, erro de conexão)
   - Consistência de spacing (8px grid system)
   - Dark mode polido com contraste WCAG AA

### Fase 5 — Segurança (Agent Teams)
Crie agent team com 2 teammates para hardening:

1. **teammate "sec-backend"** — Segurança do servidor:
   - Rate limiting nos endpoints (express-rate-limit ou manual)
   - Helmet.js headers (X-Content-Type-Options, X-Frame-Options, CSP, HSTS)
   - Validação e sanitização rigorosa de todos query params
   - Prevenir path traversal no movie/:id
   - CORS configurado corretamente
   - Timeout nas chamadas pra TMDB (evitar hang)
   - Error handling que não vaza stack traces pro client
   - Audit de dependências (npm audit)

2. **teammate "sec-frontend"** — Segurança do frontend:
   - Audit completo de escapeHtml() — garantir 100% cobertura
   - CSP-compatible: sem inline styles/scripts onde possível
   - Sanitizar URLs de imagem antes de renderizar
   - Validar dados recebidos da API antes de renderizar
   - Prevenir open redirect em hash routing
   - Subresource Integrity em resources externos (Google Fonts)
   - Remover console.log em produção ou guard com flag

### Fase 6 — Testes Completos (Agent Teams)
Crie agent team com 2 teammates para cobertura total:

1. **teammate "test-api"** — Testes de API expandidos:
   - Teste de rate limiting (se implementado)
   - Teste de headers de segurança
   - Teste de timeout handling
   - Teste de caracteres especiais no search (SQL injection patterns, XSS payloads)
   - Teste de IDs com valores extremos (0, -1, MAX_INT)
   - Teste de pagination params
   - Teste de concurrent requests
   - Teste de CORS headers

2. **teammate "test-frontend"** — Testes de integração:
   - Criar test/frontend.test.js usando node:test
   - Testar que HTML estático serve corretamente
   - Testar que app.js carrega sem erro
   - Testar que style.css serve corretamente
   - Testar Content-Type headers dos static files
   - Testar 404 para rotas inexistentes

### Fase 7 — Usabilidade e Visuais Finais (Agent Teams)
Crie agent team com 2 teammates para toque final:

1. **teammate "accessibility"** — Acessibilidade completa:
   - ARIA labels em todos elementos interativos
   - Focus management na navegação SPA
   - Skip-to-content link
   - Alt text descritivo em todas imagens
   - Roles corretos (navigation, main, complementary)
   - Focus visible styles customizados (outline bonito)
   - Screen reader announcements em route changes (aria-live region)
   - Tab order lógico em toda página

2. **teammate "final-touches"** — Toques finais profissionais:
   - 404 page bonita para rotas hash inválidas
   - Offline detection com mensagem amigável
   - Performance: preconnect para TMDB image CDN
   - Meta description dinâmica por página
   - Print stylesheet básico
   - Seleção de texto estilizada (::selection)
   - Scrollbar customizada no dark theme
   - Placeholder animado no search quando idle

### Fase 8 — Novas Funcionalidades API + Visuais (Agent Teams)
Crie agent team com 3 teammates para expandir features:

1. **teammate "api-expand"** — Novos endpoints proxy no backend:
   - GET /api/genres → /genre/movie/list?language=pt-BR (lista de generos)
   - GET /api/discover?genre=X → /discover/movie?with_genres=X&language=pt-BR (filmes por genero)
   - GET /api/upcoming → /movie/upcoming?language=pt-BR (proximos lancamentos)
   - GET /api/now-playing → /movie/now_playing?language=pt-BR (em cartaz)
   - GET /api/movie/:id/similar → /movie/{id}/similar?language=pt-BR (filmes similares)
   - GET /api/movie/:id/reviews → /movie/{id}/reviews?language=pt-BR (reviews)
   - Validacao e error handling em todos novos endpoints
   - Quando terminar: manda mensagem pro feature-ui com contrato dos novos endpoints

2. **teammate "feature-ui"** — ESPERA mensagem do api-expand. Novos visuais no frontend:
   - Navegacao por generos: grid/lista de generos na home ou sidebar
   - Pagina de genero: #/genre/{id} com grid de filmes filtrados
   - Secao "Em Cartaz" e "Proximos Lancamentos" na home com carrosseis
   - Filmes similares na pagina de detalhe (carrossel horizontal)
   - Reviews de usuarios na pagina de detalhe (cards com nota e texto)
   - Paginacao real (botoes prev/next ou infinite scroll) nos grids
   - Filtros visuais (ordenar por nota, data, popularidade)

3. **teammate "feature-test"** — ESPERA api-expand e feature-ui. Testes dos novos endpoints:
   - Testa todos novos endpoints (genres, discover, upcoming, now-playing, similar, reviews)
   - Testa discover com genre invalido
   - Testa similar/reviews com movie id invalido
   - Roda npm test e garante verde

### Fase 9 — Identidade Visual Unificada (Agent Teams)
Crie agent team com 2 teammates para solidificar brand:

1. **teammate "brand-system"** — Design system coeso:
   - Design tokens centralizados: cores, spacing, typography, shadows, borders, transitions
   - Todos em CSS custom properties organizadas por categoria
   - Paleta de cores definitiva: primary, secondary, accent, success, warning, error, neutral (5 shades cada)
   - Escala tipografica consistente: display, h1-h4, body, caption, overline
   - Componentes visuais padronizados: buttons (primary, secondary, ghost), cards, badges, tags, inputs
   - Icon system consistente (usar um set — Lucide icons via SVG inline ou emoji set definido)
   - Border radius system (sm, md, lg, full)
   - Motion tokens (duration, easing curves padronizadas)
   - Documentar design tokens em comentarios no CSS

2. **teammate "brand-apply"** — Aplicar identidade em todo site:
   - Garantir que TODA pagina usa os design tokens (zero valores hardcoded)
   - Navbar, footer, cards, detail page — tudo consistente
   - Transicoes e animacoes usando motion tokens
   - Hierarquia visual clara: o que eh primario, secundario, terciario
   - Espacamento consistente entre secoes (rhythm vertical)
   - Logo/branding refinado (tipografia do logo, posicionamento)
   - Color consistency: mesmo accent em hover, focus, active states
   - Audit visual: screenshot mental de cada pagina, garantir harmonia
   - Remover qualquer estilo orfao ou duplicado no CSS

### Fase 10 — Carrossel de Filmes na Home (Agent Teams)
Crie agent team com 2 teammates para carrossel profissional:

1. **teammate "carousel-engine"** — Carrossel interativo real:
   - Carrossel horizontal com scroll snap (CSS scroll-snap-type)
   - Botoes de navegacao (seta esquerda/direita) nos lados do carrossel
   - Indicadores de posicao (dots) abaixo do carrossel
   - Auto-play no hero carousel (troca a cada 5s, pausa no hover)
   - Swipe/drag support pra mobile (touch events)
   - Smooth scroll entre items
   - Mostrar parcialmente o proximo card (peek effect)
   - Cada secao da home (trending, popular, top-rated) vira carrossel real
   - Hero banner vira slideshow dos top 5 trending (com fade transition)
   - Lazy loading dos items fora da viewport

2. **teammate "carousel-style"** — Visual do carrossel:
   - Setas estilizadas (semi-transparentes, aparecem no hover da secao)
   - Gradient fade nas bordas do carrossel (indica mais conteudo)
   - Dots indicators minimalistas
   - Responsivo: scroll livre no mobile, setas no desktop
   - Animacao suave de entrada dos cards ao scrollar
   - Hero slideshow com counter (1/5, 2/5...)
   - Transicao cinematografica entre slides do hero

### Fase 11 — Top Filmes e Series (Agent Teams)
Crie agent team com 3 teammates para expandir pra series:

1. **teammate "api-series"** — Novos endpoints de series no backend:
   - GET /api/tv/trending → /trending/tv/week?language=pt-BR
   - GET /api/tv/popular → /tv/popular?language=pt-BR
   - GET /api/tv/top-rated → /tv/top_rated?language=pt-BR
   - GET /api/tv/:id → /tv/{id}?append_to_response=credits,videos&language=pt-BR
   - GET /api/tv/search?q= → /search/tv?query={q}&language=pt-BR
   - GET /api/top-list → endpoint custom que combina top movies + top TV ordenado por nota
   - Validacao e error handling em todos endpoints
   - Quando terminar: manda mensagem pro ui-series

2. **teammate "ui-series"** — ESPERA mensagem do api-series. Interface de series:
   - Tab/toggle na home: "Filmes" | "Series" (alterna conteudo)
   - Pagina de detalhe de serie (#/tv/{id}): poster, backdrop, sinopse, nota, temporadas, elenco, trailer
   - Busca unificada: retorna filmes E series com badge indicando tipo
   - Pagina "Top Lista" (#/top): ranking combinado filmes+series com posicao numerada
   - Cards de serie com badge "Serie" visual
   - Adaptar routing hash pra suportar #/tv/{id} e #/top

3. **teammate "test-series"** — ESPERA os outros. Testes completos:
   - Testa todos endpoints de series (trending, popular, top-rated, detail, search)
   - Testa top-list endpoint
   - Testa serie com id invalido → 400
   - Testa busca de series
   - Roda npm test e garante verde

### Fase 12 — Novas Paginas TMDB (Agent Teams)
Crie agent team com 3 teammates para paginas extras:

1. **teammate "api-pages"** — Novos endpoints no backend:
   - GET /api/people/popular → /person/popular?language=pt-BR (pessoas populares)
   - GET /api/person/:id → /person/{id}?append_to_response=movie_credits,tv_credits&language=pt-BR (detalhe pessoa)
   - GET /api/trending/day → /trending/all/day?language=pt-BR (trending diario)
   - GET /api/movie/:id/collection → busca collection_id do filme, depois /collection/{id}?language=pt-BR
   - Validacao e error handling em todos endpoints
   - Quando terminar: manda mensagem pro ui-pages

2. **teammate "ui-pages"** — ESPERA api-pages. Novas paginas no frontend:
   - Pagina Pessoas Populares (#/people): grid de atores/diretores com foto, nome, filmes conhecidos
   - Pagina Detalhe Pessoa (#/person/{id}): foto, bio, filmografia (filmes + series separados)
   - Pagina Trending Hoje (#/trending/day): grid com filmes+series do dia, badge tipo
   - Pagina Colecao (#/collection/{id}): lista de filmes da saga/franquia ordenados por data
   - Links de navegacao: adicionar "Pessoas" e "Trending Hoje" na home ou navbar
   - Clicar em ator na pagina de detalhe do filme leva pra #/person/{id}

3. **teammate "test-pages"** — ESPERA os outros. Testes:
   - Testa todos novos endpoints
   - Testa person com id invalido
   - Roda npm test e garante verde

### Fase 13 — Remover Vicios de IA (Agent Teams)
Crie agent team com 2 teammates para profissionalizar:

1. **teammate "anti-ai-visual"** — Remove padroes visuais genericos de IA:
   - Substituir emojis por SVG icons inline (film reel, star, search, arrow, etc)
   - Paleta de cores mais cinematografica e unica (nao vermelho generico)
   - Gradientes mais sutis e organicos (nao linear-gradient obvio)
   - Tipografia com mais carater (avaliar alternativas a Inter/Poppins)
   - Layout menos perfeitamente simetrico — mais editorial/magazine
   - Espacamento com mais variacao (nao tudo com mesmo gap)
   - Reduzir animacoes (menos pulse, menos bounce — mais fade sutil)
   - Cards com design mais unico (nao so retangulo com sombra)
   - Hero com layout mais criativo (texto sobreposto, recortes)

2. **teammate "anti-ai-copy"** — Remove padroes de texto de IA:
   - Micro-copias mais naturais em pt-BR (nao traducao literal)
   - Mensagens de erro com personalidade (nao generico "Erro interno")
   - Loading states com mensagens variadas (nao sempre "Carregando...")
   - Empty states com humor sutil
   - Textos de interface revisados por naturalidade
   - Remover excesso de feedback visual (nem tudo precisa toast)
   - Footer com texto mais humano
   - 404 page com personalidade

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
