# Incident Runbook

## Severity levels

- Sev 1: Core flow down (auth/booking/payment), major user impact.
- Sev 2: Degraded feature, partial user impact.
- Sev 3: Minor issue, workaround exists.

## Response flow

1. Create incident issue from template.
2. Assign roles:
   - Incident lead
   - Comms owner
   - Fix owner
3. Gather initial signals:
   - Sentry errors
   - Uptime monitor alerts
   - Vercel logs
4. Decide:
   - Hotfix forward
   - Rollback
5. Execute fix/rollback.
6. Validate critical paths.
7. Post update to team.
8. Close with postmortem.

## Evidence checklist

- [ ] Error trace links
- [ ] Affected endpoints/routes
- [ ] Start/end timestamps
- [ ] User impact estimate
- [ ] Root cause
- [ ] Permanent prevention action

