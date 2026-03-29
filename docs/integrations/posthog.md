# PostHog Integration

Last updated: 2026-03-29

## Status

- `In progress`: client provider and funnel events implemented.
- `Pending`: dashboard creation, retention cohorts, and ownership/alerts.

## Files

- `components/analytics/PostHogProvider.tsx`
- `lib/analytics/posthog-client.ts`
- `app/layout.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/cadastro/page.tsx`
- `components/booking/BookingForm.tsx`

## Required env vars

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` (default: `https://us.i.posthog.com`)

## Event taxonomy (implemented)

Auth:
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

## Validation checklist

1. Set PostHog env vars in Vercel production.
2. Deploy and open `/login`, `/cadastro`, `/agendar/[id]`.
3. Confirm events above are visible in PostHog Live Events.
4. Build initial funnel:
   1. `booking_form_viewed`
   2. `booking_time_selected`
   3. `booking_submit_clicked`
   4. `booking_created`

## Notes

- If PostHog env vars are absent, capture helpers are no-op.
- Keep event names stable to avoid dashboard fragmentation.
