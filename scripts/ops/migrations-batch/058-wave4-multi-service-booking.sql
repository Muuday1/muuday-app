-- ============================================
-- Multi-Service Booking (Wave 4)
-- ============================================
-- Adds professional_services table and links bookings to a specific service.
-- Backward compatible: bookings without service_id use legacy single-service behavior.
-- ============================================

-- --------------------------------------------
-- 1) Professional services
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) <= 100),
  description TEXT CHECK (LENGTH(description) <= 500),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 300),
  price_brl DECIMAL(10,2) NOT NULL CHECK (price_brl >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professional_services_professional ON professional_services(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_active ON professional_services(professional_id, is_active);

-- --------------------------------------------
-- 2) Link bookings to services (nullable, backward compatible)
-- --------------------------------------------
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES professional_services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id)
WHERE service_id IS NOT NULL;

-- --------------------------------------------
-- 3) RLS Policies
-- --------------------------------------------

ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS professional_services_public_select ON professional_services;
CREATE POLICY professional_services_public_select ON professional_services
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS professional_services_owner_insert ON professional_services;
CREATE POLICY professional_services_owner_insert ON professional_services
  FOR INSERT WITH CHECK (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS professional_services_owner_update ON professional_services;
CREATE POLICY professional_services_owner_update ON professional_services
  FOR UPDATE USING (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS professional_services_owner_delete ON professional_services;
CREATE POLICY professional_services_owner_delete ON professional_services
  FOR DELETE USING (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );
