# Session Log

Use this for meaningful checkpoints only.

## 2026-04-24

### Entry 86 (2026-04-24) — Comprehensive Documentation Audit
- Scope executed:
  - Full read pass of all 154 markdown files under `docs/`.
  - Codebase cross-reference against `package.json`, `lib/tier-config.ts`, `db/sql/migrations/`, `app/`, `lib/actions/`, `app/api/v1/`, `inngest/functions/`.
  - Identified critical misalignment in `docs/product/IMPLEMENTATION-ROADMAP.md` — all backend-built systems marked as ⏳ pending. Rewrote with accurate `✅` / `🔄` / `⏳` statuses.
  - Identified payment rail controversy: three different plans across docs (Stripe+Airwallex vs Trolley+Revolut). Added warning banners to affected docs.
  - Identified canonical spec internal contradictions: annual pricing (10× vs 15% discount) and Basic booking window (30 vs 60 days).
  - Updated 11 critical status documents with accurate current state.
  - Created `docs/DOC-AUDIT-REPORT-2026-04-24.md` with full findings, severity ratings, and remediation recommendations.
- Key stats:
  - Next.js: `^16.2.4` (doc said 14)
  - React: `^19` (doc said 18)
  - Migrations: 69 applied (doc mentioned only 14)
  - `lib/actions/admin.ts`: 172 lines (was 655)
  - `lib/actions/email.ts`: 270 lines (was 548)
- Validation: N/A (docs-only change)

### Entry 87 (2026-04-24) — Resolve spec contradictions (user decisions applied)
- User decisions received and applied:
  1. **Annual pricing:** 10× monthly (not 15% discount).
  2. **Basic booking window:** 60 days (not 30 days).
- Changes executed:
  - `lib/tier-config.ts`: `bookingWindowDays` for Basic changed `30 → 60`.
  - `docs/spec/source-of-truth/part1-foundations-search-tiers.md` line 1452: removed "15% discount", now reads "Annual plan: annual = 10× monthly price".
  - `docs/spec/source-of-truth/part3-payments-billing-revenue-engine.md` lines 515, 893: updated to "10× monthly" / "annual = 10× monthly price".
  - `docs/engineering/onboarding-and-tiers-implementation-plan.md`: Basic window updated `30-day → 60-day` (2 occurrences).
  - `docs/engineering/stripe-integration-plan.md`: Annual pricing rule updated from "15% discount" to "10× monthly".
  - `docs/product/journeys/professional-workspace-journey.md`: Max booking window table updated `Basic: 30 → Basic: 60`.
  - `docs/DOC-AUDIT-REPORT-2026-04-24.md`: Contradiction sections marked as RESOLVED.
- Verification:
  - `grep` confirms zero remaining "15% discount" references in active docs.
  - `grep` confirms zero remaining "30-day Basic window" references in docs.
  - `npm run typecheck` → pass (tier-config change is a literal value swap, no type impact).

> **Nota de reversão (2026-04-27):** A janela de agendamento Basic foi revertida de 60 dias para **30 dias** para alinhar com a migration 045 (`plan_configs` table) e `lib/tier-config.ts`. A decisão de 60 dias foi corrigida após verificação de que o banco de dados já tinha 30 dias como default canônico. Ver `docs/NEXT_STEPS.md` P0.4 e P0.5.

## 2026-04-22

### Entry 85 (2026-04-22) — Sala de Espera + jogo "O Expat" para sessões de video
- Scope executed:
  - Migration `063`: adiciona `professional_ready_at` em `bookings` para controle de entrada do profissional.
  - API `GET /api/sessao/status`: polling do cliente a cada 2s com rate limiting (`bookingManage`).
  - API `POST /api/sessao/liberar`: profissional libera a sessão; valida ownership, status e janela de tempo.
  - `SessionCountdown`: countdown ao início da sessão; mostra alerta âmbar quando o horário chegou.
  - `WaitingRoomGame` ("O Expat"): runner 2D B&W em canvas; obstáculos progressivos (avião → casa → mala → prédio), moedas com $, high score em `sessionStorage`, partículas de poeira no pulo, `touch-action: none` para mobile.
  - `VideoSession` refatorado em 3 fases: `waiting` → `connecting` → `in-session`.
  - Economia de créditos Agora: ninguém conecta até o profissional clicar "Entrar na sessão".
  - Agora cleanup separado do unmount para evitar desconexão na troca de fase.
  - Tratamento de erro na fase `connecting` com botão "Voltar e tentar novamente".
- Security:
  - Descoberta e mitigação de API key Resend hardcoded em 4 scripts Python.
  - Scripts refatorados para `os.environ.get("RESEND_API_KEY")`.
  - `.gitignore` atualizado para proteger scripts com keys e cache da CLI Supabase.
- Validation:
  - `npm run lint` -> pass (0 warnings)
  - `npm run build` -> pass (Turbopack)
  - Deploy Vercel production -> Ready
  - Health check `/api/health` -> 200
  - APIs `/api/sessao/status` e `/api/sessao/liberar` -> 401 não autenticado (comportamento esperado)

## 2026-04-16

### Entry 84 (2026-04-16) — Onboarding modal load-path performance split + hygiene pass
- Scope executed:
  - onboarding modal bootstrap split into server scopes:
    - `GET /api/professional/onboarding/modal-context?scope=critical`
    - `GET /api/professional/onboarding/modal-context?scope=optional`
  - `OnboardingTrackerModal` now:
    - renders from dashboard state immediately,
    - blocks only on `critical` payload,
    - hydrates optional blocks in background without global spinner lock.
  - hot-path optimization in onboarding loaders:
    - `loadProfessionalOnboardingState(..., { resolveSignedMediaUrls: false })` used in state/save/submit/recompute paths that only need gates/evaluation.
  - plan-pricing unified through shared helper (`lib/professional/plan-pricing.ts`) and reused by optional modal context.
- Validation:
  - `npm run typecheck` -> pass
  - `npm run lint` -> pass
  - `npm run build` -> pass
  - `npm run test:state-machines` -> pass
- Repository hygiene:
  - branch audit completed; merged `codex/*` branches identified for cleanup.
  - `feat/landing-page-redesign` remains intentionally unmerged pending explicit product decision.

## 2026-04-10

### Entry 81 (2026-04-10) — Wave 2 final closure (T7 to T12)
- Scope executed:
  - T7 formal booking-flow closure audit (`one_off`, `request_booking`, `recorrente`, `várias_datas`).
  - T9 video-session gates validation on `/sessao/[bookingId]` and `/api/agora/token`.
  - T10 admin review end-to-end decision validation with audit trail generation.
  - T11 full quality gate rerun on final branch state.
  - T12 documentation sign-off across status/handover/roadmap docs.
- Evidence generated:
  - `artifacts/ops/wave2-final-readiness-audit-2026-04-10.json` (`11/11 pass`, `0 fail`, `0 critical`).
- Validation:
  - `npm.cmd run test:e2e -- tests/e2e/video-session-gates.spec.ts` -> `2 passed`.
  - `npm.cmd run test:e2e -- tests/e2e/admin-review-audit.spec.ts` -> `1 passed`.
  - `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test:state-machines`, `npm.cmd run test:e2e` -> `15 passed`, `1 skipped`, `0 failed`.
- Operational readout:
  - remaining E2E skip is non-critical/intentional (manual-confirmation fixture path), documented and accepted for Wave 2 closure.
  - real-money payments lifecycle remains out of Wave 2 scope and stays in Wave 3.

## 2026-04-11

### Entry 83 (2026-04-11) — Post-Wave2 operational closure
- Repository hygiene and delivery:
  - PR `#21` (`perf(search): precompute visibility + split public/auth buscar`) rebased, validated, merged, and deployed to production.
  - Main branch checks green after merge (`CI`, `Checkly Validate`, `Vercel`).
  - Local stale branches cleaned; no open PRs remained after merge.
- Supabase Pro capabilities:
  - Extensions enabled in project: `pg_cron`, `pg_net`, `pgsodium`.
  - SQL 033 jobs/templates applied with active cron jobs:
    - `cleanup-expired-slot-locks`
    - `clear-expired-slot-locks-fast`
    - `cancel-stale-pending-bookings`
    - `http-public-visibility-sync`
- Webhook bridge validation:
  - Payments trigger route finalized to call `https://muuday-app.vercel.app/api/webhooks/supabase-db`.
  - `net._http_response` validated with `202` responses (ids 15/16), confirming DB -> webhook bridge -> Inngest enqueue path.
- Platform decisions (recorded):
  - Vercel `Skew Protection`: enabled (max age 12h).
  - Supabase `PITR`: deferred for pre-launch/payments cutover due current cost tradeoff; compensating controls required.
  - Supabase branching policy adopted: `always branch per PR` (exception only for emergency hotfix with mandatory backfill PR).

## 2026-04-02

### Entry 80
- Fluxo de autenticação padronizado em app-level:
  - `app/(auth)/login/page.tsx` agora usa `components/auth/LoginForm.tsx` como fonte única de login (página + modal).
  - catálogo único de mensagens criado em `lib/auth/messages.ts` (login/signup/password).
  - `components/auth/SocialAuthButtons.tsx` passou a usar mensagens padronizadas para rate-limit/OAuth fail.
- Novo endpoint de suporte a UX de login social:
  - `POST /api/auth/login-hint` (`app/api/auth/login-hint/route.ts`).
  - identifica quando conta é social-only e devolve hint para mensagem de erro determinística após falha de senha.
- Cadastro alinhado com mensagens padronizadas:
  - `app/(auth)/cadastro/page.tsx` agora usa `mapSignupErrorMessage` e `isDuplicateSignupError`.
  - duplicate-email exibe mensagem padrão com orientação para login social ou recuperação de senha.
- Segurança de conta em `/perfil` ampliada:
  - `components/profile/ProfileAccountSettings.tsx` agora permite definir/atualizar senha em sessão ativa.
  - inclui validação de confirmação, tamanho mínimo e feedback de sucesso/erro padronizado.
- Validação técnica executada com sucesso:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`

### Entry 81
- Fechada lacuna operacional de sync do Inngest sem depender de ação manual exclusiva no dashboard.
- `app/api/inngest/route.ts` voltou a expor `PUT` com o mesmo controle de CORS de `GET/POST`, permitindo resync determinístico via endpoint.
- Comando operacional oficial para pós-deploy:
  - `curl -X PUT https://muuday-app.vercel.app/api/inngest --fail-with-body`
- Handover atualizado para tratar sync como fluxo reproduzível por CLI/CI.

### Entry 82
- Executado checklist técnico de fechamento Wave 2 (rodada de evidência automática):
  - `npm run test:e2e` -> `11 passed`, `2 skipped` (skips em `wave2-onboarding-gates.spec.ts` ainda dependem de fixture de gate bloqueado/aberto totalmente determinística).
  - `npm run audit:auth-role-claims` -> `0%` cobertura de claim JWT de role e `100%` fallback estimado para query em `profiles`.
  - `npm run db:validate-pooling` -> falha por ausência de `SUPABASE_DB_POOLER_URL` (ou `DATABASE_URL`) com endpoint pooler `:6543`.
- Status consolidado de Wave 2 permanece `In progress` até:
  - fechamento do sign-off manual (recorrência/gates/role split),
  - eliminação dos 2 skips de E2E de gates,
  - ajuste de pooling runtime e backfill de JWT role claims.

## 2026-04-01

### Entry 79
- Implementado auditor de cobertura de claim de role para middleware:
  - script novo `scripts/ops/audit-role-claim-coverage.cjs`
  - comando novo `npm run audit:auth-role-claims`
  - relatório inclui: claim válido/ausente/inválido, consistência claim vs `profiles.role`, e estimativa de fallback.
- Middleware (`lib/supabase/middleware.ts`) agora emite sinal de observabilidade para fallback de role:
  - evento Sentry amostrado: `middleware_role_fallback_to_profile`
  - disparado quando claim JWT não existe e middleware precisa consultar `profiles`.
- Tentativa de auditoria real executada e bloqueada por configuração de ambiente:
  - `SUPABASE_SERVICE_ROLE_KEY` local estava com chave publishable (`sb_publishable...`), sem permissão para `auth.admin.listUsers`.
  - ação pendente: substituir pela service-role key real e rerodar `npm run audit:auth-role-claims`.

### Entry 78
- Entregue fundação de resiliência de jobs Stripe (Wave 3 prep, sem execução de dinheiro real).
- Nova migration criada:
  - `db/sql/migrations/023-wave3-stripe-job-resilience-foundation.sql`
  - adiciona tabelas:
    - `stripe_webhook_events` (inbox/idempotência/retry),
    - `stripe_payment_retry_queue`,
    - `stripe_subscription_check_queue`,
    - `stripe_job_runs`.
