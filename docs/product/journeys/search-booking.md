# User Journey: Search and Booking

Last updated: 2026-03-30

## Goal

Help users discover relevant professionals and complete booking safely with clear trust, timezone, and policy context.

## Actors

1. User
2. Professional
3. Discovery engine
4. Booking engine

## Entry points

- `/` (public landing / home)
- `/buscar`
- `/profissional/[id]`
- `/agendar/[id]`
- `/solicitar/[id]`

## Canonical flow

1. User searches with structured filters + free text.
2. User opens professional profile and reviews trust/price/availability signals.
3. User selects service and duration context.
4. User selects slot with timezone clarity.
5. User reviews booking summary and policy acknowledgements.
6. User pays and booking enters correct state (confirmed or pending acceptance).

## Key rules from canonical spec

1. Tags enrich search recall but are not primary filters.
2. Search cards are rich but not noisy; price shown in user currency.
3. Service type is not exposed as primary search filter in MVP.
4. Slot hold is required before payment completion.
5. Booking state machine is explicit; UI state is simplified.
6. Recurring booking/scheduling rules follow deadline and reservation constraints.
7. Filter bar lives below the search input in a horizontal layout on desktop.
8. Specialty filter is enabled only after category selection.
9. Country/location must appear by full name in filters and cards.
10. Filter options must be derived from professionals currently available in platform data.
11. Public booking intent must be signup-first with login as secondary action path.

## Current implementation status

`In progress`

- Core search and direct booking works.
- Request-booking foundation is live (request, proposal, accept/decline/cancel, proposal expiration handling).
- Search cards and price filter labels now follow selected user currency (with symbol), not fixed BRL labels.
- Top category-chip strip removed from results area to keep IA cleaner (category now lives in the horizontal filter bar).
- Filter bar moved to horizontal layout below search bar.
- Specialty select is now category-dependent.
- Category/specialty/language/location options are data-driven from active professionals.
- Country labels render by full name (no 2-letter code) in search cards.
- Public landing and discovery navigation baseline is live (`/`, `/buscar`, `/sobre`, `/ajuda`, `/registrar-profissional`).
- Public booking CTA now routes unauthenticated visitors to signup-first flow with redirect context.
- Full recurring parity from source spec is not complete.

## Gaps

1. Full ranking/boost governance parity with tiers.
2. Transition tests still need parity hardening across direct + request-booking flows (transition guard already enforced in request-booking actions).
3. Full recurring scheduling reservation/release parity.
4. Source-of-truth asks for sign-up/login modal on unauthenticated booking intent; current implementation is signup-first page redirect (functional, but modal UX still pending).

## Next steps

1. Finalize tier-aware ranking and governance controls.
2. Expand recurring scheduling and reschedule policy parity.
3. Add transition-level tests and edge-case coverage for request-booking conversion conflicts.

## Related docs

- [Master Spec](../../spec/consolidated/master-spec.md)
- [Session Management Journey](./session-management.md)
- [Payments and Revenue Journey](./payments-billing-revenue.md)
