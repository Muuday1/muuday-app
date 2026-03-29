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

Required env vars for `test:e2e`:

- `E2E_BASE_URL` (recommended for prod/staging runs)
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `E2E_PROFESSIONAL_ID`
- `E2E_MANUAL_PROFESSIONAL_ID` (optional, only for manual-confirmation smoke test)

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

## Current Playwright booking smoke coverage

1. Booking safety policy and timezone controls visibility.
2. Checkout remains blocked until cancellation + timezone confirmations are accepted.
3. Manual confirmation submit CTA copy (`Pagar ... solicitar`) when professional requires approval.

Latest production execution snapshot:

- `2 passed`
- `1 skipped` (manual confirmation fixture blocked by schema drift)

## Known quality gaps

1. Lint warnings remain in some client pages for hook dependencies.
2. E2E suite depends on dedicated fixture professionals:
- `E2E_PROFESSIONAL_ID` must not belong to the logged-in `E2E_USER_EMAIL`.
- `E2E_MANUAL_PROFESSIONAL_ID` must be a bookable professional configured with manual confirmation mode.
3. Current production API does not expose `professional_settings`, which blocks manual-confirmation fixture setup and full `3/3` smoke completion.

## Related docs

- [Release Checklist](./runbooks/release-checklist.md)
- [Project Status](../project/project-status.md)
