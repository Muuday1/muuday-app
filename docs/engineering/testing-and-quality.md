# Testing and Quality

Last updated: 2026-03-29

## CI baseline

GitHub Actions workflow `ci.yml` runs on push and PR to `main`:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`

## Local verification commands

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

## Current quality status

- Build pipeline: `Done`
- Typecheck gate: `Done`
- Lint gate: `Done` (with known hook dependency warnings)
- Automated integration/e2e tests: `In progress` (Playwright baseline added)

## Smoke tests to run after deploy

1. Login and signout
2. Search page load and filtering
3. Booking creation flow
4. Agenda management actions
5. Admin panel access and key actions
6. Cron endpoints authentication and success response

## Known quality gaps

1. Lint warnings remain in some client pages for hook dependencies.
2. E2E suite is currently baseline-only and depends on configured test credentials/fixtures.

## Related docs

- [Release Checklist](./runbooks/release-checklist.md)
- [Project Status](../project/project-status.md)
