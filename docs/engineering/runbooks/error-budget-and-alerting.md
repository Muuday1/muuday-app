# Error Budget and Alerting Runbook

Last updated: 2026-04-01

## Purpose

Define cost-efficient alerting and error-budget rules for current scale (solo operator), with explicit ownership and actionable thresholds.

## Ownership

1. Primary owner: `igorpinto.lds@gmail.com`
2. Alert channels:
- Sentry email alerts (application errors)
- Checkly email alerts (uptime and synthetic journeys)
- PostHog product alerts (funnel regressions)

## Error budget policy (pre-launch / low-cost)

1. Availability SLO (public web + critical API): `99.5%` monthly.
2. Journey SLO (auth + search/booking synthetic): `99.0%` monthly.
3. Budget consumption trigger:
- warning when consumed >= `50%` of monthly budget
- incident when consumed >= `100%` of monthly budget

## Alert rules (required)

### Sentry (manual dashboard rules)

1. Error rate spike:
- condition: error events >= `20` in `5m` OR issue spike significantly above baseline
- severity: Sev 1 when affecting login, booking, or global route rendering

2. Payment flow failures:
- condition: message contains:
  - `booking_payment_record_failed`
  - `request_booking_payment_record_failed`
- threshold: >= `1` in `10m`
- severity: Sev 1

3. Auth failures:
- condition: message contains one of:
  - `auth_login_failed`
  - `auth_oauth_callback_invalid_request`
  - `auth_oauth_callback_missing_user`
  - `auth_oauth_start_failed`
  - `auth_signup_failed`
- threshold: >= `10` in `15m`
- severity: Sev 2 (escalate to Sev 1 if widespread login outage)

### Checkly (monitoring-as-code + deployed)

1. API checks:
- `/login` availability
- `/api/cron/booking-reminders`
- `/api/cron/booking-timeouts`

2. Browser journeys:
- auth journey
- search + booking journey
- agenda journey

3. Alerting:
- failure + degraded + recovery emails are enabled in Checkly code config.

### PostHog (manual dashboard alerts)

1. Signup drop-off:
- funnel: `auth_signup_started` -> `auth_signup_succeeded`
- alert condition: conversion drops below `60%` over `1h`

2. Booking conversion drop:
- funnel: `booking_submit_clicked` -> `booking_created`
- alert condition: conversion drops below `70%` over `1h`

## Current instrumentation status in code

1. Auth failure signals sent to Sentry:
- password login failures
- OAuth start failures
- OAuth callback failures (invalid request, missing user, exchange errors)
- signup failures (general + duplicate email)

2. Payment failure signals sent to Sentry:
- direct booking payment record failure
- request-booking payment record failure

3. Product funnel signals sent to PostHog:
- `auth_signup_started`
- `auth_signup_succeeded`
- `booking_submit_clicked`
- `booking_created`

## Validation checklist

1. Sentry:
- trigger one controlled auth failure and confirm event/alert routing.
- trigger one controlled payment failure in preview and confirm tagged event appears.

2. Checkly:
- run `npm run checkly:test` and confirm all checks pass.

3. PostHog:
- verify events appear in Live Events:
  - `auth_signup_started`
  - `auth_signup_succeeded`
  - `booking_submit_clicked`
  - `booking_created`

## Escalation SLA

1. Sev 1: ack <= 15m, mitigate <= 2h
2. Sev 2: ack <= 4h, mitigate <= 24h
3. Sev 3: ack next business block, mitigate <= 3 business days
