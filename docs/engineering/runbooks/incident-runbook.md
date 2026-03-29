# Incident Runbook

Last updated: 2026-03-29

## Severity levels

- Sev 1: core flow down (auth, booking, payment)
- Sev 2: degraded feature with partial user impact
- Sev 3: minor issue with available workaround

## Response flow

1. Open incident record in execution tracker.
2. Assign roles:
- incident lead
- communications owner
- fix owner
3. Collect signals:
- production errors
- uptime alerts
- deployment/runtime logs
4. Choose path:
- hotfix forward
- rollback
5. Execute and validate critical flows.
6. Publish internal update and closure summary.

## Evidence checklist

- [ ] Error traces and impacted routes
- [ ] Start/end timestamps (UTC)
- [ ] User impact estimate
- [ ] Root cause summary
- [ ] Preventive follow-up actions with owners
