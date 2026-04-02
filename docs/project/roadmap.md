# Roadmap

Last updated: 2026-04-01

Source baseline: `docs/spec/source-of-truth/part1..part5`

## Done

### Wave 0 - Baseline alignment and schema parity âœ…

1. ~~Resolve production schema drift for booking foundation tables and API exposure.~~ Done.
2. ~~Stabilize deterministic e2e critical journeys with dedicated fixtures.~~ Done.
3. ~~Keep monitoring and observability activation running in production.~~ Done.
4. ~~Keep handover/docs aligned with wave progress.~~ Done.

### Wave 1 - Foundations and discovery parity âœ…

1. ~~Enforce taxonomy governance and moderation model.~~ Done.
2. ~~Enforce tier limits/entitlements and discovery influence rules.~~ Done.
3. ~~Align search, filter, rank, cards, trust signals, and favorites/rebooking behavior.~~ Done.

## Now

### Wave 2 close - Onboarding, booking lifecycle, and infrastructure hardening

**Product scope** (backend complete, pending manual acceptance):
1. ~~Finalize dual onboarding gates (public listing vs first booking acceptance).~~ Done.
2. ~~Finalize booking state machine, request booking, slot hold, and recurring scheduling rules.~~ Done.
3. ~~Finalize timezone-safe booking views and timeline/event integrity.~~ Done.

**Infrastructure hardening** (must deploy before starting Wave 3):
4. Database composite indexes â€” In progress (migration `020` criada): aplicar em produÃ§Ã£o e validar com `EXPLAIN ANALYZE` para `bookings(professional_id, status)`, `bookings(user_id, status)`, `availability_rules(professional_id, is_active)`, `payments(booking_id, status)`, `slot_locks(professional_id, start_time_utc)`.
5. Booking race condition â€” wrap conflict check + insert in Postgres RPC transaction or add `UNIQUE(professional_id, start_time_utc)` constraint.
6. JWT custom claims â€” encode user role in `raw_app_meta_data` to eliminate per-request DB query in middleware.
7. Zod validation â€” audit and add schema validation to ALL server actions that accept user input.
8. GitHub Actions CI â€” create workflow: `lint â†’ typecheck â†’ build â†’ test:state-machines â†’ test:e2e`. Block Vercel deploy on failure.
9. Upstash monitoring â€” add alert/log when rate limiter falls back to in-memory mode.
10. Dynamic exchange rates â€” create `exchange_rates` Supabase table, cron job to refresh from API, 24h staleness check on booking creation.
11. pg_trgm + GIN indexes â€” In progress (migration `019` criada): validar em produÃ§Ã£o para substituir filtragem client-side pesada em `/buscar`.

## Next

### Wave 3 - Payments, billing, payouts, revenue engine

Wave 3 has two parallel tracks: **journeys completion** (must finish before Stripe code) and **Stripe prep** (independent, can run in parallel).

