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
