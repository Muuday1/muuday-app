# User Journey: User Onboarding

Last updated: 2026-03-29

## Goal

Allow users to create account, complete profile basics, and reach trusted discovery/booking flow with correct timezone and policy context.

## Actors

1. User
2. Auth system
3. Profile and policy services

## Entry points

- `/cadastro`
- `/login`
- OAuth callback `/auth/callback`
- account completion `/completar-conta`

## Happy path

1. User creates account or logs in.
2. App ensures required identity and locale context (country/timezone/language).
3. User lands in discovery with policy-consistent defaults.
4. User can favorite professionals, open profiles, and begin booking.

## Key rules from canonical spec

1. User and professional accounts are separate account types (no dual-role shared account for now).
2. Public search is accessible without login, but booking actions from public flow must trigger sign-up/login modal.
3. Logged-in user primary navigation is:
- Buscar profissionais
- Bookings
- Favorites
- Profile
4. Settings/notifications/financial history are secondary or nested under Profile/Bookings.
5. User timezone context is first-class for all booking times.
6. Discovery must expose trust signals without requiring user to understand internal tier logic.
7. User should see final payable total in checkout, not internal fee breakdown.
8. For sensitive categories, user must see scope/disclaimer signals in profile and checkout.

## Edge cases

1. Missing required profile context blocks direct jump into booking.
2. Auth callback/session errors must be observable and user-friendly.
3. User without accepted required disclaimer cannot complete sensitive-category checkout.

## Current implementation status

`In progress`

- Core auth flow exists.
- Full disclaimer/versioned acceptance parity is not complete yet.

## Gaps

1. Full policy/disclaimer acceptance snapshot flow not fully enforced in checkout.
2. Full UX parity for recurring renewal management and pause flows pending.

## Next steps

1. Align onboarding profile requirements with canonical baseline.
2. Add explicit sensitive-category disclaimer acceptance flow where needed.
3. Expand user lifecycle states for recurring and dispute status visibility.

## Related docs

- [Master Spec](../../spec/consolidated/master-spec.md)
- [Search and Booking Journey](./search-booking.md)
- [Session Management Journey](./session-management.md)
