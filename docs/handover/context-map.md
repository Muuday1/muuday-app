# Context Map

Last updated: 2026-04-24

## Repository map

- Canonical active local workspace: `C:\dev\muuday-app`
- Archived/non-active workspace snapshots must not be used for commits or deploys.

- `app/`: routes and UX surfaces
- `components/`: reusable UI
- `lib/actions/`: server actions
- `lib/booking/`: booking-domain logic
- `db/sql/migrations/`: DB evolution source-of-truth
- `docs/`: documentation source-of-truth

## Documentation map (updated)

- `docs/spec/`
  - canonical product baseline (source files + consolidated execution docs)

- `docs/project/`
  - strategy status, roadmap, and wave planning
  - `docs/project/international-expansion/` — i18n, market detection, CMS, payments/fiscal for new markets
  - `docs/project/mobile-app/` — API-first refactor, mobile app requirements, implementation roadmap

- `docs/product/journeys/`
  - journey-by-journey implementation and gaps

- `docs/architecture/`
  - domain boundaries, target architecture, stack states

- `docs/engineering/`
  - setup, quality, deployment, runbooks
  - includes data governance and lifecycle policy

- `docs/integrations/`
  - provider-specific state and rollout notes

- `docs/handover/`
  - continuity system for any new engineer/agent

- `docs/human-actions/`
  - human-owned decisions, validations, and open tool selection backlog
  - live operator checklist for provider dashboard actions

## Where to find key topics

1. Canonical decision baseline: `docs/spec/source-of-truth/`
2. Unified decision view: `docs/spec/consolidated/master-spec.md`
3. Ordered build plan: `docs/NEXT_STEPS.md`
4. International expansion plan: `docs/project/international-expansion/00-master-plan.md`
5. Mobile app roadmap: `docs/project/mobile-app/00-executive-summary.md`
4. External validation blockers: `docs/spec/consolidated/open-validations.md`
5. Current implementation reality: `docs/handover/current-state.md`
6. Immediate execution queue: `docs/NEXT_STEPS.md`

## Cross-file dependency rule

If you update code for a domain, update:

1. the corresponding journey file,
2. project status,
3. handover current-state/next-steps,
4. spec delta notes if behavior diverges from source-of-truth.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
