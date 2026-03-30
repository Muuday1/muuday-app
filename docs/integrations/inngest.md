# Inngest Integration

Last updated: 2026-03-30

## Purpose

Durable background-job orchestration for retries, idempotent async workflows, and event-driven operations.

## Status

- `In progress`: provider selected and first non-critical workflow wired.
- `Done`: Inngest endpoint at `/api/inngest` with function `sync-booking-reminders` (cron trigger + event trigger).
- `Done`: production endpoint health check (`https://muuday-app.vercel.app/api/inngest`) returns cloud mode + key detection.
- `Pending`: clear/confirm stale "unattached syncs" in Inngest dashboard by forcing new sync from current endpoint.

## Environment variables

- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

## Rollout approach (cost-efficient)

1. Keep existing GitHub cron jobs active for stability.
2. Introduce Inngest first for non-critical async flows (notifications/retries).
3. Expand to booking/payment async orchestration only after validation.

## Current implementation

1. Route: `app/api/inngest/route.ts`
2. Client: `inngest/client.ts`
3. Function: `inngest/functions/index.ts` (`sync-booking-reminders`)
4. Shared logic: `lib/ops/booking-reminders.ts`
5. Cron fallback remains active: `app/api/cron/booking-reminders/route.ts`

## Local run

1. Start app: `npm run dev`
2. Start Inngest dev server: `npm run inngest:dev`
3. Confirm function registration in Inngest dev UI and invoke test trigger if needed.

## Next steps

1. Confirm app sync attachment in Inngest cloud for `https://muuday-app.vercel.app/api/inngest` (ignore/remove stale unattached sync records).
2. Validate scheduled executions in cloud and compare parity with cron.
3. Keep clear idempotency keys and retry-safe handlers as more workflows migrate.
