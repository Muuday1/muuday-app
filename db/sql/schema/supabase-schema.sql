-- ============================================
-- MUUDAY CANONICAL SCHEMA SNAPSHOT
-- ============================================
-- Snapshot aligned with migrations through:
-- - 016-professional-public-profile-code.sql
--
-- Notes:
-- 1) Ordered migrations in db/sql/migrations remain the source of truth for evolution.
-- 2) This snapshot is for clean bootstrap/reference and should be kept in sync.
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'usuario' CHECK (role IN ('usuario', 'profissional', 'admin')),
  country TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  currency TEXT DEFAULT 'BRL',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{
    "booking_confirmation": true,
    "session_reminder_24h": true,
    "session_reminder_1h": true,
    "payment_confirmation": true,
    "payment_failed": true,
    "booking_cancelled": true,
    "new_booking_received": true,
    "new_review": true,
    "news_promotions": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code INTEGER NOT NULL CHECK (public_code BETWEEN 1000 AND 9999),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'suspended')),
  bio TEXT,
  category TEXT NOT NULL,
  subcategories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT ARRAY['Portugues'],
  years_experience INTEGER DEFAULT 0,
  session_price_brl DECIMAL(10,2) NOT NULL DEFAULT 0,
  session_price INTEGER NOT NULL DEFAULT 0,
  session_price_currency TEXT NOT NULL DEFAULT 'BRL',
  session_duration_minutes INTEGER DEFAULT 60,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'professional', 'premium')),
  category_id UUID,
  market_code TEXT NOT NULL DEFAULT 'BR',
  first_booking_enabled BOOLEAN NOT NULL DEFAULT false,
  first_booking_gate_note TEXT,
  first_booking_gate_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE TABLE IF NOT EXISTS specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name_pt TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subcategory_id, slug)
);

CREATE TABLE IF NOT EXISTS professional_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(professional_id, specialty_id)
);

