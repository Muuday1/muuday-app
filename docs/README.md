# Muuday Documentation

Last updated: 2026-03-29

This folder is the source of truth for product context, technical architecture, execution status, operational readiness, and handover continuity.

## Canonical spec baseline

The 5-part consolidation package is now the canonical product baseline and is stored under:

- [Spec Index](./spec/README.md)
- [Master Spec](./spec/consolidated/master-spec.md)
- [Execution Plan](./spec/consolidated/execution-plan.md)
- [Unified AI Agent Instructions](./spec/consolidated/ai-agents-unified-instructions.md)
- [Open Validations](./spec/consolidated/open-validations.md)
- [Journey Coverage Matrix](./spec/consolidated/journey-coverage-matrix.md)

Important rule:
- Do not remove or silently override decisions from `docs/spec/source-of-truth/part1..part5`.
- If implementation differs, document explicit deltas.

## How to use this documentation

1. Start with project docs for priorities and status.
2. Read journey docs to understand end-to-end flows.
3. Read the spec baseline before major implementation decisions.
4. Use architecture docs for system boundaries and stack decisions.
5. Use engineering docs for setup, deploy, runbooks, and quality checks.
6. Use integrations docs for third-party services and implementation state.

## Status conventions

- `Done`: implemented and in use.
- `In progress`: partially implemented or rollout in progress.
- `Planned`: approved but not started.
- `Blocked`: waiting on dependency or external setup.
- `Deprecated`: should not be used going forward.

## Documentation map

- [Spec Baseline](./spec/README.md)

- [Handover Overview](./handover/handover-overview.md)
- [Handover Current State](./handover/current-state.md)
- [Handover Next Steps](./handover/next-steps.md)
- [Handover Operating Manual](./handover/how-to-work.md)
- [Handover Rules and Constraints](./handover/rules-and-constraints.md)
- [Handover Context Map](./handover/context-map.md)
- [Handover Session Log](./handover/session-log.md)

- [Project Overview](./project/project-overview.md)
- [Project Status](./project/project-status.md)
- [Roadmap](./project/roadmap.md)
- [Execution Alignment (Linear)](./project/execution-alignment.md)
- [Human Actions and Decisions](./human-actions/README.md)

- [Architecture Overview](./architecture/overview.md)
- [Tech Stack](./architecture/tech-stack.md)
- [Architecture Decisions](./architecture/decisions)

- [User Journey: User Onboarding](./product/journeys/user-onboarding.md)
- [User Journey: Professional Onboarding](./product/journeys/professional-onboarding.md)
- [User Journey: Search and Booking](./product/journeys/search-booking.md)
- [User Journey: Session Management](./product/journeys/session-management.md)
- [User Journey: Admin Operations](./product/journeys/admin-operations.md)
- [User Journey: Payments and Revenue](./product/journeys/payments-billing-revenue.md)
- [User Journey: Trust and Compliance](./product/journeys/trust-safety-compliance.md)
- [User Journey: Session Execution](./product/journeys/video-session-execution.md)

- [Engineering: Setup and Environments](./engineering/setup-and-environments.md)
- [Engineering: Database and Migrations](./engineering/database-and-migrations.md)
- [Engineering: Testing and Quality](./engineering/testing-and-quality.md)
- [Engineering: Deployment and Operations](./engineering/deployment-and-operations.md)
- [Engineering: Data Governance and Lifecycle](./engineering/data-governance-and-lifecycle.md)
- [Engineering Runbooks](./engineering/runbooks)

- [Integration: Supabase](./integrations/supabase.md)
- [Integration: Vercel and GitHub Actions](./integrations/vercel-github-actions.md)
- [Integration: Resend](./integrations/resend.md)
- [Integration: Sentry](./integrations/sentry.md)
- [Integration: PostHog](./integrations/posthog.md)
- [Integration: Upstash Rate Limiting](./integrations/upstash-rate-limit.md)
- [Integration: Checkly Monitoring](./integrations/checkly.md)
- [Integration: Make and HubSpot](./integrations/make-hubspot.md)

## Governance rules for this repository

1. Documentation updates are part of done.
2. Keep explicit implementation status per domain.
3. Keep `docs/spec/source-of-truth/` intact as canonical baseline.
4. Use one unified AI execution protocol in operational docs.
5. Archive or remove stale planning and prompt artifacts.
6. Keep docs aligned with active workstreams tracked in execution tools.
7. Update `docs/` continuously during each section/prompt of work, including any new docs files created.