- Webhook Stripe evoluído (`app/api/webhooks/stripe/route.ts`):
  - valida assinatura Stripe (`constructEvent`),
  - persiste evento no inbox idempotente,
  - enfileira processamento assíncrono no Inngest (`stripe/webhook.received`),
  - mantém ACK `202` para desacoplamento.
- Novo motor operacional:
  - `lib/ops/stripe-resilience.ts`
  - implementa:
    - processamento de inbox com backoff/retry e estados terminais,
    - varredura semanal de elegibilidade de payout (read-only),
    - checagens de renovação de assinatura,
    - retries de pagamentos falhos.
- Inngest expandido:
  - `process-stripe-webhook-inbox`,
  - `stripe-weekly-payout-eligibility-scan`,
  - `stripe-subscription-renewal-checks`,
  - `stripe-failed-payment-retries`.
- Pendência operacional:
  - aplicar migration `023` no Supabase produção antes de ativar tráfego Stripe real.

### Entry 77
- Cobertura de rate limiting expandida em auth, booking creation, webhook Stripe e observabilidade de fallback.
- `lib/security/rate-limit.ts` reestruturado com novos presets:
  - `authLogin`, `authSignup`, `authOAuth`
  - `bookingCreate`
  - `stripeWebhook`
- Fallback in-memory agora gera sinal operacional:
  - `console.warn` throttled
  - Sentry `rate_limit_fallback_memory_active` throttled.
- Nova rota de guard de tentativas de auth:
  - `POST /api/auth/attempt-guard`
  - aplicada antes de operações de login/signup/oauth start nas telas/componentes de auth.
- Novo endpoint de webhook Stripe com proteção de rate limit e CORS:
  - `POST /api/webhooks/stripe`
  - status atual proposital: `501` placeholder até implementação completa Wave 3.
- Criação de booking reforçada:
  - `createBooking`, `createRequestBooking`, `acceptRequestBooking` agora usam preset `bookingCreate`.
- Docs/handover atualizados para refletir conclusão parcial do bloco de segurança de rate limiting e próximos follow-ups.

### Entry 76
- Conexão de banco com pooling (Supabase Pro/Supavisor) formalizada como requisito operacional obrigatório.
- Criado validador de configuração:
  - `scripts/ops/validate-db-pooling-config.cjs`
  - comando `npm run db:validate-pooling`
- Regras implementadas no validador:
  - URL de runtime (`SUPABASE_DB_POOLER_URL` ou `DATABASE_URL`) deve usar porta `6543`;
  - URL direta (`SUPABASE_DB_DIRECT_URL` ou `DATABASE_DIRECT_URL`), quando presente, não pode usar `6543`.
- `.env.local.example` atualizado com slots explícitos de pooler/direct.
- Runbooks/docs atualizados para exigir validação de pooling antes de deploy:
  - `docs/engineering/setup-and-environments.md`
  - `docs/engineering/database-and-migrations.md`
  - `docs/engineering/deployment-and-operations.md`
  - `docs/engineering/runbooks/release-checklist.md`
  - `docs/NEXT_STEPS.md`
  - `docs/handover/current-state.md`
  - `docs/handover/current-state.md`

### Entry 75
- Error budget + alerting hardening batch concluído com foco custo-eficiente.
- Nova referência operacional:
  - `docs/engineering/runbooks/error-budget-and-alerting.md`
  - inclui SLO/error-budget e thresholds de alertas para Sentry/Checkly/PostHog.
- Instrumentação de sinais para alertas adicionada:
  - Auth failures -> Sentry:
    - `app/(auth)/login/page.tsx`
    - `components/auth/LoginForm.tsx`
    - `components/auth/SocialAuthButtons.tsx`
    - `app/auth/callback/route.ts`
    - `app/(auth)/cadastro/page.tsx`
  - Payment failure -> Sentry:
    - `lib/actions/request-booking.ts` (`request_booking_payment_record_failed`)
- Taxonomia de eventos PostHog expandida:
  - novo evento `auth_signup_started` para medir drop-off de signup.
- Docs de integração atualizadas:
  - `docs/integrations/sentry.md`
  - `docs/integrations/posthog.md`
  - `docs/integrations/checkly.md`
- Estado final desta rodada:
  - instrumentação e runbook prontos no código,
  - criação efetiva de alert rules no dashboard de Sentry/PostHog permanece ação operacional humana.

### Entry 74
- Implementada fundação de trilha de auditoria administrativa (compliance para dinheiro real).
- Migration criada:
  - `db/sql/migrations/022-admin-audit-log-foundation.sql`
- Estrutura entregue:
  - tabela `admin_audit_log` com `admin_user_id`, `action`, `target_table`, `target_id`, `old_value`, `new_value`, `metadata`, `created_at`.
  - índices por alvo, admin e tempo.
  - RLS admin-only para leitura e inserção.
- Integração no app:
  - helper `lib/admin/audit-log.ts` para escrita padronizada.
  - ações admin em `lib/actions/admin.ts` agora registram evento de auditoria ao concluir:
    - update de status de profissional,
    - update de first-booking gate,
    - toggle de visibilidade de review,
    - delete de review.
- Modo fail-closed opcional suportado por env:
  - `ADMIN_AUDIT_FAIL_ON_ERROR=true`.
- Pendência operacional:
  - aplicar migration `022` em produção e validar evidência de trilha para cada ação admin acima.

### Entry 73
- Entregue pre-hardening de PII financeira para preparação de Wave 3 (Stripe).
- Novo guard de payload sensível:
  - `lib/stripe/pii-guards.ts`
  - bloqueia chaves proibidas em payload de pagamento (`card_number`, `cvv/cvc`, `iban`, `routing_number`, etc.).
- Guard aplicado nos fluxos atuais de escrita de pagamento:
  - `lib/actions/booking.ts`
  - `lib/actions/request-booking.ts`
- Novo pacote de auditoria SQL criado:
  - `db/sql/analysis/024-wave3-pii-column-audit.sql`
  - cobre: colunas proibidas de cartão, inventário de colunas sensíveis de payout, presença de extensões `pgcrypto`/`vault`, status de RLS em tabelas financeiras.
- Documento técnico consolidado/atualizado:
  - `docs/engineering/financial-pii-encryption-and-vault.md`
  - define regra não-negociável de nunca armazenar dados brutos de cartão e o caminho de decisão Stripe-only vs colunas locais criptografadas.

### Entry 72
- Hardening de CORS concluído com política explícita em todas as rotas API atuais.
- Novo módulo compartilhado criado:
  - `lib/http/cors.ts`
  - inclui avaliação de origem allowlist, aplicação de headers CORS em respostas e helper de preflight `OPTIONS`.
- Rotas atualizadas com CORS explícito + preflight:
  - `app/api/auth/password-reset/route.ts`
  - `app/api/waitlist/route.ts`
  - `app/api/inngest/route.ts`
  - `app/api/cron/booking-reminders/route.ts`
  - `app/api/cron/booking-timeouts/route.ts`
- Variáveis de ambiente adicionadas/documentadas em `.env.local.example`:
  - `API_CORS_ORIGINS`
  - `WAITLIST_CORS_ORIGINS`
  - `WEBHOOK_CORS_ORIGINS`
- Observação operacional:
  - `WEBHOOK_API_CORS_POLICY` foi deixado pronto para aplicação obrigatória em `/api/webhooks/*` quando Stripe webhook entrar.

### Entry 71
- Executado hardening de validação de input em server actions com Zod como fronteira obrigatória.
- `lib/actions/admin.ts` reescrito com schemas explícitos por ação:
  - `adminUpdateProfessionalStatus` (UUID + enum de status),
  - `adminUpdateFirstBookingGate` (UUID + boolean),
  - `adminToggleReviewVisibility` (UUID + boolean),
  - `adminDeleteReview` (UUID).
- `lib/actions/email.ts` atualizado para parse/validação de todos os payloads antes de qualquer side effect:
  - email, IDs opcionais de usuário, datas, horários, valores monetários, URLs, rating, listas de itens faltantes.
- `lib/actions/booking.ts` e `lib/actions/request-booking.ts` reforçados com validação semântica de datetime local (não apenas regex de formato).
- Gate técnico pós-hardening validado:
  - `npm.cmd run lint` ✅
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run build` ✅
  - `npm.cmd run test:state-machines` ✅

### Entry 70
- Política de rotação periódica de secrets formalizada e documentada com runbook operacional:
  - `docs/engineering/runbooks/secrets-rotation-runbook.md`.
- Escopo de rotação agora inclui explicitamente:
  - `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SECRET_KEY`,
  - `CRON_SECRET`,
  - `RESEND_API_KEY`,
  - `UPSTASH_REDIS_REST_TOKEN`,
  - `STRIPE_SECRET_KEY`,
  - `STRIPE_WEBHOOK_SECRET`,
  - `STRIPE_CONNECT_CLIENT_ID`,
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (com rollovers Stripe).
- Checklist de release e docs de setup/deploy foram atualizados para exigir registro de rotação e validação pós-cutover.
- Backlog de decisões e checklist do operador foram alinhados para tratar rotação como requisito contínuo, não opcional.

### Entry 69
- Entregue toolkit completo para auditoria RLS:
  - `db/sql/analysis/022-rls-audit-inventory.sql` (inventário de RLS + políticas + risco de permissividade),
  - `db/sql/analysis/023-rls-cross-user-isolation.sql` (harness SQL de isolamento cross-user),
  - `scripts/ops/audit-rls-direct-api.cjs` + `npm run audit:rls:api` (teste via API direta com anon key).
- Script API direto agora carrega `.env.local` automaticamente e suporta `RLS_SAMPLE_*` para execução determinística quando a base não tiver amostras descobertas automaticamente.
- Execução atual:
  - autenticação de dois usuários funcionou,
  - mas não havia amostras privadas elegíveis (`bookings/payments/hidden reviews/messages`) para validar isolamento por ID nesta rodada.
- Gap registrado em handover: coletar/fornecer IDs de amostra e rerodar para evidência final de "no cross-user leak".

### Entry 68
- CI workflow (`.github/workflows/ci.yml`) expandido para gate completo em cadeia:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:unit`
  - `npm run test:e2e`
- Adicionado `test:unit` em `package.json` (mapeado para suite determinística atual de state machines).
- CI agora instala Playwright Chromium e publica `playwright-report` como artifact.
- Push em `main` agora falha se faltar segredo E2E obrigatório, evitando falso-positivo com testes pulados por ausência de fixture.
- Workflow de Checkly (`.github/workflows/checkly-validate.yml`) ampliado com:
  - schedule (`a cada 6h`),
  - execução de `checkly:test`,
  - deploy automático de checks em `main` via `checkly:deploy` quando segredos estiverem presentes.

### Entry 67
- Middleware atualizado para resolver role via claims JWT antes de consultar `profiles`.
- `lib/supabase/middleware.ts` agora prioriza:
  - `user.app_metadata.role`
  - `user.raw_app_meta_data.role`
- Fallback de role no banco permanece somente quando claim estiver ausente/inválida.
- Guard de role agora usa allow-list explícita (`usuario`, `profissional`, `admin`) para evitar valores fora do padrão.
- Resultado esperado: menos `SELECT` por request em rotas protegidas com compatibilidade para sessões legadas.

### Entry 66
- Implementada camada de cache com Upstash Redis para leituras públicas críticas:
  - perfis públicos de profissionais com TTL de 5 minutos (`app/(app)/profissional/[id]/page.tsx`);
  - taxonomia ativa (categorias/subcategorias/especialidades) com TTL de 1 hora (`lib/taxonomy/professional-specialties.ts`);
  - câmbio com TTL de 1 hora em provider único (`lib/exchange-rates.ts`), agora consumido por `/buscar`, `createBooking` e `acceptRequestBooking`.
- Adicionada invalidação por tag ISR para perfis públicos:
  - `revalidateTag('public-profiles')` em mutações admin/profissional que impactam superfície pública (`lib/actions/admin.ts`, `lib/actions/professional.ts`).
- Resultado: queda de leituras repetidas no DB para páginas públicas sem alterar comportamento funcional.

### Entry 65
- Operator confirmou execução em produção das migrations:
  - `019-wave2-search-pgtrgm.sql`
  - `020-wave2-composite-indexes.sql`
  - `021-wave2-booking-atomic-slot-constraint.sql`
- Itens de schema do bloco P2 (search indexes, composite indexes, atomic slot uniqueness) agora estão ativos em produção.
- Pendências remanescentes desse bloco passaram a ser apenas validação operacional:
  - captura de `EXPLAIN (ANALYZE, BUFFERS)` para evidência de uso de índice;
  - smoke de concorrência para confirmar `1 sucesso + 1 conflito determinístico` no mesmo slot.

