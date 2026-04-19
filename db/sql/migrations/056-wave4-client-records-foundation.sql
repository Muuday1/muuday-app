-- ============================================
-- Client Records / CRM Foundation (Wave 4)
-- ============================================
-- Design: Each professional maintains their own records per client.
-- Privacy: clients cannot see notes; professionals see only their own.
-- GDPR: export/delete capability via server actions.
-- ============================================

-- --------------------------------------------
-- 1) Client records (per professional + per user)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS client_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(professional_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_client_records_professional ON client_records(professional_id);
CREATE INDEX IF NOT EXISTS idx_client_records_user ON client_records(user_id);

-- --------------------------------------------
-- 2) Session notes (per booking)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  notes TEXT,
  mood TEXT,
  symptoms TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, professional_id)
);

CREATE INDEX IF NOT EXISTS idx_session_notes_booking ON session_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_professional ON session_notes(professional_id);

-- --------------------------------------------
-- 3) RLS Policies
-- --------------------------------------------

-- Client records: professional can CRUD their own records
ALTER TABLE client_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_records_professional_select ON client_records;
CREATE POLICY client_records_professional_select ON client_records
  FOR SELECT USING (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS client_records_professional_insert ON client_records;
CREATE POLICY client_records_professional_insert ON client_records
  FOR INSERT WITH CHECK (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS client_records_professional_update ON client_records;
CREATE POLICY client_records_professional_update ON client_records
  FOR UPDATE USING (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS client_records_professional_delete ON client_records;
CREATE POLICY client_records_professional_delete ON client_records
  FOR DELETE USING (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );

-- Session notes: professional can CRUD their own notes
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS session_notes_professional_select ON session_notes;
CREATE POLICY session_notes_professional_select ON session_notes
  FOR SELECT USING (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS session_notes_professional_insert ON session_notes;
CREATE POLICY session_notes_professional_insert ON session_notes
  FOR INSERT WITH CHECK (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS session_notes_professional_update ON session_notes;
CREATE POLICY session_notes_professional_update ON session_notes
  FOR UPDATE USING (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS session_notes_professional_delete ON session_notes;
CREATE POLICY session_notes_professional_delete ON session_notes
  FOR DELETE USING (
    professional_id IN (
      SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()
    )
  );
