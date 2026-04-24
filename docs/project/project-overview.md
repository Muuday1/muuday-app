# Project Overview

Last updated: 2026-04-24

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

`Stabilization` - Waves 0–2 are complete. Platform baseline is operational with search, booking, onboarding, admin review, and session execution (Agora with waiting room). Backend parallel work (Fases 1–5) delivered notifications, chat, push, client records, disputes, multi-service booking, and analytics. Wave 3 (real-money payments) is locked pending compliance readiness.

## Program priorities

1. ✅ Achieve schema and state-model parity for booking foundation in production. (Done)
2. ✅ Complete Wave 1 and Wave 2 journey correctness (taxonomy/search/onboarding/booking). (Done)
3. ⏳ Implement Wave 3 payments-revenue engine with dual-rail lifecycle (UK Stripe + BR Airwallex/dLocal) and internal ledger safety. (Locked — waiting for compliance + rail confirmation)
4. ✅ Implement Wave 4 admin/trust/notifications operational layer. (Backend complete — chat, push, client records, disputes, cases, multi-service)
5. ✅ Keep Agora as active video provider and execute Wave 5 compliance validations. (Agora locked; waiting room + game shipped)
6. 🔄 Close stabilization backlog: professional operations UX, copy cleanup, doc drift remediation.

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


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
