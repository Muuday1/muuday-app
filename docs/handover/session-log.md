# Session Log

Use this for meaningful checkpoints only.

## 2026-03-29

### Entry 1
- Completed production validation for cron endpoints and login availability.
- Updated production env alignment for URL/CORS consistency.
- Follow-up: activate Checkly checks and alerts.

### Entry 2
- Introduced canonical app URL resolver and updated auth/waitlist/email usage.
- Added Checkly setup guidance.
- Follow-up: migrate to final domain via env-only change when ready.

### Entry 3
- Rebuilt documentation governance structure across project/architecture/engineering/integrations/product.
- Removed stale and agent-specific prompt/handoff documents.
- Follow-up: keep `project-status` and `handover/current-state` synchronized every meaningful change.

### Entry 4
- Created persistent handover system in `docs/handover/` with overview, state, next steps, operating rules, constraints, context map, and this log.
- Follow-up: contributors must update handover files during execution, not only at session end.

### Entry 5
- Audited booking journey readiness on professional side against code reality.
- Confirmed gap: advanced `professional_settings` are implemented in backend reads but not exposed in professional UI for editing.
- Follow-up: implement dedicated professional booking settings page before deeper booking lifecycle expansion.

### Entry 6
- Delivered professional booking settings UI at `/configuracoes-agendamento` with save flow to `professional_settings`.
- Added direct navigation links from `/perfil` and `/disponibilidade` to advanced booking settings.
- Validation completed with `typecheck` and `lint` (only pre-existing lint warnings remained).

### Entry 7
- Added Sentry instrumentation baseline (client/server/edge init + global error capture + booking server-action error capture).
- Added PostHog baseline (provider, auth events, booking funnel events, route pageviews).
- Updated canonical schema snapshot `db/sql/schema/supabase-schema.sql` through migration `006`.
- Improved professional agenda to expose pending confirmation SLA/deadline context.
- Added Playwright e2e baseline (`playwright.config.ts`, `tests/e2e/booking-critical.spec.ts`, `npm run test:e2e`).
- Follow-up: activate Sentry/PostHog in production env and validate dashboards/alerts.

### Entry 8
- Added Checkly monitoring-as-code structure (`checkly/` + `checkly.config.js`) with API and browser journey checks.
- Added dedicated local validation path for Checkly browser journeys (`playwright.checkly.config.ts`, `npm run test:checkly-local`).
- Added GitHub Actions workflow `.github/workflows/checkly-validate.yml` to validate Checkly project syntax/parse on PR and push.
- Confirmed external blocker: Checkly account authentication still required (`CHECKLY_API_KEY` + `CHECKLY_ACCOUNT_ID`) before deploy/alerts.

### Entry 9
- Executed local Checkly validation (`npm run checkly:validate`) successfully.
- Executed local Checkly browser journeys successfully with provided credentials.
- Hardened `checkly/tests/search-booking-journey.spec.js` to support self-profile redirect fallback (`erro=auto-agendamento`) while production has a single approved professional fixture.

### Entry 10
- Authenticated Checkly CLI account and deployed monitoring resources to account `igor@muuday.com`.
- Configured Checkly account environment variables for runtime checks.
- Fixed cloud-runtime browser check issue by switching browser scripts to absolute URL navigation based on `BASE_URL`.
- Executed `checkly test` successfully with cloud result `6 passed, 6 total`.

### Entry 11
- Pushed local commits to `origin/main` (branch was ahead by 3 commits).
- Added Checkly alerting resources in code (`EmailAlertChannel` + group subscription).
- Executed controlled ops failure session (`2 failed`, expected with invalid secret): `https://chkly.link/l/PsQns`.
- Executed controlled ops recovery session (`2 passed`, expected with valid secret): `https://chkly.link/l/YLBJF`.

### Entry 12
- Shifted Checkly to free-first pre-launch profile: single location (`us-east-1`), API at `15m/30m`, browser at `1h`.
- Reduced retries (API single retry, browser no retry).
- Disabled inactive legacy checks (`muuday-app`, `muuday-site`) to reduce unnecessary run consumption.
