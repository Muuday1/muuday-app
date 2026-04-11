# Onboarding, Tiers and Booking - Implementation Plan (14 phases)

Last updated: 2026-04-11
Status: Active, pre-Wave 3 alignment
Canonical refs: `docs/spec/source-of-truth/part1-foundations-search-tiers.md`, `docs/spec/source-of-truth/part2-onboarding-booking-lifecycle.md`, `docs/spec/consolidated/master-spec.md`, `docs/project/roadmap.md`

---

## Canonical decisions locked

1. Product is video-only (Agora for now). No in-person delivery.
2. No service jurisdiction. Professionals can serve globally.
3. Tier limits:
   - Basic: `1 service / 1 specialty`
   - Professional: `5 / 3`
   - Premium: `10 / 3`
4. Annual = `10x` monthly.
5. Basic is paid (`BRL 49.99` and `USD/GBP/EUR 9.99`) with 3-month trial starting at go-live.
6. `billing_card_for_professional_plan` is required in C6 for review submission and revalidated for first booking acceptance.

---

## Phase 1 - Schema and data parity

Objective: ensure database contracts and schema have no drift.

Deliverables:
1. Validate/apply onboarding, tier, recurring booking and batch booking migrations (`027`..`031`).
2. Confirm all C1-C9 fields exist in `professionals`, `professional_settings`, `professional_applications`, and booking tables.
3. Confirm critical search/availability/booking indexes in production.

Exit criteria:
1. `025-sql-apply-integrity-check` with zero failures.
2. Required onboarding fields available through API without implicit fallback.

## Phase 2 - Tier core (backend)

Objective: single deterministic server-side enforcement.

Deliverables:
1. `lib/tier-config.ts` as source of truth for limits and features.
2. Normalize PT-BR labels and remove broken encoding text.
3. Ensure limit helpers (`services`, `specialties`, `tags`, `bookingWindowDays`) are used in write actions.

Exit criteria:
1. No write path accepts tier-limit bypass through client payload.

## Phase 3 - Gate engine C1-C9

Objective: convert gates into a canonical operational contract.

Deliverables:
1. `evaluateOnboardingGates` as single source for `review_submission`, `go_live`, `first_booking_acceptance`, `payout_receipt`.
2. `billing_card_for_professional_plan` required at C6 and revalidated at first booking.
3. `payout_receipt` independent from first-booking gate.
4. Blocker messages without mojibake and with normalized reason codes.

Exit criteria:
1. Gate state is reproducible for any professional with the same snapshot.

## Phase 4 - Onboarding shell (dashboard)

Objective: guided onboarding experience with overlay/tracker.

Deliverables:
1. C1-C9 tracker with clear progress and blockers.
2. Flow: simple signup -> dashboard with overlay.
3. C6 centralizes plan, terms and card.

Exit criteria:
1. Incomplete professional cannot publish or accept first booking.

## Phase 5 - Identity and public profile

Objective: consistency between account data and professional data.

Deliverables:
1. Dedicated professional `display_name` (not derived from account `full_name`).
2. Profile fields: bio, photo, languages, credentials, WhatsApp, social links, cover, intro video (tier-gated).
3. Full removal of jurisdiction references.

Exit criteria:
1. Public profile renders only allowed fields by tier and availability.

## Phase 6 - Service and professional catalog

Objective: enforce offer setup by canonical tier limits.

Deliverables:
1. Enforce service count by tier.
2. Enforce specialties/tags by tier.
3. Validate service price/duration/options by tier.

Exit criteria:
1. Exceeding limits returns structured backend error.

## Phase 7 - Availability and operating rules

Objective: predictable schedule behavior with validated constraints.

Deliverables:
1. Tier booking windows (60/90/180 days).
2. Tier min-notice/buffer rules (Basic fixed 15 min where applicable).
3. Cancellation policy acceptance required.

Exit criteria:
1. Availability rules and gate rules stay aligned (no UI/backend divergence).

## Phase 8 - One-off and request-booking

Objective: close booking transitions without state inconsistency.

Deliverables:
1. One-off flow: create, confirm, cancel, reschedule, no-show.
2. Request-booking flow: proposal, accept/reject, expiry.
3. Slot hold/release with deadlines.

