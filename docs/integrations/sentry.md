# Sentry Integration

Last updated: 2026-03-29

## Status

- `In progress`: SDK wired in app (client/server/edge) with env-guarded activation.
- `Pending`: dashboard alerts, issue ownership, and release health workflow in Sentry UI.

## Files

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- `instrumentation-client.ts`
- `app/global-error.tsx`
- `lib/actions/booking.ts` (critical booking error capture)

## Required env vars

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN` (optional server override)
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (default example: `0.1`)
- `SENTRY_TRACES_SAMPLE_RATE` (default example: `0.1`)

## Validation checklist

1. Set DSN env vars in Vercel production.
2. Deploy.
3. Trigger a controlled frontend error and confirm event appears in Sentry.
4. Trigger a controlled server-side booking error and confirm event appears with `area=booking_create`.
5. Configure alert rules (email/Slack) for `error` severity.

## Notes

- If DSN is not configured, Sentry stays disabled (safe no-op).
- Keep sample rates conservative in production and raise only when needed.