CREATE TABLE IF NOT EXISTS tag_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professional_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  title TEXT,
  display_name TEXT,
  headline TEXT,
  category TEXT NOT NULL,
  specialty_name TEXT,
  specialty_custom BOOLEAN NOT NULL DEFAULT false,
  specialty_validation_message TEXT,
  focus_areas TEXT[] NOT NULL DEFAULT '{}',
  primary_language TEXT,
  secondary_languages TEXT[] NOT NULL DEFAULT '{}',
  jurisdiction TEXT,
  years_experience INTEGER NOT NULL DEFAULT 0,
  session_price_brl DECIMAL(10,2) NOT NULL DEFAULT 0,
  session_duration_minutes INTEGER NOT NULL DEFAULT 60,
  qualification_file_names TEXT[] NOT NULL DEFAULT '{}',
  qualification_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'professionals_category_id_fkey'
      AND table_name = 'professionals'
  ) THEN
    ALTER TABLE professionals
      ADD CONSTRAINT professionals_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categories(id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  start_time_utc TIMESTAMPTZ,
  end_time_utc TIMESTAMPTZ,
  timezone_user TEXT,
  timezone_professional TEXT,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending' CHECK (
    status IN (
      'draft',
      'pending_payment',
      'pending_confirmation',
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'no_show',
      'rescheduled'
    )
  ),
  booking_type TEXT DEFAULT 'one_off' CHECK (booking_type IN ('one_off', 'recurring_parent', 'recurring_child', 'batch')),
  parent_booking_id UUID REFERENCES bookings(id),
  session_link TEXT,
  price_brl DECIMAL(10,2) NOT NULL,
  price_user_currency DECIMAL(10,2),
  price_total DECIMAL(10,2),
  user_currency TEXT DEFAULT 'BRL',
  notes TEXT,
  session_purpose TEXT,
  cancellation_reason TEXT,
  stripe_payment_intent_id TEXT,
  confirmation_mode_snapshot TEXT DEFAULT 'auto_accept' CHECK (confirmation_mode_snapshot IN ('auto_accept', 'manual')),
  cancellation_policy_snapshot JSONB DEFAULT '{
    "code":"platform_default",
    "refund_48h_or_more":100,
    "refund_24h_to_48h":50,
    "refund_under_24h":0
  }'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  professional_ready_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'offered', 'accepted', 'declined', 'expired', 'cancelled', 'converted')
  ),
  preferred_start_utc TIMESTAMPTZ NOT NULL,
  preferred_end_utc TIMESTAMPTZ NOT NULL,
  user_timezone TEXT NOT NULL,
  user_message TEXT,
  proposal_start_utc TIMESTAMPTZ,
  proposal_end_utc TIMESTAMPTZ,
  proposal_timezone TEXT,
  proposal_message TEXT,
  proposal_expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  converted_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (preferred_start_utc < preferred_end_utc),
  CHECK (
    proposal_start_utc IS NULL
    OR proposal_end_utc IS NULL
    OR proposal_start_utc < proposal_end_utc
  )
);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, professional_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  professional_id UUID NOT NULL REFERENCES professionals(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  professional_response TEXT,
  professional_response_at TIMESTAMPTZ,
  is_visible BOOLEAN DEFAULT FALSE,
  client_market_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ============================================
-- BOOKING FOUNDATION TABLES
-- ============================================

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

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'stripe',
  stripe_payment_intent_id TEXT,
  amount_total DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('requires_payment', 'captured', 'partial_refunded', 'refunded', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refunded_amount DECIMAL(10,2),
  refund_percentage INTEGER CHECK (refund_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  firstname TEXT NOT NULL,
  country TEXT,
  tipo_lead TEXT DEFAULT 'usuario' CHECK (tipo_lead IN ('usuario', 'profissional')),
  origem_lead TEXT,
  status TEXT DEFAULT 'na_lista',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_professional_id_idx ON favorites(professional_id);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_professional_unique
  ON reviews(user_id, professional_id);
CREATE INDEX IF NOT EXISTS professionals_tier_idx ON professionals(tier);
CREATE INDEX IF NOT EXISTS professionals_category_id_idx ON professionals(category_id);
CREATE UNIQUE INDEX IF NOT EXISTS professionals_public_code_unique_idx ON professionals(public_code);
CREATE INDEX IF NOT EXISTS categories_sort_order_idx ON categories(sort_order);
CREATE INDEX IF NOT EXISTS subcategories_category_id_sort_idx ON subcategories(category_id, sort_order);
CREATE INDEX IF NOT EXISTS specialties_subcategory_id_sort_idx ON specialties(subcategory_id, sort_order);
CREATE INDEX IF NOT EXISTS professional_specialties_professional_idx ON professional_specialties(professional_id);
CREATE INDEX IF NOT EXISTS professional_specialties_specialty_idx ON professional_specialties(specialty_id);
CREATE INDEX IF NOT EXISTS tag_suggestions_professional_idx ON tag_suggestions(professional_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS professional_applications_user_uidx ON professional_applications(user_id);
CREATE INDEX IF NOT EXISTS professional_applications_status_idx ON professional_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_start_time_utc_idx ON bookings(start_time_utc);
CREATE INDEX IF NOT EXISTS bookings_end_time_utc_idx ON bookings(end_time_utc);
CREATE INDEX IF NOT EXISTS bookings_parent_booking_id_idx ON bookings(parent_booking_id);
CREATE INDEX IF NOT EXISTS idx_request_bookings_professional_status
  ON request_bookings(professional_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_bookings_user_status
  ON request_bookings(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_bookings_offer_expiry
  ON request_bookings(status, proposal_expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS availability_rules_unique_window_idx
  ON availability_rules(professional_id, weekday, start_time_local, end_time_local);
CREATE INDEX IF NOT EXISTS availability_rules_professional_weekday_idx
  ON availability_rules(professional_id, weekday);
CREATE UNIQUE INDEX IF NOT EXISTS availability_exceptions_unique_day_idx
  ON availability_exceptions(professional_id, date_local);
CREATE UNIQUE INDEX IF NOT EXISTS slot_locks_unique_slot_idx
  ON slot_locks(professional_id, start_time_utc);
CREATE INDEX IF NOT EXISTS slot_locks_expires_at_idx ON slot_locks(expires_at);
CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON payments(booking_id);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_professional_id_idx ON payments(professional_id);
CREATE INDEX IF NOT EXISTS booking_sessions_parent_idx ON booking_sessions(parent_booking_id);
CREATE INDEX IF NOT EXISTS booking_sessions_start_idx ON booking_sessions(start_time_utc);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_booking_idx ON notifications(booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS notifications_unique_booking_type_user_idx
  ON notifications(booking_id, type, user_id)
  WHERE booking_id IS NOT NULL AND user_id IS NOT NULL;

-- ============================================
-- RLS ENABLEMENT
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Approved professionals are viewable" ON professionals;
CREATE POLICY "Approved professionals are viewable" ON professionals
  FOR SELECT USING (
    status = 'approved'
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Professionals can update own profile" ON professionals;
CREATE POLICY "Professionals can update own profile" ON professionals
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Professionals can insert own profile" ON professionals;
CREATE POLICY "Professionals can insert own profile" ON professionals
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
CREATE POLICY "Categories are publicly readable" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;
CREATE POLICY "Only admins can manage categories" ON categories
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Subcategories are publicly readable" ON subcategories;
CREATE POLICY "Subcategories are publicly readable" ON subcategories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage subcategories" ON subcategories;
CREATE POLICY "Only admins can manage subcategories" ON subcategories
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Specialties are publicly readable" ON specialties;
CREATE POLICY "Specialties are publicly readable" ON specialties
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage specialties" ON specialties;
CREATE POLICY "Only admins can manage specialties" ON specialties
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Professional specialties are publicly readable" ON professional_specialties;
CREATE POLICY "Professional specialties are publicly readable" ON professional_specialties
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Professionals can manage own specialties" ON professional_specialties;
CREATE POLICY "Professionals can manage own specialties" ON professional_specialties
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM professionals WHERE id = professional_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Professionals can view own tag suggestions" ON tag_suggestions;
CREATE POLICY "Professionals can view own tag suggestions" ON tag_suggestions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM professionals WHERE id = professional_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Professionals can create tag suggestions" ON tag_suggestions;
CREATE POLICY "Professionals can create tag suggestions" ON tag_suggestions
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM professionals WHERE id = professional_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Only admins can update tag suggestions" ON tag_suggestions;
CREATE POLICY "Only admins can update tag suggestions" ON tag_suggestions
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Professionals can view own applications" ON professional_applications;
CREATE POLICY "Professionals can view own applications" ON professional_applications
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Professionals can insert own applications" ON professional_applications;
CREATE POLICY "Professionals can insert own applications" ON professional_applications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update applications" ON professional_applications;
CREATE POLICY "Admins can update applications" ON professional_applications
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Availability is viewable" ON availability;
CREATE POLICY "Availability is viewable" ON availability
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Professionals manage own availability" ON availability;
CREATE POLICY "Professionals manage own availability" ON availability
  FOR ALL
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Visible reviews are public" ON reviews;
CREATE POLICY "Visible reviews are public" ON reviews
  FOR SELECT USING (
    is_visible = true
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users see own bookings" ON bookings;
CREATE POLICY "Users see own bookings" ON bookings
  FOR SELECT USING (
    user_id = auth.uid()
    OR professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users and professionals can update bookings" ON bookings;
CREATE POLICY "Users and professionals can update bookings" ON bookings
  FOR UPDATE
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

DROP POLICY IF EXISTS "Users can view own request bookings" ON request_bookings;
CREATE POLICY "Users can view own request bookings" ON request_bookings
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM professionals p
      WHERE p.id = request_bookings.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can insert own request bookings" ON request_bookings;
CREATE POLICY "Users can insert own request bookings" ON request_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own request bookings" ON request_bookings;
CREATE POLICY "Users can update own request bookings" ON request_bookings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Professionals can update own request bookings" ON request_bookings;
CREATE POLICY "Professionals can update own request bookings" ON request_bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM professionals p
      WHERE p.id = request_bookings.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM professionals p
      WHERE p.id = request_bookings.professional_id
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Professional settings are viewable" ON professional_settings;
CREATE POLICY "Professional settings are viewable" ON professional_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Professionals manage own settings" ON professional_settings;
CREATE POLICY "Professionals manage own settings" ON professional_settings
  FOR ALL
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Availability rules are viewable" ON availability_rules;
CREATE POLICY "Availability rules are viewable" ON availability_rules
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Professionals manage own availability rules" ON availability_rules;
CREATE POLICY "Professionals manage own availability rules" ON availability_rules
  FOR ALL
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Availability exceptions are viewable" ON availability_exceptions;
CREATE POLICY "Availability exceptions are viewable" ON availability_exceptions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Professionals manage own availability exceptions" ON availability_exceptions;
CREATE POLICY "Professionals manage own availability exceptions" ON availability_exceptions
  FOR ALL
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users manage own slot locks" ON slot_locks;
CREATE POLICY "Users manage own slot locks" ON slot_locks
  FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users and professionals view own payments" ON payments;
CREATE POLICY "Users and professionals view own payments" ON payments
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "System creates payments for booking owner" ON payments;
CREATE POLICY "System creates payments for booking owner" ON payments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users and professionals update own payments" ON payments;
CREATE POLICY "Users and professionals update own payments" ON payments
  FOR UPDATE
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
CREATE POLICY "Booking sessions follow parent booking visibility" ON booking_sessions
  FOR SELECT
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
CREATE POLICY "Professionals manage own booking sessions" ON booking_sessions
  FOR ALL
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
CREATE POLICY "Professionals manage own calendar integration" ON calendar_integrations
  FOR ALL
  USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users insert own notifications" ON notifications;
CREATE POLICY "Users insert own notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "No direct access to api_rate_limits" ON api_rate_limits;
CREATE POLICY "No direct access to api_rate_limits" ON api_rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Service role only" ON waitlist;
CREATE POLICY "Service role only" ON waitlist
  USING (false);

-- ============================================
-- RATE LIMIT FUNCTION
-- ============================================

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

-- ============================================
-- PROFESSIONAL PUBLIC PROFILE CODE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.assign_professional_public_code()
RETURNS trigger AS $$
DECLARE
  candidate INTEGER;
  attempts INTEGER := 0;
BEGIN
  IF NEW.public_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    attempts := attempts + 1;
    candidate := FLOOR(RANDOM() * 9000)::INTEGER + 1000;

    IF NOT EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.public_code = candidate
    ) THEN
      NEW.public_code := candidate;
      RETURN NEW;
    END IF;

    IF attempts >= 200 THEN
      SELECT gs
      INTO candidate
      FROM generate_series(1000, 9999) gs
      WHERE NOT EXISTS (
        SELECT 1 FROM public.professionals p WHERE p.public_code = gs
      )
      LIMIT 1;

      IF candidate IS NULL THEN
        RAISE EXCEPTION 'No available 4-digit public_code remaining for professionals';
      END IF;

      NEW.public_code := candidate;
      RETURN NEW;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_professional_public_code ON public.professionals;
CREATE TRIGGER trg_assign_professional_public_code
  BEFORE INSERT ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_professional_public_code();

-- ============================================
-- AUTH TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _raw_role TEXT;
  _role TEXT;
  _professional_id UUID;
  _category TEXT;
  _display_name TEXT;
  _headline TEXT;
  _specialty_name TEXT;
  _specialty_custom BOOLEAN;
  _specialty_message TEXT;
  _focus_areas TEXT[];
  _primary_language TEXT;
  _secondary_languages TEXT[];
  _languages TEXT[];
  _jurisdiction TEXT;
  _years_experience INTEGER;
  _session_price_brl DECIMAL(10,2);
  _session_duration_minutes INTEGER;
  _qualification_file_names TEXT[];
  _qualification_note TEXT;
  _title TEXT;
  _specialty_tag TEXT;
BEGIN
  _raw_role := lower(COALESCE(NEW.raw_user_meta_data->>'role', 'usuario'));

  _role := CASE
    WHEN _raw_role IN ('profissional', 'professional', 'provider') THEN 'profissional'
    WHEN _raw_role IN ('usuario', 'user', 'cliente', 'client', 'customer') THEN 'usuario'
    ELSE 'usuario'
  END;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    country,
    timezone,
    currency,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    _role,
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'timezone', ''), 'America/Sao_Paulo'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'currency', ''), 'BRL'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    role = CASE
      WHEN public.profiles.role = 'admin' THEN 'admin'
      ELSE EXCLUDED.role
    END,
    country = COALESCE(EXCLUDED.country, public.profiles.country),
    timezone = COALESCE(EXCLUDED.timezone, public.profiles.timezone),
    currency = COALESCE(EXCLUDED.currency, public.profiles.currency),
    updated_at = NOW();

  IF _role = 'profissional' THEN
    BEGIN
      _category := lower(COALESCE(NULLIF(NEW.raw_user_meta_data->>'professional_category', ''), 'outro'));
      IF _category NOT IN (
        'saude-mental-bem-estar',
        'saude-corpo-movimento',
        'educacao-desenvolvimento',
        'contabilidade-financas',
        'direito-suporte-juridico',
        'carreira-negocios-desenvolvimento',
        'traducao-suporte-documental',
        'outro'
      ) THEN
        _category := 'outro';
      END IF;

      _display_name := NULLIF(NEW.raw_user_meta_data->>'professional_display_name', '');
      _headline := NULLIF(NEW.raw_user_meta_data->>'professional_headline', '');
      _specialty_name := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'professional_specialty_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'professional_specialties', '')
      );
      _specialty_custom := lower(COALESCE(NEW.raw_user_meta_data->>'professional_specialty_is_custom', 'false')) IN ('true', '1', 'yes');
      _specialty_message := NULLIF(NEW.raw_user_meta_data->>'professional_specialty_validation_message', '');
      _title := NULLIF(NEW.raw_user_meta_data->>'professional_title', '');
      _jurisdiction := NULLIF(NEW.raw_user_meta_data->>'professional_jurisdiction', '');
      _qualification_note := NULLIF(NEW.raw_user_meta_data->>'professional_qualification_note', '');

      SELECT COALESCE(array_agg(trim(value)), '{}'::text[])
      INTO _focus_areas
      FROM jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'professional_focus_areas', '[]'::jsonb)) AS value
      WHERE trim(value) <> '';

      IF COALESCE(array_length(_focus_areas, 1), 0) = 0 THEN
        _focus_areas := COALESCE(
          regexp_split_to_array(NULLIF(NEW.raw_user_meta_data->>'professional_focus_areas', ''), '\s*,\s*'),
          '{}'::text[]
        );
      END IF;

      _primary_language := COALESCE(NULLIF(NEW.raw_user_meta_data->>'professional_primary_language', ''), 'Portugues');

      SELECT COALESCE(array_agg(trim(value)), '{}'::text[])
      INTO _secondary_languages
      FROM jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'professional_secondary_languages', '[]'::jsonb)) AS value
      WHERE trim(value) <> '';

      IF COALESCE(array_length(_secondary_languages, 1), 0) = 0 THEN
        SELECT COALESCE(array_agg(trim(value)), '{}'::text[])
        INTO _secondary_languages
        FROM jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'professional_languages', '[]'::jsonb)) AS value
        WHERE trim(value) <> '' AND trim(value) <> _primary_language;
      END IF;

      SELECT ARRAY(
        SELECT DISTINCT lang_value
        FROM unnest(array_prepend(_primary_language, COALESCE(_secondary_languages, '{}'::text[]))) AS lang_value
        WHERE lang_value IS NOT NULL AND btrim(lang_value) <> ''
      )
      INTO _languages;

      _years_experience := CASE
        WHEN COALESCE(NEW.raw_user_meta_data->>'professional_years_experience', '') ~ '^[0-9]+$'
          THEN LEAST(60, GREATEST(0, (NEW.raw_user_meta_data->>'professional_years_experience')::INTEGER))
        ELSE 0
      END;

      _session_price_brl := CASE
        WHEN COALESCE(NEW.raw_user_meta_data->>'professional_session_price', '') ~ '^[0-9]+(\.[0-9]{1,2})?$'
          THEN GREATEST(0, (NEW.raw_user_meta_data->>'professional_session_price')::DECIMAL(10,2))
        ELSE 0
      END;

      _session_duration_minutes := CASE
        WHEN COALESCE(NEW.raw_user_meta_data->>'professional_session_duration_minutes', '') ~ '^[0-9]+$'
          THEN LEAST(240, GREATEST(15, (NEW.raw_user_meta_data->>'professional_session_duration_minutes')::INTEGER))
        ELSE 60
      END;

      SELECT COALESCE(array_agg(trim(value)), '{}'::text[])
      INTO _qualification_file_names
      FROM jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'professional_qualification_files', '[]'::jsonb)) AS value
      WHERE trim(value) <> '';

      SELECT p.id
      INTO _professional_id
      FROM public.professionals p
      WHERE p.user_id = NEW.id
      ORDER BY p.created_at ASC
      LIMIT 1;

      IF _professional_id IS NULL THEN
        INSERT INTO public.professionals (
          user_id,
          status,
          bio,
          category,
          tags,
          languages,
          years_experience,
          session_price_brl,
          session_duration_minutes,
          updated_at
        )
        VALUES (
          NEW.id,
          'pending_review',
          _headline,
          _category,
          COALESCE(_focus_areas, '{}'::text[]),
          COALESCE(_languages, ARRAY['Portugues']),
          _years_experience,
          _session_price_brl,
          _session_duration_minutes,
          NOW()
        )
        RETURNING id INTO _professional_id;
      ELSE
        UPDATE public.professionals
        SET
          status = 'pending_review',
          bio = COALESCE(_headline, bio),
          category = COALESCE(_category, category),
          tags = CASE
            WHEN COALESCE(array_length(_focus_areas, 1), 0) > 0 THEN _focus_areas
            ELSE tags
          END,
          languages = CASE
            WHEN COALESCE(array_length(_languages, 1), 0) > 0 THEN _languages
            ELSE languages
          END,
          years_experience = GREATEST(years_experience, _years_experience),
          session_price_brl = CASE WHEN _session_price_brl > 0 THEN _session_price_brl ELSE session_price_brl END,
          session_duration_minutes = COALESCE(_session_duration_minutes, session_duration_minutes),
          updated_at = NOW()
        WHERE id = _professional_id;
      END IF;

      INSERT INTO public.professional_applications (
        user_id,
        professional_id,
        title,
        display_name,
        headline,
        category,
        specialty_name,
        specialty_custom,
        specialty_validation_message,
        focus_areas,
        primary_language,
        secondary_languages,
        jurisdiction,
        years_experience,
        session_price_brl,
        session_duration_minutes,
        qualification_file_names,
        qualification_note,
        status,
        reviewed_by,
        reviewed_at,
        updated_at
      )
      VALUES (
        NEW.id,
        _professional_id,
        _title,
        _display_name,
        _headline,
        _category,
        _specialty_name,
        _specialty_custom,
        _specialty_message,
        COALESCE(_focus_areas, '{}'::text[]),
        _primary_language,
        COALESCE(_secondary_languages, '{}'::text[]),
        _jurisdiction,
        _years_experience,
        _session_price_brl,
        _session_duration_minutes,
        COALESCE(_qualification_file_names, '{}'::text[]),
        _qualification_note,
        'pending',
        NULL,
        NULL,
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE
      SET
        professional_id = EXCLUDED.professional_id,
        title = EXCLUDED.title,
        display_name = EXCLUDED.display_name,
        headline = EXCLUDED.headline,
        category = EXCLUDED.category,
        specialty_name = EXCLUDED.specialty_name,
        specialty_custom = EXCLUDED.specialty_custom,
        specialty_validation_message = EXCLUDED.specialty_validation_message,
        focus_areas = EXCLUDED.focus_areas,
        primary_language = EXCLUDED.primary_language,
        secondary_languages = EXCLUDED.secondary_languages,
        jurisdiction = EXCLUDED.jurisdiction,
        years_experience = EXCLUDED.years_experience,
        session_price_brl = EXCLUDED.session_price_brl,
        session_duration_minutes = EXCLUDED.session_duration_minutes,
        qualification_file_names = EXCLUDED.qualification_file_names,
        qualification_note = EXCLUDED.qualification_note,
        status = 'pending',
        reviewed_by = NULL,
        reviewed_at = NULL,
        updated_at = NOW();

      IF _specialty_custom AND _professional_id IS NOT NULL AND _specialty_name IS NOT NULL THEN
        _specialty_tag := CONCAT('Especialidade pendente: ', _specialty_name, COALESCE(CONCAT(' | Motivo: ', _specialty_message), ''));

        INSERT INTO public.tag_suggestions (professional_id, tag, status)
        SELECT _professional_id, _specialty_tag, 'pending'
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.tag_suggestions ts
          WHERE ts.professional_id = _professional_id
            AND ts.tag = _specialty_tag
            AND ts.status = 'pending'
        );
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'handle_new_user professional application setup warning for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- AUTO-RECALC PROFESSIONAL RATING
-- ============================================

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

