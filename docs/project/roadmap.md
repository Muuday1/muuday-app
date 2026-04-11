# Roadmap

Last updated: 2026-04-11

Source baseline: `docs/spec/source-of-truth/part1..part5`
Canonical status docs: `docs/project/roadmap.md` + `docs/spec/consolidated/master-spec.md`

## Done

### Wave 0 - Baseline alignment and schema parity [Done]

1. Resolve production schema drift for booking foundation tables and API exposure.
2. Stabilize deterministic e2e critical journeys with dedicated fixtures.
3. Keep monitoring and observability activation running in production.
4. Keep handover/docs aligned with wave progress.

### Wave 1 - Foundations and discovery parity [Done]

1. Enforce taxonomy governance and moderation model.
2. Enforce tier limits/entitlements and discovery influence rules.
3. Align search, filter, rank, cards, trust signals, and favorites/rebooking behavior.

## Now

### Wave 2 close - Onboarding, booking lifecycle, and infrastructure hardening [Done]

Product scope (closed 2026-04-10):
1. Finalize dual onboarding gates (public listing vs first booking acceptance).
2. Finalize booking state machine, request booking, slot hold, and recurring scheduling rules.
3. Finalize timezone-safe booking views and timeline/event integrity.

Infrastructure hardening carryover (pre-Wave 3 closure tasks):
1. Database composite indexes: validate production query plans for `bookings(professional_id, status)`, `bookings(user_id, status)`, `availability_rules(professional_id, is_active)`, `payments(booking_id, status)`, `slot_locks(professional_id, start_time_utc)`.
2. Booking race condition: keep conflict check + insert atomic (RPC/constraint path validated).
3. JWT custom claims: keep role in token, DB fallback monitored.
4. Zod validation: keep server-side schema validation on all write paths.
5. GitHub Actions CI: lint -> typecheck -> build -> test:state-machines -> test:e2e.
6. Upstash monitoring: keep alert/log for in-memory rate-limit fallback.
7. Dynamic exchange rates: table + cron + stale guard.
8. `pg_trgm` + GIN search indexes: validated in production.

## Next

### Wave 3 - Payments, billing, payouts, revenue engine

Canonical lock (2026-04-10):
1. Entity decides rail, not professional country.
2. UK entity: Stripe end-to-end.
3. BR entity: Airwallex end-to-end (v1 default).
4. dLocal: contingency fallback only.

Track A - Payment rail prep (can run in parallel):
1. Keep Stripe scope limited to UK rail.
2. Keep Stripe products/prices for professional subscriptions (Basic/Professional/Premium x monthly/annual).
3. Keep webhook skeleton + signature verification + event logging/idempotency.
4. Keep payment schema and operational tables aligned with migration set.

Track B - Product journey completion (must stay green):
1. Finish remaining professional onboarding gates and UX consistency.
2. Keep booking journeys stable (one-off, request-booking, recurring, multiple-dates).
3. Keep `/financeiro` and billing settings consistent with tier/gate rules.

Track C - Real-money implementation:
1. Stripe customer/account/subscription lifecycle for UK rail.
2. BR rail integration lifecycle using Airwallex.
3. Reconciliation, settlement, and operational alerting.

Security/compliance for payments:
1. Supabase Vault for sensitive payout/bank metadata.
2. Admin audit trail on financial/admin mutations.
3. RLS audit on all payment tables.
4. Rate limit + CORS hardening on payment/webhook paths.

## Later

### Wave 4 - Admin trust operations, monitoring, and notifications

1. Structured case queue for disputes/refunds/payout failures/moderation.
2. Review moderation and trust-flag governance.
3. Sentry alert rules (error spikes, payment failures, auth failures, webhook delays).
4. Checkly uptime and critical journey checks.
5. PostHog alerts (signup drop-off, booking conversion drop).
6. Notification dispatcher + in-app inbox reliability.
7. Redis cache layer when threshold triggers are met.

### Wave 5 - Session provider and compliance freeze

1. Keep Agora as active provider while preserving adapter boundaries.
2. Sensitive-category disclaimer versioning and acceptance snapshots.
3. External validations closure (legal/tax/accounting + rail operations).

### Post-MVP triggers

1. Typesense/Meilisearch if scale/latency thresholds are exceeded.
2. Cloudflare Images/imgproxy if image scale or LCP thresholds are exceeded.
3. Deep tax automation when jurisdiction/compliance complexity demands it.

## Open validations

1. Payment rails architecture lock: Done.
2. BR provider selection: Done (Airwallex v1).
3. Legal wording freeze for sensitive-category scope/disclaimers.
4. Tax/accounting model confirmation (including UK <-> BR intercompany settlement design).

## Under evaluation

1. No open video provider decision for v1 (Agora locked).
2. Deeper tax automation beyond MVP light model.
3. Advanced trust automation beyond manual + rule-based controls.
