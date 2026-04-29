# Integration: Vercel and GitHub Actions

Last updated: 2026-04-29

## Purpose

1. Host and serve the Next.js production app (Vercel).
2. Run CI and scheduled operational tasks (GitHub Actions).

## Current workflows

### `ci.yml` — Quality Gate
- Trigger: push/PR to `main`
- Steps:
  1. Checkout (with fetch-depth 0 for secret scan baseline)
  2. Secret scan (TruffleHog `--only-verified`)
  3. Verify no tracked `.env` files (excluding `.example`)
  4. Verify no UTF-8 BOM in source files
  5. Setup Node (from `.nvmrc`)
  6. Install dependencies (`npm ci`)
  7. Audit dependencies for high+ severity CVEs
  8. Validate required E2E secrets on `main` push
  9. Typecheck (`npm run typecheck`)
  10. Lint (`npm run lint`)
  11. Encoding check (`npm run check:encoding`)
  12. Unit tests (Vitest)
  13. State machine tests
  14. Cache Next.js build
  15. Build (`npm run build`)
  16. Validate DB pooling in production mode
  17. Cache Playwright browsers
  18. Install Playwright Chromium
  19. Auto-heal E2E professional fixtures
  20. End-to-end tests (Playwright)
  21. Upload Playwright report artifact

### `booking-crons.yml`
- Trigger: schedule every 5 minutes + manual dispatch
- Executes:
  - `/api/cron/booking-reminders` every run
  - `/api/cron/booking-timeouts` every 15 minutes

### `secrets-rotation-reminder.yml`
- Trigger: daily schedule
- Checks `docs/engineering/runbooks/secrets-rotation-register.json` for overdue items
- Fails if any secret is past its `next_due_at`

### `checkly.yml`
- Trigger: PR + deploy
- Runs Checkly synthetic monitoring tests

## Required configuration

- GitHub secret: `CRON_SECRET`
- GitHub variable: `CRON_BASE_URL`
- E2E secrets (main push only): `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_PROFESSIONAL_EMAIL`, `E2E_PROFESSIONAL_PASSWORD`, `E2E_PROFESSIONAL_ID`, `E2E_MANUAL_PROFESSIONAL_ID`, `E2E_BLOCKED_PROFESSIONAL_ID`
- Supabase secrets: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_POOLER_URL`
- Vercel envs aligned with app URL and cron auth needs

## Current status

- ✅ CI baseline complete (21 steps)
- ✅ Cron workflow structure complete
- ✅ Secret rotation monitoring active
- ✅ E2E tests run on every main push
- 🟡 Ongoing monitoring and alert ownership hardening

## Risks

1. Secret mismatch between GitHub and Vercel can break cron auth.
2. Alias drift can point stable URL to outdated deployment.
3. E2E tests require live sandbox credentials; missing secrets will fail the build on main.

## Next steps

1. Keep smoke checks tied to deploy workflow.
2. Validate workflow health via external monitor alerts.
3. Reduce E2E flakiness through fixture auto-healing.

---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
