# Inngest Integration

Last updated: 2026-03-30

## Purpose

Durable background-job orchestration for retries, idempotent async workflows, and event-driven operations.

## Status

- `In progress`: provider selected (Inngest) and environment slots added.
- `Pending`: first function registration and event flow migration from cron-only orchestration.

## Environment variables

- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

## Rollout approach (cost-efficient)

1. Keep existing GitHub cron jobs active for stability.
2. Introduce Inngest first for non-critical async flows (notifications/retries).
3. Expand to booking/payment async orchestration only after validation.

## Next steps

1. Add minimal Inngest function scaffold in app code.
2. Move one reminder/notification path behind Inngest with parity checks.
3. Keep clear idempotency keys and retry-safe handlers.
