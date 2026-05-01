# Roadmap

Last updated: 2026-05-01

Source baseline: `docs/spec/source-of-truth/part1..part5`
Canonical status docs: `docs/NEXT_STEPS.md` + `docs/handover/current-state.md`

## Done

### Wave 0 - Baseline alignment and schema parity

1. Production schema parity and critical journey stabilization.
2. Monitoring and operational baseline activation.
3. Documentation consolidation around the canonical spec.

### Wave 1 - Discovery, taxonomy, and tier parity

1. Taxonomy governance and moderation model.
2. Tier limits and entitlements.
3. Search, ranking, filters, cards, trust signals, and favorites baseline.

### Wave 2 - Onboarding and booking lifecycle

1. Dual onboarding gates.
2. Booking and request-booking lifecycle.
3. Recurring booking foundations.
4. Professional onboarding review pipeline.
5. Dashboard tracker modal as the primary onboarding experience.

## Now

### Stabilization and UX refinement — CODE COMPLETE

1. ✅ Public shell, search, and profile UX stable and coherent.
2. ✅ Professional operations UX polished (calendar, scheduling, availability workspace).
3. ✅ Onboarding tracker responsive with critical-first loading and non-blocking optional hydration.
4. ✅ Copy, PT-BR, and consistency cleanup applied across public and admin surfaces.
5. ✅ Documentation consolidated and aligned (archive pass completed 2026-05-01).
6. ⏳ Human testing with 5+ real professionals pending for calendar UX.
7. ⏳ Landing page stakeholder sign-off pending.

## Next

### Wave 3 - Payments, billing, payouts, and revenue operations

**BLOCKED until:**
1. E2E sandbox validation of Stripe pay-in → Revolut → Trolley flow passes.
2. Revolut access token refreshed (currently expired).
3. Compliance/legal text freeze complete.

Architecture (locked 2026-04-24):
1. Stripe UK = customer pay-in.
2. Revolut Business = treasury/settlement.
3. Trolley = professional payout (KYC + mass payouts).
4. Airwallex/dLocal = contingency only.

Execution tracks:

1. Payment rail integration and subscription lifecycle.
2. Financial compliance, audit trail, and vault posture.
3. Reconciliation, retries, settlement, and operational alerts.

## Later

### Wave 4 - Admin trust operations, notifications, and monitoring maturity

1. Structured admin case operations.
2. Trust and moderation workflows.
3. Notification dispatcher and inbox reliability.
4. Alerting and observability maturity.

### Wave 5 - Session abstraction and compliance freeze

1. Session provider abstraction beyond current Agora lock.
2. Final compliance wording/versioning freeze.
3. External legal/tax/accounting closure.

## Open validations

1. Financial compliance closure for Wave 3.
2. Sensitive-category legal wording freeze.
3. Tax/accounting operating model finalization.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
