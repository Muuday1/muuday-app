# Roadmap

Last updated: 2026-04-01

Source baseline: `docs/spec/source-of-truth/part1..part5`

## Done

### Wave 0 - Baseline alignment and schema parity ✅

1. ~~Resolve production schema drift for booking foundation tables and API exposure.~~ Done.
2. ~~Stabilize deterministic e2e critical journeys with dedicated fixtures.~~ Done.
3. ~~Keep monitoring and observability activation running in production.~~ Done.
4. ~~Keep handover/docs aligned with wave progress.~~ Done.

### Wave 1 - Foundations and discovery parity ✅

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
4. Database composite indexes — In progress (migration `020` criada): aplicar em produção e validar com `EXPLAIN ANALYZE` para `bookings(professional_id, status)`, `bookings(user_id, status)`, `availability_rules(professional_id, is_active)`, `payments(booking_id, status)`, `slot_locks(professional_id, start_time_utc)`.
5. Booking race condition — wrap conflict check + insert in Postgres RPC transaction or add `UNIQUE(professional_id, start_time_utc)` constraint.
6. JWT custom claims — encode user role in `raw_app_meta_data` to eliminate per-request DB query in middleware.
7. Zod validation — audit and add schema validation to ALL server actions that accept user input.
8. GitHub Actions CI — create workflow: `lint → typecheck → build → test:state-machines → test:e2e`. Block Vercel deploy on failure.
9. Upstash monitoring — add alert/log when rate limiter falls back to in-memory mode.
10. Dynamic exchange rates — create `exchange_rates` Supabase table, cron job to refresh from API, 24h staleness check on booking creation.
11. pg_trgm + GIN indexes — In progress (migration `019` criada): validar em produção para substituir filtragem client-side pesada em `/buscar`.

## Next

### Wave 3 - Payments, billing, payouts, revenue engine

**Stripe integration** (core):
1. Install Stripe MCP server for Claude Code dev tooling.
2. Add `stripe` npm package and configure Stripe Connect (Separate Charges and Transfers).
3. Create Stripe webhook endpoint (`/api/webhooks/stripe`) with signature verification + idempotency.
4. Wire Inngest for webhook processing (retry, failure handling).
5. Professional onboarding → Stripe Express connected account creation.
6. Booking checkout → Payment Intent → webhook confirmation → booking status update.
7. Replace legacy `provider: 'legacy'` + `status: 'captured'` with real Stripe charge flow.

**Billing and payouts**:
8. Implement payout eligibility, weekly payout scheduling via Inngest cron, and reconciliation.
9. Implement professional subscription billing (3-month free, then Stripe Billing) with grace/block logic.
10. Implement internal ledger tables and audit-grade financial projections.

**Security and compliance for payments**:
11. Supabase Vault for encrypted storage of sensitive payout/bank details.
12. Admin audit trail table — `admin_audit_log(admin_user_id, action, target_table, target_id, old_value, new_value, timestamp)`.
13. Recurring booking atomicity — wrap parent + child + session inserts in Postgres RPC transaction.
14. RLS audit — verify all payment/financial tables have correct RLS policies.
15. Rate limiting on Stripe webhook endpoint, booking creation, and signup/login.
16. CORS explicit policy on all API routes, especially webhooks.

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
3. Sentry alert rules — custom alerts for: error rate spike, payment failures, auth failures, webhook processing delays.
4. Checkly synthetic monitoring — configure uptime checks and critical-path journey monitoring (already in devDependencies).
5. PostHog alerts — signup drop-off, booking conversion drop, payment failure rate.

**Notifications**:
6. Notification dispatcher + in-app inbox + reminder reliability via Inngest.
7. Multi-channel routing (email + in-app + future push).

**Scale (deploy when threshold met)**:
8. Redis cache layer (Upstash) for public profiles (5min TTL), taxonomy (1h), exchange rates (1h) — trigger: DB read IOPS > 80% of plan limit.
9. Next.js ISR with `revalidateTag` for public profile pages — trigger: > 5k daily profile views.

### Wave 5 - Session provider and compliance freeze

1. Final provider lock with provider-agnostic session abstraction.
2. Sensitive-category disclaimer versioning and booking acceptance snapshots.
3. External validations closure (Stripe corridor, legal, tax/accounting).

### Post-MVP - Scale triggers

1. Typesense or Meilisearch for dedicated search — trigger: > 2k active professionals (or latency > 500ms p95 after pg_trgm tuning).
2. Cloudflare Images or imgproxy for image optimization — trigger: > 1k uploaded avatars or LCP > 2.5s.
3. Deep tax automation — trigger: new jurisdictions or regulatory complexity beyond light model.
4. Advanced trust automation beyond manual + rule-based controls.

## Open validations (must close before architecture freeze)

1. Stripe corridor validation for UK platform to Brazil-heavy professional payouts — **must close before Wave 3 start**.
2. Final session provider lock decision — **must close before Wave 5 start**.
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
| Admin audit trail | Financial compliance | Planned | Wave 3 |
| Sentry alert rules | Production incident detection | Planned | Wave 4 |
| Checkly monitoring | Uptime and journey checks | Planned | Wave 4 |
| Admin case queue | Operational exception handling | Planned | Wave 4 |
| Notification dispatcher | Reliable operational communication | In progress | Wave 4 |
| Redis cache layer | Read performance at scale | Threshold-triggered | Wave 4+ |
| Session provider abstraction | Video/session execution flexibility | Planned | Wave 5 |
| Typesense/Meilisearch | Search at scale | Threshold-triggered | Post-MVP |
| Cloudflare Images | Image optimization | Threshold-triggered | Post-MVP |

## Stack adoption by wave (mandatory tracking)

1. Wave 0: ✅ Done
   - observability/testing baseline (Checkly, Sentry, Playwright, PostHog, Zod hardening)
   - on-call ownership and SLA baseline active (solo model)

2. Wave 1: ✅ Done
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
   - Sentry custom alert rules
   - Checkly synthetic monitoring activation
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
