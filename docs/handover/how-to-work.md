# How To Work

Last updated: 2026-03-29

## 1) Read order for any new contributor

1. `docs/handover/handover-overview.md`
2. `docs/handover/current-state.md`
3. `docs/handover/next-steps.md`
4. `docs/README.md` for full documentation map

## 2) How to navigate the repo

1. Product routes and UX: `app/`
2. Business logic: `lib/actions/`, `lib/booking/`
3. Platform/config/security helpers: `lib/`
4. Database model evolution: `db/sql/migrations/`
5. Operations scripts: `scripts/ops/`
6. Documentation: `docs/`

## 3) Task execution workflow

1. Confirm scope and impacted domains.
2. Implement minimal safe change.
3. Validate with:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
4. Run targeted smoke checks for touched flows.
5. Update handover docs before ending task.

## 4) Mandatory handover updates DURING work

Update these files incrementally while working:

1. `current-state.md` when implementation status changes.
2. `next-steps.md` when priority/order/dependencies change.
3. `session-log.md` for meaningful progress checkpoints.

Do not wait for the end of a long session.

## 5) Consistency guardrails

1. Docs must match current code behavior.
2. If uncertain, mark status explicitly (`Planned`, `In progress`, `Blocked`, `Done`).
3. Keep one canonical document per topic.
4. Remove stale files instead of keeping conflicting versions.

## 6) Definition of done (handover perspective)

A task is complete only when:

1. Code is updated and validated.
2. Relevant docs are updated.
3. `current-state.md` reflects reality.
4. `next-steps.md` is actionable for the next contributor.
5. `session-log.md` includes the meaningful change.
