# Tech Stack

Last updated: 2026-03-29

## Current stack

| Technology | Purpose | Status | Notes |
| --- | --- | --- | --- |
| Next.js 14 (App Router) | Web application framework | Done | Core app runtime and routing |
| React 18 | UI runtime | Done | Used by Next.js app |
| Tailwind CSS | Styling | Done | Main styling system |
| Supabase Auth + Postgres | Auth and data layer | Done | Core production backend |
| Supabase RLS policies | Data access control | Done | Active across main domain tables |
| Vercel | Deployment platform | Done | Production hosting |
| GitHub Actions (`ci.yml`) | CI checks | Done | Typecheck, lint, build |
| GitHub Actions (`booking-crons.yml`) | Scheduled cron execution | Done | Reminders every 5m, timeouts every 15m |
| Sentry SDK | Error observability instrumentation | In progress | Wired in client/server/edge; production activation pending |
| PostHog SDK | Funnel and behavior analytics instrumentation | In progress | Provider + auth/booking events + route pageviews |
| Playwright | End-to-end critical journey tests | In progress | Baseline specs added, env-gated execution |
| Zod | Input validation | In progress | Implemented in key server actions and API routes |
| Resend | Transactional/lifecycle email service | In progress | Templates and helper code implemented |
| Upstash Rate Limit | Abuse protection | In progress | Active when env configured, memory fallback exists |

## Approved future stack

| Technology | Purpose | Status | Expected role |
| --- | --- | --- | --- |
| Stripe (full flow) | Capture/refund/payment lifecycle | Planned | Replace legacy payment placeholder flow |
| Make | Ops and growth automation | Planned | Event-driven external workflows |
| HubSpot | CRM for supply/demand operations | Planned | Lifecycle and pipeline management |
| Checkly | Uptime/API checks | In progress | External monitoring and alerting |

## Under evaluation

| Technology | Purpose | Status |
| --- | --- | --- |
| Cloudflare DNS/WAF tuning | Edge security and performance hardening | Under evaluation |
| Messaging channel providers | Reminder/support channels beyond email | Under evaluation |
| LoveKit | in-built videocall | Under evaluation |

## Deprecated or discouraged

| Item | Status | Reason |
| --- | --- | --- |
| Agent-specific handoff/prompt docs as active docs | Deprecated | Replaced by durable domain documentation |
| Legacy hardcoded domain references | Deprecated | Replaced by central app URL config |

## Stack alignment notes

1. Keep product invariants in app + DB, not in external automation tools.
2. Track every new external dependency in this file with explicit status.
3. Do not mark tools as `Done` until production setup is complete and validated.
