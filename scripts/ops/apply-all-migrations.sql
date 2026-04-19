-- ============================================
-- PREFLIGHT CHECK: detect incomplete tables from previous partial runs
-- ============================================
DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(table_name || '.' || col, ', ')
  INTO v_missing
  FROM (VALUES
    ('conversation_participants', 'conversation_id'),
    ('messages', 'conversation_id'),
    ('push_subscriptions', 'endpoint'),
    ('client_records', 'professional_id'),
    ('session_notes', 'booking_id'),
    ('cases', 'reporter_id'),
    ('case_messages', 'case_id'),
    ('case_actions', 'case_id'),
    ('professional_services', 'professional_id')
  ) AS t(table_name, col)
  WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t.table_name
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = t.table_name AND column_name = t.col
  );

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Incomplete tables detected: %. Run: DROP TABLE IF EXISTS conversation_participants, messages, push_subscriptions, client_records, session_notes, cases, case_messages, case_actions, professional_services CASCADE; then re-run this script.', v_missing;
  END IF;
END $$;

COMMIT;

-- ============================================
-- Auto-recalc professional rating on review changes
-- ============================================
-- Goals:
-- - Automatically update professionals.rating and professionals.total_reviews
--   whenever a review is inserted, updated (visibility toggle), or deleted.
-- - Only count visible reviews (is_visible = true).
-- - Avoid recalculating the entire professionals table on every change.
-- ============================================

-- --------------------------------------------
-- 1) Helper function to recalc rating for a specific professional
-- --------------------------------------------
CREATE OR REPLACE FUNCTION recalc_professional_rating(p_professional_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE professionals
  SET
    rating = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM reviews
      WHERE professional_id = p_professional_id
        AND is_visible = true
    ), 0),
    total_reviews = COALESCE((
      SELECT COUNT(*)
      FROM reviews
      WHERE professional_id = p_professional_id
        AND is_visible = true
    ), 0),
    updated_at = NOW()
  WHERE id = p_professional_id;
END;
$$;

-- --------------------------------------------
-- 2) Trigger function invoked on review changes
-- --------------------------------------------
CREATE OR REPLACE FUNCTION trigger_recalc_professional_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_professional_id UUID;
BEGIN
  -- Determine which professional_id was affected
  IF TG_OP = 'DELETE' THEN
    v_professional_id := OLD.professional_id;
  ELSE
    v_professional_id := NEW.professional_id;
  END IF;

  -- For UPDATE: if professional_id changed, recalc both old and new professionals
  IF TG_OP = 'UPDATE' AND OLD.professional_id IS DISTINCT FROM NEW.professional_id THEN
    PERFORM recalc_professional_rating(OLD.professional_id);
    PERFORM recalc_professional_rating(NEW.professional_id);
    RETURN NEW;
  END IF;

  -- For INSERT: only recalc if review is visible
  IF TG_OP = 'INSERT' AND NEW.is_visible = true THEN
    PERFORM recalc_professional_rating(v_professional_id);
    RETURN NEW;
  END IF;

  -- For UPDATE: only recalc if visibility or rating changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_visible IS DISTINCT FROM NEW.is_visible
       OR OLD.rating IS DISTINCT FROM NEW.rating THEN
      PERFORM recalc_professional_rating(v_professional_id);
    END IF;
    RETURN NEW;
  END IF;

  -- For DELETE: always recalc (the review is gone)
  IF TG_OP = 'DELETE' THEN
    PERFORM recalc_professional_rating(v_professional_id);
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- --------------------------------------------
-- 3) Attach trigger to reviews table
-- --------------------------------------------
DROP TRIGGER IF EXISTS trg_recalc_professional_rating ON reviews;

CREATE TRIGGER trg_recalc_professional_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_recalc_professional_rating();

-- --------------------------------------------
-- 4) Index to support fast recalc queries
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_professional_visible
ON reviews(professional_id, is_visible)
WHERE is_visible = true;

-- --------------------------------------------
-- 5) Backfill existing professionals (one-time)
-- --------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT professional_id
    FROM reviews
    WHERE is_visible = true
  LOOP
    PERFORM recalc_professional_rating(r.professional_id);
  END LOOP;
END $$;

-- === COMMIT: End of migration 53 ===
COMMIT;

-- ============================================
-- Chat / Messaging Foundation (Wave 4)
-- ============================================
-- Design: One conversation per confirmed booking.
-- Lifecycle: conversation is created automatically when booking is confirmed.
-- ============================================

-- --------------------------------------------
-- 1) Conversations (1:1 with bookings)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(booking_id);

-- --------------------------------------------
-- 2) Conversation participants
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'professional')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

-- --------------------------------------------
-- 3) Messages
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent ON messages(conversation_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- --------------------------------------------
-- 4) RLS Policies
-- --------------------------------------------

-- Conversations: participants can read
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_participants_select ON conversations;
CREATE POLICY conversations_participants_select ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.user_id = auth.uid()
    )
  );

-- Conversation participants: participants can read
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversation_participants_select ON conversation_participants;
CREATE POLICY conversation_participants_select ON conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT cp.conversation_id FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
  );

-- Messages: participants can read; sender can insert/update their own
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_participants_select ON messages;
CREATE POLICY messages_participants_select ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT cp.conversation_id FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_sender_insert ON messages;
CREATE POLICY messages_sender_insert ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT cp.conversation_id FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS messages_sender_update ON messages;
CREATE POLICY messages_sender_update ON messages
  FOR UPDATE USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- --------------------------------------------
-- 5) Trigger: auto-create conversation on booking confirmed
-- --------------------------------------------
CREATE OR REPLACE FUNCTION auto_create_conversation_on_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    INSERT INTO conversations (booking_id)
    VALUES (NEW.id)
    ON CONFLICT (booking_id) DO NOTHING;

    -- Add client participant
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    SELECT c.id, NEW.user_id, 'client'
    FROM conversations c
    WHERE c.booking_id = NEW.id
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    -- Add professional participant
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    SELECT c.id, p.user_id, 'professional'
    FROM conversations c
    JOIN professionals p ON p.id = NEW.professional_id
    WHERE c.booking_id = NEW.id
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_conversation ON bookings;
CREATE TRIGGER trg_auto_create_conversation
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION auto_create_conversation_on_confirmed();

-- === COMMIT: End of migration 54 ===
COMMIT;

-- ============================================
-- Push Notifications Foundation (Wave 4)
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_owner_select ON push_subscriptions;
CREATE POLICY push_subscriptions_owner_select ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS push_subscriptions_owner_delete ON push_subscriptions;
CREATE POLICY push_subscriptions_owner_delete ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS push_subscriptions_owner_insert ON push_subscriptions;
CREATE POLICY push_subscriptions_owner_insert ON push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- === COMMIT: End of migration 55 ===
COMMIT;

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

-- === COMMIT: End of migration 56 ===
COMMIT;

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

-- === COMMIT: End of migration 57 ===
COMMIT;

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
