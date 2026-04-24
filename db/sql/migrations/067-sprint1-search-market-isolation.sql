-- ============================================
-- SPRINT 1: Search Market Isolation
-- ============================================
-- Migration: 067
-- Date: 2026-04-23
-- Purpose:
--   Update search_public_professionals_pgtrgm to accept p_market
--   and filter professionals by market_code.
-- ============================================

CREATE OR REPLACE FUNCTION public.search_public_professionals_pgtrgm(
  p_query text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_specialty text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_min_price_brl numeric DEFAULT NULL,
  p_max_price_brl numeric DEFAULT NULL,
  p_limit integer DEFAULT 600,
  p_market text DEFAULT NULL
)
RETURNS TABLE (
  professional_id uuid,
  text_rank real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH normalized AS (
    SELECT
      NULLIF(TRIM(LOWER(COALESCE(p_query, ''))), '') AS q,
      NULLIF(TRIM(LOWER(COALESCE(p_category, ''))), '') AS category,
      NULLIF(TRIM(LOWER(COALESCE(p_specialty, ''))), '') AS specialty,
      NULLIF(TRIM(LOWER(COALESCE(p_language, ''))), '') AS language,
      NULLIF(TRIM(LOWER(COALESCE(p_location, ''))), '') AS location,
      NULLIF(TRIM(UPPER(COALESCE(p_market, ''))), '') AS market
  )
  SELECT
    p.id AS professional_id,
    CASE
      WHEN n.q IS NULL THEN 0::real
      ELSE GREATEST(
        similarity(LOWER(COALESCE(pr.full_name, '')), n.q),
        similarity(LOWER(COALESCE(p.bio, '')), n.q),
        similarity(LOWER(COALESCE(p.category, '')), n.q),
        similarity(LOWER(public.search_text_from_array(p.tags)), n.q),
        similarity(LOWER(public.search_text_from_array(p.subcategories)), n.q),
        COALESCE((
          SELECT MAX(similarity(LOWER(COALESCE(s.name_pt, '')), n.q))
          FROM public.professional_specialties ps
          JOIN public.specialties s ON s.id = ps.specialty_id
          WHERE ps.professional_id = p.id
            AND s.is_active = true
        ), 0::real)
      )::real
    END AS text_rank
  FROM public.professionals p
  JOIN public.profiles pr ON pr.id = p.user_id
  CROSS JOIN normalized n
  WHERE p.status = 'approved'
    AND pr.role = 'profissional'
    -- Market isolation: if p_market is provided, filter by it.
    -- If NULL, show all (backward compatible for old callers).
    AND (n.market IS NULL OR p.market_code = n.market)
    AND (n.category IS NULL OR LOWER(COALESCE(p.category, '')) = n.category)
    AND (p_min_price_brl IS NULL OR COALESCE(p.session_price_brl, 0) >= p_min_price_brl)
    AND (p_max_price_brl IS NULL OR COALESCE(p.session_price_brl, 0) <= p_max_price_brl)
    AND (
      n.language IS NULL
      OR EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.languages, ARRAY[]::text[])) AS lang(value)
        WHERE LOWER(lang.value) = n.language
      )
    )
    AND (
      n.location IS NULL
      OR LOWER(COALESCE(pr.country, '')) ILIKE ('%' || n.location || '%')
      OR LOWER(COALESCE(p.bio, '')) ILIKE ('%' || n.location || '%')
    )
    AND (
      n.specialty IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.professional_specialties ps
        JOIN public.specialties s ON s.id = ps.specialty_id
        WHERE ps.professional_id = p.id
          AND s.is_active = true
          AND LOWER(COALESCE(s.name_pt, '')) = n.specialty
      )
    )
    AND (
      n.q IS NULL
      OR LOWER(COALESCE(pr.full_name, '')) ILIKE ('%' || n.q || '%')
      OR LOWER(COALESCE(p.bio, '')) ILIKE ('%' || n.q || '%')
      OR LOWER(COALESCE(p.category, '')) ILIKE ('%' || n.q || '%')
      OR LOWER(public.search_text_from_array(p.tags)) ILIKE ('%' || n.q || '%')
      OR LOWER(public.search_text_from_array(p.subcategories)) ILIKE ('%' || n.q || '%')
      OR EXISTS (
        SELECT 1
        FROM public.professional_specialties ps
        JOIN public.specialties s ON s.id = ps.specialty_id
        WHERE ps.professional_id = p.id
          AND s.is_active = true
          AND LOWER(COALESCE(s.name_pt, '')) ILIKE ('%' || n.q || '%')
      )
    )
  ORDER BY
    text_rank DESC,
    COALESCE(p.rating, 0) DESC,
    COALESCE(p.total_reviews, 0) DESC,
    p.id
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 600), 2000));
$$;

-- Update permissions to reflect the new signature
REVOKE ALL ON FUNCTION public.search_public_professionals_pgtrgm(text, text, text, text, text, numeric, numeric, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.search_public_professionals_pgtrgm(text, text, text, text, text, numeric, numeric, integer, text) TO anon, authenticated, service_role;
