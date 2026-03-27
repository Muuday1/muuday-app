# HubSpot Setup Checklist (Muuday)

Use this checklist in HubSpot UI before activating Make scenarios.

## A. Properties

- [ ] `muuday_role` (dropdown)
- [ ] `lifecycle_stage_muuday` (dropdown)
- [ ] `country` (text or dropdown)
- [ ] `timezone` (text)
- [ ] `first_booking_at` (datetime)
- [ ] `last_booking_status` (dropdown)
- [ ] `total_completed_sessions` (number)
- [ ] `source_channel` (dropdown)
- [ ] `consent_marketing` (boolean)

## B. Pipelines

- [ ] Pipeline `Professional Supply`
  - `new_lead`
  - `contacted`
  - `qualified`
  - `onboarding`
  - `approved`
  - `active`
- [ ] Pipeline `User Activation`
  - `signed_up`
  - `completed_account`
  - `first_booking`
  - `repeat_booking`

## C. Lists

- [ ] Professionals pending review > 48h
- [ ] Signed up with no booking
- [ ] Completed session with no review
- [ ] Inactive users (no booking in 30d)

## D. Ownership and SLA

- [ ] Define default owner for new leads
- [ ] Define SLA for pending review (48h)
- [ ] Define escalation rule for SLA breach

## E. Security

- [ ] Create private app token for Make
- [ ] Store token securely (not in repo)
- [ ] Restrict scopes to minimum required

