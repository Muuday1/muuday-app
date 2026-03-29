# User Journey: Payments and Revenue

Last updated: 2026-03-29

## Goal

Provide reliable money movement across booking charges, refunds, disputes, payouts, recurring cycles, and professional subscription billing.

## Actors

1. User
2. Professional
3. Platform finance engine
4. Admin finance operations
5. Payment provider

## Canonical flow domains

1. One-off booking payment and state-aware confirmation.
2. Manual-accept booking payment + timeout refund handling.
3. Request-booking proposal payment conversion.
4. Recurring/monthly cycle collection with session-aware payout release.
5. Professional plan billing with trial and grace rules.
6. Refund/dispute/payout hold/reversal operations.
7. Internal ledger and role-aware financial visibility.

## Key non-negotiable rules

1. Muuday charges customer first; professional payout is delayed.
2. Payout eligibility starts after session completion + buffer and no dispute hold.
3. Weekly payout with minimum threshold and rollover logic.
4. Customer sees final total; professional sees net with expandable detail.
5. Refunds return to original payment method in MVP.
6. Professional subscription failure follows grace period then booking-block behavior.

## Current implementation status

`In progress`

- Foundation tables and placeholders exist.
- Full provider-backed lifecycle and ledger parity are not complete.

## Gaps

1. Idempotent webhook-driven payment lifecycle.
2. Full payout eligibility and batch payout engine.
3. Professional billing and debt-recovery lifecycle parity.
4. Full ledger and reconciliation visibility by role.

## Next steps

1. Implement Stripe-backed charge/refund/payout flow.
2. Build internal ledger model and payout eligibility service.
3. Build professional plan billing flow with trial/grace/lock behavior.
4. Add finance-case operations and auditability.

## Related docs

- [Master Spec](../../spec/consolidated/master-spec.md)
- [Open Validations](../../spec/consolidated/open-validations.md)
- [Integration: Stripe (to create/update)](../../integrations)
