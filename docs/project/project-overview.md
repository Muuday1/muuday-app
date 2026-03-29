# Project Overview

Last updated: 2026-03-29

## Product definition

Muuday is a structured services marketplace connecting users (especially Brazilians abroad) with remote professionals across health/wellness, education, legal, finance, language/document, and career domains.

The operating model is not directory-only. It is an integrated platform with:

1. Controlled taxonomy and trust-based discovery.
2. Tiered professional plans (Basic/Professional/Premium).
3. Booking lifecycle with request booking and recurring scheduling.
4. Payments, payouts, and professional billing.
5. Admin cases, moderation, notifications, and auditability.
6. Sensitive-category compliance controls.

## Canonical baseline

The 5-part specification in `docs/spec/source-of-truth/` is now the canonical product truth.

Primary references:

- [Master Spec](../spec/consolidated/master-spec.md)
- [Execution Plan](../spec/consolidated/execution-plan.md)
- [Open Validations](../spec/consolidated/open-validations.md)

## Current stage

`In progress` - Platform baseline exists, but full implementation parity with the canonical 5-part spec is not complete.

## Program priorities

1. Achieve schema and state-model parity for booking foundation in production.
2. Complete Wave 1 and Wave 2 journey correctness (taxonomy/search/onboarding/booking).
3. Implement Wave 3 payments-revenue engine with Stripe-backed lifecycle and internal ledger safety.
4. Implement Wave 4 admin/trust/notifications operational layer.
5. Freeze Wave 5 session provider and compliance validations.

## Program constraints

1. Build in deterministic waves with explicit acceptance criteria.
2. Keep operations and auditability first-class.
3. Keep cost-effective tooling and avoid premature platform complexity.
4. Keep docs synchronized with real implementation state.

## Where to go next

- [Project Status](./project-status.md)
- [Roadmap](./roadmap.md)
- [Execution Alignment](./execution-alignment.md)
- [Journey Coverage Matrix](../spec/consolidated/journey-coverage-matrix.md)
