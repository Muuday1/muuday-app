# Make Scenarios Blueprint (Muuday)

This is the execution order for high-impact scenarios using your current Make + HubSpot plans.

## Scenario 1 - Waitlist Intake -> HubSpot Upsert

### Trigger
- Webhook: `waitlist_submitted`

### Steps
1. Validate payload required fields (`email`, `firstname`).
2. Normalize email.
3. Dedupe by `event_id` and email.
4. HubSpot contact upsert.
5. Create follow-up task for ops owner.
6. Log result to audit table/notion sheet.

### Failure policy
- Retry 3 times with backoff.
- If still failing, send alert to ops channel and mark dead-letter.

## Scenario 2 - Professional Onboarding Pipeline

### Trigger
- Webhook/event: `professional_profile_pending_review`

### Steps
1. Upsert contact in HubSpot.
2. Move lifecycle to `onboarding`.
3. Create review task with SLA (48h).
4. Notify internal channel.

### Failure policy
- Retry + dead-letter + daily digest of pending errors.

## Scenario 3 - Booking Reminder 24h and 1h

### Trigger
- Event: `booking_confirmed`

### Steps
1. Schedule delayed execution for `-24h`.
2. Send reminder email (Resend).
3. Schedule delayed execution for `-1h`.
4. Send reminder email or WhatsApp (optional later).
5. Mark message status in log.

### Guardrails
- Do not send if booking status changed to cancelled/no_show.

## Scenario 4 - Completed Session -> Review + Rebook

### Trigger
- Event: `booking_completed`

### Steps
1. Send review request email.
2. Wait 72h.
3. If no review, send soft reminder.
4. Wait 7 days.
5. Send rebooking nudge.

## Scenario 5 - No-show Recovery

### Trigger
- Event: `booking_no_show`

### Steps
1. Create support task.
2. Send recovery message with reschedule CTA.
3. Update HubSpot stage/health tags.

## Scenario standards (apply to all)

1. Include `event_id`, `occurred_at`, and `source`.
2. Log every execution with status (`success`, `retry`, `failed`).
3. Use idempotent updates only.
4. Never block user-facing request path waiting for Make completion.

