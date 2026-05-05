-- Migration 089: Atomic replace_external_busy_slots RPC
-- Purpose: Eliminates the non-atomic delete-then-insert race condition in
--          replaceExternalBusySlots. If the process crashed between DELETE and
--          INSERT, the professional's external busy slots were zeroed out,
--          causing double-booking risk.
-- Date: 2026-05-05

CREATE OR REPLACE FUNCTION replace_external_busy_slots(
  p_professional_id UUID,
  p_provider TEXT,
  p_slots JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove existing busy slots for this professional + provider
  DELETE FROM public.external_calendar_busy_slots
  WHERE professional_id = p_professional_id
    AND provider = p_provider;

  -- Insert new slots (if any)
  IF p_slots IS NOT NULL AND jsonb_array_length(p_slots) > 0 THEN
    INSERT INTO public.external_calendar_busy_slots (
      professional_id,
      provider,
      external_event_id,
      external_calendar_id,
      title,
      start_time_utc,
      end_time_utc,
      source_updated_at,
      payload,
      created_at,
      updated_at
    )
    SELECT
      p_professional_id,
      p_provider,
      (slot->>'external_event_id')::TEXT,
      (slot->>'external_calendar_id')::TEXT,
      (slot->>'title')::TEXT,
      (slot->>'start_time_utc')::TIMESTAMPTZ,
      (slot->>'end_time_utc')::TIMESTAMPTZ,
      (slot->>'source_updated_at')::TIMESTAMPTZ,
      COALESCE(slot->'payload', '{}'::jsonb),
      COALESCE((slot->>'created_at')::TIMESTAMPTZ, NOW()),
      COALESCE((slot->>'updated_at')::TIMESTAMPTZ, NOW())
    FROM jsonb_array_elements(p_slots) AS slot;
  END IF;
END;
$$;

-- Grant execute to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.replace_external_busy_slots TO authenticated, service_role;
