# Incident Runbook

Last updated: 2026-03-30

## Severity levels

- Sev 1: core flow down (auth, booking, payment)
- Sev 2: degraded feature with partial user impact
- Sev 3: minor issue with available workaround

## On-call ownership (current scale)

- Primary owner: founder operator (`igorpinto.lds@gmail.com`)
- Alert sources: Checkly and Sentry email alerts
- Escalation path:
- acknowledge the alert in the inbox
- open incident record in execution tracker
- choose hotfix or rollback path
- post closure summary with follow-up items

## Incident SLA (cost-efficient solo model)

- Sev 1: acknowledge within 15 minutes, mitigate within 2 hours
- Sev 2: acknowledge within 4 hours, mitigate within 24 hours
- Sev 3: acknowledge in next business block, mitigate within 3 business days

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
