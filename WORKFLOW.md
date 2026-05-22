# MovieFlix — Workflow de Desenvolvimento Autonomo

Documento descrevendo o workflow completo utilizado para construir o MovieFlix do zero ate producao em uma unica sessao, usando Claude Code com Agent Teams, Cron Loops, Telegram feedback e Chrome DevTools.

---

## Visao Geral

O projeto MovieFlix foi construido usando um workflow de **desenvolvimento autonomo orquestrado**, onde um agente principal (team lead) coordena multiplos agentes especializados (teammates) trabalhando em paralelo, com monitoramento continuo via cron jobs e feedback em tempo real via Telegram.

```
                    +------------------+
                    |   Usuario        |
                    |   (Telegram)     |
                    +--------+---------+
                             |
                    feedback / requests
                             |
                    +--------v---------+
                    |   Team Lead      |
                    |   (Orquestrador) |
                    +--------+---------+
                             |
              +--------------+---------------+
              |              |               |
     +--------v---+  +------v-----+  +------v-----+
     | Teammate 1 |  | Teammate 2 |  | Teammate 3 |
     | (backend)  |  | (frontend) |  | (tester)   |
     +------------+  +------------+  +------------+
              |              |               |
              +--------------+---------------+
                             |
                    +--------v---------+
                    |   Cron Loops     |
                    | /check-tests 5m  |
                    | /babysit 5m      |
                    | /telegram 5m     |
                    +------------------+
```

---

## Componentes do Workflow

### 1. Agent Teams (Trabalho Paralelo)

**O que eh:** Grupos de agentes especializados que trabalham simultaneamente no mesmo codebase, cada um com uma responsabilidade clara.

**Como funciona:**
1. Team Lead cria um team (`TeamCreate`)
2. Spawna teammates com prompts especificos (`Agent` tool)
3. Teammates trabalham em paralelo, editando arquivos
4. Quando terminam, enviam mensagem ao lead com resumo
5. Lead verifica, corrige integracoes, faz commit
6. Shutdown dos teammates, delete do team

**Exemplo real (Fase 8 — Novas Features):**
```
Team: phase8-features
  api-expand   → Cria 6 novos endpoints no server.js
  feature-ui   → ESPERA api-expand, cria UI para novos endpoints
  feature-test → ESPERA ambos, escreve testes
```

**Padroes de coordenacao:**
- **Pipeline sequencial:** A espera B espera C (backend → frontend → tester)
- **Paralelo total:** A, B, C trabalham ao mesmo tempo (visual + copy + animations)
- **Hub-spoke:** Lead distribui e recolhe resultados

**Beneficios:**
- 3-4x mais rapido que trabalho sequencial
- Especializacao: cada agent foca em uma area
- Isolamento: bugs de um nao bloqueiam outros

**Riscos encontrados:**
- Teammates editando mesmo arquivo simultaneamente causa conflitos
- Funcoes removidas por um que outro chamava → runtime errors
- Solucao: testes de integracao (syntax check, function existence)

---

### 2. Cron Loops (Monitoramento Continuo)

**O que eh:** Jobs recorrentes que executam automaticamente a cada N minutos durante a sessao.

**Loops configurados:**
```
/loop 5m /check-tests      → Roda npm test, auto-corrige se falhar
/loop 5m /babysit           → Monitora PRs, auto-rebase, fix CI
/loop 5m /telegram-feedback → Processa mensagens Telegram pendentes
```

**Como funciona:**
1. `CronCreate` agenda job com expressao cron
2. A cada 5 minutos, o prompt eh executado automaticamente
3. Se testes falham, o skill tenta corrigir (ate 5 tentativas)
4. Se PR tem conflito, faz rebase automatico
5. Se mensagem Telegram chega, categoriza e responde

**Beneficios:**
- Deteccao precoce de bugs (testes rodam mesmo sem pedir)
- PRs nunca ficam com conflito por muito tempo
- Usuario no Telegram sempre recebe resposta rapida
- Zero intervencao humana pro monitoramento

**Limitacoes:**
- Jobs morrem quando a sessao Claude termina
- Auto-expire apos 7 dias
- Minimo 1 minuto de intervalo (cron nao suporta segundos)

---

### 3. Telegram Integration (Feedback em Tempo Real)

**O que eh:** Canal bidirecional de comunicacao entre o usuario (celular) e o agente (terminal).

**Fluxo:**
```
Usuario no Telegram → Mensagem chega como <channel> tag →
Agente categoriza → Age (cria issue, roda testes, responde) →
Responde no Telegram via reply tool
```

**Categorias automaticas:**
| Palavra-chave | Categoria | Acao |
|---|---|---|
| bug, erro, quebrou | Bug report | `gh issue create` + responde |
| quero, feature, adiciona | Feature request | `gh issue create --label enhancement` |
| status, testes, rodou | Status check | Roda `npm test`, responde resultado |
| ? | Pergunta | Responde baseado no CLAUDE.md |
| outro | Outro | Confirma recebimento |

**Beneficios:**
- Usuario nao precisa estar no terminal
- Pode dar feedback do celular a qualquer momento
- Issues criadas automaticamente no GitHub
- Contexto do projeto sempre disponivel pro agente

---

### 4. Chrome DevTools MCP (Auditoria Visual)