CREATE OR REPLACE FUNCTION trigger_recalc_professional_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_professional_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_professional_id := OLD.professional_id;
  ELSE
    v_professional_id := NEW.professional_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.professional_id IS DISTINCT FROM NEW.professional_id THEN
    PERFORM recalc_professional_rating(OLD.professional_id);
    PERFORM recalc_professional_rating(NEW.professional_id);
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.is_visible = true THEN
    PERFORM recalc_professional_rating(v_professional_id);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_visible IS DISTINCT FROM NEW.is_visible
       OR OLD.rating IS DISTINCT FROM NEW.rating THEN
      PERFORM recalc_professional_rating(v_professional_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM recalc_professional_rating(v_professional_id);
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_professional_rating ON reviews;
CREATE TRIGGER trg_recalc_professional_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION trigger_recalc_professional_rating();

CREATE INDEX IF NOT EXISTS idx_reviews_professional_visible
ON reviews(professional_id, is_visible)
WHERE is_visible = true;

-- ============================================
-- CHAT / MESSAGING (Wave 4)
-- ============================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(booking_id);

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

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversation_participants_select ON conversation_participants;
CREATE POLICY conversation_participants_select ON conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT cp.conversation_id FROM conversation_participants cp
      WHERE cp.user_id = auth.uid()
    )
  );

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

