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
