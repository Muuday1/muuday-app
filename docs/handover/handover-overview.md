# Handover Overview

Last updated: 2026-03-30

## Product summary

Muuday is a services marketplace with integrated discovery, booking, payments, payouts, trust, admin operations, and compliance controls.

## Canonical baseline

The canonical decision baseline is now:

1. `docs/spec/source-of-truth/part1-foundations-search-tiers.md`
2. `docs/spec/source-of-truth/part2-onboarding-booking-lifecycle.md`
3. `docs/spec/source-of-truth/part3-payments-billing-revenue-engine.md`
4. `docs/spec/source-of-truth/part4-admin-ops-notifications-trust.md`
5. `docs/spec/source-of-truth/part5-video-compliance-open-items.md`

Use `docs/spec/consolidated/master-spec.md` for unified reading and `execution-plan.md` for build order.

## Current stage

`In progress` - Implementation exists for major MVP surfaces, but full parity with canonical 5-part spec is not complete.

## Current priorities

1. Wave 2 parity for onboarding and booking lifecycle correctness.
2. Apply migration 013 in production and keep dual-gate policy consistent.
3. Activate Inngest in production (keys + cloud sync) while keeping cron fallback.
4. Wave 3 payments-revenue implementation (Stripe + ledger + payout lifecycle).
5. Wave 4 admin case operations and trust/notification system completion.

## Biggest risks / unknowns

1. BR-entity rail provider decision still open (Airwallex vs dLocal) for Wave 3 real-money go-live.
2. Session provider lock is closed (Agora) for current roadmap execution.
3. Open legal/tax wording freeze for sensitive categories and final compliance language.

## Where to start (new contributor)

1. Read `docs/spec/README.md`.
2. Read `docs/spec/consolidated/master-spec.md`.
3. Execute `docs/spec/consolidated/execution-plan.md` in wave order.
4. Use `docs/handover/current-state.md` + `docs/handover/next-steps.md` as real-time operating context.
