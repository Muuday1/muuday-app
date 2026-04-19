-- ============================================
-- Case / Dispute System Foundation (Wave 4)
-- ============================================

CREATE TYPE case_type AS ENUM (
  'cancelation_dispute',
  'no_show_claim',
  'quality_issue',
  'refund_request'
);

CREATE TYPE case_status AS ENUM (
  'open',
  'under_review',
  'waiting_info',
  'resolved',
  'closed'
);

-- --------------------------------------------
-- 1) Cases
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type case_type NOT NULL,
  status case_status NOT NULL DEFAULT 'open',
  reason TEXT NOT NULL,
  resolution TEXT,
  refund_amount DECIMAL(10,2),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_booking ON cases(booking_id);
CREATE INDEX IF NOT EXISTS idx_cases_reporter ON cases(reporter_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);

-- --------------------------------------------
-- 2) Case messages
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_messages_case ON case_messages(case_id);

-- --------------------------------------------
-- 3) Case actions (audit trail)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS case_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_actions_case ON case_actions(case_id);

-- --------------------------------------------
-- 4) RLS Policies
-- --------------------------------------------

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cases_reporter_select ON cases;
CREATE POLICY cases_reporter_select ON cases
  FOR SELECT USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS cases_reporter_insert ON cases;
CREATE POLICY cases_reporter_insert ON cases
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_messages_participant_select ON case_messages;
CREATE POLICY case_messages_participant_select ON case_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = case_messages.case_id
        AND (c.reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

DROP POLICY IF EXISTS case_messages_participant_insert ON case_messages;
CREATE POLICY case_messages_participant_insert ON case_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM cases c
      WHERE c.id = case_messages.case_id
        AND (c.reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

ALTER TABLE case_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_actions_admin_select ON case_actions;
CREATE POLICY case_actions_admin_select ON case_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
