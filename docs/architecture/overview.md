# Architecture Overview

Last updated: 2026-04-10

Spec baseline: `docs/spec/source-of-truth/part1..part5`

## System summary

Muuday is a marketplace platform with a multi-domain architecture:

1. Discovery domain (taxonomy, ranking, trust signals).
2. Onboarding and professional domain.
3. Booking and scheduling domain.
4. Payments, billing, payout, and ledger domain.
5. Admin case and moderation domain.
6. Notifications and analytics domain.
7. Session execution domain (provider-agnostic abstraction).
8. Compliance and disclaimer governance domain.

## Core architectural boundaries

1. Booking state is not payment state.
2. Payment state is not payout state.
3. Case status is not booking status.
4. Session provider status is not booking truth.
5. UTC persistence is canonical for scheduling timestamps.

## Major components

1. Web application
- Next.js App Router routes for user/professional/admin flows.

2. Domain services
- Booking engine, availability engine, state transitions, recurring scheduling.

3. Data platform
- Supabase Postgres + RLS + auth model.

4. Financial engine (target parity with Part 3)
- Dual-rail payments by entity:
  - UK entity: Stripe end-to-end (where supported).
  - BR entity: Airwallex or dLocal end-to-end for BR professionals/payout rails.
- Professional subscription billing.
- Payout eligibility and payout batching.
- Internal financial ledger and snapshots.

5. Operations layer (target parity with Part 4)
- Structured case queue.
- Trust flags and moderation controls.
- Audit logs for sensitive actions.

6. Notification and analytics layer
- Event-driven notifications (email + in-app).
- Canonical analytics event schema.

7. Session execution layer
- Provider abstraction for session execution.
- Active provider for current implementation: Agora.

## High-level data flow

1. UI triggers domain action.
2. Domain action validates policy + state transitions.
3. Persist state and snapshots.
4. Emit domain events.
5. Downstream processors update notifications, timeline, analytics, and admin signals.

## Risk and freeze points

1. BR-entity rail provider final decision (Airwallex vs dLocal) remains open before Wave 3 real-money go-live.
2. Session provider is locked to Agora for current roadmap execution.
3. Compliance/legal wording finalization remains open.

## Related docs

- [Tech Stack](./tech-stack.md)
- [Master Spec](../spec/consolidated/master-spec.md)
- [Open Validations](../spec/consolidated/open-validations.md)
- [Execution Plan](../spec/consolidated/execution-plan.md)


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
