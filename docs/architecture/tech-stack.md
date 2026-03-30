# Tech Stack

Last updated: 2026-03-30

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

## Approved build targets from canonical spec

| Component | Purpose | Status | Planned entry wave | Growth update trigger |
| --- | --- | --- | --- | --- |
| Stripe Payments + Connect + Billing | Booking charges, refunds, payouts, professional billing | Planned | Wave 3 | Corridor/volume complexity and reconciliation requirements |
| Internal financial ledger | Booking-finance auditability and reconciliation | Planned | Wave 3 | Finance/audit traceability gaps in payment lifecycle |
| Case queue subsystem | Admin exception handling and trust operations | Planned | Wave 4 | Case volume and dispute turnaround SLA pressure |
| Event-driven notification dispatcher | Consistent email + in-app delivery | Planned/In progress | Wave 4 | Reminder reliability and multi-channel routing needs |
| Session provider abstraction | Provider-agnostic video/session execution | Planned | Wave 5 | Video experience reliability and no-show evidence requirements |
| Compliance disclaimer versioning | Sensitive-category checkout/profile governance | Planned | Wave 5 | Legal wording changes and category expansion complexity |

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
