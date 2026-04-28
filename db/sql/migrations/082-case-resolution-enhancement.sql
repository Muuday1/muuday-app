-- ============================================
-- Case Resolution Enhancement (ADMIN-01)
-- ============================================
-- Adds assignment, priority, and SLA tracking to the existing case system.

-- --------------------------------------------
-- 1) Extend cases table
-- --------------------------------------------
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'P1',
  ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS summary TEXT;

-- --------------------------------------------
-- 2) Priority constraint
-- --------------------------------------------
ALTER TABLE cases
  DROP CONSTRAINT IF EXISTS cases_priority_check;
ALTER TABLE cases
  ADD CONSTRAINT cases_priority_check
  CHECK (priority IN ('P0', 'P1', 'P2', 'P3'));

-- --------------------------------------------
-- 3) Indexes
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_sla_deadline ON cases(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_cases_type_status ON cases(type, status);

-- --------------------------------------------
-- 4) Update existing rows with computed priority and SLA
-- --------------------------------------------
UPDATE cases
SET priority = CASE type
  WHEN 'cancelation_dispute' THEN 'P0'
  WHEN 'no_show_claim' THEN 'P1'
  WHEN 'quality_issue' THEN 'P1'
  WHEN 'refund_request' THEN 'P1'
  ELSE 'P1'
END,
sla_deadline = CASE type
  WHEN 'cancelation_dispute' THEN created_at + INTERVAL '24 hours'
  WHEN 'no_show_claim' THEN created_at + INTERVAL '24 hours'
  WHEN 'quality_issue' THEN created_at + INTERVAL '48 hours'
  WHEN 'refund_request' THEN created_at + INTERVAL '48 hours'
  ELSE created_at + INTERVAL '48 hours'
END
WHERE priority = 'P1' AND sla_deadline IS NULL;

-- --------------------------------------------
-- 5) RLS policy for assigned cases
-- --------------------------------------------
DROP POLICY IF EXISTS cases_assigned_select ON cases;
CREATE POLICY cases_assigned_select ON cases
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- --------------------------------------------
-- 6) Update trigger for updated_at
-- --------------------------------------------
CREATE OR REPLACE FUNCTION update_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cases_updated_at_trigger ON cases;
CREATE TRIGGER cases_updated_at_trigger
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_cases_updated_at();
