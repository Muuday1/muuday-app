# Muuday Master Specification

Last updated: 2026-03-29

This folder is the canonical product specification baseline for Muuday.

The files under `source-of-truth/` are copied from the 5 provided consolidation documents and must be treated as the new product truth.

## Structure

1. `source-of-truth/`
- Verbatim source files (Part 1 to Part 5).
- No decision in those files should be dropped.

2. `consolidated/master-spec.md`
- Unified operational summary across the 5 parts.
- Marks what is already decided, provisional, or deferred.

3. `../NEXT_STEPS.md`
- Single source of truth for upcoming work (P0/P1/P2/P3 priorities).

4. `consolidated/ai-agents-unified-instructions.md`
- Single instruction protocol for any AI coding agent.
- Not split by vendor/model.

5. `consolidated/open-validations.md`
- External validations that must happen before architecture freeze.

6. `consolidated/journey-coverage-matrix.md`
- Maps user/professional/admin/system journeys to implementation phases.

## Source files (verbatim)

- [Part 1 - Foundations, Search, Tiers](./source-of-truth/part1-foundations-search-tiers.md)
- [Part 2 - Onboarding and Booking Lifecycle](./source-of-truth/part2-onboarding-booking-lifecycle.md)
- [Part 3 - Payments, Billing, Revenue](./source-of-truth/part3-payments-billing-revenue-engine.md)
- [Part 4 - Admin Ops, Notifications, Trust](./source-of-truth/part4-admin-ops-notifications-trust.md)
- [Part 5 - Video, Compliance, Open Validations](./source-of-truth/part5-video-compliance-open-items.md)

## Governance

1. If code or behavior diverges from this spec, update implementation or explicitly document the delta.
2. Do not remove source-of-truth content.
3. New decisions should be added as additive deltas, not undocumented overrides.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
