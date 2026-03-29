# User Journey: Search and Booking

Last updated: 2026-03-29

## Goal

Help users discover relevant professionals and complete booking safely with clear trust, timezone, and policy context.

## Actors

1. User
2. Professional
3. Discovery engine
4. Booking engine

## Entry points

- `/buscar`
- `/profissional/[id]`
- `/agendar/[id]`

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

## Current implementation status

`In progress`

- Core search and booking works.
- Full request-booking and full recurring parity from source spec is not complete.

## Gaps

1. Full ranking/boost governance parity with tiers.
2. Full request-booking proposal lifecycle parity.
3. Full recurring scheduling reservation/release parity.

## Next steps

1. Finalize tier-aware ranking and governance controls.
2. Implement request-booking lifecycle end-to-end.
3. Expand recurring scheduling and reschedule policy parity.

## Related docs

- [Master Spec](../../spec/consolidated/master-spec.md)
- [Session Management Journey](./session-management.md)
- [Payments and Revenue Journey](./payments-billing-revenue.md)
