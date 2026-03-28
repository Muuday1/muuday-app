-- ============================================
-- Production-grade booking foundation
-- ============================================
-- Goals:
-- - timezone-safe schedule model
-- - explicit booking state machine fields
-- - slot locks (race-condition mitigation)
-- - payment and recurring foundations
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- --------------------------------------------
-- 1) Extend bookings for robust state model
-- --------------------------------------------
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (
    status IN (
      'draft',
      'pending_payment',
      'pending_confirmation',
      'pending', -- legacy compatibility
      'confirmed',
      'cancelled',
      'completed',
      'no_show',
      'rescheduled'
    )
  );

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS start_time_utc TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time_utc TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timezone_user TEXT,
  ADD COLUMN IF NOT EXISTS timezone_professional TEXT,
  ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'one_off',
  ADD COLUMN IF NOT EXISTS parent_booking_id UUID REFERENCES bookings(id),
  ADD COLUMN IF NOT EXISTS price_total DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS confirmation_mode_snapshot TEXT DEFAULT 'auto_accept',
  ADD COLUMN IF NOT EXISTS cancellation_policy_snapshot JSONB DEFAULT '{
    "code":"platform_default",
    "refund_48h_or_more":100,
    "refund_24h_to_48h":50,
    "refund_under_24h":0
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS session_purpose TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE bookings
SET
  start_time_utc = COALESCE(start_time_utc, scheduled_at),
  end_time_utc = COALESCE(end_time_utc, scheduled_at + make_interval(mins => COALESCE(duration_minutes, 60))),
  timezone_user = COALESCE(timezone_user, 'America/Sao_Paulo'),
  timezone_professional = COALESCE(timezone_professional, 'America/Sao_Paulo'),
  booking_type = COALESCE(booking_type, 'one_off'),
  price_total = COALESCE(price_total, price_user_currency, price_brl);

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_booking_type_check
  CHECK (booking_type IN ('one_off', 'recurring_parent', 'recurring_child'));

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_confirmation_mode_snapshot_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_confirmation_mode_snapshot_check
  CHECK (confirmation_mode_snapshot IN ('auto_accept', 'manual'));

CREATE INDEX IF NOT EXISTS bookings_start_time_utc_idx ON bookings(start_time_utc);
CREATE INDEX IF NOT EXISTS bookings_end_time_utc_idx ON bookings(end_time_utc);
CREATE INDEX IF NOT EXISTS bookings_parent_booking_id_idx ON bookings(parent_booking_id);

-- --------------------------------------------
-- 2) Professional booking settings
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS professional_settings (
  professional_id UUID PRIMARY KEY REFERENCES professionals(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  session_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (session_duration_minutes BETWEEN 15 AND 240),
  buffer_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes BETWEEN 0 AND 120),
  minimum_notice_hours INTEGER NOT NULL DEFAULT 24 CHECK (minimum_notice_hours BETWEEN 1 AND 168),
  max_booking_window_days INTEGER NOT NULL DEFAULT 30 CHECK (max_booking_window_days BETWEEN 1 AND 365),
  enable_recurring BOOLEAN NOT NULL DEFAULT false,
  confirmation_mode TEXT NOT NULL DEFAULT 'auto_accept' CHECK (confirmation_mode IN ('auto_accept', 'manual')),
  cancellation_policy_code TEXT NOT NULL DEFAULT 'platform_default',
  require_session_purpose BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO professional_settings (professional_id, timezone, session_duration_minutes)
SELECT p.id, COALESCE(pr.timezone, 'America/Sao_Paulo'), COALESCE(p.session_duration_minutes, 60)
FROM professionals p
JOIN profiles pr ON pr.id = p.user_id
ON CONFLICT (professional_id) DO NOTHING;

-- --------------------------------------------
-- 3) Availability rules and exceptions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time_local TIME NOT NULL,
  end_time_local TIME NOT NULL,
  timezone TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time_local < end_time_local)
);

CREATE UNIQUE INDEX IF NOT EXISTS availability_rules_unique_window_idx
  ON availability_rules(professional_id, weekday, start_time_local, end_time_local);

CREATE INDEX IF NOT EXISTS availability_rules_professional_weekday_idx
  ON availability_rules(professional_id, weekday);

INSERT INTO availability_rules (professional_id, weekday, start_time_local, end_time_local, timezone, is_active)
SELECT
  a.professional_id,
  a.day_of_week,
  a.start_time,
  a.end_time,
  COALESCE(ps.timezone, 'America/Sao_Paulo'),
  COALESCE(a.is_active, true)
