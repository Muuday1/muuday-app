# Release Checklist

## Pre-release

- [ ] Branch synced and PR approved
- [ ] Scope confirmed (only intended files changed)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Database migration impact reviewed
- [ ] Feature flags/env vars documented
- [ ] Rollback plan prepared

## Deploy window

- [ ] Confirm owner on call
- [ ] Confirm monitoring channels active
- [ ] Deploy started

## Post-release (0-30 min)

- [ ] Home, login, signup, dashboard smoke test
- [ ] Booking flow smoke test
- [ ] Admin page smoke test
- [ ] Error monitor has no spike
- [ ] API logs show normal status/error rates

## Post-release (24h)

- [ ] Funnel metrics stable
- [ ] No increase in support incidents
- [ ] Retrospective notes captured