### Entry 64
- Endereçado item P2 de race condition em criação de booking (check+insert não atômicos).
- Nova migration adicionada: `db/sql/migrations/021-wave2-booking-atomic-slot-constraint.sql`.
- A migration aplica duas proteções:
  - normalização de duplicidade ativa existente (mantém booking mais antigo e cancela duplicados com marcador em `metadata`);
  - índice único parcial `bookings_unique_active_professional_start_idx` em `(professional_id, start_time_utc)` para estados ativos.
- `lib/actions/booking.ts` atualizado para tratar `23505` desse índice e retornar erro funcional determinístico:
  - `Um ou mais horários já foram reservados. Escolha outro horário.`
- Escopo intencional: `booking_type='recurring_parent'` fica fora da unicidade para não quebrar o modelo atual de parent+children recorrente.
- Próximo passo operacional obrigatório: aplicar `021` em produção e validar corrida concorrente real (um sucesso + uma falha controlada).

### Entry 59
- Ajustado o modal de login usado por CTAs de visitante em `/buscar` e `/profissional/[id]` para remover scroll interno no desktop padrão.
- `AuthOverlay` (variante `modal`) foi compactado:
  - largura reduzida (`max-w-md`),
  - padding menor,
  - sem restrição de altura/scroll interno em desktop (`md:max-h-none`, `md:overflow-visible`),
  - fallback com scroll mantido para viewports pequenos.
- `LoginForm` recebeu compactação real quando `compact=true`:
  - título/subtítulo menores,
  - gaps verticais menores,
  - campos e botão com altura reduzida,
  - separador social compacto,
  - CTA `Ainda não é membro? Criar conta` mantida visível no modal.
- `SocialAuthButtons` agora aceita prop `compact` para reduzir densidade (padding/gap/ícone).
- `SearchBookingCtas` passou `compact` para o `LoginForm` e removeu copy auxiliar extra abaixo do formulário para economizar altura.
- Validação técnica concluída:
  - `npm.cmd run lint` ✅
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run build` ✅
  - `npm.cmd run test:state-machines` ✅

### Entry 60
- Executado ajuste `Sticky Booking Box` no perfil profissional para tablet + desktop.
- `components/professional/ProfileAvailabilityBookingSection.tsx` atualizado:
  - grid principal agora abre 2 colunas a partir de `md` (`conteúdo + booking rail`);
  - sticky da box de booking ativado em `md` (`md:sticky md:top-24`), mantendo comportamento anterior no desktop;
  - mobile permanece em uma coluna sem sticky.
- Objetivo entregue: manter a caixa de `Agendar sessão / Mandar mensagem` visível durante scroll em iPad/tablet e desktop.
- Validação técnica concluída:
  - `npm.cmd run lint` ✅
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run build` ✅
  - `npm.cmd run test:state-machines` ✅

### Entry 61
- Implementada base de search escalável Postgres-first (`pg_trgm + GIN`) para `/buscar`.
- Nova migration adicionada:
  - `db/sql/migrations/019-wave2-search-pgtrgm.sql`
  - inclui extensão `pg_trgm`, índices trigram/filtro e RPC `search_public_professionals_pgtrgm(...)`.
- Atualização de código em `app/(app)/buscar/page.tsx`:
  - busca agora tenta obter `candidate IDs` via RPC quando há filtros/texto ativos;
  - depois carrega somente os profissionais candidatos para aplicar o restante do pipeline;
  - fallback preservado para não quebrar a busca se RPC não estiver disponível.
- Estratégia registrada:
  - continuar com Postgres até ultrapassar 2k profissionais ativos;
  - migrar para Typesense após esse gatilho de escala.
- Validação técnica concluída:
  - `npm.cmd run lint` ✅
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run build` ✅
  - `npm.cmd run test:state-machines` ✅

### Entry 62
- Endereçado item de audit P2 para índices compostos em queries críticas.
- Criada migration:
  - `db/sql/migrations/020-wave2-composite-indexes.sql`
  - índices adicionados:
    - `bookings(professional_id, status)`
    - `bookings(user_id, status)`
    - `availability_rules(professional_id, is_active)`
    - `payments(booking_id, status)`
- Criado script operacional:
  - `db/sql/analysis/wave2-indexes-explain-analyze.sql`
  - inclui consultas `EXPLAIN (ANALYZE, BUFFERS)` para validar uso real dos índices em caminhos de booking/search/payment.
- Próximo passo operacional: rodar migration + explain no Supabase produção e registrar plano/tempos no handover.

### Entry 63
- Corrigida compatibilidade da migration `019-wave2-search-pgtrgm.sql` após erro `42P17` no Supabase (`functions in index expression must be marked IMMUTABLE`).
- Ajuste aplicado:
  - criada função helper imutável `public.search_text_from_array(text[])`;
  - índices trigram em `tags` e `subcategories` passaram a usar helper imutável em vez de `array_to_string(...)` direto.
- Resultado esperado: migration 019 agora executa normalmente no SQL Editor sem falhar na criação desses índices.

### Entry 53
- Delivered no-cost backend performance optimization for `/buscar`:
  - runtime cache now deduplicates concurrent in-flight loads for identical keys.
  - raised public search base cache TTL from `45s` to `180s` (`buscar:public-base:v2`).
  - skipped `supabase.auth.getUser()` on anonymous requests with no Supabase auth cookie.
  - parallelized public-visibility and base search data queries to reduce serial DB wait.
- Validation completed:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅
- Quick latency samples after patch stayed in the same or better range for repeated `/buscar` requests (warm-path ~`1.5s-2.0s` total in current region).

### Entry 54
- Updated `/buscar` price slider semantics and mobile interaction:
  - max now defaults to open-ended `+50 USD` equivalent per selected currency (minimum remains `0`).
  - selecting max keeps query `precoMax` unset to include all values above threshold.
  - slider now applies filters on commit (pointer up / keyboard step) instead of on every drag movement.
  - improved touch reliability with larger thumbs and pointer capture.
- Validation completed:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 55
- Fixed logout inconsistency across preview/prod domains:
  - `/auth/signout` now redirects using `request.nextUrl.origin` (same domain as current request).
  - Supabase signout now writes cookie-clearing changes directly to the redirect response.
  - added `GET` support alongside `POST` to avoid no-op behavior from mixed callers.
- Validation completed:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 56
- Diagnosed signup issue reported with `igor@muuday.com`:
  - auth smoke script confirms fresh alias signup/reset are accepted by Supabase.
  - root issue addressed in app UX: duplicate-email signup path was not explicit.
- Implemented duplicate-email handling in `/cadastro`:
  - detects duplicate signal when `signUp` returns success without new identity.
  - blocks flow and shows recovery guidance with `Esqueceu a senha? Clique aqui.` link.
  - suppresses welcome-email action on duplicate-email attempts.
- Validation completed:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 57
- Updated user-signup completion flow in `/cadastro`:
  - after successful user signup, app now shows modal with “confirm/verify your email” instructions.
  - clicking `OK` closes modal and redirects to landing page (`/`).
  - user is signed out before modal display to avoid immediate member state after signup.
- Validation completed:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 58
- Fixed logged-out public profile navigation regression:
  - `app/(app)/profissional/[id]/page.tsx` now reads professional/profile/availability/review data with admin client when anonymous.
  - aligned profile route data access with `/buscar` public listing model to prevent false “Página não encontrada”.
  - preserved go-live visibility gate and owner exceptions.
- Validation completed:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 52
- Applied repository hygiene and branch governance hardening:
  - promoted validated branch to `main` via fast-forward only.
  - deleted obsolete local/remote feature branches after merge to reduce drift risk.
  - preserved rollback tags:
    - `backup/pre-wave2-promotion-2026-04-01`
    - `backup/cursor-snapshot-debug-2026-04-01`
- Consolidated workspace usage policy:
  - canonical active repository is `C:\dev\muuday-app`.
  - parallel OneDrive workspace archived to `C:\Users\igorp\OneDrive\Documents\Muuday__ARCHIVED_2026-04-01`.
  - original OneDrive path now carries `DO_NOT_USE_FOR_ACTIVE_DEV.txt`.

### Entry 51
- Closed Wave 2 backend scope for recurring deadlines and booking lifecycle enforcement without UI expansion:
  - added canonical recurring policy engine (`lib/booking/recurring-deadlines.ts`) with fixed 7-day rules.
  - added recurring reserved-slot release runner (`lib/ops/recurring-slot-release.ts`) and wired into `/api/cron/booking-timeouts`.
  - added recurring release Inngest function (`release-recurring-reserved-slots`) and registered on `/api/inngest`.
- Hardened C1-C10 gate matrix enforcement as backend truth:
  - onboarding state remains centralized on `evaluateOnboardingGates`.
  - booking/request actions now return structured gate blockers with `reasonCode`.
  - recurring management blocks now return deterministic `reasonCode` + `deadlineAtUtc`.
- Expanded Wave 2 E2E and state-machine coverage:
  - added `tests/e2e/wave2-onboarding-gates.spec.ts`.
  - extended professional role-split checks and booking helper stability in existing specs.
  - `scripts/ops/test-state-machines.cjs` now asserts recurring constants and canonical gate delegation.
- Technical gate executed and green:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:state-machines`
  - `npm run test:e2e` (`10 passed`, `2 skipped` fixture-dependent checks).
- Follow-up required:
  - manual acceptance checklist for Wave 2 sign-off.
  - confirm Inngest dashboard attachment (remove stale unattached sync records).

## 2026-03-31

### Entry 48
- Enforced public professional visibility by full onboarding readiness (`canGoLive`) instead of `status=approved` only.
- `/buscar` now filters professionals through canonical onboarding gate evaluation before rendering cards.
- `/profissional/[id]` now applies the same go-live visibility rule for public viewers while preserving own-profile access.
- Added ops script `npm run fixtures:ensure-public-ready` to normalize test professionals across profile/settings/services/availability and keep them visible/openable for QA.
- Validation completed: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:state-machines`.

### Entry 49
- Fixed Google OAuth callback session persistence in `app/auth/callback/route.ts`.
- callback now propagates auth cookies from `exchangeCodeForSession` to redirect response, eliminating post-OAuth return-to-login loops.
- callback now enforces admin destination to `/buscar` even if profile completion fields are not fully set.
- preserved enforced role destinations after OAuth: `profissional -> /dashboard`; `usuario/admin -> /buscar`.
- Validation completed: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:state-machines`.

### Entry 50
- Validated production password-login routing for all three target roles:
  - admin -> `/buscar`
  - usuário -> `/buscar`
  - profissional -> `/dashboard`
- Implemented mobile login-popup centering structural fix in `components/auth/AuthOverlay.tsx`:
  - overlay now renders in `document.body` via portal.
  - prevents `position: fixed` popup from being constrained by the sticky public header (`backdrop-blur` context).
