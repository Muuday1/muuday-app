# User Journey: Professional Onboarding

Last updated: 2026-03-29

## Goal

Enable professionals to create a profile, submit for review, and manage weekly availability.

## Actors

1. Professional user
2. Admin reviewer

## Entry points

- `/completar-perfil`
- `/editar-perfil-profissional`
- `/disponibilidade`
- Admin panel `/admin`

## Happy path

1. Professional user completes profile fields (category, bio, pricing, languages, experience).
2. Profile enters `pending_review` status.
3. Admin reviews and sets status (`approved`, `rejected`, `suspended`).
4. Approved professional appears in public search.
5. Professional configures weekly availability.

## Edge cases

1. Non-professional users are blocked from availability page.
2. Profile updates can return to review status depending on flow.
3. Availability write operations replace previous rows.

## Current implementation status

- `Done` for profile CRUD and basic moderation lifecycle.
- `In progress` for stronger verification and operational SLA automation.

## Gaps

1. Verification artifacts/checklists are not yet integrated into admin workflow.
2. Availability currently writes legacy `availability` table; expanded rule/exception tooling can be improved in UI.

## Next steps

1. Add stronger trust verification workflow.
2. Add SLA-driven admin alerts for pending reviews.

## Related docs

- [Admin Operations Journey](./admin-operations.md)
- [Supabase Integration](../../integrations/supabase.md)
