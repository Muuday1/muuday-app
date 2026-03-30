-- ============================================
-- Wave 1: Taxonomy governance + professional tiers
-- ============================================

-- 0) Ensure base taxonomy tables exist for clean environments
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_pt text NOT NULL,
  name_en text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_pt text NOT NULL,
  name_en text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- 1) Add specialties table
CREATE TABLE IF NOT EXISTS specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id uuid NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name_pt text NOT NULL,
  name_en text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(subcategory_id, slug)
);

ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Specialties are publicly readable" ON specialties;
CREATE POLICY "Specialties are publicly readable"
  ON specialties FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage specialties" ON specialties;
CREATE POLICY "Only admins can manage specialties"
  ON specialties FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2) Professional-specialties junction
CREATE TABLE IF NOT EXISTS professional_specialties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  specialty_id uuid NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(professional_id, specialty_id)
);

ALTER TABLE professional_specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professional specialties are publicly readable" ON professional_specialties;
CREATE POLICY "Professional specialties are publicly readable"
  ON professional_specialties FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Professionals can manage own specialties" ON professional_specialties;
CREATE POLICY "Professionals can manage own specialties"
  ON professional_specialties FOR ALL
  USING (
    EXISTS (SELECT 1 FROM professionals WHERE id = professional_id AND user_id = auth.uid())
  );

-- 3) Add tier column to professionals (default 'basic')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'professionals' AND column_name = 'tier'
  ) THEN
    ALTER TABLE professionals ADD COLUMN tier text NOT NULL DEFAULT 'basic'
      CHECK (tier IN ('basic', 'professional', 'premium'));
  END IF;
END $$;

-- 4) Add category_id FK to professionals (nullable during migration, will coexist with text category)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'professionals' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE professionals ADD COLUMN category_id uuid REFERENCES categories(id);
  END IF;
END $$;

-- 5) RLS for subcategories (make publicly readable)
DROP POLICY IF EXISTS "Subcategories are publicly readable" ON subcategories;
CREATE POLICY "Subcategories are publicly readable"
  ON subcategories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage subcategories" ON subcategories;
CREATE POLICY "Only admins can manage subcategories"
  ON subcategories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6) RLS for categories (make publicly readable)
DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage categories" ON categories;
CREATE POLICY "Only admins can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7) Tag suggestions table for moderation
CREATE TABLE IF NOT EXISTS tag_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  tag text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tag_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Professionals can view own tag suggestions" ON tag_suggestions;
CREATE POLICY "Professionals can view own tag suggestions"
  ON tag_suggestions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM professionals WHERE id = professional_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Professionals can create tag suggestions" ON tag_suggestions;
CREATE POLICY "Professionals can create tag suggestions"
  ON tag_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM professionals WHERE id = professional_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Only admins can update tag suggestions" ON tag_suggestions;
CREATE POLICY "Only admins can update tag suggestions"
  ON tag_suggestions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
