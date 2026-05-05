# Integration: Resend

Last updated: 2026-04-29

## Purpose

Transactional and lifecycle email delivery.

## Where it is used

- `lib/email/resend.ts`
- Waitlist confirmation path in `app/api/waitlist/route.ts`

## Current status

- `Done (active)`
- Email templates, broadcasts, and automation workflows are active in production.
- Multiple verified domains configured.

## Risks

1. Missing or invalid `RESEND_API_KEY` disables delivery.
2. Delivery outcomes are not yet fully observable in a centralized dashboard.

## Booking lifecycle email events (Resend Automations)

The following automation events are emitted server-side via `lib/email/resend-events.ts`:

**User events:**
- `user.started_checkout` — emitted when a booking is created (checkout begins)
- `user.booking_confirmed` — emitted **after** payment is captured by Stripe
- `user.payment_failed` — emitted when payment fails
- `user.session_completed` — emitted after the session is marked complete

**Professional events:**
- `professional.received_booking` — emitted when a user starts checkout
- `professional.booking_confirmed` — emitted **after** payment is captured
- `professional.session_completed` — emitted after the session is marked complete

> ⚠️ Confirmation emails (`user.booking_confirmed`, `professional.booking_confirmed`) are intentionally sent **only after** Stripe payment capture, not at booking creation time.

## Next steps

1. Validate sender domain and production API key setup.
2. Add delivery monitoring and alerting policies.
3. Expand booking lifecycle email coverage with explicit ownership.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
