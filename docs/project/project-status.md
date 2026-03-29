# Project Status

Last updated: 2026-03-29

## Snapshot

- App deploy: `Done` (Vercel production active)
- Core booking flow: `In progress` (production-grade base implemented, payments/calendar integrations still pending)
- Ops monitoring baseline: `In progress` (GitHub cron workflow active, Checkly monitoring-as-code deployed and passing)
- Observability baseline: `In progress` (Sentry/PostHog instrumentation in code, production activation pending)
- Growth integrations: `Planned` (Make + HubSpot blueprint and event contracts documented)

## Status by area

| Area | Status | Current reality | Next step |
| --- | --- | --- | --- |
| Auth and account | Done | Login, signup, social callback, signout, complete-account flow in app routes. | Add stronger auth hardening controls (2FA still not implemented). |
| Professional onboarding | Done | Professional profile creation/editing, availability management, and advanced booking settings management are live. | Improve verification workflow depth and SLA automation. |
| Search and discovery | Done | Marketplace-style search page with categories, specialties, price, availability, location, and language filters. | Add ranking/analytics improvements. |
| Booking engine | In progress | UTC timestamps, booking settings, slot locks, recurring weekly package model, cancellation/refund logic, no-show paths. | Integrate real payment provider flow and stronger recurring edge-case handling. |
| Session lifecycle | In progress | Confirm/cancel/complete/reschedule actions and agenda views are implemented. | Add richer notifications and calendar write-back. |
| Payments | In progress | `payments` table and refund fields exist; booking flow currently records legacy captured payments. | Implement Stripe capture/refund lifecycle and webhooks. |
| Calendar integration | Planned | `calendar_integrations` foundation table exists. | Implement Google Calendar OAuth + read/write sync. |
| Notifications/reminders | In progress | Internal `notifications` table and cron endpoints for reminders/timeouts are live. | Expand channels and delivery auditability. |
| Admin operations | Done | Admin dashboard supports moderation and core operational actions. | Add deeper audit trails and role-boundary hardening. |
| CI and quality gates | In progress | GitHub `ci.yml` runs typecheck/lint/build; Playwright critical booking e2e baseline added. | Wire e2e execution in controlled env and expand critical-path coverage. |
| Observability | In progress | Runbooks in place; Checkly monitoring-as-code is deployed and cloud-tested (`6/6`); Sentry/PostHog now wired in app code. | Complete Checkly alert routing/ownership and validate Sentry/PostHog dashboards in production. |
| Sentry/PostHog | In progress | SDK wiring and key funnel events implemented. | Complete env rollout, alert ownership, and dashboard governance. |
| Make/HubSpot | Planned | Event contracts and integration blueprint are documented. | Configure live scenarios and CRM properties in external tools. |

## Known gaps

1. Keep `db/sql/schema/supabase-schema.sql` synced with ordered migrations (snapshot updated through migration `006`).
2. Payment flow is not yet provider-backed (legacy capture placeholder still present).
3. Calendar sync logic is not yet implemented despite schema groundwork.
4. Checkly alert routing and dedicated booking fixture still pending for stronger operational signal quality.

## Immediate next actions

1. Finish Checkly setup in production and validate alert channels.
2. Activate Sentry/PostHog in production and validate event/error ingestion.
3. Add Stripe integration plan and implementation milestones to execution board.

## Handover continuity

Handover files under `docs/handover/` must be updated during execution whenever state or priorities change.
