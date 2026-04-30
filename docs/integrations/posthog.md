# PostHog Integration

Last updated: 2026-04-29

## Status

- `Done`: client provider, funnel events, and feature-flag usage implemented.
- `Pending`: dashboard creation, retention cohorts, and product analytics review cadence (manual UI steps).

## Files

- `components/analytics/PostHogProvider.tsx`
- `lib/analytics/posthog-client.ts`
- `lib/analytics/feature-flags.ts`
- `app/layout.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/cadastro/page.tsx`
- `components/booking/BookingForm.tsx`

## Required env vars

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (default: `https://us.i.posthog.com`)

## Event taxonomy (implemented)

Auth:
- `auth_signup_started`
- `auth_login_succeeded`
- `auth_login_failed`
- `auth_signup_succeeded`
- `auth_signup_failed`

Booking funnel:
- `booking_form_viewed`
- `booking_date_selected`
- `booking_time_selected`
- `booking_submit_clicked`
- `booking_created`
- `booking_create_failed`

Navigation:
- `$pageview` captured on route changes.

Feature flags:
- `booking_recurring_enabled` (used in checkout to control recurring package option rollout)

## Validation checklist

1. Set PostHog env vars in Vercel production.
2. Deploy and open `/login`, `/cadastro`, `/agendar/[id]`.
3. Confirm events above are visible in PostHog Live Events.
4. Build initial funnel:
   1. `booking_form_viewed`
   2. `booking_time_selected`
   3. `booking_submit_clicked`
   4. `booking_created`
5. Configure alert thresholds (manual dashboard step) from:
   - `docs/engineering/runbooks/error-budget-and-alerting.md`
   - signup drop-off: `auth_signup_started -> auth_signup_succeeded`
   - booking conversion drop: `booking_submit_clicked -> booking_created`

## Notes

- If PostHog env vars are absent, capture helpers are no-op.
- Keep event names stable to avoid dashboard fragmentation.
- Feature-flag behavior is fail-open for existing checkout UX (`undefined` flag state keeps current behavior).


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
