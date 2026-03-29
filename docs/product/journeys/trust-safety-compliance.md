# User Journey: Trust and Compliance

Last updated: 2026-03-29

## Goal

Protect user trust and operational safety through reviews, verification, moderation, disputes, trust flags, and sensitive-category compliance controls.

## Actors

1. User
2. Professional
3. Admin trust operations
4. Compliance/policy services

## Canonical trust/compliance domains

1. Review lifecycle (one review per relationship, editable over time).
2. Professional response lifecycle and moderation controls.
3. Verification and badge semantics.
4. Dispute/no-show evidence workflows.
5. Off-platform payment enforcement and strike model.
6. Sensitive-category disclaimers on profile and checkout.

## Key non-negotiable rules

1. Sensitive categories must not imply unsupported regulated authority.
2. Disclaimer policy must be consistent across profile, checkout, and terms.
3. Booking-level disclaimer acceptance evidence must be storable.
4. Trust flags are mostly internal but can impact listing and booking eligibility.

## Current implementation status

`Planned/In progress`

- Review and moderation baseline exists.
- Full compliance versioning and sensitive-category governance parity is pending.

## Gaps

1. Full disclaimer template/version/acceptance model.
2. Full trust-flag and case-linking operational model.
3. Full moderation/audit playbooks and admin tooling parity.

## Next steps

1. Implement compliance data model for disclaimer versions and acceptance snapshots.
2. Align review moderation with case and audit workflows.
3. Finalize sensitive-category operational checklist and admin governance flows.

## Related docs

- [Master Spec](../../spec/consolidated/master-spec.md)
- [Open Validations](../../spec/consolidated/open-validations.md)
- [Admin Operations Journey](./admin-operations.md)
