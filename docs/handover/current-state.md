# Current State

Last updated: 2026-03-29

## Fully implemented (`Done`)

1. Auth and account basics (login/signup/callback/signout/complete-account).
2. Professional profile and availability pages.
3. Search marketplace page with filters and category/specialty model.
4. Booking domain foundation:
- UTC booking fields
- settings model
- slot locks
- state transition guards
- cancellation/no-show paths
5. Agenda and management actions for user/professional flows.
6. Admin dashboard for professionals/reviews/bookings.
7. CI pipeline (`typecheck`, `lint`, `build`).
8. Cron workflow and protected cron endpoints.
9. Canonical app URL config helper (`lib/config/app-url.ts`).
10. Docs governance baseline (new docs architecture and cleanup).
11. Professional booking settings UI:
- New self-service screen at `/configuracoes-agendamento`.
- Professional can now manage timezone, session duration, buffer, minimum notice, booking window, confirmation mode, recurring toggle, and session-purpose requirement.
- Perfil + disponibilidade now link to this screen.
12. Observability instrumentation baseline in code:
- Sentry init on client/server/edge + global error capture.
- PostHog provider + auth and booking funnel events.
13. Booking operations UX improvements:
- Professional agenda highlights pending confirmations and SLA deadline labels.
14. E2E baseline committed:
- Playwright config and critical booking journey spec.
15. Canonical schema snapshot updated:
- `db/sql/schema/supabase-schema.sql` aligned to migrations through `006`.

## Partially implemented (`In progress`)

1. Payments:
- `payments` table and refund metadata exist.
- Booking flow still inserts legacy captured payment records.
2. Notifications/monitoring:
- Internal notifications + cron generation exist.
- External monitoring-as-code is implemented (`checkly/` + `checkly.config.js`) and validated in CI.
- Checkly project is deployed with env vars configured and cloud checks passing (`6/6`).
- Email alert channel and group subscription are provisioned from code.
- Final confirmation of alert receipt/escalation ownership still needs completion.
3. Resend:
- templates and helpers exist.
- production lifecycle coverage and monitoring still incomplete.
4. Sentry/PostHog operations:
- Instrumentation is in code, but production dashboards/alerts/ownership still need completion.

## Not implemented (`Planned`)

1. Stripe full payment lifecycle (capture/refund via provider webhooks).
2. Google Calendar read/write sync flow.
3. Live Make + HubSpot scenario rollout.

## Broken or unstable (`Blocked` / risk)

1. No confirmed Sev-1 production blocker currently.
2. Payment provider/webhook gap still creates reconciliation risk.
3. Domain transition risk if envs are changed inconsistently.

## Active work in progress

No active code WIP at this moment after finishing observability/schema/booking-UX/e2e baseline updates.

## Last meaningful changes

1. `2026-03-29` - commit `c53a7f4`
- rebuilt docs governance structure
- removed stale/agent-specific docs artifacts
- added canonical architecture/project/journey/integration docs
2. `2026-03-29` - commit `9b62bab`
- centralized app URL configuration
- added Checkly setup documentation
3. `2026-03-29` - production validation
- cron endpoints returned `200`
- alias `muuday-app.vercel.app` pointed to latest ready deployment
4. `2026-03-29` - professional booking settings delivery
- added `/configuracoes-agendamento` screen bound to `professional_settings`
- linked profile/disponibilidade to advanced settings flow
- validated with `typecheck` and `lint` (existing unrelated lint warnings remain)
5. `2026-03-29` - reliability and observability baseline package
- added Sentry client/server/edge instrumentation + global error capture
- added PostHog provider and booking/auth funnel events
- updated canonical schema snapshot through migration `006`
- improved professional agenda UX for pending confirmation SLA visibility
- added Playwright critical booking e2e baseline
6. `2026-03-29` - Checkly monitoring-as-code hardening
- added Checkly browser/API check definitions under `checkly/`
- added dedicated local Playwright config for journey validation (`playwright.checkly.config.ts`)
- added CI workflow to validate Checkly project parse (`.github/workflows/checkly-validate.yml`)
- confirmed blocker remains external Checkly auth (`CHECKLY_API_KEY` and `CHECKLY_ACCOUNT_ID`)
7. `2026-03-29` - Checkly local journey execution validated
- `npm run checkly:validate` passed
- `npm run test:checkly-local` passed with configured credentials
- search-booking journey now handles self-profile redirect fallback when only one approved professional fixture exists
8. `2026-03-29` - Checkly cloud activation completed
- authenticated Checkly CLI account and deployed project resources
- configured required Checkly environment variables in account
- fixed browser checks to use absolute URLs from `BASE_URL`
- executed `checkly test` in cloud runtime with result `6 passed, 6 total`
9. `2026-03-29` - Checkly alerting smoke test
- added `EmailAlertChannel` + `AlertChannelSubscription` in monitoring code
- executed controlled failure test for ops checks (`2 failed`) and controlled recovery test (`2 passed`)
- sessions recorded in Checkly for auditability
