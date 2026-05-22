---
description: Ativa só os loops de monitoramento (sem rebuild). Usa quando app já tá pronto.
---

Ativa loops de monitoramento:

1. /loop 5m /check-tests — roda testes, corrige falhas automaticamente
2. /loop 10m /telegram-feedback — processa mensagens Telegram, cria issues, responde
3. /loop 5m /babysit — monitora PRs, auto-rebase, fix CI, merge quando pronto

Relata quais loops foram ativados.