**Track A â€” Stripe prep (independent, start NOW in parallel with journeys)**:
1. Send Stripe validation packet (UKâ†’BR corridor) â€” zero code, just email/chat with Stripe.
2. Create Stripe Products/Prices for professional subscriptions in Stripe Dashboard (Basic/Professional/Premium Ã— monthly/annual).
3. Install Stripe MCP server for Claude Code dev tooling.
4. `npm install stripe` and add env vars (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
5. Database migration: payment tables schema only (no app code yet) â€” `stripe_customers`, `stripe_connected_accounts`, `payment_intents`, `transfers`, `subscriptions`, `internal_ledger`, `admin_audit_log`.
6. Webhook endpoint skeleton (`/api/webhooks/stripe`) with signature verification + logging (no business logic yet).
7. Exchange rates table + cron (already in Wave 2 close).
8. GitHub Actions CI pipeline (already in Wave 2 close).

**Track B â€” Journey completion (must finish before Stripe code)**:
9. Professional onboarding screens finalized (all steps, review flow, approval).
10. Booking one-off journey complete (agendar â†’ confirmar â†’ cancelar).
11. Request booking journey complete (solicitar â†’ proposta â†’ aceitar/expirar).
12. Recurring booking journey complete (ciclo â†’ renovaÃ§Ã£o â†’ pausa).
13. Cancellation policy rules implemented and testable.
14. `/financeiro` professional page with mock data (earnings, payouts, breakdown).
15. Professional settings billing area UI (tier, card placeholder, subscription status).

**Track C â€” Stripe code (after Track B is done)**:
16. Stripe customer creation on user signup.
17. Stripe Express connected account in professional onboarding.
18. Payment Element checkout for one-off bookings.
19. Webhook business logic: `payment_intent.succeeded` â†’ confirm booking.
20. Manual-accept timeout â†’ auto-refund via Inngest.
21. Request-booking payment link with 24h expiry.
22. Cancellation refund flow (pre-transfer and post-transfer).
23. Inngest weekly payout cron (48h eligibility, BRL 100 minimum, accumulation).
24. Professional subscription billing (90-day trial, grace, block).
25. Recurring client billing (Stripe Subscription + per-session payout tracker).
26. Professional earnings dashboard with real Stripe data.
27. Admin financial dashboard.

**Security and compliance for payments**:
28. Supabase Vault for encrypted payout/bank details.
29. Admin audit trail on all admin mutations (foundation delivered via migration `022`; expand to finance/manual flows).
30. RLS audit on all payment/financial tables.
31. Rate limiting on webhook, booking creation, signup/login.
32. CORS explicit policy on all API routes.

**Database schema additions for Wave 3**:
- `stripe_customers(id, user_id, stripe_customer_id, created_at)`
- `stripe_connected_accounts(id, professional_id, stripe_account_id, onboarding_complete, created_at)`
- `payment_intents(id, booking_id, stripe_payment_intent_id, amount, currency, status, created_at)`
- `transfers(id, payment_intent_id, stripe_transfer_id, amount, currency, status, created_at)`
- `subscriptions(id, professional_id, stripe_subscription_id, plan, status, current_period_end, created_at)`
- `exchange_rates(currency_pair, rate, source, updated_at)` (may be created in Wave 2 close)
- `admin_audit_log(id, admin_user_id, action, target_table, target_id, old_value, new_value, created_at)`
- `internal_ledger(id, booking_id, entry_type, amount, currency, description, created_at)`

## Later

### Wave 4 - Admin trust operations, monitoring, and notifications

**Operations**:
1. Structured case queue for disputes/refunds/payout failures/moderation.
2. Review moderation and trust-flag governance.

**Monitoring and alerting**:
3. Sentry alert rules — configure dashboard alerts from runbook for: error rate spike, payment failures, auth failures, webhook processing delays.
4. Checkly synthetic monitoring — keep uptime and critical-path journey checks active and green.
5. PostHog alerts — configure signup drop-off and booking conversion drop alerts.

**Notifications**:
6. Notification dispatcher + in-app inbox + reminder reliability via Inngest.
7. Multi-channel routing (email + in-app + future push).

**Scale (deploy when threshold met)**:
8. Redis cache layer (Upstash) for public profiles (5min TTL), taxonomy (1h), exchange rates (1h) â€” trigger: DB read IOPS > 80% of plan limit.
9. Next.js ISR with `revalidateTag` for public profile pages â€” trigger: > 5k daily profile views.

### Wave 5 - Session provider and compliance freeze

1. Final provider lock with provider-agnostic session abstraction.
2. Sensitive-category disclaimer versioning and booking acceptance snapshots.
3. External validations closure (Stripe corridor, legal, tax/accounting).

### Post-MVP - Scale triggers

1. Typesense or Meilisearch for dedicated search â€” trigger: > 2k active professionals (or latency > 500ms p95 after pg_trgm tuning).
2. Cloudflare Images or imgproxy for image optimization â€” trigger: > 1k uploaded avatars or LCP > 2.5s.
3. Deep tax automation â€” trigger: new jurisdictions or regulatory complexity beyond light model.
4. Advanced trust automation beyond manual + rule-based controls.

## Open validations (must close before architecture freeze)

1. ~~Stripe corridor validation for UK platform to Brazil-heavy professional payouts~~ â€” **CONFIRMED 2026-04-01**. UKâ†’BR Express corridor supported. Separate Charges and Transfers works. PayPal available. BR payouts in BRL, daily automatic. See `docs/engineering/stripe-integration-plan.md`.
2. Final session provider lock decision â€” **must close before Wave 5 start**.
3. Legal wording freeze for sensitive-category scope and disclaimers.
4. Tax/accounting operational model confirmation.

## Approved future stack additions

| Component | Purpose | Status | Entry wave |
| --- | --- | --- | --- |
| Database indexes + booking atomicity | Performance and data integrity | Planned | Wave 2 close |
| GitHub Actions CI | Automated quality gate | Planned | Wave 2 close |
| JWT custom claims | Middleware performance | Planned | Wave 2 close |
| Stripe full integration | Marketplace charging, refunds, payouts, billing | Planned | Wave 3 |
| Stripe MCP server | Dev tooling for Claude Code | Planned | Wave 3 |
| Supabase Vault | Encrypted PII storage | Planned | Wave 3 |
| Admin audit trail | Financial compliance | In progress (foundation delivered) | Wave 3 |
| Sentry alert rules | Production incident detection | In progress | Wave 4 |
| Checkly monitoring | Uptime and journey checks | In progress | Wave 4 |
| Admin case queue | Operational exception handling | Planned | Wave 4 |
| Notification dispatcher | Reliable operational communication | In progress | Wave 4 |
| Redis cache layer | Read performance at scale | Threshold-triggered | Wave 4+ |
| Session provider abstraction | Video/session execution flexibility | Planned | Wave 5 |
| Typesense/Meilisearch | Search at scale | Threshold-triggered | Post-MVP |
| Cloudflare Images | Image optimization | Threshold-triggered | Post-MVP |

## Stack adoption by wave (mandatory tracking)

1. Wave 0: âœ… Done
   - observability/testing baseline (Checkly, Sentry, Playwright, PostHog, Zod hardening)
   - on-call ownership and SLA baseline active (solo model)

2. Wave 1: âœ… Done
   - feature flag rollout baseline (PostHog Feature Flags)

3. Wave 2 close: In progress
   - database indexes and booking atomicity
   - JWT custom claims for middleware performance
   - GitHub Actions CI pipeline
   - dynamic exchange rates
   - pg_trgm search indexes
   - Upstash rate limit monitoring

4. Wave 3:
   - Stripe full lifecycle (Connect + Billing + webhooks)
   - Stripe MCP server for dev tooling
   - internal financial ledger
   - Supabase Vault for PII
   - admin audit trail
   - recurring booking transaction atomicity

5. Wave 4:
   - finalize Sentry dashboard alert-rule rollout
   - keep Checkly synthetic monitoring stable and tuned
   - case queue and Inngest-backed event/job orchestration for notification reliability
   - Redis cache layer (if threshold met)

6. Wave 5:
   - session provider lock (LiveKit vs Google Meet) and compliance versioning hardening

7. Post-MVP:
   - Typesense/Meilisearch (if search scale threshold met)
   - Cloudflare Images (if image scale threshold met)
   - tax automation expansion

## Under evaluation

1. Final video provider path for v1 launch.
2. Deeper tax automation beyond MVP light model.
3. Advanced trust automation beyond manual + rule-based controls.

