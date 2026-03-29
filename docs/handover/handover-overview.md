# Handover Overview

Last updated: 2026-03-29

## Product summary

Muuday is a marketplace connecting Brazilians abroad with Brazilian professionals for online services (mental health, legal, accounting, education, wellness, career, and related categories).

## Current stage

`In progress` - MVP in production with active hardening and operations maturity.

## Current priorities

1. Keep booking lifecycle reliable in production.
2. Keep cron-based reminders/timeouts stable and monitored.
3. Complete monitoring activation (Checkly + alert channels).
4. Activate observability providers (Sentry/PostHog dashboards + alerts).
5. Implement payment-provider lifecycle (Stripe) when approved.

## Major components

1. Next.js app routes (`app/`) for auth, search, booking, agenda, admin.
2. Booking domain modules (`lib/booking/`, `lib/actions/`).
3. Supabase auth + PostgreSQL + RLS data model.
4. GitHub Actions CI and cron workflows.

## Key integrations

- Supabase (`Done`)
- Vercel + GitHub Actions (`Done`)
- Resend (`In progress`)
- Upstash rate limiting (`In progress`)
- Checkly (`In progress`)
- Sentry (`In progress`)
- PostHog (`In progress`)
- Make + HubSpot (`Planned`)
- Stripe full lifecycle (`Planned`)

## Biggest risks / unknowns

1. Payment flow still uses legacy capture placeholder in booking action.
2. Calendar integration schema exists but runtime sync is not implemented.
3. Monitoring/observability activation in production still depends on external provider setup.

## Where to start (new contributor)

1. Read `docs/handover/current-state.md`.
2. Execute `docs/handover/next-steps.md` top to bottom.
3. Follow `docs/handover/how-to-work.md` during implementation.
4. Update handover files while you work, not only at the end.