Exit criteria:
1. State machine and UI show same final booking state.

## Phase 9 - Recurrence and multiple dates

Objective: recurring and batch as separate contracts.

Deliverables:
1. Recurrence: same day/same time, periodicity (`weekly|biweekly|monthly|custom_days`).
2. Duration by occurrence count or end date.
3. Multiple-dates mode for one-off batch.
4. Opt-in auto-renewal for recurring.

Exit criteria:
1. Recurring groups and batch groups stay consistent in DB and agenda.

## Phase 10 - Video session (Agora)

Objective: secure and predictable room access.

Deliverables:
1. Token server and participant eligibility validation.
2. Time-window and eligible booking status checks.
3. Controlled fallback when Agora env is missing.

Exit criteria:
1. Only authorized participants can enter `/sessao/[bookingId]` during valid window.

## Phase 11 - Admin review (approve/reject/needs_changes)

Objective: complete review cycle with auditability.

Deliverables:
1. Review queue + detail with evidence.
2. Actions: `approved`, `rejected`, `needs_changes`.
3. Professional notification for each decision.
4. `admin_audit_log` entry for each action.

Exit criteria:
1. End-to-end review works without manual workarounds.

## Phase 12 - Security and auth hardening

Objective: remove login intermittency and enforce security baseline.

Deliverables:
1. Middleware/callback deterministic cookie application (no `setAll` race overwrite).
2. CSP and Permissions-Policy compatible with Stripe/Agora/Google OAuth.
3. Server-side validation and input sanitization for critical writes.

Exit criteria:
1. Password and OAuth login with stable session and redirect.

## Phase 13 - Quality and observability

Objective: close technical suite and release safety.

Deliverables:
1. CI gates: lint, typecheck, build, state-machines, e2e.
2. Deterministic E2E fixtures (`open`, `manual`, `blocked`) with auto-heal.
3. Journey coverage matrix updated to real state.

Exit criteria:
1. Main stays green, with only intentional non-critical skips documented.

## Phase 14 - Sign-off and handover

Objective: formal Wave 2 closure and clean Wave 3 entry.

Deliverables:
1. Update roadmap, master-spec, execution-plan and handover docs.
2. Explicit status markers: done, in progress, deferred.
3. Final technical + manual checklist attached.

Exit criteria:
1. Wave 2 formally closed with traceable evidence.

---

## Appendix A - Public contracts

1. Gate contract: `review_submission`, `go_live`, `first_booking_acceptance`, `payout_receipt`.
2. Booking contract: `one_off`, `request_booking`, `recurring`, `batch`.
3. Tier contract: backend-enforced limits/features by tier.
4. Video gate contract: participant + time window + eligible status.

## Appendix B - Canonical tier matrix

1. Basic: 1 service, 1 specialty, 3 tags, 60-day booking window.
2. Professional: 5 services, 3 specialties, 5 tags, 90 days.
3. Premium: 10 services, 3 specialties, 10 tags, 180 days.

## Appendix C - Onboarding stages C1-C9

1. C1 Account
2. C2 Identity
3. C3 Public profile
4. C4 Service
5. C5 Availability
6. C6 Plan + terms + card
7. C7 Payout
8. C8 Submit review
9. C9 Go live

## Appendix D - Security baseline

1. Session cookies applied only on final response (no response overwrite race).
2. CSP/Permissions-Policy aligned for Stripe/Agora/OAuth.
3. Input sanitization + server-side validation on critical routes/actions.

## Appendix E - Test acceptance

1. `npm run lint`
2. `npm run typecheck`
3. `npm run build`
4. `npm run test:state-machines`
5. `npm run test:e2e`

## Appendix F - Out of scope for this package

1. Full real-money Wave 3 implementation (Stripe/Airwallex/dLocal) beyond prep/contracts.
2. Group session (Premium future) as functional delivery.

## Appendix G - Canonical docs hierarchy

1. `docs/project/roadmap.md` and `docs/spec/consolidated/master-spec.md` are canonical scope/status docs.
2. `docs/spec/consolidated/execution-plan.md` is derived operational plan and must reference canonical docs.
3. `docs/spec/consolidated/journey-coverage-matrix.md` reflects real implementation state (no stale placeholders).