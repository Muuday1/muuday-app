# Integration: Vercel and GitHub Actions

Last updated: 2026-03-29

## Purpose

1. Host and serve the Next.js production app (Vercel).
2. Run CI and scheduled operational tasks (GitHub Actions).

## Current workflows

1. `ci.yml`
- Trigger: push/PR to `main`
- Steps: install, typecheck, lint, build

2. `booking-crons.yml`
- Trigger: schedule every 5 minutes + manual dispatch
- Executes:
  - `/api/cron/booking-reminders` every run
  - `/api/cron/booking-timeouts` every 15 minutes

## Required configuration

- GitHub secret: `CRON_SECRET`
- GitHub variable: `CRON_BASE_URL`
- Vercel envs aligned with app URL and cron auth needs

## Current status

- `Done` for CI baseline and cron workflow structure
- `In progress` for ongoing monitoring and alert ownership hardening

## Risks

1. Secret mismatch between GitHub and Vercel can break cron auth.
2. Alias drift can point stable URL to outdated deployment.

## Next steps

1. Keep smoke checks tied to deploy workflow.
2. Validate workflow health via external monitor alerts.
