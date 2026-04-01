# Tech Stack

Last updated: 2026-04-01

Status legend:
- `Done`
- `In progress`
- `Planned`
- `Under evaluation`

Wave legend:
- `Pre-Wave`: already active baseline
- `Wave 0` to `Wave 5`: execution plan phases
- `Post-MVP`: after Wave 5 stabilization

## Current stack in use

| Technology | Purpose | Status | Entry phase | Growth update trigger |
| --- | --- | --- | --- | --- |
| Next.js 14 + React 18 | Web app runtime | Done | Pre-Wave | Major framework/LTS change or sustained perf bottlenecks |
| Tailwind CSS | UI styling | Done | Pre-Wave | Design system complexity exceeds utility-first maintainability |
| Supabase Auth + Postgres | Core auth/data | Done (Pro plan) | Pre-Wave | Sustained DB scaling/security requirements beyond current plan |
| Supabase RLS | Access control | Done | Pre-Wave | New role model or policy complexity requires refactor |
| Vercel | Deploy/runtime | Done (Pro plan) | Pre-Wave | Region/performance/compliance needs exceed current hosting setup |
| GitHub Actions | CI and cron | Done/In progress | Pre-Wave / Wave 0 | Pipeline time/cost instability or release reliability issues |
| Playwright | Critical e2e tests | In progress | Wave 0 | Flaky critical paths or expanded journey test coverage needs |
| Zod | Input validation | In progress | Wave 0 | New API/server-action surfaces without schema parity |
| Checkly | External monitoring | In progress | Wave 0 | SLA incidents require broader check set/escalation |
| Sentry | Error observability | In progress | Wave 0 | Error-volume spikes or poor triage signal quality |
| PostHog | Product analytics + feature flags | In progress | Wave 0 / Wave 1 | Funnel blind spots or feature-release experiment needs |
| Resend | Transactional email | In progress | Wave 0 | Notification volume/templates exceed basic lifecycle setup |
| Upstash | Rate limiting | In progress | Wave 0 | Abuse patterns or higher API throughput require tighter controls |
| Inngest | Background job orchestration | In progress | Wave 2 prep / Wave 4 scale | Fragmented retries and async workflow reliability pressure |

## Wave 2 close — infrastructure hardening (deploy before Wave 3)

| Component | Purpose | Status | Deploy timing | Growth update trigger |
| --- | --- | --- | --- | --- |
| Database composite indexes | Query performance for booking/search paths | In progress (migration `020` criada) | Wave 2 close | `EXPLAIN ANALYZE` mostra seq scans após aplicação dos índices |
| Booking race condition fix | Atomic conflict check + insert via Postgres RPC or UNIQUE constraint | Planned | Wave 2 close | Double-booking reports in production |
| JWT custom claims for role | Eliminate per-request DB query in middleware | Planned | Wave 2 close | Middleware latency > 50ms p95 or DB connection saturation |
| Zod validation hardening | Schema validation on ALL server actions (booking amounts, dates, IDs) | Planned | Wave 2 close | Input validation gaps in server actions |
| GitHub Actions CI pipeline | `lint → typecheck → build → test:unit → test:e2e` on every push | Planned | Wave 2 close | Any deploy-breaking regression reaching production |
| Upstash rate limit monitoring | Alert when fallback in-memory limiter is active | Planned | Wave 2 close | Abuse patterns or Upstash outage goes unnoticed |
| Dynamic exchange rates | Replace hardcoded rates with Supabase table + cron refresh + 24h staleness check | Planned | Wave 2 close | Currency conversion drift or stale-rate booking disputes |

## Approved build targets from canonical spec

