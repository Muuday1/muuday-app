# Rules And Constraints

Last updated: 2026-03-29

## Non-flexible constraints

1. `docs/spec/source-of-truth/part1..part5` is canonical baseline.
2. Booking, payment, payout, and case states must remain separated.
3. UTC canonical storage for booking/session timestamps must be preserved.
4. Core business invariants must remain server-side.
5. Migration order is authoritative for DB evolution.
6. No destructive git operations without explicit user instruction.
7. Do not parallel-edit the same files with multiple agents simultaneously.

## Architectural constraints

1. Keep provider integrations as adapters, not business source-of-truth.
2. Keep internal ledger logic independent from raw processor object state.
3. Keep case and audit models first-class for operational safety.
4. Keep session execution provider-agnostic until provider lock is finalized.

## Compliance constraints

1. Sensitive-category wording must not imply unsupported regulated authority.
2. Disclaimer handling must be versioned and traceable at profile/checkout/booking level.
3. Verification badges must map to explicit internal criteria.

## Documentation constraints

1. Documentation updates are part of done.
2. Do not delete source-of-truth files imported from the 5-part package.
3. Keep one canonical file per topic and status explicit.
4. Record blockers and open validations in docs, not only in chat.
5. Update `docs/` continuously during each implementation section/prompt.
6. Any new docs file must be linked from `docs/README.md` and represented in handover context mapping.

## Flexible areas

1. UX and visual refinement without policy drift.
2. Internal refactors preserving behavior and constraints.
3. Tooling improvements aligned with cost-effective rollout.
