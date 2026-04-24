# Integration: Checkly Monitoring

Last updated: 2026-04-01

## Purpose

External health monitoring for production endpoint availability, cron operations, and core browser journeys.

## Status

- `In progress`
- Monitoring-as-code is implemented, deployed in Checkly, and validated in cloud run.
- Email alert channel is now provisioned in code and linked to the monitoring group.
- Alert receipt and solo on-call ownership policy are now defined.
- Uptime and critical-path journey monitoring baseline is active via API + browser checks.

## Implemented in repository

- `checkly.config.js`
- `checkly/check-group.js`
- `.github/workflows/checkly-validate.yml` (syntax/parse validation on PR and push)
- API checks:
  - `checkly/checks/api-login-availability.check.js`
  - `checkly/checks/api-cron-booking-reminders.check.js`
  - `checkly/checks/api-cron-booking-timeouts.check.js`
- Browser journey checks:
  - `checkly/checks/browser-auth-journey.check.js`
  - `checkly/checks/browser-search-booking-journey.check.js`
  - `checkly/checks/browser-agenda-journey.check.js`
- Browser journey scripts:
  - `checkly/tests/auth-journey.spec.js`
  - `checkly/tests/search-booking-journey.spec.js`
  - `checkly/tests/agenda-journey.spec.js`
  - `checkly/tests/helpers/auth.js`
- Local browser validation config:
  - `playwright.checkly.config.ts`
- Alerting resources:
  - `EmailAlertChannel` (`muuday-ops-email-alerts`)
  - `AlertChannelSubscription` for check group (`muuday-prod-journeys-group`)

## Required Checkly account auth (for deploy/test against account)

- `CHECKLY_API_KEY`
- `CHECKLY_ACCOUNT_ID`

## Required Checkly environment variables (inside Checkly project)

- `BASE_URL` (example: `https://muuday-app.vercel.app`)
- `CRON_SECRET`
- `CHECKLY_USER_EMAIL`
- `CHECKLY_USER_PASSWORD`
- `CHECKLY_BOOKING_PROFESSIONAL_ID` (must be bookable by `CHECKLY_USER_EMAIL`)

## Local validation commands

```bash
npm run checkly:validate
npm run test:checkly-local
npm run checkly:test -- --list --config checkly.config.js
npm run checkly:deploy -- --config checkly.config.js
```

PowerShell-safe env example for local journey tests:

```powershell
$env:CHECKLY_BASE_URL='https://muuday-app.vercel.app'
$env:CHECKLY_USER_EMAIL='...'
$env:CHECKLY_USER_PASSWORD='...'
$env:CHECKLY_BOOKING_PROFESSIONAL_ID='...'
npm.cmd run test:checkly-local
```

## Next steps

1. Keep `BASE_URL` aligned when domain changes from `muuday-app.vercel.app` to `muuday.com`.
2. Add optional secondary channel (Slack/WhatsApp) only after team expansion.

## Latest validation

- Checkly project deployed successfully to account `igor@muuday.com`.
- Checkly environment variables were configured (`BASE_URL`, `CRON_SECRET`, `CHECKLY_USER_EMAIL`, `CHECKLY_USER_PASSWORD`, `CHECKLY_BOOKING_PROFESSIONAL_ID`).
- `checkly test` result: `6 passed, 6 total`.
- Controlled failure test executed on ops checks:
  - Session: `https://chkly.link/l/PsQns` (`2 failed`, expected, invalid `CRON_SECRET`)
- Controlled recovery test executed on ops checks:
  - Session: `https://chkly.link/l/YLBJF` (`2 passed`, expected, valid `CRON_SECRET`)

## Cost profile (pre-launch / free-first)

- Active Muuday checks now run in single location (`us-east-1`).
- Frequencies tuned down:
  - API: `15m` (login + booking reminders), `30m` (booking timeouts)
  - Browser journeys: `1h`
- Retry policy tuned down:
  - API: single retry
  - Browser: no retries
- Legacy non-tagged checks (`muuday-app`, `muuday-site`) marked inactive to avoid unnecessary consumption.

## Current fixture caveat

Current production sample data has only one approved professional. The `search-booking` browser journey therefore supports a fallback assertion for self-profile redirect (`erro=auto-agendamento`) so monitoring stays reliable until a dedicated bookable fixture professional is created.

## Domain migration note

When moving to `muuday.com`, update only `BASE_URL`.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
