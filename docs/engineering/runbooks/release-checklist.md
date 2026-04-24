# Release Checklist

Last updated: 2026-04-01

## Pre-release

- [ ] Branch synced and PR approved
- [ ] Scope confirmed (only intended files changed)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Migration impact reviewed
- [ ] Env variable changes documented
- [ ] `npm run db:validate-pooling` passes (pooler `:6543` validated for production runtime)
- [ ] Secret changes (if any) followed `secrets-rotation-runbook` and register updated
- [ ] Rollback path identified

## Deploy window

- [ ] Owner on call
- [ ] Monitoring channels active
- [ ] Deploy started and tracked

## Post-release (0-30 min)

- [ ] Login and auth callback smoke test
- [ ] Search and professional profile smoke test
- [ ] Booking create/manage smoke test
- [ ] Admin panel smoke test
- [ ] Cron endpoints return success

## Post-release (24h)

- [ ] No abnormal error spikes
- [ ] No critical support incidents
- [ ] Follow-up issues captured and prioritized


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
