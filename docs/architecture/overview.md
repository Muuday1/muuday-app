# Architecture Overview

Last updated: 2026-03-29

## System summary

Muuday is a Next.js App Router application deployed on Vercel, backed by Supabase for auth, database, and storage-adjacent data services. Booking business logic is implemented in server actions and domain modules under `lib/booking` and `lib/actions`.

## Major components

1. Web app
- Next.js 14 app routes and server/client components.
- Route groups for auth and logged-in experiences.

2. Domain services
- Booking engine modules:
  - availability validation
  - cancellation and refund policy decisions
  - slot locking
  - state transition guards

3. Data platform
- Supabase PostgreSQL with RLS-backed tables.
- Auth via Supabase session model.
- Admin-path access through service-role client where required.

4. Operational automation
- GitHub Actions scheduled workflow runs booking cron endpoints.
- Cron API routes generate reminders and process confirmation timeouts.

5. Integrations
- Resend (email templates and contact actions)
- Upstash Redis (rate limiting primary backend, in-memory fallback)
- Make + HubSpot (planned rollout with documented contracts)

## High-level data flow

1. User action hits page or server action.
2. Server action validates input (Zod where implemented), rate limits, and applies domain rules.
3. Supabase read/write persists business state.
4. Background cron routes process reminder/timeout tasks.
5. Notifications and integration hooks consume persisted state.

## Boundary rules

1. Product-critical logic must run server-side.
2. Time values are persisted in UTC where booking engine fields are used.
3. App URL/domain handling is centralized via config helper (`lib/config/app-url.ts`).
4. External automations should consume events/contracts, not own core business invariants.

## Current architecture risks

1. Legacy schema file is behind current migration reality.
2. Payment provider integration is not complete yet.
3. Calendar integration foundation exists but runtime sync flows are still planned.

## Related docs

- [Tech Stack](./tech-stack.md)
- [Architecture Decisions](./decisions)
- [Database and Migrations](../engineering/database-and-migrations.md)
