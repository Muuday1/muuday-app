# Sentry Integration

Last updated: 2026-04-29

## Status

- `Done`: SDK wired in app (client/server/edge) with env-guarded activation.
- `Done`: Next.js Sentry wrapper uses current treeshake config and router transition hook instrumentation.
- `Done`: auth/payment failure signals now emit explicit Sentry events for alert routing.
- `Pending`: configure Sentry dashboard alert rules (manual UI step).

## Files

- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- `instrumentation-client.ts`
- `next.config.js`
- `app/global-error.tsx`
- `lib/actions/booking.ts` (critical booking error capture)
- `lib/actions/request-booking.ts` (request-booking payment failure capture)
- `app/auth/callback/route.ts` (OAuth callback failure capture)
- `app/(auth)/login/page.tsx`
- `components/auth/LoginForm.tsx`
- `components/auth/SocialAuthButtons.tsx`

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
5. Configure alert rules (email) for `error` severity to `igorpinto.lds@gmail.com`.
6. Validate one failure + one recovery alert cycle.
7. Apply alert templates from `docs/engineering/runbooks/error-budget-and-alerting.md`.

## Notes

- If DSN is not configured, Sentry stays disabled (safe no-op).
- Keep sample rates conservative in production and raise only when needed.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