- Validation completed: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:state-machines`.

### Entry 47
- Executed PT-BR copy normalization across core app surfaces (auth, busca, agenda, configurações, booking and request-booking UIs).
- Fixed malformed encoding artifacts and restored truncated identifiers introduced during intermediate cleanup.
- Revalidated technical gate after corrections: `lint`, `typecheck`, `build`, and `test:state-machines` all passing.
- Follow-up: run visual QA in preview/production to confirm no remaining mojibake on user-visible screens.

## 2026-03-29

### Entry 1
- Completed production validation for cron endpoints and login availability.
- Updated production env alignment for URL/CORS consistency.
- Follow-up: activate Checkly checks and alerts.

### Entry 2
- Introduced canonical app URL resolver and updated auth/waitlist/email usage.
- Added Checkly setup guidance.
- Follow-up: migrate to final domain via env-only change when ready.

### Entry 3
- Rebuilt documentation governance structure across project/architecture/engineering/integrations/product.
- Removed stale and agent-specific prompt/handoff documents.
- Follow-up: keep `project-status` and `handover/current-state` synchronized every meaningful change.

### Entry 4
- Created persistent handover system in `docs/handover/` with overview, state, next steps, operating rules, constraints, context map, and this log.
- Follow-up: contributors must update handover files during execution, not only at session end.

### Entry 5
- Audited booking journey readiness on professional side against code reality.
- Confirmed gap: advanced `professional_settings` are implemented in backend reads but not exposed in professional UI for editing.
- Follow-up: implement dedicated professional booking settings page before deeper booking lifecycle expansion.

### Entry 6
- Delivered professional booking settings UI at `/configuracoes-agendamento` with save flow to `professional_settings`.
- Added direct navigation links from `/perfil` and `/disponibilidade` to advanced booking settings.
- Validation completed with `typecheck` and `lint` (only pre-existing lint warnings remained).

### Entry 7
- Added Sentry instrumentation baseline (client/server/edge init + global error capture + booking server-action error capture).
- Added PostHog baseline (provider, auth events, booking funnel events, route pageviews).
- Updated canonical schema snapshot `db/sql/schema/supabase-schema.sql` through migration `006`.
- Improved professional agenda to expose pending confirmation SLA/deadline context.
- Added Playwright e2e baseline (`playwright.config.ts`, `tests/e2e/booking-critical.spec.ts`, `npm run test:e2e`).

### Entry 8
- Added Checkly monitoring-as-code structure (`checkly/` + `checkly.config.js`) with API and browser journey checks.
- Added local Checkly browser journey validation (`playwright.checkly.config.ts`, `npm run test:checkly-local`).
- Added `.github/workflows/checkly-validate.yml` for parse/syntax checks.

### Entry 9
- Completed Checkly cloud activation and controlled fail/recovery validation sessions.
- Shifted Checkly to free-first pre-launch profile.

### Entry 10
- Expanded Playwright booking smoke tests and stabilized selectors.
- Created dedicated non-self professional fixture for production e2e regular-booking coverage.
- Confirmed remaining manual-confirmation smoke blocker due production schema/API drift.

### Entry 11
- Imported 5-part Muuday product specification into `docs/spec/source-of-truth/` as canonical baseline.
- Added consolidated spec docs (`master-spec`, `execution-plan`, unified AI protocol, open-validations, journey matrix).
- Updated project, architecture, journey, and handover docs to execution-wave model aligned with the new canonical baseline.

### Entry 12
- Consolidated new journey coverage docs for payments/revenue, trust/compliance, and session execution.
- Validated docs structure and local markdown links under `docs/` for consistency.
- Follow-up: execute Wave 0 implementation tasks and keep `current-state`/`next-steps` updated after each shipped batch.

### Entry 13
- Completed consolidation verification pass and documented remaining doc gaps in `docs/human-actions/consolidation-verification.md`.
- Added `docs/human-actions/decision-backlog.md` with explicit human-owned P0/P1/P2 decisions.
- Added `docs/human-actions/tool-options-and-stack-gaps.md` with 3 concrete options per open capability and stack-gap recommendations.

### Entry 14
- Added explicit data governance policy with retention/deletion matrix by data type in `docs/engineering/data-governance-and-lifecycle.md`.
- Strengthened continuity rules to require docs updates during each section/prompt and immediate indexing of newly created docs files.
- Updated handover and human-action backlog to reflect that policy is documented and next step is lifecycle automation rollout.

### Entry 15
- Clarified consolidated docs for historical provider evaluation notes (later superseded by final Agora decision).
- Aligned `tech-stack`, `open-validations`, and `human-actions/tool-options-and-stack-gaps` with canonical source-of-truth.

### Entry 16
- Added explicit "by when" deadlines per wave for human decisions in `docs/human-actions/decision-backlog.md`.
- Linked handover execution queue to those wave-gated decision deadlines.

### Entry 17
- Updated tech-stack governance to require phase entry and growth trigger metadata for all active/proposed components.
- Added wave-based stack adoption mapping in roadmap and human-actions tool matrix.
- Added handover rule to review/update stack phase tracking at every Wave close.

### Entry 18
- Reworked source-of-truth spec files to remove tool-specific AI instruction splits and replace with unified AI-agnostic build instructions.
- Added explicit role split, route guards, and screen inventory baseline for public/user/professional/admin.
- Added detailed professional onboarding stages and gate matrix requirements for implementation readiness.

### Entry 18 (2026-03-29)
- Applied all production schema migrations (001-006) to live Supabase (`jbbnbbrroifghrshplsq`).
- Fixed `availability_exceptions` table schema mismatch (recreated with correct `date_local` column).
- Migrations applied: role escalation fix, RLS restrict, favorites RLS, schema alignment, production booking foundation (professional_settings, availability_rules, availability_exceptions, slot_locks, payments, booking_sessions, calendar_integrations + full RLS), booking operations and reminders (notifications table + partial refund support).
- Wave 0 schema parity task: `Done`.
- Follow-up: validate e2e fixtures against new schema, continue Wave 0 exit criteria.

### Entry 19 (2026-03-30)
- Upgraded to Supabase Pro (spend cap enabled, PITR available but disabled) and Vercel Pro.
- Sentry env vars deployed to Vercel.
- Confirmed Supabase billing: Pro with spend cap = no surprise charges; daily backups included; PITR ~$100/mth extra, not needed yet.
- Created migration 007 (RLS cleanup: remove duplicate favorites policies and stale payments policy). Not yet applied.
- Vercel MCP requires re-authentication (user action needed).
- Follow-up: apply migration 007, configure Supabase custom SMTP with Resend (`noreply@muuday.com`), verify Vercel spending limits, verify Checkly checks.

### Entry 20 (2026-03-30) — Wave 0 closed, Wave 1 started
- **Wave 0 formally closed.** All exit criteria met.
- Vercel MCP reconnected and verified (project READY, team confirmed).
- Applied migration 008 (Wave 1 taxonomy + tiers schema): specialties table, professional_specialties junction, tier column on professionals, category_id FK, tag_suggestions table, RLS for all taxonomy tables.
- Applied migration 009 (taxonomy seed): consolidated 8 categories to new slugs, seeded 23 subcategories and 59 specialties matching search-config, backfilled category_id on existing professionals.
- Updated middleware for role-based route guards: public search (/buscar, /profissional), professional-only routes, admin-only routes, redirect param on login.
- Created `lib/tier-config.ts` with tier entitlement limits (specialties, tags, services, booking window per tier).
- Updated `types/index.ts` CATEGORIES to match new taxonomy slugs.
- Updated `lib/search-config.ts` legacy slug mapping with English DB slugs.
- Updated `lib/actions/professional.ts` to accept new + legacy category slugs.
- Build passes clean (0 errors, 0 warnings).
- Follow-up: admin taxonomy CRUD UI, search ranking refinement, review constraints, profile card trust signals.

### Entry 21 (2026-03-30) — Wave 1 core delivery
- Made search (`/buscar`) and professional profiles (`/profissional/[id]`) publicly accessible without login. Layout handles unauthenticated users with "Entrar" button.
- Login page now supports `?redirect=` param for post-login navigation (booking intent → login → booking).
- Created admin taxonomy CRUD page at `/admin/taxonomia`: tree view of categories → subcategories → specialties with inline edit, add, activate/deactivate. Tag suggestions moderation tab.
- Added tier-aware relevance ranking to search: weighted score from rating (50%), volume signals (35%), tier boost (15% premium, 8% professional).
- Added tier badges on search cards and professional profiles (Premium/Profissional visual indicators).
- Applied migration 010: review uniqueness constraint (one review per user-professional pair), professional_response + professional_response_at columns, updated_at for edit lifecycle.
- Professional profile page: shows professional response on reviews, uses new taxonomy category labels, tier badges.
- Updated professional profile page to use search-config category labels instead of hardcoded CATEGORIES.
- Build: 0 errors, 0 warnings.
- Wave 1 exit criteria status: taxonomy CRUD ✅, tier limits config ✅, search ranking ✅, review constraints ✅, route guards ✅, public search ✅.

### Entry 22 (2026-03-30) — Reliability and operations hardening
- Added Sentry hardening updates:
  - `instrumentation-client.ts` now exports `onRouterTransitionStart`.
  - `next.config.js` moved from deprecated `disableLogger` to `webpack.treeshake.removeDebugLogging`.
  - client init moved to `instrumentation-client.ts` (removed `sentry.client.config.ts` to avoid Turbopack deprecation path).
- Added PostHog feature-flag baseline in booking checkout:
  - `lib/analytics/feature-flags.ts`
  - `booking_recurring_enabled` controls recurring package visibility without breaking default behavior.
- Added migration `011-favorites-rls-safety-net.sql` to ensure canonical favorites RLS policies are always present.
- Fixed `/login` static prerender blocker by wrapping `useSearchParams` usage in `Suspense`.
- Cleaned legacy React hook dependency warnings in admin/settings/profile pages (`next lint` now clean).
- Updated migration `008-wave1-taxonomy-tiers.sql` to bootstrap base taxonomy tables (`categories`, `subcategories`) for clean environments.
- Updated schema snapshot `db/sql/schema/supabase-schema.sql` to include Wave 1 and review-constraint entities through migration 011.
- Added Inngest integration doc + env slots (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`) in `.env.local` and `.env.local.example`.
- Formalized monitoring ownership and incident SLA in operational docs and handover files.

### Entry 23 (2026-03-30) — Auth validation path without Inngest dependency
- Added operational smoke script `scripts/ops/validate-supabase-auth-flow.cjs` to validate Supabase signup + reset-password flows.
- Added `npm run auth:validate-smoke` script in `package.json`.
- Updated environment template with `SUPABASE_AUTH_TEST_EMAIL`.
- Updated setup/integration/handover/human-actions docs to make auth email validation execution-ready.

### Entry 24 (2026-03-30) — Signup failure diagnosis and safety migration
- Executed real auth smoke test; signup failed with Supabase `unexpected_failure` (`Database error saving new user`).
- Added migration `012-auth-signup-trigger-hardening.sql` with canonical role normalization and resilient profile upsert trigger behavior.
- Updated status/handover/human-actions docs to treat migration 012 as immediate production action before re-running auth smoke checks.

### Entry 25 (2026-03-30) — Wave 0 verification closure
- Confirmed operator applied migrations `011` and `012` in production.
- Confirmed auth smoke validation succeeded (signup + reset flow).
- Updated next-steps/project-status/current-state/human-actions to remove resolved blocker and keep only remaining pre-Wave-2 human checks.

### Entry 26 (2026-03-30) — Inngest activation path + Wave 2 kickoff
- Replaced Inngest placeholder with first non-critical workflow: `sync-booking-reminders` (cron + event trigger).
- Extracted reminder sync logic to `lib/ops/booking-reminders.ts` and reused it from both cron endpoint and Inngest function.
- Added migration `013-wave2-dual-gate-first-booking.sql` and implemented dual-gate booking enforcement in app/admin flows.
- Updated docs/handover/human-actions with production actions: apply migration 013 and complete Inngest cloud key/sync setup.

### Entry 27 (2026-03-30) — Wave 2 request-booking foundation delivery
- Added migration `014-wave2-request-bookings-foundation.sql` and synced canonical schema snapshot.
- Implemented request-booking server actions in `lib/actions/request-booking.ts`:
  - create request
  - professional offer proposal
  - professional decline
  - user accept proposal (conversion to booking + payment record)
  - user decline/cancel
  - proposal expiration handling
- Added new user route `/solicitar/[id]` and UI form component `components/booking/RequestBookingForm.tsx`.
- Extended `/agenda` with request-booking queue and role-specific actions via `components/booking/RequestBookingActions.tsx`.
- Updated professional profile CTA to expose "Solicitar horario" when tier allows.
- Search UX adjustment: removed top category chip strip from `/buscar` and made price display/filters currency-aware from user profile preference (`/buscar`, `/favoritos`, `/profissional/[id]`).
- Tightened middleware role split for user-only routes (`/agendar`, `/solicitar`, `/favoritos`).
- Validated code with `lint`, `typecheck`, `build`, and `test:e2e` (2 passed, 1 skipped).
- Verified Inngest endpoint health in production (`https://muuday-app.vercel.app/api/inngest` returned cloud mode with key detection and 1 function).

### Entry 28 (2026-03-30) — Search currency patch + request transition hardening
- Repaired `/buscar` filter labels so min/max price reflects selected currency symbol instead of fixed BRL text.
- Enforced dynamic render on `/buscar` to reduce stale profile-currency reads.
- Removed the top category-chip strip from search results area (category now lives in the horizontal filter bar).
- Moved search filters to a horizontal bar under the main search input.
- Enforced specialty dependency on category selection.
- Switched location/country UX to full country names and data-driven options from current professionals.
- Wired request-booking server actions to explicit transition guard (`assertRequestBookingTransition`) and status-matching updates (`.eq('status', currentStatus)`) for safer concurrent updates.
- Validation: `npm run lint`, `npm run typecheck`, `npm run build` all passed locally.

### Entry 29 (2026-03-30) — Wave 2 role-based navigation and route hardening
- Updated app shell navigation by role:
  - user: Buscar, Bookings, Favoritos, Perfil
  - professional: Dashboard, Calendario, Financeiro, Configuracoes
