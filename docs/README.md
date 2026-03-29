# Muuday Documentation

Last updated: 2026-03-29

This folder is the source of truth for product context, technical architecture, execution status, and operational readiness.

## How to use this documentation

1. Start with project docs for priorities and status.
2. Read journey docs to understand end-to-end flows.
3. Use architecture docs for system boundaries and stack decisions.
4. Use engineering docs for setup, deploy, runbooks, and quality checks.
5. Use integrations docs for third-party services and implementation state.

## Status conventions

- `Done`: implemented and in use.
- `In progress`: partially implemented or rollout in progress.
- `Planned`: approved but not started.
- `Blocked`: waiting on dependency or external setup.
- `Deprecated`: should not be used going forward.

## Documentation map

- [Project Overview](./project/project-overview.md)
- [Project Status](./project/project-status.md)
- [Roadmap](./project/roadmap.md)
- [Execution Alignment (Linear)](./project/execution-alignment.md)

- [Architecture Overview](./architecture/overview.md)
- [Tech Stack](./architecture/tech-stack.md)
- [Architecture Decisions](./architecture/decisions)

- [User Journey: User Onboarding](./product/journeys/user-onboarding.md)
- [User Journey: Professional Onboarding](./product/journeys/professional-onboarding.md)
- [User Journey: Search and Booking](./product/journeys/search-booking.md)
- [User Journey: Session Management](./product/journeys/session-management.md)
- [User Journey: Admin Operations](./product/journeys/admin-operations.md)

- [Engineering: Setup and Environments](./engineering/setup-and-environments.md)
- [Engineering: Database and Migrations](./engineering/database-and-migrations.md)
- [Engineering: Testing and Quality](./engineering/testing-and-quality.md)
- [Engineering: Deployment and Operations](./engineering/deployment-and-operations.md)
- [Engineering Runbooks](./engineering/runbooks)

- [Integration: Supabase](./integrations/supabase.md)
- [Integration: Vercel and GitHub Actions](./integrations/vercel-github-actions.md)
- [Integration: Resend](./integrations/resend.md)
- [Integration: Upstash Rate Limiting](./integrations/upstash-rate-limit.md)
- [Integration: Checkly Monitoring](./integrations/checkly.md)
- [Integration: Make and HubSpot](./integrations/make-hubspot.md)

## Governance rules for this repository

1. Documentation updates are part of done.
2. Do not keep duplicate sources of truth.
3. Keep explicit implementation status per domain.
4. Archive or remove stale planning and agent prompt artifacts.
5. Keep docs aligned with active workstreams tracked in execution tools (including Linear when used).
