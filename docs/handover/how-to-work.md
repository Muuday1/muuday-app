# How To Work

Last updated: 2026-03-29

## 1) Mandatory read order

1. `docs/spec/README.md`
2. `docs/spec/consolidated/master-spec.md`
3. `docs/spec/consolidated/execution-plan.md`
4. `docs/handover/current-state.md`
5. `docs/handover/next-steps.md`

## 2) Core operating rule

Treat the 5 source files in `docs/spec/source-of-truth/` as canonical truth.

Do not silently override them in code or docs.
If implementation diverges, document explicit deltas.

## 3) Task execution workflow

1. Map task to one wave and one domain.
2. Identify impacted states (booking/payment/payout/case/review/session).
3. Implement with deterministic transitions and explicit permissions.
4. Validate with relevant automated checks and targeted journey smoke tests.
5. Update docs during work, not only at the end.
6. At each section/prompt checkpoint, update affected docs immediately.
7. If a new docs file is created, add it to `docs/README.md` and `docs/handover/context-map.md` in the same task.

## 4) Required docs updates during execution

Always update:

1. `docs/handover/current-state.md`
2. `docs/handover/next-steps.md`
3. `docs/handover/session-log.md`
4. affected domain docs (journeys, architecture, integrations, project status)
5. `docs/README.md` and context map when new docs artifacts are introduced
6. `docs/architecture/tech-stack.md` whenever a tool/component changes phase/status/trigger

## 5) Consistency guardrails

1. Keep booking/payment/payout/case statuses separated.
2. Keep UTC canonical time storage rules.
3. Keep role boundaries explicit (user/professional/admin/system).
4. Keep sensitive admin actions auditable.
5. Keep docs and implementation parity visible.

## 6) Definition of done

A task is done only when:

1. behavior is implemented and tested,
2. status transitions are safe,
3. docs are updated,
4. next action is clear for the next contributor.
