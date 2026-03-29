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

## Critical dual-gate rule

1. Public listing eligibility is not equal to first-booking acceptance eligibility.
2. Professional can be listed but blocked from first accepted booking until payout/payment requirements are complete.

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
