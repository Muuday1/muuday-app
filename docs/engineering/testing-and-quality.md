# Testing and Quality

Last updated: 2026-04-24

## CI baseline

GitHub Actions workflow `ci.yml` runs on push and PR to `main`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run test:unit`
6. `npm run test:e2e`

## Local verification commands

```bash
npm run typecheck
npm run lint
npm run build
npm run test:unit
npm run test:e2e
npm run test:state-machines
npm run audit:rls:api
```

Required env vars for `test:e2e`:

- `E2E_BASE_URL` (recommended for prod/staging runs)
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `E2E_PROFESSIONAL_EMAIL` (for professional workspace e2e)
- `E2E_PROFESSIONAL_PASSWORD` (for professional workspace e2e)
- `E2E_PROFESSIONAL_ID`
- `E2E_MANUAL_PROFESSIONAL_ID` (optional, only for manual-confirmation smoke test)
- `E2E_BLOCKED_PROFESSIONAL_ID` (for blocked-gate onboarding/booking checks)

Required env vars for `audit:rls:api`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `RLS_A_EMAIL` + `RLS_A_PASSWORD` (or E2E user fallback)
- `RLS_B_EMAIL` + `RLS_B_PASSWORD` (or E2E professional fallback)

## Current quality status

- Build pipeline: `Done`
- Typecheck gate: `Done`
- Lint gate: `Done`
- Automated integration/e2e tests: `Done (baseline)` — Playwright E2E suite runs in CI; 2 critical-path smoke tests pass in production
- State machine guard checks: `Done` (`npm run test:state-machines`)

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
4. Professional workspace role split and guard checks:
- professional-only primary nav visibility
- agenda control-center views
- business-oriented settings hub
- user-role redirect away from professional dashboard

Latest production execution snapshot:

- `2 passed`
- `1 skipped` (manual confirmation fixture blocked by schema drift)

## Known quality gaps

1. E2E suite depends on dedicated fixture professionals:
- `E2E_PROFESSIONAL_ID` must not belong to the logged-in `E2E_USER_EMAIL`.
- `E2E_MANUAL_PROFESSIONAL_ID` must be a bookable professional configured with manual confirmation mode.
2. Full recurring/reservation lifecycle assertions still need dedicated fixture coverage beyond baseline booking smoke.

## Related docs

- [Release Checklist](./runbooks/release-checklist.md)
- [RLS Audit Runbook](./runbooks/rls-audit-runbook.md)
- [Project Status](../project/project-status.md)


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