- Updated app logo destination to landing page (`/`) for desktop and mobile headers.
- Added `/financeiro` route (professional/admin) as Wave 2 financial surface stub, preserving Stripe-heavy implementation for Wave 3.
- Tightened middleware guards for professional-only workspace routes and user-only route redirect behavior.

### Entry 30 (2026-03-30) — Wave 2 transition-test automation
- Added `scripts/ops/test-state-machines.cjs`.
- Added npm command `npm run test:state-machines`.
- Validation covers:
  - booking transition map structure and required edges
  - request-booking transition map structure and required edges
  - terminal-state immutability checks

### Entry 31 (2026-03-30) — Recurring timeout cascade hardening
- Updated `api/cron/booking-timeouts` to cascade recurring parent timeout cancellation into:
  - child recurring bookings in pending confirmation path
  - booking_sessions rows for the same parent
- Goal: release recurring inventory quickly when manual confirmation SLA expires.

### Entry 32 (2026-03-30) — Public landing + role-split navigation baseline in app
- Replaced root redirect page with full public landing at `/` (no forced redirect to login/search).
- Added public top navigation baseline per source-of-truth: Home, Buscar profissionais, Registrar como profissional, Sobre nos, Ajuda, Login.
- Added new public pages: `/sobre`, `/ajuda`, `/registrar-profissional`.
- Added public language/currency controls in header with cookie persistence (`muuday_public_language`, `muuday_public_currency`).
- Updated `/buscar` to support logged-out currency preference via `moeda` query/cookie and carry it through filter/sort/pagination.
- Updated public professional booking CTAs to sign-up-first path (`/cadastro?role=usuario&redirect=...`).
- Updated signup flow to accept role preselection and safe redirect handling after account creation.

### Entry 33 (2026-03-30) — Wave 2 B3 professional workspace execution batch
- Restored and upgraded `/agenda` into professional control-center structure with view modes:
  - `overview`, `pending`, `requests`, `settings`
  - context-aware pending/request sections and booking-rule visibility
  - role-specific alerts integrated in agenda surface
- Expanded `/dashboard` action-first behavior remains active and connected to workspace-health alerting.
- Reworked `/configuracoes` into role-aware surface:
  - users keep preferences flow
  - professionals get business-oriented setup hub (profile/services, calendar, booking rules, finance) with account health context
- Implemented source-of-truth unauthenticated booking modal behavior on `/profissional/[id]`:
  - signup primary
  - login secondary
  - redirect preserved for booking intent
- Added professional workspace e2e suite:
  - `tests/e2e/professional-workspace.spec.ts`
  - added env template keys `E2E_PROFESSIONAL_EMAIL`, `E2E_PROFESSIONAL_PASSWORD`
  - run result: 1 passed, 3 skipped (professional creds not configured in local env)

### Entry 34 (2026-03-30) — Wave 2 C onboarding gate-matrix implementation batch
- Added migration `015-wave2-onboarding-gate-matrix-foundation.sql`:
  - `professional_services` table (C4 service structure baseline)
  - `professional_settings` readiness flags for C6/C7 (`billing_card_on_file`, `payout_onboarding_started`, `payout_kyc_completed`)
  - compatibility backfill for existing professionals.
- Added centralized onboarding evaluation engine:
  - `lib/professional/onboarding-gates.ts`
  - `lib/professional/onboarding-state.ts`
- Wired first-booking eligibility to onboarding gate checks in:
  - `lib/actions/booking.ts`
  - `lib/actions/request-booking.ts`
  - `/agendar/[id]`
  - `/solicitar/[id]`
- Added `/onboarding-profissional` route with:
  - C1-C10 stage status
  - gate status cards
  - C10 matrix rendering
  - submit-for-review action integration (`lib/actions/professional-onboarding.ts`).
- Updated professional UX surfaces:
  - `/configuracoes` now shows onboarding gate visibility + readiness controls
  - `/perfil` now links directly to onboarding checklist
  - `/completar-perfil`, `/editar-perfil-profissional`, and `lib/actions/professional.ts` now sync primary service baseline into `professional_services`.
- Validation run:
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run lint` ✅
  - `npm.cmd run test:state-machines` ✅

### Entry 35 (2026-03-30) — Journey restoration hotfix (role routing and role scope)
- Fixed login redirect logic to respect role-based default journeys:
  - `profissional` -> `/dashboard`
  - `usuario` and `admin` -> `/buscar`
  - explicit safe `redirect` param still has priority.
- Fixed middleware auth-page redirect (`/login`, `/cadastro`) to route by role instead of forcing `/buscar`.
- Tightened route guard semantics:
  - professional workspace routes now require `profissional` role only.
  - user journeys (`/agendar`, `/solicitar`, `/favoritos`) now allow `usuario` and `admin`.
- Updated app shell navigation for admin to support admin+user operation model:
  - Buscar, Agenda, Favoritos, Perfil, Admin.
- Restored admin user-settings journey by removing forced redirect from `/configuracoes` to `/admin`.
- Prevented role-drift records from leaking into discovery journeys:
  - `/buscar` now filters professionals by joined `profiles.role = profissional`.
  - `/profissional/[id]` now requires linked `profiles.role = profissional`.
- Corrected `/agenda` role inference to use `profiles.role` instead of the mere existence of a `professionals` row.
- Validation run:
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run lint` ✅

### Entry 36 (2026-03-30) — Auth/cadastro stabilization + fantasy professionals
- Logout flow adjusted to return to landing (`/`) instead of `/login`.
- Login error handling improved:
  - explicit message for unconfirmed email
  - explicit message for oauth callback failure.
- OAuth callback hardened:
  - handles exchange errors with deterministic redirect
  - bootstraps missing profile row for social auth fallback
  - redirects by role after successful session exchange.
- Signup (`/cadastro`) upgraded:
  - role icons restored
  - password confirmation field added
  - full country list enabled
  - professional flow now collects expanded onboarding fields (headline/category/specialties/languages/jurisdiction/experience/price/duration) in metadata.
- Added canonical country source module `lib/countries.ts` (backed by `countries-list`) and wired `COUNTRIES` export through `lib/utils/index.ts`.
- Reduced social auth surface in UI to Google provider for stability in current environment.
- Seeded 8 fantasy approved professionals across all target categories (marker tag `seed_fantasy_wave2_20260330`) including availability rows for filter/testing coverage.
- Validation run:
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run lint` ✅

### Entry 37 (2026-03-30) — Duplicate professional row resilience patch
- Added `lib/professional/current-professional.ts` as canonical resolver for professional row selection by `user_id` (single-row deterministic fallback).
- Replaced fragile `.single()`/`.maybeSingle()` lookups by `user_id` in core professional flows:
  - `/dashboard`, `/agenda`, `/perfil`, `/financeiro`, `/configuracoes`, `/configuracoes-agendamento`, `/disponibilidade`, `/editar-perfil-profissional`, `/completar-perfil`, `/onboarding-profissional`
  - `lib/actions/professional.ts`, `lib/actions/professional-onboarding.ts`, `lib/actions/manage-booking.ts`, `lib/actions/request-booking.ts`
- Goal: avoid professional journey regression when seed/legacy data has multiple rows in `professionals` for one account.
- Validation run:
  - `npm.cmd run typecheck` ✅
  - `npm.cmd run lint` ✅
  - `npm.cmd run build` ✅

### Entry 32 (2026-03-31) — Recovery Sprint UX/estabilidade (fase 1)
- Created branch `codex/recovery-sprint-ux-stability` and locked recovery scope to UX/stability only.
- Reworked public header for mobile hamburger navigation with visible language/currency controls and login/minha área access.
- Rewrote public-facing copy on `/`, `/sobre`, `/ajuda`, `/registrar-profissional` to remove internal product jargon.
- Hardened auth/OAuth flow:
  - `SocialAuthButtons` now forwards safe redirect intent to callback.
  - `/auth/callback` now handles `next` redirect safely, profile bootstrap fallback, and role-aware routing.
  - login messages and labels normalized in PT-BR.
- Improved signup journey quality:
  - kept professional 3-step model.
  - added inline field validation and error summary handling.
  - preserved role icons, country list, confirm password, category select, and expanded professional fields.
- Implemented search recovery foundation:
  - canonical query-state contract consolidated in `/buscar`.
  - added `components/search/MobileFiltersDrawer.tsx` and replaced long mobile collapsible filters with drawer behavior.
- Professional/profile UX recovery:
  - dashboard rewritten with explicit UI status mapping to avoid raw internal state leakage.
  - profile page uses avatar image when available with fallback to initial.
  - mobile sticky booking CTA now supports signup-first flow for visitors via modal.
- Favorites UX recovery:
  - explicit success/error feedback on remove.
  - loading/disabled hardening + aria-live status feedback.
- Validation status:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` pending final rerun after docs updates.

### Entry 33 (2026-03-31) — Recovery gate validation and E2E stabilization
- Re-ran recovery gate on `codex/recovery-sprint-ux-stability` with professional credentials.
- Fixed E2E drift:
  - `tests/e2e/professional-workspace.spec.ts` now uses unambiguous `Calendario` link selector.
  - `tests/e2e/booking-critical.spec.ts` now skips deterministically when booking route redirects to profile due first-booking gate (`erro=primeiro-agendamento-bloqueado`) or self-booking guard.
- Final technical gate results:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅
  - `npm run test:e2e` ✅ (`4 passed`, `3 skipped`, `0 failed`).
- Follow-up: configure deterministic booking fixtures (`E2E_PROFESSIONAL_ID`, `E2E_MANUAL_PROFESSIONAL_ID`) to remove remaining skips and complete full Wave 2 acceptance coverage.

### Entry 34 (2026-03-31) — Recovery gate closure (zero-skip E2E)
- Configured deterministic E2E fixtures for booking coverage:
  - auto-accept professional fixture with gate minimums complete
  - manual-confirmation professional fixture with gate minimums complete
- Updated local `.env.local` with professional E2E credentials and both professional IDs used by booking tests.
- Resolved final booking-test skip by ensuring slot visibility fixture conditions (availability/settings) on the auto-accept professional.
- Full technical gate rerun result:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅
  - `npm run test:e2e` ✅ (`7 passed`, `0 skipped`, `0 failed`)
- Follow-up: proceed with remaining Wave 2 backlog (recurring deadlines/slot release, migration 015 production validation, onboarding C1-C10 acceptance).

### Entry 38 (2026-03-31) — Production unexpected-error stability patch
- Goal: stop live pages from collapsing into global error screen (`Ocorreu um erro inesperado`) under transient server-side runtime failures.
- Applied guarded server-side fallbacks:
  - `app/(app)/layout.tsx`: Supabase user/profile reads wrapped in `try/catch`; fallback to non-auth state.
  - `components/public/PublicPageLayout.tsx`: public layout changed to auth-agnostic SSR mode (no blocking auth/profile reads in public render path).
  - `app/(app)/buscar/page.tsx`: resilient guards around auth/profile/professional reads to avoid crashing route on transient Supabase failures.
  - `app/layout.tsx`: headers/cookies country detection wrapped in safe fallback (`BR`).
- Repository hygiene:
  - `.cursor/` added to `.gitignore` to avoid accidental commit noise from Cursor workspace artifacts.
- Validation run:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
- Next follow-up:
- redeploy branch and confirm `/` + `/buscar` + `/login` load without global error.

### Entry 39 (2026-03-31) — Public route runtime crash root cause fix
- Root cause confirmed for persistent production 500 on `/` and `/buscar`:
  - `components/public/PublicFooter.tsx` used `onClick` + `window` but was compiled as a server component (missing `'use client'`).
  - This affected pages rendered through `PublicPageLayout` while `/login` remained healthy (different layout path).
- Fix applied:
  - marked `PublicFooter` as client component with `'use client'`.
- Validation:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅

### Entry 40 (2026-03-31) — Search compact auto-apply UX implementation
- Implemented compact filter UX in `/buscar` focused on tablet/iPad density:
  - reduced filter bar visual height and control spacing.
  - removed desktop `Aplicar` button and moved to automatic query updates.
- Implemented canonical auto-apply behavior:
  - text query applies on blur.
  - category/specialty/availability/language/sort and price range apply immediately.
  - every filter mutation forces `pagina=1`.
- Updated mobile drawer behavior:
  - filters apply in real time without closing the drawer.
  - explicit `Limpar filtros` shortcut kept as reset action.
- Price improvements:
  - slider step set to `1`.
  - min/max interaction stabilized with invariant `min <= max`.
  - search card prices now render rounded up with no decimals.
- Availability feedback:
  - total available professionals now shown between filter block and card list with active filter context.
