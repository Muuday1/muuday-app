-- ============================================
-- Wave 2: Professional onboarding gate-matrix foundation
-- Scope:
-- - Add service-structure table for C4 (service setup)
-- - Add operational readiness flags for C6/C7 in professional_settings
-- - Keep backward compatibility with existing professionals
-- ============================================

CREATE TABLE IF NOT EXISTS public.professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('one_off', 'one_off_plus_recurring', 'monthly_subscription')),
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 15 AND 240),
  price_brl DECIMAL(10,2) NOT NULL CHECK (price_brl >= 0),
  enable_recurring BOOLEAN NOT NULL DEFAULT false,
  enable_monthly BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professional_services_professional
  ON public.professional_services(professional_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_professional_services_type
  ON public.professional_services(service_type, is_active);

ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active professional services" ON public.professional_services;
CREATE POLICY "Public can read active professional services"
  ON public.professional_services
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = professional_services.professional_id
        AND (p.user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Professionals can manage own services" ON public.professional_services;
CREATE POLICY "Professionals can manage own services"
  ON public.professional_services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = professional_services.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = professional_services.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

ALTER TABLE public.professional_settings
  ADD COLUMN IF NOT EXISTS billing_card_on_file BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_onboarding_started BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_kyc_completed BOOLEAN NOT NULL DEFAULT false;

-- Backfill C4 baseline: one active service from legacy professionals
-- when no service exists yet.
INSERT INTO public.professional_services (
  professional_id,
  name,
  service_type,
  description,
  duration_minutes,
  price_brl,
  enable_recurring,
  enable_monthly,
  is_active,
  is_draft
)
SELECT
  p.id,
  'Sessao principal',
  'one_off',
  COALESCE(NULLIF(p.bio, ''), 'Sessao profissional na plataforma Muuday'),
  GREATEST(15, LEAST(COALESCE(p.session_duration_minutes, 60), 240)),
  COALESCE(p.session_price_brl, 0),
  false,
  false,
  true,
  false
FROM public.professionals p
WHERE COALESCE(p.session_price_brl, 0) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.professional_services s
    WHERE s.professional_id = p.id
  );

-- Backward-compatible bootstrap:
-- if first-booking was already enabled, mirror this readiness in C6/C7 placeholders.
UPDATE public.professional_settings ps
SET
  billing_card_on_file = true,
  payout_onboarding_started = true
FROM public.professionals p
WHERE p.id = ps.professional_id
  AND p.first_booking_enabled = true
  AND (ps.billing_card_on_file = false OR ps.payout_onboarding_started = false);
