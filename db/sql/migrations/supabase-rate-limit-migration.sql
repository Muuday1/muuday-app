-- ============================================
-- RATE LIMIT INFRA (free tier friendly)
-- Run in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct row access from anon/authenticated clients.
DROP POLICY IF EXISTS "No direct access to api_rate_limits" ON api_rate_limits;
CREATE POLICY "No direct access to api_rate_limits"
  ON api_rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  now_ts TIMESTAMPTZ := NOW();
  window_interval INTERVAL := make_interval(secs => p_window_seconds);
  row_state api_rate_limits;
BEGIN
  INSERT INTO api_rate_limits AS rl (rate_key, hits, window_started_at, updated_at)
  VALUES (p_key, 1, now_ts, now_ts)
  ON CONFLICT (rate_key) DO UPDATE
    SET hits = CASE
      WHEN rl.window_started_at + window_interval <= now_ts THEN 1
      ELSE rl.hits + 1
    END,
    window_started_at = CASE
      WHEN rl.window_started_at + window_interval <= now_ts THEN now_ts
      ELSE rl.window_started_at
    END,
    updated_at = now_ts
  RETURNING * INTO row_state;

  IF row_state.hits <= p_limit THEN
    RETURN QUERY SELECT TRUE, GREATEST(0, p_limit - row_state.hits), 0;
  ELSE
    RETURN QUERY
      SELECT
        FALSE,
        0,
        GREATEST(
          1,
          CEIL(EXTRACT(EPOCH FROM ((row_state.window_started_at + window_interval) - now_ts)))::INTEGER
        );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER)
  TO anon, authenticated, service_role;