- Validation:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 38 (2026-03-31) — Search slider + auth redirect + public header auth actions
- Fixed `/buscar` price range slider interaction so the minimum thumb can move up/down from zero consistently.
- Hardened auth redirect sanitization across password + OAuth flows to prevent redirecting to `/` after successful login.
- Updated `PublicHeader`:
  - added explicit desktop `Criar conta` button next to `Login`.
  - login now opens compact auth popup with `Entrar` and `Criar conta` options.
- Validation run:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 39 (2026-03-31) — Search bar separation + unified cards + message CTA
- Added separated search query bar on `/buscar` (`components/search/SearchQueryBar.tsx`) for both logged and logged-out views.
- Removed duplicate embedded query inputs from desktop/mobile filter blocks to keep query UX canonical.
- Updated `/buscar` card layout to a single unified format across auth states:
  - avatar photo fallback,
  - name,
  - specialty (in place of category),
  - expandable tags,
  - rounded integer price,
  - short bio,
  - badges,
  - country,
  - spoken languages,
  - no session-duration badge.
- Replaced `Solicitar horário` action in search cards with `Mandar mensagem`.
- Added protected `/mensagens` route as current message intent destination and protected it in middleware.
- Validation run:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 40 (2026-03-31) — Fixed post-login routing by role
- Added `lib/auth/post-login-destination.ts` and centralized post-login routing policy.
- Enforced fixed destinations for all login paths:
  - `profissional` -> `/dashboard`
  - `usuario` and `admin` -> `/buscar`
- Applied policy to password login surfaces (`/login` page and shared `LoginForm`) and OAuth callback (`/auth/callback`).
- Removed action-return messaging in search modal login to match new routing policy.
- Validation run:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 41 (2026-03-31) — Header login popup converted to full auth form
- Replaced lightweight header auth menu with full `LoginForm` inside `AuthOverlay`.
- Increased overlay footprint:
  - modal max width from `max-w-md` to `max-w-lg`
  - popover width from `360px` to `440px`
- Updated login helper copy to requested text: `Ainda nao eh membro? Criar conta`.
- Confirmed mobile behavior remains centered modal popup due `popover -> modal` fallback in `AuthOverlay`.
- Validation run:
  - `npm run lint` ✅
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run test:state-machines` ✅

### Entry 42 (2026-03-31) — Search card subtitle with dynamic session duration
- Updated `/buscar` card subtitle from `por sessão` to `por sessão de X min`.
- Duration now reads from `session_duration_minutes` with fallback `60`.

### Entry 38 (2026-03-31) — Public profile permalink foundation (`nome-1234`)
- Added canonical profile URL helper `lib/professional/public-profile-url.ts` with slug generation, 4-digit code normalization, and legacy UUID compatibility.
- Updated profile link generation in critical surfaces: `/buscar`, `/favoritos`, `/dashboard`, `/admin`, and `/mensagens`.
- Updated `/profissional/[id]` to resolve both URL formats: legacy UUID and new slug+code (`nome-1234`).
- Added DB migration `016-professional-public-profile-code.sql`:
  - adds `professionals.public_code`
  - backfills unique 4-digit codes for existing rows
  - adds uniqueness/range constraints
  - adds insert trigger to auto-assign new codes.
- Updated schema snapshot through migration 016.
- Validation run passed: `lint`, `typecheck`, `build`, `test:state-machines`.
- Follow-up: apply migration 016 in production before expecting canonical slug URLs for all existing professional profiles.

### Entry 39 (2026-03-31) — Public header auth-state correction (`Minha área`)
- Fixed public header login-state behavior after authentication.
- `components/public/PublicHeader.tsx` now checks session client-side and subscribes to auth state changes.
- Logged-in state now reliably hides `Login/Criar conta` and shows `Minha área`.
- Portuguese label standardized with accent (`Minha área`).
- Validation passed: `lint`, `typecheck`, `build`, `test:state-machines`.

### Entry 40 (2026-03-31) — Google OAuth login loop fix
- Fixed OAuth callback redirect origin handling in `app/auth/callback/route.ts`.
- Callback now uses `request.nextUrl.origin` instead of static app base URL to avoid cross-domain cookie loss.
- Hardened first-login profile bootstrap with `upsert` before destination routing.
- Role-based post-login destination preserved for all methods:
  - `profissional` -> `/dashboard`
  - `usuario/admin` -> `/buscar`
- Validation passed: `lint`, `typecheck`, `build`, `test:state-machines`.

### Entry 41 (2026-03-31) — Auth pages logo navigation to home
- Updated `app/(auth)/layout.tsx` so Muuday logo is clickable and routes to `/`.
- Applied to both desktop and mobile auth headers.
- Affects login/signup/auth flow pages using auth layout.
- Validation passed: `lint`, `typecheck`, `build`, `test:state-machines`.

### Entry 42 (2026-03-31) — Signup country defaults for timezone and currency
- Updated `app/(auth)/cadastro/page.tsx` country-change behavior for user signup.
- Selecting a country now auto-applies timezone and preferred currency defaults consistently.
- Timezone and currency remain manually editable after auto-fill (no forced lock).

### Entry 43 (2026-03-31) — Professional signup review-first expansion
- Expanded professional signup flow in `app/(auth)/cadastro/page.tsx`:
  - required title dropdown above full name.
  - country now auto-applies timezone and currency defaults for professional accounts (editable afterwards).
  - specialty now uses approved autocomplete with custom suggestion + validation-message path.
  - renamed tags wording to `Foco de atuação`.
  - added primary + secondary language capture.
  - added qualification/certificate attachment picker and optional note.
- Professional signup destination changed to `/cadastro/profissional-em-analise` (approval-email waiting state) instead of direct dashboard redirect.
- Added new page `app/(auth)/cadastro/profissional-em-analise/page.tsx`.
- Added migration `017-wave2-professional-signup-review-pipeline.sql` + schema snapshot updates to persist and moderate professional applications.

### Entry 44 (2026-03-31) — Hotfix do slider de preço em `/buscar`
- Corrigido bug crítico no filtro de preço onde mínimo e máximo ficavam travados em `0` (especialmente iPad/Safari).
- `components/search/PriceRangeSlider.tsx` foi reimplementado com dual-thumb custom (pointer events + teclado) para evitar conflito de `input[type=range]` sobreposto.
- Mantidos:
  - passo de `1 em 1`
  - regra `mínimo <= máximo`
  - atualização automática dos filtros
  - campos hidden compatíveis para formulário.
- Validação executada: `lint`, `typecheck`, `build`, `test:state-machines` (todos verdes).

### Entry 45 (2026-03-31) — Hotfix de vínculo filtros x cards em `/buscar`
- Corrigido filtro de disponibilidade para usar `readClient` (mesmo client dos cards) em vez de `supabase` fixo.
- Adicionado fallback para não limpar resultados quando a consulta de disponibilidade falhar por contexto/RLS.
- Objetivo: evitar zero resultados falso ao aplicar filtros (principalmente `Horário`).
- Validação executada: `lint` e `typecheck` verdes.

### Entry 46 (2026-03-31) — Taxonomia de profissões reais expandida e integrada
- Criada migration `018-wave2-real-professions-taxonomy.sql` com expansão ampla de profissões reais verificáveis, organizadas por categoria/subcategoria.
- Incluída lógica de backfill para profissionais existentes:
  - mapeamento por `professional_applications.specialty_name`
  - mapeamento por arrays legados (`professionals.subcategories`/`tags`)
  - fallback por categoria quando não houver mapeamento direto
  - sincronização de compatibilidade para `professionals.subcategories`.
- Adicionado helper canônico `lib/taxonomy/professional-specialties.ts` para:
  - carregar catálogo ativo de taxonomia
  - montar opções de especialidade por categoria
  - carregar contexto de especialidades por profissional.
- Integrações de UI entregues:
  - `/buscar`: filtros e matching passam a considerar especialidades canônicas.
  - `/cadastro`: especialidades aprovadas por categoria vindas da taxonomia canônica.
  - `/profissional/[id]`, `/perfil`, `/admin`: exibição de especialidades canônicas com `Foco de atuação` separado.
- Validação concluída com sucesso:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:state-machines`

### Entry 47 (2026-04-01) — Ajuste de copy do email de confirmação de cadastro (usuário)
- Atualizado o template Supabase `Confirm sign up` em `scripts/ops/update-supabase-templates.ts` para alinhar o texto ao padrão dos outros emails transacionais da Muuday.
- Mudanças aplicadas:
  - badge/título de abertura mais direto para ativação de conta;
  - corpo com benefício contextual pós-confirmação;
  - instrução explícita de fallback para copiar/colar URL;
  - assunto alterado para `Ative sua conta na Muuday`.
- Escopo: apenas conteúdo/editorial do template; layout/tokens visuais foram preservados.
- Ação pendente para efetivar em produção: executar script com token de management do Supabase.

### Entry 48 (2026-04-01) — Correção de estabilidade do filtro de preço em `/buscar`
- Corrigido bug de parsing em filtros client-side (`DesktopFiltersAutoApply`, `MobileFiltersDrawer`) onde `precoMax=''` era interpretado como `0`.
- Efeito corrigido:
  - slider no default volta a representar faixa completa (mínimo até máximo);
  - thumb máximo não sofre reset para `0` ao finalizar interação.
- Hardening adicional no componente `PriceRangeSlider`:
  - `pointerdown` dos thumbs agora evita propagação para o trilho;
  - cálculo de `pointermove` passa a usar refs atuais (`minRef/maxRef`) para reduzir jitter/efeitos de estado obsoleto.
- Validação executada com sucesso:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`

### Entry 49 (2026-04-01) — Filtro de especialidade alinhado à taxonomia canônica
- Ajustada a lógica de `/buscar` para que o filtro de especialidade use apenas especialidades reais da categoria selecionada.
- Fonte de opções:
  - prioritariamente taxonomia ativa no banco (`categories/subcategories/specialties`);
  - fallback para catálogo estático por categoria somente quando taxonomia não estiver disponível.
- Removidas `tags`/`Foco de atuação` da montagem de opções de especialidade.
- Matching de filtro alterado para igualdade em especialidade canônica (sem busca em tags/bio).
- Validação executada com sucesso:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`

### Entry 50 (2026-04-01) — Idioma público fixado em Português
- Atualizado `lib/public-preferences.ts` para suportar apenas idioma público `pt-BR`.
- Removidas opções públicas `en-US` e `es-ES` do seletor de idioma.
- `resolveDefaultLanguageFromAcceptLanguage` agora retorna sempre `pt-BR`.
- `PublicHeader` (desktop e mobile) foi ajustado para idioma fixo em Português no botão superior.
- Validação executada com sucesso:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`

### Entry 51 (2026-04-01) — Página do profissional reestruturada com agenda in-page
- Reestruturada `app/(app)/profissional/[id]/page.tsx` para remover duplicidades e consolidar booking na própria página.
- Atualizações entregues:
  - especialidade exibida uma única vez no topo;
  - categoria removida do cabeçalho;
  - `Foco de atuação` preservado;
  - seções separadas de `Sobre mim`, `Idiomas`, `Rating` e `Comentários`;
  - adicionado carrossel de recomendações (`Pessoas que você também pode gostar`).
- Disponibilidade/agendamento migrados para `components/professional/ProfileAvailabilityBookingSection.tsx`:
  - calendário + seleção de horário;
  - duração variável (30/50/60/90 + base do profissional);
  - recorrência com opção de pacotes;
  - preço dinâmico por duração no card lateral;
  - cópia de confiança mantida (cancelamento, vídeo, conversão de fuso).
- CTA secundário padronizado para `Mandar mensagem` em `components/auth/PublicBookingAuthModal.tsx`.
- Validação técnica concluída:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`

### Entry 52 (2026-04-01) — Consolidação de workspace e migração de artefatos do OneDrive
- Confirmado `C:\dev\muuday-app` como único workspace ativo da Muuday.
- Migrados artefatos úteis do workspace legado (`C:\Users\igorp\OneDrive\Documents\Muuday`) para:
  - `artifacts/onedrive-import-2026-04-01/`
- Arquivos importados:
  - `ux-blueprint.html`
  - `refero-main.js`
  - `pdf-page.png`
  - `DO_NOT_USE_FOR_ACTIVE_DEV.txt`
- Criado manifesto de migração:
  - `artifacts/onedrive-import-2026-04-01/MIGRATION_MANIFEST.md`
- Workspace legado recebeu reforço de sinalização:
  - atualização de `DO_NOT_USE_FOR_ACTIVE_DEV.txt`
  - criação de `OPEN_ACTIVE_REPO.txt` apontando para `C:\dev\muuday-app`

