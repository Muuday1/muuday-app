# Integration: Checkly Monitoring

Last updated: 2026-03-29

## Purpose

External health monitoring for production endpoint availability and cron operation checks.

## Status

- `In progress`
- Setup documented, activation depends on dashboard configuration.

## Step-by-step setup

## 1) Create Checkly variables

1. Open Checkly dashboard.
2. Go to environment variables.
3. Add:
- `BASE_URL = https://muuday-app.vercel.app`
- `CRON_SECRET = <your real cron secret>`
4. Mark `CRON_SECRET` as secret.

## 2) API check: booking reminders

1. Create API check `prod-booking-reminders`.
2. Method: `GET`.
3. URL: `{{BASE_URL}}/api/cron/booking-reminders`.
4. Header: `x-cron-secret: {{CRON_SECRET}}`.
5. Assertions:
- status code `200`
- body contains `"ok":true`
6. Frequency: every 5 minutes.
7. Retries: 2.

## 3) API check: booking timeouts

1. Create API check `prod-booking-timeouts`.
2. Method: `GET`.
3. URL: `{{BASE_URL}}/api/cron/booking-timeouts`.
4. Header: `x-cron-secret: {{CRON_SECRET}}`.
5. Assertions:
- status code `200`
- body contains `"ok":true`
6. Frequency: every 15 minutes.
7. Retries: 2.

## 4) Web availability check

1. Create API check `prod-login-availability`.
2. URL: `{{BASE_URL}}/login`.
3. Assertions:
- status code `200`
- body contains a stable app marker text.
4. Frequency: every 5 minutes.

## 5) Alert channels

1. Connect email or Slack.
2. Alert after 2 consecutive failures.
3. Enable recovery notifications.

## Domain migration note

When moving to `muuday.com`, update only `BASE_URL` in Checkly.
