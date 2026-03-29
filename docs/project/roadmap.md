# Roadmap

Last updated: 2026-03-29

## Now (current cycle)

1. Booking reliability hardening
- Keep cron reminders/timeouts stable in production.
- Ensure booking transitions remain safe and explicit.
- Maintain timezone and slot-lock safety.

2. Operational readiness
- Deploy Checkly checks (monitoring-as-code already in repo) and activate alert channels.
- Keep release/incident/rollback runbooks current.
- Maintain CI baseline (`typecheck`, `lint`, `build`).

3. Documentation governance
- Keep status, journeys, and stack docs aligned with code reality.
- Remove stale planning and agent-specific artifacts.

## Next

1. Payments maturity
- Implement Stripe-based capture/refund flow.
- Add webhook handling and idempotency controls.

2. Observability operations
- Activate Sentry and PostHog in production environment variables.
- Create and validate dashboards, alerts, and ownership routines.

3. Integration operations
- Execute Make + HubSpot scenarios based on documented contracts.
- Add monitoring and retries for automation failures.

## Later

1. Calendar integration
- Google Calendar OAuth, busy slot sync, booking event write-back.

2. Marketplace trust expansion
- Stronger professional verification and audit trail improvements.
- Moderation workflow optimization with SLA dashboards.

3. Advanced growth loops
- Rebooking, lifecycle campaigns, segmented retention automations.

## Future stack additions (approved)

| Component | Why | Status |
| --- | --- | --- |
| Stripe full integration | Production-safe payments and refunds | Approved / planned |
| Sentry | Production error visibility and alerting | Approved / in progress |
| PostHog | Funnel and behavior analytics | Approved / in progress |
| Checkly | External uptime and endpoint monitoring | Approved / in progress |
| Make + HubSpot | Ops and growth automation | Approved / planned rollout |

## Under evaluation

1. Cloudflare WAF/performance layer rollout details.
2. Messaging channels beyond email (for reminders and support).

## Dependencies

1. External credentials and workspace setup for SaaS tools.
2. Stable production domain transition (`muuday-app.vercel.app` to `muuday.com`).
3. Migration discipline to keep DB model and app logic aligned.
