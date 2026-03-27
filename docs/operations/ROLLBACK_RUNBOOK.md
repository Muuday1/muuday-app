# Rollback Runbook

Use this when a production deploy causes user-impacting issues.

## Trigger conditions

- Booking flow broken
- Login/auth callback broken
- Error rate spike sustained for more than 5 minutes
- Revenue-impacting failures

## Steps

1. Declare incident in issue tracker and assign incident lead.
2. Freeze further deploys.
3. Identify last known good commit.
4. Re-deploy last known good commit on Vercel.
5. Validate critical flows:
   - Login
   - Signup
   - Booking create
   - Booking manage
6. If a DB migration caused the issue:
   - Apply reversible migration only if already prepared and verified.
   - Otherwise keep app rollback and schedule DB hotfix.
7. Keep monitoring for 30 minutes.
8. Close incident with timeline and root cause action items.

## Required notes in incident issue

- Start/end times (UTC)
- User impact summary
- Rollback commit id
- Recovery validation evidence
- Follow-up owners and deadlines

