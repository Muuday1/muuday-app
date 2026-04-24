# Integration: Resend

Last updated: 2026-03-29

## Purpose

Transactional and lifecycle email delivery.

## Where it is used

- `lib/email/resend.ts`
- Waitlist confirmation path in `app/api/waitlist/route.ts`

## Current status

- `In progress`
- Email template system exists in code.
- Production readiness depends on confirmed domain/sender setup and operational monitoring.

## Risks

1. Missing or invalid `RESEND_API_KEY` disables delivery.
2. Delivery outcomes are not yet fully observable in a centralized dashboard.

## Next steps

1. Validate sender domain and production API key setup.
2. Add delivery monitoring and alerting policies.
3. Expand booking lifecycle email coverage with explicit ownership.


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