| Component | Purpose | Status | Planned entry wave | Growth update trigger |
| --- | --- | --- | --- | --- |
| Stripe Payments + Connect + Billing | Booking charges, refunds, payouts, professional billing | Planned | Wave 3 | Corridor/volume complexity and reconciliation requirements |
| Stripe webhook endpoint | Signature-verified `/api/webhooks/stripe` with idempotency + Inngest retry | Planned | Wave 3 | Required for any real payment processing |
| Stripe MCP server (dev tooling) | Claude Code direct access to Stripe API for setup/testing | Planned | Wave 3 | Speeds up Stripe integration development |
| Internal financial ledger | Booking-finance auditability and reconciliation | Planned | Wave 3 | Finance/audit traceability gaps in payment lifecycle |
| Recurring booking atomicity | Wrap parent + child + session inserts in Postgres RPC transaction | Planned | Wave 3 | Partial booking creation on failure |
| Supabase Vault | Encrypted storage for sensitive payout/bank details | Planned | Wave 3 | PII compliance when handling financial data |
| Admin audit trail table | `admin_audit_log` for all admin mutations | Planned | Wave 3 | Financial compliance requires audit-grade traceability |
| Case queue subsystem | Admin exception handling and trust operations | Planned | Wave 4 | Case volume and dispute turnaround SLA pressure |
| Event-driven notification dispatcher | Consistent email + in-app delivery | Planned/In progress | Wave 4 | Reminder reliability and multi-channel routing needs |
| Checkly synthetic monitoring | Uptime and critical-path monitoring (already in devDependencies) | Planned | Wave 4 | SLA incidents require broader check set/escalation |
| Sentry alert rules | Custom alerts for error rate spike, payment failures, auth failures | Planned | Wave 4 | Production incident detection is manual |
| Session provider abstraction | Provider-agnostic video/session execution | Planned | Wave 5 | Video experience reliability and no-show evidence requirements |
| Compliance disclaimer versioning | Sensitive-category checkout/profile governance | Planned | Wave 5 | Legal wording changes and category expansion complexity |

## Scale-triggered additions (deploy when threshold is met)

| Component | Purpose | Status | Trigger threshold | Estimated cost |
| --- | --- | --- | --- | --- |
| pg_trgm + GIN indexes | Full-text search on professional names/bios/specialties | In progress | Wave 2 close (migration `019` + production validation) | Free (Supabase) |
| Typesense or Meilisearch | Dedicated search engine with facets and typo tolerance | Under evaluation | > 2k active professionals (or search latency > 500ms p95 after pg_trgm tuning) | ~$50/month cloud |
| Cloudflare Images or imgproxy | Image resize/optimization pipeline for profile photos | Under evaluation | > 1k uploaded avatars or LCP > 2.5s on profiles | ~$5/month |
| Redis cache layer (Upstash) | Cache public profiles (5min TTL), taxonomy (1h), exchange rates (1h) | Planned | DB read IOPS > 80% of plan limit or search latency regression | Already in stack, minimal incremental cost |
| Next.js ISR with revalidateTag | Incremental Static Regeneration for public profile pages | Under evaluation | > 5k daily profile views | Free (Vercel Pro) |

## Under evaluation (explicitly provisional)

| Item | Purpose | Status | Decision by phase | Re-evaluation trigger |
| --- | --- | --- | --- | --- |
| Final session provider lock | LiveKit (preferred embedded) vs Google Meet (fallback link-based) | Under evaluation | Before Wave 5 start gate | Launch timeline/capacity changes or reliability test outcomes |
| Stripe corridor architecture details | UK platform to Brazil payout route confirmation | Under evaluation | Before Wave 3 start gate | Stripe/legal feedback affecting payout model |
| Deep tax automation | Post-MVP expansion | Under evaluation | Post-MVP | New jurisdictions/regulatory complexity beyond light model |

## Plan and billing status

| Service | Plan | Spend cap | PITR | Notes |
| --- | --- | --- | --- | --- |
| Supabase | Pro | Enabled (no surprise charges) | Disabled (available ~$100/mth extra, not needed pre-launch) | Daily backups included with Pro |
| Vercel | Pro | Default limits apply | N/A | Pending: confirm spending limits via dashboard |

## Operational ownership baseline

1. Checkly and Sentry alerts are routed to founder operator email.
2. Incident SLA is defined in `docs/engineering/runbooks/incident-runbook.md`.

## Stack guardrails

1. Prefer one coherent platform backend over many disconnected services.
2. Keep cost-effective defaults until metrics justify complexity.
3. Keep core invariants in Muuday domain layer, not external tooling.
4. Keep documented status parity with `docs/spec/consolidated/master-spec.md`.
5. Every tool/component must have a defined entry phase and growth update trigger.

## Growth update protocol (mandatory)

1. At each Wave close, review this file and update status, phase, and trigger outcomes.
2. Any new tool added to the platform must be documented here in the same task.
3. When growth metrics force tool evolution, update:
- `docs/architecture/tech-stack.md`
- `docs/project/roadmap.md`
- `docs/handover/current-state.md`
- `docs/handover/session-log.md`
4. Do not keep "tool name only" placeholders without phase, purpose, and trigger metadata.

## Human decision register

For open tool selections and stack-gap evaluation, see:

1. `docs/human-actions/tool-options-and-stack-gaps.md`
2. `docs/human-actions/decision-backlog.md`
