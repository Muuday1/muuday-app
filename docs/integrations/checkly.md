# Integration: Checkly Monitoring

Last updated: 2026-03-29

## Purpose

External health monitoring for production endpoint availability, cron operations, and core browser journeys.

## Status

- `In progress`
- Monitoring-as-code is implemented in repository and validated in CI.
- Remaining blocker is Checkly account authentication (`CHECKLY_API_KEY` + `CHECKLY_ACCOUNT_ID`) for deploy/run.

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

## Current blocker

`checkly whoami` / `checkly test` / `checkly deploy` fail without account auth env vars.

## Next steps

1. Add `CHECKLY_API_KEY` and `CHECKLY_ACCOUNT_ID` to local env and GitHub secrets.
2. Configure Checkly env vars listed above in the Checkly project.
3. Run `npm run checkly:deploy -- --config checkly.config.js`.
4. Configure alert channels (email/Slack) and set failure/recovery notifications.
5. Trigger one controlled failure and confirm alert + recovery delivery.

## Current fixture caveat

Current production sample data has only one approved professional. The `search-booking` browser journey therefore supports a fallback assertion for self-profile redirect (`erro=auto-agendamento`) so monitoring stays reliable until a dedicated bookable fixture professional is created.

## Domain migration note

When moving to `muuday.com`, update only `BASE_URL`.
