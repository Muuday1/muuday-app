# Current State

Last updated: 2026-03-29 (session 18)

## Canonical baseline status

1. 5-part source-of-truth specification imported into `docs/spec/source-of-truth/`.
2. Consolidated execution artifacts created (`master-spec`, `execution-plan`, `open-validations`, `journey-coverage-matrix`, unified AI protocol).
3. Existing docs realigned to this baseline.

## Implemented today (`Done`)

1. Core app routes for auth, search, profile, booking, agenda, and admin are live.
2. Baseline booking logic exists (slot locks, scheduling checks, state transitions).
3. Basic admin moderation views exist.
4. CI baseline and cron baseline exist.
5. Monitoring and analytics instrumentation baseline exists (activation parity still pending).
6. Documentation governance and handover system are active.
7. Production schema parity for booking foundation (migrations 001-006 applied).
8. Sentry DSN configured and next.config.js wrapped with withSentryConfig.
9. Playwright e2e tests load env vars from .env.local automatically — 2/3 pass deterministically.
10. Security fixes applied: role escalation trigger, RLS update policy, favorites RLS, profiles select restriction.

## Partially implemented (`In progress`)

1. Full taxonomy governance and entitlement parity with Part 1.
2. Full onboarding and request-booking parity with Part 2.
3. Stripe-backed payment and payout lifecycle parity with Part 3.
4. Structured case queue and full trust operations parity with Part 4.
5. Session provider abstraction and compliance freeze parity with Part 5.

## Blocked / open validations

1. Stripe corridor validation for UK platform to Brazil-heavy professional payouts.
2. Final session provider lock decision.
3. Final legal/tax wording freeze for sensitive categories.

### Resolved blockers
- ~~Production schema parity gaps affecting some booking foundations in production API.~~ Resolved: migrations 001-006 applied 2026-03-29.

## Active execution mode

Wave-driven delivery is now mandatory:

1. Wave 0: schema parity + deterministic quality baseline. **Status: near complete — schema done, e2e passing, Sentry active. Remaining: verify Checkly checks, confirm Vercel env vars for Sentry DSN.**
2. Wave 1: foundations/discovery/tier parity.
3. Wave 2: onboarding and booking lifecycle parity.
4. Wave 3: payments/revenue parity.
5. Wave 4: admin/trust/notifications parity.
6. Wave 5: session provider + compliance freeze.

## Last meaningful changes

1. Imported full 5-part product specification as canonical source in repo docs.
2. Consolidated new master spec and execution plan with open-validation register.
3. Updated roadmap, status, architecture, journeys, and handover docs to execution-wave model.
4. Added `docs/human-actions/` with consolidation verification, human decision backlog, and concrete open-tool options.
5. Added explicit retention/deletion policy by data type in `docs/engineering/data-governance-and-lifecycle.md`.
