# Tech Stack

Last updated: 2026-03-29

Status legend:
- `Done`
- `In progress`
- `Planned`
- `Under evaluation`

## Current stack in use

| Technology | Purpose | Status | Notes |
| --- | --- | --- | --- |
| Next.js 14 + React 18 | Web app runtime | Done | Core application |
| Tailwind CSS | UI styling | Done | Active |
| Supabase Auth + Postgres | Core auth/data | Done | Main backend |
| Supabase RLS | Access control | Done | Active on main tables |
| Vercel | Deploy/runtime | Done | Production host |
| GitHub Actions | CI and cron | Done/In progress | CI active, cron active |
| Playwright | Critical e2e tests | In progress | Coverage expanding |
| Zod | Input validation | In progress | Implemented in key flows |
| Checkly | External monitoring | In progress | Running with free-first profile |
| Sentry | Error observability | In progress | Instrumented, activation hardening pending |
| PostHog | Product analytics | In progress | Instrumented, dashboard ops pending |
| Resend | Transactional email | In progress | Partial lifecycle coverage |
| Upstash | Rate limiting | In progress | Active with fallback |

## Approved build targets from canonical spec

| Component | Purpose | Status |
| --- | --- | --- |
| Stripe Payments + Connect + Billing | Booking charges, refunds, payouts, professional billing | Planned |
| Internal financial ledger | Booking-finance auditability and reconciliation | Planned |
| Case queue subsystem | Admin exception handling and trust operations | Planned |
| Event-driven notification dispatcher | Consistent email + in-app delivery | Planned/In progress |
| Session provider abstraction | Provider-agnostic video/session execution | Planned |
| Compliance disclaimer versioning | Sensitive-category checkout/profile governance | Planned |

## Under evaluation (explicitly provisional)

| Item | Purpose | Status |
| --- | --- | --- |
| Final session provider lock | Embedded vs external-provider launch path | Under evaluation |
| Stripe corridor architecture details | UK platform to Brazil payout route confirmation | Under evaluation |
| Deep tax automation | Post-MVP expansion | Under evaluation |

## Stack guardrails

1. Prefer one coherent platform backend over many disconnected services.
2. Keep cost-effective defaults until metrics justify complexity.
3. Keep core invariants in Muuday domain layer, not external tooling.
4. Keep documented status parity with `docs/spec/consolidated/master-spec.md`.
