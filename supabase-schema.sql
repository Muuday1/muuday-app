-- ============================================
-- MUUDAY DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'usuario' CHECK (role IN ('usuario', 'profissional', 'admin')),
  country TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  currency TEXT DEFAULT 'BRL',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Professionals
CREATE TABLE professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending_review','approved','rejected','suspended')),
  bio TEXT,
  category TEXT NOT NULL,
  subcategories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT ARRAY['Português'],
  years_experience INTEGER DEFAULT 0,
  session_price_brl DECIMAL(10,2) NOT NULL DEFAULT 0,
  session_duration_minutes INTEGER DEFAULT 60,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability (weekly schedule)
CREATE TABLE availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Bookings
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  professional_id UUID REFERENCES professionals(id) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  session_link TEXT,
  price_brl DECIMAL(10,2) NOT NULL,
  price_user_currency DECIMAL(10,2),
  user_currency TEXT DEFAULT 'BRL',
  notes TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  professional_id UUID REFERENCES professionals(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT FALSE, -- Admin approves
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, only update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Professionals: approved ones are public
CREATE POLICY "Approved professionals are viewable" ON professionals FOR SELECT USING (status = 'approved' OR user_id = auth.uid());
CREATE POLICY "Professionals can update own profile" ON professionals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Professionals can insert own profile" ON professionals FOR INSERT WITH CHECK (user_id = auth.uid());

-- Availability: public read for approved professionals
CREATE POLICY "Availability is viewable" ON availability FOR SELECT USING (true);
CREATE POLICY "Professionals manage own availability" ON availability FOR ALL USING (
  professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
);

-- Bookings: users see own bookings, professionals see their bookings
CREATE POLICY "Users see own bookings" ON bookings FOR SELECT USING (
  user_id = auth.uid() OR
  professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (user_id = auth.uid());

-- Reviews: visible approved ones are public
CREATE POLICY "Visible reviews are public" ON reviews FOR SELECT USING (is_visible = true OR user_id = auth.uid());
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, country, timezone, currency)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'usuario'),
    NEW.raw_user_meta_data->>'country',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Sao_Paulo'),
    COALESCE(NEW.raw_user_meta_data->>'currency', 'BRL')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
