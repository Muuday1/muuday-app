# ADR-002: Scheduled Booking Operations via Protected Cron Endpoints

Date: 2026-03-29
Status: Accepted

## Context

Booking reminders and pending-confirmation timeouts need reliable recurring execution in production.

## Decision

1. Expose protected cron API routes:
- `/api/cron/booking-reminders`
- `/api/cron/booking-timeouts`
2. Run them from GitHub Actions schedule (`booking-crons.yml`).
3. Require `CRON_SECRET` authentication (`Authorization` bearer, `x-cron-secret`, or token query fallback).

## Rationale

1. Keeps scheduling logic in repository-controlled workflow.
2. Makes cron execution observable via CI logs and external uptime checks.
3. Allows simple endpoint smoke validation during deploy checks.

## Impact

- Requires `CRON_SECRET` and stable `CRON_BASE_URL` configuration.
- Monitoring should include endpoint checks and workflow run health.