### Entry 53 (2026-04-01) — Modal de login unificado no perfil profissional (visitante)
- Atualizado `ProfileAvailabilityBookingSection` para reutilizar `SearchBookingCtas`.
- Comportamento resultante:
  - visitante em `/profissional/[id]` ao clicar `Agendar sessão` ou `Mandar mensagem` abre o mesmo modal da busca (`AuthOverlay + LoginForm`);
  - usuário logado mantém navegação direta para as rotas de agendamento e mensagem.
- `SearchBookingCtas` ganhou labels configuráveis (`bookLabel`, `messageLabel`) sem alterar o comportamento existente em `/buscar`.
- Validação executada com sucesso:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`

### Entry 54 (2026-04-01) — Seletor de moeda no perfil profissional para visitante
- Ajustada a regra de visibilidade do seletor de moeda no `PublicHeader`.
- Visitante deslogado agora vê o mesmo controle de moeda em:
  - `/buscar`
  - `/profissional/[id]`
- Sessão logada mantém comportamento atual (controle de moeda não é exibido no header autenticado).

### Entry 55 (2026-04-01) — Recorrência do perfil para agendamento em lote
- Ajustado `app/(app)/agendar/[id]/page.tsx` para consumir parâmetros de prefill:
  - `tipo` (`one_off` | `recurring`)
  - `sessoes` (2..12)
  - `data` (`YYYY-MM-DD`)
  - `hora` (`HH:mm`)
- `components/booking/BookingForm.tsx` agora:
  - recebe prefill inicial de recorrência;
  - aplica prefill de data/horário quando válido;
  - expande pacote recorrente para seleção de `2..12` sessões.
- `components/professional/ProfileAvailabilityBookingSection.tsx` agora:
  - expande seleção recorrente para `2..12` sessões;
  - bloqueia toggle de recorrência quando `enable_recurring` estiver desativado.
- Resultado funcional: usuário seleciona recorrência e quantidade e confirma todas as sessões em um único envio do checkout.
- Validação executada:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`

### Entry 56 (2026-04-01) — Recuperação de senha com entrega robusta
- Criado endpoint `app/api/auth/password-reset/route.ts` para centralizar o fluxo de recuperação:
  - validação de payload (`email`);
  - rate-limit com chave `ip+email` (preset `auth`);
  - redirect canônico com `getAppBaseUrl()/auth/callback`.
- Entrega principal implementada via:
  - `createAdminClient().auth.admin.generateLink({ type: 'recovery' })`
  - envio de template de reset por Resend (`sendPasswordResetEmail`).
- Fallback mantido para `supabase.auth.resetPasswordForEmail` quando caminho admin não estiver disponível.
- `app/(auth)/recuperar-senha/page.tsx` migrada para consumir a nova API e melhorar a mensagem de confirmação para o usuário.
- Validação executada:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`

### Entry 57 (2026-04-01) — Perfil do usuário consolidado com configurações de conta
- Página `app/(app)/perfil/page.tsx` agora incorpora o bloco completo de conta sem depender de navegação para `/configuracoes`.
- Criado componente `components/profile/ProfileAccountSettings.tsx` com:
  - `Idioma e região` (fuso horário + moeda);
  - `Notificações` (toggles persistidos em `profiles.notification_preferences`);
  - `Segurança` (atalho para recuperação de senha);
  - `Zona de risco` (logout).
- Rota `app/(app)/configuracoes/page.tsx` foi convertida para gate de papel:
  - usuário/admin redirecionam para `/perfil`;
  - profissional mantém acesso ao workspace de configurações (`components/settings/ProfessionalSettingsWorkspace.tsx`).
- Validação executada:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`

### Entry 58 (2026-04-01) — Bloqueio de contratação para contas profissionais
- Regra de produto aplicada no servidor:
  - conta `profissional` não pode contratar/agendar com outro profissional.
- Implementação:
  - `app/(app)/agendar/[id]/page.tsx`: valida `profiles.role` e redireciona profissional para `/dashboard?erro=conta-profissional-nao-pode-contratar`.
  - `app/(app)/solicitar/[id]/page.tsx`: mesma validação e mesmo redirecionamento.
- Cobertura de regressão:
  - novo teste E2E em `tests/e2e/professional-workspace.spec.ts` valida bloqueio em ambos os entry points.
- Resultado esperado:
  - somente conta `usuario` pode passar pelos fluxos de contratação; profissionais atuam apenas no workspace provider.

### Entry 59 (2026-04-01) — Automação operacional para rotação de secrets
- Criado register estruturado para rotação:
  - `docs/engineering/runbooks/secrets-rotation-register.json`
- Criados scripts operacionais:
  - `scripts/ops/check-secrets-rotation.cjs` (`npm run secrets:rotation:check`)
  - `scripts/ops/stamp-secrets-rotation.cjs` (`npm run secrets:rotation:stamp`)
  - `scripts/ops/audit-secrets-sync.cjs` (`npm run secrets:sync:audit`)
- Criados workflows agendados:
  - `.github/workflows/secrets-rotation-reminder.yml` (diário, falha em due_soon/overdue com artifact de status).
  - `.github/workflows/secrets-sync-audit.yml` (semanal + manual, valida presença de secrets em GitHub e Vercel).
- Runbook atualizado com comandos e pré-requisitos:
  - `docs/engineering/runbooks/secrets-rotation-runbook.md`.

### Entry 60 (2026-04-02) — Hotfix de compatibilidade em `payments` para restaurar booking
- Incidente observado:
  - qualquer tentativa de booking/request terminava com `Falha ao processar pagamento. Nenhum agendamento foi confirmado.`
  - bookings eram cancelados com `metadata.cancelled_reason = payment_capture_failed`.
- Diagnóstico SQL:
  - `public.payments` possuía campos `NOT NULL` fora do payload atual do app:
    - `base_price_brl`
    - `platform_fee_brl`
    - `total_charged`
  - policy de INSERT em `payments` também estava com comparação tautológica no `WITH CHECK`.
- Ação tomada:
  - criado patch canônico: `db/sql/migrations/026-wave3-payments-insert-compatibility-hotfix.sql`.
  - patch aplica:
    - defaults + backfill para colunas legadas obrigatórias;
    - trigger `trg_fill_payments_legacy_required_fields`;
    - recriação da policy `System creates payments for booking owner` com vínculo estrito booking↔payment.
- Resultado:
  - fluxo de booking voltou a funcionar após aplicação do patch no banco.

### Entry 61 (2026-04-10) — PR-2 onboarding/gates e PR-3 hardening operacional
- PR-2 (branch `codex/onboarding-gates-pr2`, PR `#14`):
  - Basic passou a ser cobrado no checkout de planos (`monthly`/`annual`) com trial de 90 dias, removendo bloqueio legado de Basic gratuito.
  - gate `display_name` passou a usar campo profissional dedicado (`professional_applications.display_name`) no snapshot.
  - credibilidade não bloqueia mais por `0` anos de experiência.
  - gate `payout_receipt` separado de `first_booking_acceptance` (sem depender de `first_booking_enabled`).
  - estágios C8/C9 agora são montados de forma determinística (sem placeholder de completo antes da avaliação final).
  - mensagens de blockers em PT-BR foram normalizadas para remover mojibake.
