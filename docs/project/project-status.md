# Project Status

Last updated: 2026-04-14

Spec baseline: `docs/spec/source-of-truth/part1..part5`

## Snapshot

- Wave 0: Done
- Wave 1: Done
- Wave 2: Done (closed 2026-04-10)
- Stabilization and UX refinement: In progress
- Wave 3 real-money execution: Not started

## Production state

1. Public shell is live and usable for logged-out and logged-in journeys.
2. Search, profile, and booking entry flows are operational.
3. Professional signup and admin-reviewed onboarding pipeline are operational.
4. Dashboard tracker modal is the active professional onboarding experience.
5. Calendar configuration and sync are being concentrated in `/disponibilidade`.

## Infrastructure state

1. Supabase Pro and Vercel Pro are active.
2. CI quality gates exist and are part of the release path.
3. Search indexing and rate limiting baselines are in place.
4. Monitoring exists through Sentry and Checkly.
5. DB webhook to async processing bridge is live.

## Major completed milestones

1. Taxonomy, search, and discovery foundations are implemented.
2. Tier enforcement and professional visibility gates are implemented.
3. Booking lifecycle and request-booking foundations are implemented.
4. Professional onboarding review pipeline is implemented.
5. Dashboard onboarding tracker has replaced the old standalone onboarding page.
6. Public/member PT-BR cleanup and search currency-filter corrections have shipped.

## Active gaps

1. Professional operations UX still needs refinement, especially around calendar and scheduling experience.
2. Financial and compliance hardening needed for Wave 3 remains open.
3. Some lower-traffic surfaces still need copy and consistency cleanup.

## Blockers

1. Wave 3 depends on payment-rail execution work and compliance readiness.
2. Sensitive-category legal/tax wording is not fully frozen.

## Continuity rule

Every meaningful implementation batch should update:

1. `docs/project/project-status.md`
2. `docs/handover/current-state.md`
3. `docs/handover/next-steps.md`
