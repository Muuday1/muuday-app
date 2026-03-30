-- ============================================
-- Wave 2: request-booking lifecycle foundation
-- ============================================

CREATE TABLE IF NOT EXISTS public.request_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'offered', 'accepted', 'declined', 'expired', 'cancelled', 'converted')
  ),
  preferred_start_utc TIMESTAMPTZ NOT NULL,
  preferred_end_utc TIMESTAMPTZ NOT NULL,
  user_timezone TEXT NOT NULL,
  user_message TEXT,
  proposal_start_utc TIMESTAMPTZ,
  proposal_end_utc TIMESTAMPTZ,
  proposal_timezone TEXT,
  proposal_message TEXT,
  proposal_expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  converted_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (preferred_start_utc < preferred_end_utc),
  CHECK (
    proposal_start_utc IS NULL
    OR proposal_end_utc IS NULL
    OR proposal_start_utc < proposal_end_utc
  )
);

CREATE INDEX IF NOT EXISTS idx_request_bookings_professional_status
  ON public.request_bookings(professional_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_bookings_user_status
  ON public.request_bookings(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_bookings_offer_expiry
  ON public.request_bookings(status, proposal_expires_at);

ALTER TABLE public.request_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own request bookings" ON public.request_bookings;
CREATE POLICY "Users can view own request bookings" ON public.request_bookings
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = request_bookings.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert own request bookings" ON public.request_bookings;
CREATE POLICY "Users can insert own request bookings" ON public.request_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own request bookings" ON public.request_bookings;
CREATE POLICY "Users can update own request bookings" ON public.request_bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Professionals can update own request bookings" ON public.request_bookings;
CREATE POLICY "Professionals can update own request bookings" ON public.request_bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = request_bookings.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = request_bookings.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  );