- validação local PR-2:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`
  - `npm.cmd run test:state-machines`
  - `npm.cmd run test:e2e` (`13 passed`)
### Entry 62 (2026-04-22) — Two-tier availability architecture closure

- Contexto: o sistema mantém duas tabelas de disponibilidade:
  - `availability_rules` (moderna, preferida por todas as superfícies de leitura)
  - `availability` (legada, preservada para compatibilidade)
- Lacuna crítica identificada: a rota `POST /api/professional/onboarding/save` escrevia apenas em `availability`, deixando `availability_rules` vazio ou desatualizado para professionals que salvaram após a migração 005.
- Superfícies de leitura auditadas e corrigidas (todas agora preferem `availability_rules` com fallback para `availability`):
  - `/agenda` (overview + calendário profissional)
  - `/profissional/[id]` (perfil público + slot picker)
  - `/agendar/[id]` (checkout + BookingForm slot picker)
  - `/buscar` (filtro de busca com merge das duas fontes)
  - `/dashboard` (contagem de "Slots ativos")
- Extractions com testes unitários:
  - `lib/search/availability-merge.ts` (6 tests) — merge modern + legacy para busca
  - `lib/booking/slot-filtering.ts` (16 tests) — filtragem pura de slots contra exceções e bookings
  - `components/booking/booking-form-helpers.ts` — deduplicação de `generateTimeSlots`
- Renderização de exceções no calendário profissional:
  - overlays vermelhos em day/week view para blocos de tempo
  - badge "Bloqueado" em month view para bloqueios de dia inteiro
- Dual-write implementado no onboarding save:
  - `safeRulesRows` construídos com weekday, start/end_time_local, timezone, is_active
  - delete + insert atômico em ambas as tabelas
  - rollback simétrico: se `availability_rules` falha, restaura legacy; se settings falha, restaura ambas
- Migração de backfill criada (`062-backfill-availability-rules-from-legacy.sql`):
  - sincroniza `availability_rules` a partir de `availability` para professionals com dados legados
  - usa timezone de `professional_settings` ou fallback 'America/Sao_Paulo'
- Validação:
  - `tsc --noEmit` → pass
  - `npm run test:state-machines` (91 tests) → pass
  - `npm run build` (140/140 static pages) → pass

- PR-3 (branch `codex/hardening-ops-pr3`, em andamento):
  - CI `main` agora exige `SUPABASE_DB_POOLER_URL` e valida pooler em modo produção.
  - evidências operacionais executadas:
    - `npm.cmd run db:validate-pooling` (local/dev informativo),
    - `npm.cmd run audit:auth-role-claims` (`100%` válido, `0%` fallback),
    - `npm.cmd run audit:rls:api` (PASS sem leak para bookings/payments/reviews/messages).


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.


### Entry 63 (2026-04-29) — Pass 22: console.warn → Sentry cleanup

- Scope: replaced all production-facing `console.warn` calls with `Sentry.captureMessage(level: 'warning')` across `lib/`, `components/`, and `app/api/`.
- Files changed (24 total):
  - `lib/payments/revolut/client.ts` — 6 calls (token refresh, missing config, webhook verification)
  - `lib/payments/trolley/client.ts` — 2 calls (missing secret, invalid signature)
  - `lib/payments/debt/monitor.ts` — 1 call (threshold exceeded, with `extra` metadata)
  - `lib/payments/subscription/manager.ts` — 2 calls (missing subscription for payment/failure)
  - `lib/push/sender.ts` — 1 call (admin client unavailable; dev-only warning at line 166 left intact)
  - `lib/push/preferences.ts` — 2 calls (query/unexpected errors)
  - `lib/push/unified-sender.ts` — 2 calls (admin unavailable, Expo push failed)
  - `lib/session/client-tracker.ts` — 2 calls (event rejected/failed)
  - `lib/email/resend-events.ts` — 2 calls (event failed/error)
  - `lib/email/email-action-service.ts` — 1 call (invalid payload)
  - `lib/chat/chat-service.ts` — 1 call (push notification failed)
  - `lib/ops/booking-reminders.ts` — 1 call (push failed)
  - `lib/ops/pending-payment-timeout.ts` — 1 call (push failed)
  - `lib/ops/no-show-detection.ts` — 1 call (push failed)
  - `lib/notifications/quiet-hours.ts` — 2 calls (query/unexpected errors)
  - `lib/config/app-url.ts` — 1 call (missing APP_BASE_URL)
  - `lib/security/rate-limit.ts` — removed redundant `console.warn` (Sentry.captureMessage already present)
  - `components/agenda/ProfessionalAvailabilityWorkspace.tsx` — 1 call (recompute-visibility failed)
  - `components/booking/VideoSession.tsx` — 2 calls (subscribe failed, connection state)
  - `components/pwa/ServiceWorkerRegistration.tsx` — 2 calls (sync failed/error)
  - `components/pwa/PushNotificationToggle.tsx` — 2 calls (VAPID not configured, subscribe API failed)
  - `app/api/professional/onboarding/save/route.ts` — 1 call (subcategories clamped to tier limit)
- Test updates:
  - `lib/payments/debt/monitor.test.ts` — switched from `vi.spyOn(console, 'warn')` to Sentry mock
  - `lib/payments/subscription/manager.test.ts` — added Sentry mock, switched 2 tests from console.warn spy
- Intentionally left untouched (all development-only or pre-Sentry):
  - `lib/analytics/server-events.ts` (`NODE_ENV !== 'production'`)
  - `lib/supabase/server.ts` (`NODE_ENV === 'development'`)
  - `lib/supabase/api-client.ts` (`NODE_ENV === 'development'`)
  - `lib/email/client.ts` (`NODE_ENV !== 'production'`)
  - `lib/push/sender.ts` line 166 (`NODE_ENV !== 'production'`)
  - `lib/booking/creation/logging.ts` (`NODE_ENV === 'development'`, plus Sentry.captureMessage already follows)
  - `lib/config/env.ts` (startup validation before Sentry init)
- Validation:
  - `tsc --noEmit` → pass
  - `vitest run` (relevant test files: 104 tests across 8 files) → all pass

---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.


### Entry 64 (2026-04-29) — Pass 23: Remove redundant force-dynamic + fix any types in critical pages

- Scope: three complementary cleanup tasks across 15 files.
- **Task 1 — Remove redundant `force-dynamic`** (7 files):
  - `app/buscar/page.tsx`, `app/(app)/mensagens/page.tsx`, `app/(app)/financeiro/page.tsx`, `app/(app)/prontuario/[userId]/page.tsx`, `app/(app)/prontuario/page.tsx`, `app/(app)/buscar-auth/page.tsx`, `app/(app)/sessao/[bookingId]/page.tsx`
  - All pages unconditionally call `createClient()` (reads cookies) and/or `redirect()` — already dynamic by Next.js semantics. The explicit `export const dynamic = 'force-dynamic'` was redundant.
- **Task 2 — Fix `any` types in critical app/ pages** (7 files):
  - `app/(app)/agendar/[id]/page.tsx` — removed `professionalProfile as any`, used direct optional chaining
  - `app/(app)/sessao/[bookingId]/page.tsx` — replaced `p: any` with inline `{ id: string | null; full_name: string | null }`
  - `app/(app)/profissional/[id]/page.tsx` — replaced 3 `any` occurrences:
    - `services.map((s: any))` → explicit row type with non-null defaults for `ProfessionalService` compatibility
    - `reviews.map((review: any))` → explicit review type with `profiles` as array (Supabase foreign-table relation)
    - `recommendations.map((item: any))` → `PublicProfessionalRecord`
    - Fixed null-safety for `review.rating` and `item.session_price_brl`
  - `app/(app)/financeiro/page.tsx` — imported `ProfessionalSubscriptionStatus`, removed `subscription as any`
  - `app/(app)/perfil/page.tsx` — replaced 2 `row: any` with inline types for specialty query rows
  - `app/(app)/notificacoes/page.tsx` — defined `NotificationItem` interface (with `action_url` derived by service layer), replaced 5 `any` occurrences
  - `app/(app)/mensagens/[conversationId]/page.tsx` — exported `Message` interface from `MessageThread.tsx`, replaced `messages as any[]` with `Message[]`
- **Task 3 — Fix last production `console.log`**:
  - `components/booking/VideoSession.tsx` — replaced `console.log('[VideoSession] track unpublished', ...)` with `Sentry.captureMessage(level: 'info')`
- Validation:
  - `tsc --noEmit` → pass (0 errors)
  - `vitest run --exclude 'mobile/**'` → all visible tests pass (pre-existing 2 zod codec failures only)
  - Deployed live to https://app.muuday.com

---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.


### Entry 89 (2026-04-29) — Pass 24: Fix remaining `as any` types in booking flow and app pages
- Scope executed:
  - `lib/booking/create-booking.ts` - typed `paymentData` as `PaymentData` (imported from `./creation/prepare-payment`), removed `paymentData as any` cast in `recordBookingPayment` call
  - `app/(app)/servicos/page.tsx` - **fixed real data-shape bug**: `servicesResult.data` is `{ services: unknown[] }`, not an array. Changed to `servicesResult.data.services` and removed `as any[]`. Exported `Service` interface from `ProfessionalServicesManager.tsx` for reuse.
  - `app/(app)/prontuario/page.tsx` - removed `(b as any).profiles`, used `b.profiles?.[0]` (Supabase returns array for this fk relation)
  - `app/(app)/prontuario/[userId]/page.tsx` - removed `record as any` and `notes as any[]`, added explicit `SessionNote` interface, typed `.map()` callback
  - `app/(app)/disputas/[id]/page.tsx` - removed `messages as any[]`, added explicit `CaseMessage` interface, typed `.map()` callback
  - `app/(app)/avaliar/[bookingId]/page.tsx` - replaced `booking.professionals as any` with explicit nested type `{ id?: string; profiles?: { full_name?: string | null } | null } | null`, added fallback `|| ''` for `professionalId` prop
- Files changed: 7
- Validation:
  - `tsc --noEmit` → pass (0 errors)
  - `next build` → 200 static pages, exit 0
  - `vitest run lib/booking/create-booking.test.ts lib/disputes/dispute-service.test.ts` → 63/63 pass
  - Deployed live to https://app.muuday.com (commit `d0487e4`)


### Entry 90 (2026-04-29) — Pass 25: Add server-side timeout to createBooking
- Scope executed:
  - `lib/actions/booking.ts` — wrapped `executeBookingCreation` call with `withTimeout` (12s, matching booking-hang review P1 recommendation)
  - On timeout: `Sentry.captureMessage(level: 'error')` with userId/professionalId context, returns PT-BR error: *"A solicitação demorou muito. Verifique sua conexão e tente novamente."*
  - Slot locks are released safely via `executeBookingCreation`'s `finally` block when the original promise eventually settles (Promise.race does not cancel the underlying promise)
  - Client-side already had 15s timeout (BookingForm.tsx, added in hang review); server-side timeout now covers the full backend flow
- Also verified: BOM CI check already exists in `.github/workflows/ci.yml` (line 56) — booking-hang review P1 #6 was completed earlier
- Files changed: 1
- Validation:
  - `tsc --noEmit` → pass (0 errors)
  - `next build` → 200 static pages, exit 0
  - `vitest run lib/booking/with-timeout.test.ts` → 4/4 pass
  - `vitest run lib/booking/create-booking.test.ts` → 18/18 pass
  - Deployed live to https://app.muuday.com (commit `a919b26`)
  - `/api/health` → 200 OK

### Entry 91 (2026-05-05) — Fix premature booking confirmation email and payment page race condition
- Scope executed:
  - **`lib/booking/create-booking.ts`** — removed `sendBookingConfirmationEmail()` and `sendNewBookingToProfessionalEmail()` from `executeBookingCreation()`. These emails were being sent immediately after booking creation while status was `pending_payment`, meaning users received "Sessão confirmada" before they had actually paid.
  - **`lib/email/resend-events.ts`** — added new automation event `emitProfessionalBookingConfirmed(email, { booking_id, client_name })` for the post-payment confirmation flow.
  - **`inngest/functions/index.ts`** — in `processSupabasePaymentsChange` (payment captured handler), added parallel resolution of `userEmail`, `userName`, and `professionalEmail` via `Promise.all`. Now emits both `user.booking_confirmed` and `professional.booking_confirmed` events only after Stripe captures the payment.
  - **`app/(app)/pagamento/[bookingId]/page.tsx`** — added retry loop (3 attempts, 400ms delay) before calling `notFound()` to avoid race condition between booking creation and Server Component page load. This was the root cause of users being redirected to an error page after checkout.
  - **`app/api/stripe/payment-intent/route.ts`** — added `Sentry.captureMessage()` warnings for all error paths (booking not found, status mismatch, payment not found, payment status mismatch) to improve observability.
  - **`app/api/stripe/payment-intent/route.test.ts`** — updated Sentry mock to include `captureMessage`.
  - **`docs/project/full-codebase-bug-review-2026-05-05.md`** — updated L5 from "ACCEPTED" to "FIXED" with new description.
  - **`docs/integrations/resend.md`** — documented all booking lifecycle automation events and the rule that confirmation emails are only sent after payment capture.
- Files changed: 8
- Validation:
  - `npm run typecheck` → pass (0 errors)
  - `npm run lint` → pass (0 new errors)
  - `vitest run lib/booking/create-booking.test.ts` → 18/18 pass
  - `vitest run app/api/stripe/payment-intent/route.test.ts` → 12/12 pass
  - `vitest run inngest/functions/` → 27/27 pass
  - Commit: `fc7bcb5`, pushed to `origin/main`

### Entry 92 (2026-05-05) — Add retry to confirmation page for post-payment race condition
- Scope executed:
  - **`app/(app)/agenda/confirmacao/[bookingId]/page.tsx`** — added the same retry loop (3 attempts, 400ms delay) before calling `notFound()`. After Stripe redirects the user to the confirmation page post-payment, the booking status update from `pending_payment` to `confirmed` may not be immediately visible due to replication lag. This prevents a 404 error after successful payment.
- Files changed: 1
- Validation:
  - `npm run typecheck` → pass (0 errors)
  - `npm run lint` → pass (0 new errors)
  - Commit: `bd8d39a`, pushed to `origin/main`

### Entry 93 (2026-05-05) — Add Sentry warning logs to v1 payment-intent API
- Scope executed:
  - **`app/api/v1/payments/payment-intent/route.ts`** — added `Sentry.captureMessage()` warnings for all error paths (booking not found, status mismatch, payment not found, payment status mismatch). The mobile app uses the v1 API, so consistent observability across all payment-intent endpoints is important for debugging checkout issues.
- Files changed: 1
- Validation:
  - `npm run typecheck` → pass (0 errors)
  - Commit: `d6bcf08`, pushed to `origin/main`

### Entry 94 (2026-05-05) — Guard PaymentFormWrapper against missing Stripe key
- Scope executed:
  - **`app/(app)/pagamento/[bookingId]/PaymentFormWrapper.tsx`** — only calls `loadStripe()` when `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is defined. Shows a clear error message when the key is missing instead of letting Stripe.js fail silently. Prevents potential client-side errors when `Elements` tries to mount with a null/invalid Stripe instance.
- Files changed: 1
- Validation:
  - `npm run typecheck` → pass (0 errors)
  - Commit: `f0f3e2f`, pushed to `origin/main`


### Entry 95 (2026-05-05) - Fix critical silent failures in Stripe payment capture flow
- Scope executed:
  - **`lib/stripe/webhook-handlers.ts`**:
    - **Stuck processing recovery**: `processStripeWebhookInbox()` now fetches events stuck in `'processing'` for >5 minutes via a separate query, preventing orphaned events from being lost forever after a crash or kill.
    - **Ledger failure no longer swallowed**: Removed the try/catch around ledger creation in `payment_intent.succeeded`. If ledger creation or balance update fails, the webhook now fails and retries automatically instead of marking the event as processed with missing financial data.
    - **Idempotency guard**: Added check for `payment.status === 'captured'` before creating ledger entries. On replay or manual re-processing, skips ledger/balance updates and logs a Sentry warning.
    - **Preserve capture timestamps**: `setPaymentStatusFromWebhook()` now only sets `captured_at`/`refunded_at` if they are null, preventing audit timestamp destruction on replay.
    - **Dispute handler fixed**: `charge.dispute.created` now throws (fails the webhook) when DB writes fail, instead of returning `'processed'` with missing dispute data.
    - **Exported `fetchStripeFeeForPaymentIntent`** for reuse in cron jobs.
  - **`lib/booking/completion/complete-booking.ts`**:
    - **Capture retry on failure**: When `captureBookingPayment()` fails (e.g. Stripe transient error), the failure now enqueues the payment to `stripe_payment_retry_queue` so the capture will be re-attempted later. Previously this was fire-and-forget with no recovery.
  - **`lib/stripe/cron-jobs.ts`**:
    - **Retry cron creates ledger/balance**: When `runStripeFailedPaymentRetries()` finds a PaymentIntent with Stripe status `succeeded`, it now loads the payment row, checks idempotency, and creates ledger entries + updates professional balance if not already done. Previously it only updated `payments.status`, leaving a permanent gap if the original webhook was lost.
  - **`db/sql/migrations/088-stripe-payment-retry-queue-unique-constraint.sql`**:
    - Added partial UNIQUE index on `stripe_payment_retry_queue(provider_payment_id)` where not null, preventing duplicate retry rows.
  - **`lib/stripe/webhook-handlers.test.ts`**:
    - Updated `buildAdminClient()` mock to support `.lt()`, `.limit()` returning array data, `.in()`, `.order()`, and chained `.eq()` on update queries.
- Files changed: 5
- Validation:
  - `npm run typecheck` - pass (0 errors)
  - `npm run build` - 200 static pages, exit 0
  - `vitest run lib/stripe/webhook-handlers.test.ts` - 15/15 pass
  - `vitest run` (95 test files) - 1013/1013 pass (1 pre-existing env failure in manage-booking-service)
  - Commit: `15bc8fc`, pushed to `origin/main`
