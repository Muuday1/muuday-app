# Deployment and Operations

Last updated: 2026-03-29

## Deployment platform

- Vercel production deployment for web app.
- Stable development-hidden domain currently: `https://muuday-app.vercel.app`.

## Release flow

1. Merge approved changes into `main`.
2. Let CI complete successfully.
3. Deploy to Vercel production.
4. Ensure stable alias points to latest ready deployment.
5. Run smoke checks.

## Scheduled operations

`booking-crons.yml` runs:

1. Booking reminders endpoint every 5 minutes.
2. Booking timeout endpoint every 15 minutes.

Required config:

- GitHub secret: `CRON_SECRET`
- GitHub variable: `CRON_BASE_URL`

## Monitoring baseline

1. Internal: GitHub Action logs for cron runs.
2. External: Checkly API checks for cron endpoints and login availability.

## Incident handling

Use runbooks in `docs/engineering/runbooks`:

- release-checklist
- incident-runbook
- rollback-runbook

## Operational risks to watch

1. Secret mismatch between GitHub and Vercel environments.
2. Domain alias drift after deploy.
3. DB schema drift against app assumptions.

## Related docs

- [Vercel and GitHub Actions](../integrations/vercel-github-actions.md)
- [Checkly Monitoring](../integrations/checkly.md)
