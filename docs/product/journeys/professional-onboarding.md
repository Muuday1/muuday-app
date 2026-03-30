# User Journey: Professional Onboarding

Last updated: 2026-03-29

## Goal

Guide professionals from account creation to trusted go-live, then to first-booking eligibility with complete operational readiness.

## Actors

1. Professional
2. Admin reviewer
3. Onboarding and compliance services

## Entry points

- account setup and profile routes
- availability and booking settings routes
- admin moderation queue

## Canonical onboarding stages

1. Account creation with country/timezone/language.
2. Taxonomy positioning (category/subcategory/specialty).
3. Public profile baseline (photo, bio, languages, profile quality).
4. Service setup baseline (service type, duration, pricing).
5. Availability setup and booking constraints.
6. Plan selection and billing preparation.
7. Payment/payout readiness gating before first booking acceptance.
8. Light first go-live admin review.

## Required field matrix (must be explicit in implementation)

1. Required at account creation:
- name, email, password/auth, country, timezone, primary language
2. Required for valid profile draft:
- display name, category/subcategory/specialty, headline, short bio
3. Required for review submission:
- profile photo, at least one service, service price/duration, availability baseline, plan selection
4. Required for go-live:
- approved review, go-live blockers resolved, sensitive-category requirements when applicable
5. Required for first booking acceptance:
- payout onboarding minimum complete and professional billing card on file
6. Required for payout:
- payout/KYC requirements complete

## Critical dual-gate rule

1. Public listing eligibility is not equal to first-booking acceptance eligibility.
2. Professional can be listed but blocked from first accepted booking until payout/payment requirements are complete.
3. Professional primary navigation is:
- Dashboard
- Calendario
- Financeiro
- Configuracoes
4. Professional should not see user discovery navigation as the primary logged-in workspace.

## Current implementation status

`In progress`

- Core profile and availability management exists.
- Full dual-gate operational parity and sensitive-category compliance path is incomplete.

## Gaps

1. Full publication-vs-booking eligibility state model parity.
2. Full structured credential/disclaimer governance for sensitive categories.
3. Full SLA-backed admin review workflow and case linking.

## Next steps

1. Implement explicit onboarding progress and gate-state model.
2. Link onboarding checks to admin case/review queue.
3. Enforce category-aware compliance checks before go-live/first booking where required.

## Related docs

- [Master Spec](../../spec/consolidated/master-spec.md)
- [Admin Operations Journey](./admin-operations.md)
- [Trust and Compliance Journey](./trust-safety-compliance.md)
