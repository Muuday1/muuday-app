# User Journey: Search and Booking

Last updated: 2026-03-29

## Goal

Help users discover professionals and create one-off or recurring bookings safely.

## Actors

1. End user
2. Professional
3. Booking engine

## Entry points

- `/buscar`
- `/profissional/[id]`
- `/agendar/[id]`

## Happy path

1. User enters search page with default mixed-category suggestions.
2. User filters by category, specialty, price, availability window, location, and language.
3. User opens professional profile and reviews details.
4. User opens booking page.
5. User selects slot and optionally recurring package.
6. Server validates slot, notice window, booking window, conflicts, and availability constraints.
7. Slot lock is acquired, booking record is created, and payment row is recorded.

## Edge cases

1. User cannot book own professional profile.
2. Conflicting slots return booking error.
3. Booking blocks when recurring is not enabled for the professional.
4. Manual confirmation mode creates `pending_confirmation` bookings.

## Current implementation status

- `Done` for core search experience and booking creation flow.
- `In progress` for provider-backed payment lifecycle and advanced recurring conflict handling.

## Gaps

1. Payment capture is still legacy placeholder (not Stripe webhook flow).
2. Google Calendar conflict checks are not fully integrated.

## Next steps

1. Implement Stripe-backed payment lifecycle.
2. Implement calendar conflict sync and event write-back.

## Related docs

- [Session Management Journey](./session-management.md)
- [Architecture Overview](../../architecture/overview.md)
