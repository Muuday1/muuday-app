# Context Map

Last updated: 2026-03-29

## Repository map

- `app/`: routes and UI screens (auth, search, booking, agenda, admin)
- `components/`: reusable UI and feature components
- `lib/actions/`: server actions (booking, profile, email)
- `lib/booking/`: booking domain engine modules
- `lib/supabase/`: Supabase clients and middleware
- `lib/config/`: shared runtime config (including app URL resolution)
- `db/sql/migrations/`: authoritative DB migrations
- `scripts/ops/`: operational scripts
- `docs/`: documentation source of truth

## Documentation map

- `docs/project/`
- overview, status, roadmap, execution alignment

- `docs/product/journeys/`
- end-to-end user journeys and gaps

- `docs/architecture/`
- system overview, stack status, ADRs

- `docs/engineering/`
- setup, deployment, quality, runbooks

- `docs/integrations/`
- provider-specific state, risks, next steps

- `docs/handover/`
- takeover continuity system for any new contributor

## Where to find specific topics

1. Current priorities: `docs/project/project-status.md`
2. Exact next actions: `docs/handover/next-steps.md`
3. Tech stack status: `docs/architecture/tech-stack.md`
4. Booking architecture: `docs/architecture/overview.md` + `lib/booking/`
5. Operational procedures: `docs/engineering/runbooks/`
6. Monitoring setup: `docs/integrations/checkly.md`
7. Observability setup: `docs/integrations/sentry.md` and `docs/integrations/posthog.md`
8. Make/HubSpot contracts: `docs/integrations/make-hubspot*.{md,json}`

## How docs connect

1. `docs/README.md` is the entry index.
2. `docs/handover/*` gives immediate takeover context.
3. Domain docs provide deeper implementation and roadmap details.