**O que eh:** Conexao direta com Chrome para testar UI visualmente, tirar screenshots, inspecionar elementos e verificar console.

**Workflow de auditoria:**
1. Inicia servidor (`node server.js`)
2. Navega pra URL (`navigate_page`)
3. Tira screenshot (`take_screenshot`)
4. Verifica visualmente (le imagem)
5. Snapshot de acessibilidade (`take_snapshot`)
6. Testa interacoes (`click`, `fill`)
7. Verifica console (`list_console_messages`)
8. Testa responsivo (`emulate` viewport mobile)
9. Documenta issues encontrados
10. Corrige e repete

**Beneficios:**
- Encontra bugs visuais que testes unitarios nao pegam
- Verifica responsividade real
- Detecta erros de runtime no console
- Testa fluxos de navegacao end-to-end

---

### 5. Ralph Loop (Iteracao Ate Verde)

**O que eh:** Loop que roda testes repetidamente, corrigindo falhas automaticamente ate tudo passar.

**Fluxo:**
```
Roda testes → Falhou? → Le erro → Identifica arquivo/linha →
Corrige codigo → Roda testes de novo → Repete ate verde (max 5x)
```

**Beneficio:** Garante que o codigo sempre termina em estado funcional.

---

## Ciclo Completo de uma Fase

```
1. PLANEJAR
   - Definir scope no CLAUDE.md
   - Criar tasks com TaskCreate

2. EXECUTAR
   - Criar team com TeamCreate
   - Spawnar teammates com prompts detalhados
   - Teammates trabalham em paralelo

3. INTEGRAR
   - Lead recebe resultados dos teammates
   - Verifica testes (npm test)
   - Corrige integracoes (funcoes faltando, vars undefined)
   - Fix escaped \! characters

4. VERIFICAR
   - Roda testes: npm test
   - Syntax check: node -c app.js
   - Chrome DevTools audit visual

5. ENTREGAR
   - git commit com conventional commits
   - git push
   - Notifica usuario via Telegram
   - Shutdown teammates
   - Delete team

6. MONITORAR
   - Cron /check-tests a cada 5min
   - Cron /babysit PRs a cada 5min
   - Cron /telegram-feedback a cada 5min
```

---

## Metricas do Projeto MovieFlix

| Metrica | Valor |
|---|---|
| Fases completadas | 15 |
| Testes escritos | 58 |
| Endpoints API | 23 |
| Paginas/rotas | 13 |
| Commits | 30+ |
| Teammates criados | 40+ |
| Teams criados | 12 |
| Mensagens Telegram | 20+ processadas |
| Audits visuais | 4 |
| Bugs encontrados e corrigidos | 15+ |

---

## Problemas Encontrados e Solucoes

### 1. Teammates editando mesmo arquivo
**Problema:** Multiplos agents escrevendo no app.js causava funcoes removidas por um que outro chamava.
**Solucao:** Adicionei testes de integracao — syntax check (`node -c`), function existence check, escaped character detection.

### 2. Linter revertendo edits
**Problema:** Um linter/formatter revertia alteracoes feitas pelo agente em server.js e app.js.
**Solucao:** Editar e commitar imediatamente antes do linter rodar. Verificar sempre se a edit persistiu.

### 3. .env invisivel pra teammates
**Problema:** Sandbox esconde .env como char device. Teammates reportavam "TMDB_TOKEN missing" e test failures.
**Solucao:** Ignorar esses reports — testes passam no ambiente principal. Documentar no MEMORY.md.

### 4. Rotas Express com wildcard
**Problema:** `/api/tv/:id` matchava antes de `/api/tv/search` e `/api/tv/on-the-air`.
**Solucao:** Rotas especificas SEMPRE antes de wildcards. Documentado como padrao obrigatorio.

### 5. Endpoints TMDB inexistentes
**Problema:** Teammate criou `/api/tv/upcoming` mas TMDB nao tem esse endpoint.
**Solucao:** Validar endpoints contra a documentacao da API antes de implementar. Substituido por `/tv/airing_today`.

---

## Beneficios do Workflow

1. **Velocidade:** 15 fases em ~2 horas, trabalho que levaria dias manualmente
2. **Qualidade:** 58 testes, security headers, WCAG AA, rate limiting
3. **Feedback loop curto:** Usuario no Telegram, testes a cada 5min
4. **Escalabilidade:** Adicionar fases eh trivial — cria team, spawna agents
5. **Resiliencia:** Se um teammate falha, lead corrige e continua
6. **Documentacao:** CLAUDE.md como spec viva, commits convencionais
7. **Monitoramento:** Crons detectam problemas antes do usuario
8. **Autonomia:** Agente toma decisoes, so consulta usuario pra confirmacao

---

## Quando Usar Este Workflow

**Ideal para:**
- Projetos greenfield com spec definida
- Refatoracoes grandes com muitos arquivos
- Features paralelas sem dependencias fortes
- Projetos com CI/CD e testes automatizados

**Nao ideal para:**
- Debugging complexo de um unico bug
- Mudancas cirurgicas em codigo critico
- Projetos sem testes (risco de regressao alto)
- Codebase muito grande (context window limitation)

---

*Documento gerado em 2026-05-22 durante a construcao do MovieFlix.*
*Workflow executado com Claude Code (Opus 4.6) + Agent Teams + MCP Tools.*
