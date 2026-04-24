-- ============================================
-- Unified Push: Native Token Support (Sprint 1 Decision)
-- ============================================
-- Decision: Expo Push Service as primary native push provider.
-- This migration adds native push token columns to push_subscriptions
-- and makes VAPID fields optional (web push uses endpoint/p256dh/auth,
-- native push uses push_token).

ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS app_version TEXT,
  ADD COLUMN IF NOT EXISTS os_version TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT;

-- Make VAPID fields nullable for native tokens
ALTER TABLE push_subscriptions
  ALTER COLUMN p256dh DROP NOT NULL,
  ALTER COLUMN auth DROP NOT NULL;

-- Add index for efficient native token lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_platform_token
  ON push_subscriptions(platform, push_token)
  WHERE push_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device
  ON push_subscriptions(device_id)
  WHERE device_id IS NOT NULL;

-- Add check constraint: native tokens must have push_token, web must have VAPID
ALTER TABLE push_subscriptions
  ADD CONSTRAINT chk_push_subscriptions_platform_fields
  CHECK (
    (platform = 'web' AND endpoint IS NOT NULL AND p256dh IS NOT NULL AND auth IS NOT NULL)
    OR
    (platform IN ('ios', 'android') AND push_token IS NOT NULL)
  );

-- Update RLS policy to allow updates (for token refresh)
DROP POLICY IF EXISTS push_subscriptions_owner_update ON push_subscriptions;
CREATE POLICY push_subscriptions_owner_update ON push_subscriptions
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
