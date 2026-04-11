-- 033-supabase-pro-enable-and-jobs-template.sql
-- Purpose:
-- 1) Enable Pro extensions you are not yet using (pg_cron, pg_net, pgsodium/vault path)
-- 2) Create safe baseline jobs for DB cleanup
-- 3) Provide webhook/event templates for Inngest handoff
--
-- IMPORTANT:
-- - Review each statement before running in production.
-- - Replace placeholders:
--   {{APP_BASE_URL}}, {{CRON_SECRET}}, {{INNGEST_EVENT_KEY}}
-- - Run with an admin role in Supabase SQL editor.

BEGIN;

-- 1) Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
-- Vault path (requires pgsodium in project):
CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;

COMMIT;

-- 2) DB-native cleanup jobs (idempotent schedule)
-- Remove old schedules if they already exist (safe re-run)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'cleanup-expired-slot-locks',
  'cancel-stale-pending-bookings',
  'clear-expired-slot-locks-fast'
);

-- Slot locks cleanup (every 5 min)
SELECT cron.schedule(
  'cleanup-expired-slot-locks',
  '*/5 * * * *',
  $$DELETE FROM public.slot_locks WHERE expires_at < now()$$
);

-- Optional faster cleanup every minute (keep only one if you prefer)
SELECT cron.schedule(
  'clear-expired-slot-locks-fast',
  '* * * * *',
  $$DELETE FROM public.slot_locks WHERE expires_at < now()$$
);

-- Cancel stale pending bookings (example rule: older than 24h, not confirmed)
SELECT cron.schedule(
  'cancel-stale-pending-bookings',
  '*/10 * * * *',
  $$
  UPDATE public.bookings
  SET
    status = 'cancelled',
    updated_at = now(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('cancelled_reason', 'pending_timeout')
  WHERE status IN ('pending', 'pending_confirmation')
    AND created_at < now() - interval '24 hours'
  $$
);

-- 3) HTTP job template: call app cron endpoint from pg_cron + pg_net
-- (useful for visibility recompute or mixed logic not expressible purely in SQL)
-- Example: call /api/cron/public-visibility-sync every 15 minutes
-- Replace placeholders before execution.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'http-public-visibility-sync';

SELECT cron.schedule(
  'http-public-visibility-sync',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := '{{APP_BASE_URL}}/api/cron/public-visibility-sync',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer {{CRON_SECRET}}'
    ),
    body := '{}'::jsonb
  )
  $$
);

-- 4) Trigger template for event-driven handoff to Inngest
-- Example: payments INSERT/UPDATE -> /api/inngest
CREATE OR REPLACE FUNCTION public.emit_payment_event_to_inngest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'name', 'payments/status.updated',
    'data', jsonb_build_object(
      'payment_id', NEW.id,
      'booking_id', NEW.booking_id,
      'status', NEW.status,
      'updated_at', NEW.updated_at
    )
  );

  PERFORM net.http_post(
    url := '{{APP_BASE_URL}}/api/inngest',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-inngest-event-key', '{{INNGEST_EVENT_KEY}}'
    ),
    body := payload
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_emit_payment_event_to_inngest ON public.payments;
CREATE TRIGGER trg_emit_payment_event_to_inngest
AFTER INSERT OR UPDATE OF status ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.emit_payment_event_to_inngest();

-- 5) Vault usage template (store secrets in database-managed vault)
-- SELECT vault.create_secret('vercel-cron-secret', '{{CRON_SECRET}}');
-- SELECT vault.create_secret('inngest-event-key', '{{INNGEST_EVENT_KEY}}');