CREATE OR REPLACE FUNCTION auto_create_conversation_on_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    INSERT INTO conversations (booking_id)
    VALUES (NEW.id)
    ON CONFLICT (booking_id) DO NOTHING;

    INSERT INTO conversation_participants (conversation_id, user_id, role)
    SELECT c.id, NEW.user_id, 'client'
    FROM conversations c
    WHERE c.booking_id = NEW.id
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

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

-- ============================================
-- PUSH NOTIFICATIONS (Wave 4)
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

-- ============================================
-- CLIENT RECORDS / CRM (Wave 4)
-- ============================================

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

ALTER TABLE client_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_records_professional_select ON client_records;
CREATE POLICY client_records_professional_select ON client_records
  FOR SELECT USING (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS client_records_professional_insert ON client_records;
CREATE POLICY client_records_professional_insert ON client_records
  FOR INSERT WITH CHECK (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS client_records_professional_update ON client_records;
CREATE POLICY client_records_professional_update ON client_records
  FOR UPDATE USING (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS client_records_professional_delete ON client_records;
CREATE POLICY client_records_professional_delete ON client_records
  FOR DELETE USING (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));

ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS session_notes_professional_select ON session_notes;
CREATE POLICY session_notes_professional_select ON session_notes
  FOR SELECT USING (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS session_notes_professional_insert ON session_notes;
CREATE POLICY session_notes_professional_insert ON session_notes
  FOR INSERT WITH CHECK (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS session_notes_professional_update ON session_notes;
CREATE POLICY session_notes_professional_update ON session_notes
  FOR UPDATE USING (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS session_notes_professional_delete ON session_notes;
CREATE POLICY session_notes_professional_delete ON session_notes
  FOR DELETE USING (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));

-- ============================================
-- CASE / DISPUTE SYSTEM (Wave 4)
-- ============================================

CREATE TYPE case_type AS ENUM ('cancelation_dispute', 'no_show_claim', 'quality_issue', 'refund_request');
CREATE TYPE case_status AS ENUM ('open', 'under_review', 'waiting_info', 'resolved', 'closed');

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

CREATE TABLE IF NOT EXISTS case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_messages_case ON case_messages(case_id);

CREATE TABLE IF NOT EXISTS case_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_actions_case ON case_actions(case_id);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cases_reporter_select ON cases;
CREATE POLICY cases_reporter_select ON cases
  FOR SELECT USING (reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS cases_reporter_insert ON cases;
CREATE POLICY cases_reporter_insert ON cases
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS case_messages_participant_select ON case_messages;
CREATE POLICY case_messages_participant_select ON case_messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM cases c WHERE c.id = case_messages.case_id AND (c.reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))));
DROP POLICY IF EXISTS case_messages_participant_insert ON case_messages;
CREATE POLICY case_messages_participant_insert ON case_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM cases c WHERE c.id = case_messages.case_id AND (c.reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))));

ALTER TABLE case_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS case_actions_admin_select ON case_actions;
CREATE POLICY case_actions_admin_select ON case_actions
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- MULTI-SERVICE BOOKING (Wave 4)
-- ============================================

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

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES professional_services(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id) WHERE service_id IS NOT NULL;

ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS professional_services_public_select ON professional_services;
CREATE POLICY professional_services_public_select ON professional_services
  FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS professional_services_owner_insert ON professional_services;
CREATE POLICY professional_services_owner_insert ON professional_services
  FOR INSERT WITH CHECK (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS professional_services_owner_update ON professional_services;
CREATE POLICY professional_services_owner_update ON professional_services
  FOR UPDATE USING (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));
DROP POLICY IF EXISTS professional_services_owner_delete ON professional_services;
CREATE POLICY professional_services_owner_delete ON professional_services
  FOR DELETE USING (professional_id IN (SELECT p.id FROM professionals p WHERE p.user_id = auth.uid()));
