# Control Snapshot — 2026-04-11

## Feito
- Navegação autenticada corrigida no fluxo público:
  - `Minha área` mantém usuário autenticado no fluxo logado.
  - `Buscar profissionais` em sessão autenticada resolve para `/buscar-auth`.
  - Middleware força redirect de usuário autenticado em `/buscar` para `/buscar-auth`.
- Smoke test dirigido executado com Playwright em **produção** e **preview** (desktop + mobile):
  - Fluxo validado: `login -> landing -> logo -> Minha área -> Buscar profissionais`.
  - Resultado final: **4/4 pass**.
  - URLs validadas:
    - Produção: `https://muuday-i7a8ixq4o-muuday1s-projects.vercel.app`
    - Preview: `https://muuday-k4h10h0ga-muuday1s-projects.vercel.app`
- Pooling local fechado para validação:
  - `SUPABASE_DB_POOLER_URL` adicionado ao `.env.local`.
  - `npm run db:validate-pooling` retornando `OK`.
- Evidência operacional já coletada:
  - DB webhook trigger `payments -> /api/webhooks/supabase-db` retornando **2xx** (`net._http_response` com `status_code=202`).
  - Skew Protection no Vercel: **habilitado** (max age 12h, conforme validação operacional).

## Pendente
- CI do `main` precisa ficar totalmente verde após os últimos patches (acompanhar execução do workflow `CI`).
- Confirmar e registrar formalmente em docs de operações:
  - PITR adiado para perto do lançamento (com custo/benefício).
  - Política de Supabase Branching (quando usar branch por PR vs apenas mudanças críticas).

## Bloqueio
- PITR: decisão de custo adia habilitação para fase pré-lançamento de pagamentos reais.
- Sem bloqueios técnicos imediatos para navegação/auth no estado atual.

## Próximo
1. Acompanhar último `CI` no GitHub e confirmar `main` 100% verde.
2. Atualizar `docs/handover/current-state.md` e `docs/project/project-status.md` com este snapshot resumido.
3. Fechar policy explícita de branching Supabase no runbook operacional.
4. Manter Wave 3 (pagamentos reais) separado deste bloco de estabilização.
