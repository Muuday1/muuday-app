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

## Partially implemented (`In progress`)

1. Payments:
- `payments` table and refund metadata exist.
- Booking flow still inserts legacy captured payment records.
2. Notifications/monitoring:
- Internal notifications + cron generation exist.
- External monitoring setup documented, activation pending.
3. Resend:
- templates and helpers exist.
- production lifecycle coverage and monitoring still incomplete.

## Not implemented (`Planned`)

1. Stripe full payment lifecycle (capture/refund via provider webhooks).
2. Google Calendar read/write sync flow.
3. Sentry production instrumentation.
4. PostHog funnel instrumentation baseline.
5. Live Make + HubSpot scenario rollout.

## Broken or unstable (`Blocked` / risk)

1. No confirmed Sev-1 production blocker currently.
2. Structural risk: schema source drift (`schema.sql` vs migrations).
3. Domain transition risk if envs are changed inconsistently.

## Active work in progress

No active code WIP in repository at this moment. Branch is clean after documentation governance updates.

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
