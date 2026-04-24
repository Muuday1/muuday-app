# Muuday Documentation

Last updated: 2026-04-14

This folder is the operational source of truth for current product state, engineering status, handover continuity, and active roadmap decisions.

## Start here

1. `docs/handover/control-snapshot.md` - one-page operational truth.
2. `docs/handover/current-state.md` - current product, infra, and risks.
3. `docs/handover/next-steps.md` - ordered execution queue.
4. `docs/project/roadmap.md` - active wave model.
5. `docs/spec/README.md` - canonical product baseline.

## Canonical baseline

The canonical product baseline remains the 5-part source-of-truth package under `docs/spec/source-of-truth/` and the consolidated spec set under `docs/spec/consolidated/`.

Do not silently override source-of-truth decisions. If implementation differs, record the delta in docs and handover.

## Current operating posture

- Wave 2 is closed.
- Public shell, search, professional onboarding, and dashboard/onboarding tracker are live and being refined.
- Wave 3 real-money execution is not open yet.
- `C:\dev\muuday-app` is the only active workspace.
- OneDrive copies are archive-only.

## Documentation rules

1. Update docs in the same batch as meaningful implementation changes.
2. Keep handover docs short, current, and operational.
3. Move stale planning detail to `docs/archive/` instead of letting active docs drift.
4. Prefer current state over long historical logs in active docs.
5. Treat `docs/project/project-status.md`, `docs/handover/current-state.md`, and `docs/handover/next-steps.md` as the minimum update set for major work.

## Documentation map

- `docs/spec/` - canonical product baseline and execution model.
- `docs/handover/` - current operating context and continuity.
- `docs/project/` - roadmap, overview, and status.
- `docs/architecture/` - system and stack decisions.
- `docs/engineering/` - setup, deployment, quality, and runbooks.
- `docs/integrations/` - third-party service implementation state.
- `docs/product/` - journey-level intent and experience design.
- `docs/human-actions/` - human decisions and external follow-up.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
