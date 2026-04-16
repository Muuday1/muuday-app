# Next Steps

Last updated: 2026-04-16

Execute in order. Keep changes batchable, validated, and documented.

## Immediate queue

1. Run production smoke for onboarding review loop (`admin -> solicitar ajustes -> profissional corrige -> reenviar`) after each publish batch.
2. Continue professional operations polish with focus on calendar UX and scheduling-rule clarity in `/disponibilidade`.
3. Keep onboarding tracker copy/progression consistent and avoid reintroducing blocking optional fetches in modal open path.
4. Close remaining PT-BR cleanup on lower-traffic admin/member surfaces.
5. Evaluate and either merge or archive `feat/landing-page-redesign` explicitly (do not leave in ambiguous state).

## Pre-Wave-3 hardening

1. Keep production query-plan validation and index evidence current.
2. Keep JWT role-claim coverage and middleware fallback monitoring healthy.
3. Keep RLS audit evidence current for critical private tables.
4. Keep secrets rotation, sync audit, and DB pooling validation operational.
5. Keep Stripe resilience foundation aligned with DB migrations and operational tables, without opening real-money execution early.

## Wave 3 opening criteria

Do not open Wave 3 until all of the following are true:

1. Current stabilization backlog is materially closed.
2. Payment-rail execution order is confirmed and documented.
3. Financial compliance and audit posture are ready.
4. Operator runbooks and production secrets are current.

## Working rules

1. Use `C:\dev\muuday-app` only.
2. Keep OneDrive copies read-only.
3. Run validation before publishing meaningful changes.
4. Update `project-status.md`, `current-state.md`, and `next-steps.md` in the same batch for major changes.
5. Archive stale plans instead of letting active docs drift.
