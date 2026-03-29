# Rules And Constraints

Last updated: 2026-03-29

## Non-flexible constraints

1. Repository is the source of truth. Never rely on chat memory.
2. Booking invariants must remain server-side.
3. UTC booking storage model must be preserved.
4. App URL/domain behavior must use centralized config (`lib/config/app-url.ts`).
5. Migration order is authoritative for DB evolution.
6. Do not run destructive git commands (`reset --hard`, forced rollback) without explicit user instruction.
7. Do not parallel-edit same files with multiple agents at the same time.

## Architectural constraints

1. Core product logic belongs in app/server/db, not external automation tools.
2. External integrations (Make/HubSpot/etc.) are projections and orchestrators.
3. Cron endpoints must stay protected by secret auth.

## Integration constraints

1. Keep secrets out of repository.
2. Keep production env parity between Vercel and GitHub cron workflow.
3. Validate domain/alias consistency after each deployment.

## Naming and consistency constraints

1. Use explicit status markers in docs.
2. Keep docs folder high-signal and domain-organized.
3. Keep one canonical file per topic, avoid duplicate roadmaps/status files.

## Flexible areas

1. UX refinements inside existing journey goals.
2. Internal refactors that preserve behavior and constraints.
3. Additional integrations, if documented with status and rationale.
