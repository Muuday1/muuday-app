# Make + HubSpot Field Mapping (Muuday)

## Goal

Unify lifecycle data between app events, Make scenarios, and HubSpot CRM.

## Canonical identifiers

- `contact_key`: normalized email (lowercase + trim)
- `user_id`: Supabase auth user id (UUID)
- `professional_id`: professionals.id (UUID)
- `booking_id`: bookings.id (UUID)

## Contact properties (HubSpot)

- `email` (default)
- `firstname`
- `lastname`
- `muuday_role` (`usuario`, `profissional`, `admin`)
- `lifecycle_stage_muuday` (`new_lead`, `contacted`, `qualified`, `onboarding`, `approved`, `active`, `inactive`)
- `country`
- `timezone`
- `first_booking_at` (datetime)
- `last_booking_status` (`pending`, `confirmed`, `completed`, `cancelled`, `no_show`)
- `total_completed_sessions` (number)
- `source_channel` (`waitlist`, `organic`, `instagram`, `referral`, `manual`)
- `consent_marketing` (boolean)

## Event -> property updates

### waitlist_submitted

- Upsert contact by `email`
- Set:
  - `firstname`
  - `muuday_role` (default `usuario` unless explicit)
  - `lifecycle_stage_muuday = new_lead`
  - `source_channel = waitlist`

### account_created

- Upsert contact by `email`
- Set:
  - `muuday_role`
  - `country`
  - `timezone`

### professional_profile_pending_review

- Upsert contact by `email`
- Set:
  - `muuday_role = profissional`
  - `lifecycle_stage_muuday = onboarding`

### professional_approved

- Set:
  - `lifecycle_stage_muuday = approved`

### booking_confirmed

- Set:
  - `last_booking_status = confirmed`
  - `first_booking_at` if empty

### booking_completed

- Set:
  - `last_booking_status = completed`
  - `total_completed_sessions += 1`
  - `lifecycle_stage_muuday = active`

## Idempotency rules

1. Every scenario should receive `event_id`.
2. Make should check dedupe store before updating HubSpot.
3. Updates must be upsert-only, never hard-delete contacts.