FROM availability a
LEFT JOIN professional_settings ps ON ps.professional_id = a.professional_id
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  date_local DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT false,
  start_time_local TIME,
  end_time_local TIME,
  timezone TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (is_available = false AND start_time_local IS NULL AND end_time_local IS NULL)
    OR
    (is_available = true AND start_time_local IS NOT NULL AND end_time_local IS NOT NULL AND start_time_local < end_time_local)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS availability_exceptions_unique_day_idx
  ON availability_exceptions(professional_id, date_local);

-- --------------------------------------------
-- 4) Slot locks (temporary hold before payment)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS slot_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time_utc TIMESTAMPTZ NOT NULL,
  end_time_utc TIMESTAMPTZ NOT NULL,
  booking_type TEXT NOT NULL DEFAULT 'one_off' CHECK (booking_type IN ('one_off', 'recurring')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS slot_locks_unique_slot_idx
  ON slot_locks(professional_id, start_time_utc);

CREATE INDEX IF NOT EXISTS slot_locks_expires_at_idx
  ON slot_locks(expires_at);

-- --------------------------------------------
-- 5) Payments and recurring sessions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_id TEXT,
  amount_total DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('requires_payment', 'captured', 'refunded', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON payments(booking_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_professional_id_idx ON payments(professional_id);

CREATE TABLE IF NOT EXISTS booking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  start_time_utc TIMESTAMPTZ NOT NULL,
  end_time_utc TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'pending_payment',
      'pending_confirmation',
      'confirmed',
      'cancelled',
      'completed',
      'no_show',
      'rescheduled'
    )
  ),
  session_number INTEGER NOT NULL CHECK (session_number >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(parent_booking_id, session_number)
);

CREATE INDEX IF NOT EXISTS booking_sessions_parent_idx ON booking_sessions(parent_booking_id);
CREATE INDEX IF NOT EXISTS booking_sessions_start_idx ON booking_sessions(start_time_utc);

-- --------------------------------------------
-- 6) Calendar integration foundation
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL UNIQUE REFERENCES professionals(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  provider_account_email TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- 7) RLS for new tables
-- --------------------------------------------
ALTER TABLE professional_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional settings are viewable" ON professional_settings;
DROP POLICY IF EXISTS "Professionals manage own settings" ON professional_settings;
CREATE POLICY "Professional settings are viewable"
  ON professional_settings FOR SELECT USING (true);
CREATE POLICY "Professionals manage own settings"
  ON professional_settings FOR ALL
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Availability rules are viewable" ON availability_rules;
DROP POLICY IF EXISTS "Professionals manage own availability rules" ON availability_rules;
CREATE POLICY "Availability rules are viewable"
  ON availability_rules FOR SELECT USING (true);
CREATE POLICY "Professionals manage own availability rules"
  ON availability_rules FOR ALL
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Availability exceptions are viewable" ON availability_exceptions;
DROP POLICY IF EXISTS "Professionals manage own availability exceptions" ON availability_exceptions;
CREATE POLICY "Availability exceptions are viewable"
  ON availability_exceptions FOR SELECT USING (true);
CREATE POLICY "Professionals manage own availability exceptions"
  ON availability_exceptions FOR ALL
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users manage own slot locks" ON slot_locks;
CREATE POLICY "Users manage own slot locks"
  ON slot_locks FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users and professionals view own payments" ON payments;
CREATE POLICY "Users and professionals view own payments"
  ON payments FOR SELECT
  USING (
    user_id = auth.uid()
    OR professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "System creates payments for booking owner" ON payments;
CREATE POLICY "System creates payments for booking owner"
  ON payments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users and professionals update own payments" ON payments;
CREATE POLICY "Users and professionals update own payments"
  ON payments FOR UPDATE
  USING (
    user_id = auth.uid()
    OR professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Booking sessions follow parent booking visibility" ON booking_sessions;
CREATE POLICY "Booking sessions follow parent booking visibility"
  ON booking_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM bookings b
      WHERE b.id = booking_sessions.parent_booking_id
        AND (
          b.user_id = auth.uid()
          OR b.professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Professionals manage own booking sessions" ON booking_sessions;
CREATE POLICY "Professionals manage own booking sessions"
  ON booking_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM bookings b
      WHERE b.id = booking_sessions.parent_booking_id
        AND (
          b.professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM bookings b
      WHERE b.id = booking_sessions.parent_booking_id
        AND (
          b.professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "Professionals manage own calendar integration" ON calendar_integrations;
CREATE POLICY "Professionals manage own calendar integration"
  ON calendar_integrations FOR ALL
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
