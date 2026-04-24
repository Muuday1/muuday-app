-- ============================================
-- SPRINT 1: Market Isolation & Mobile Prep
-- ============================================
-- Migration: 066
-- Date: 2026-04-23
-- Purpose:
--   1. Add market_code to professionals for market isolation
--   2. Add language to profiles for user language preference
--   3. Add name_es to taxonomy tables for Mexico prep
--   4. Add session_price + session_price_currency to professionals for multi-currency
--   5. Add client_market_code to reviews for market-isolated reviews
--   6. Backfill existing data with BR defaults
-- ============================================

-- 1. professionals.market_code
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS market_code TEXT NOT NULL DEFAULT 'BR';

CREATE INDEX IF NOT EXISTS idx_professionals_market_code ON professionals(market_code);

-- Backfill (safety net: all existing professionals are Brazilian)
UPDATE professionals SET market_code = 'BR' WHERE market_code IS NULL OR market_code = '';

-- 2. profiles.language
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'pt-BR';

-- Backfill
UPDATE profiles SET language = 'pt-BR' WHERE language IS NULL OR language = '';

-- 3. Taxonomy: name_es for Mexico content prep
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS name_es TEXT;

ALTER TABLE subcategories
ADD COLUMN IF NOT EXISTS name_es TEXT;

ALTER TABLE specialties
ADD COLUMN IF NOT EXISTS name_es TEXT;

-- 4. professionals.session_price (generic, cents) + session_price_currency
-- Note: session_price_brl remains for backward compatibility during migration.
-- Future migration will backfill session_price from session_price_brl.
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS session_price INTEGER NOT NULL DEFAULT 0;

ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS session_price_currency TEXT NOT NULL DEFAULT 'BRL';

-- Backfill session_price from session_price_brl (convert decimal to cents)
UPDATE professionals
SET session_price = ROUND(session_price_brl * 100)::INTEGER,
    session_price_currency = 'BRL'
WHERE session_price = 0 AND session_price_brl > 0;

-- 5. reviews.client_market_code
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS client_market_code TEXT;

CREATE INDEX IF NOT EXISTS idx_reviews_client_market_code ON reviews(client_market_code);

-- Backfill reviews with client's market (from profiles.country = 'BR')
UPDATE reviews
SET client_market_code = 'BR'
WHERE client_market_code IS NULL;

-- 6. Also add market_code to professional_applications for consistency
ALTER TABLE professional_applications
ADD COLUMN IF NOT EXISTS market_code TEXT NOT NULL DEFAULT 'BR';

UPDATE professional_applications SET market_code = 'BR' WHERE market_code IS NULL OR market_code = '';

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify counts
SELECT
  (SELECT COUNT(*) FROM professionals WHERE market_code = 'BR') as professionals_with_br,
  (SELECT COUNT(*) FROM profiles WHERE language = 'pt-BR') as profiles_with_pt_br,
  (SELECT COUNT(*) FROM professionals WHERE session_price_currency = 'BRL') as professionals_with_brl_currency,
  (SELECT COUNT(*) FROM reviews WHERE client_market_code = 'BR') as reviews_with_br_market;
