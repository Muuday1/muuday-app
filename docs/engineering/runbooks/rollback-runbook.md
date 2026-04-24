# Rollback Runbook

Last updated: 2026-03-29

Use this when a production deploy introduces user-impacting regressions.

## Trigger conditions

- Booking lifecycle is broken
- Auth callback or login is broken
- Sustained error spike for critical routes
- Revenue-impacting flow failure

## Steps

1. Declare incident and freeze further deploys.
2. Identify last known good deployment/commit.
3. Redeploy known-good version in Vercel.
4. Validate critical paths:
- login
- search
- booking create/manage
- admin access
5. If DB migration is part of issue:
- apply reversible migration only when verified
- otherwise keep app rollback and schedule DB hotfix
6. Monitor recovery for at least 30 minutes.

## Required incident notes

- Rollback timestamp and actor
- Rollback target version
- Recovery evidence
- Follow-up owners and deadlines


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
