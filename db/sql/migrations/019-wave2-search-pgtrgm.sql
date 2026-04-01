-- Wave 2 search scalability baseline
-- Decision: Postgres-first search (pg_trgm + GIN) now, Typesense after scale trigger (> 2k professionals)

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- Helper function to keep array text-index expressions immutable
CREATE OR REPLACE FUNCTION public.search_text_from_array(input text[])
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(array_to_string(input, ' '), '')
$$;

-- Core text indexes for search paths
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
  ON public.profiles USING gin (lower(COALESCE(full_name, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_country_trgm
  ON public.profiles USING gin (lower(COALESCE(country, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_professionals_bio_trgm
  ON public.professionals USING gin (lower(COALESCE(bio, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_professionals_category_trgm
  ON public.professionals USING gin (lower(COALESCE(category, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_professionals_tags_text_trgm
  ON public.professionals USING gin (lower(public.search_text_from_array(tags)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_professionals_subcategories_text_trgm
  ON public.professionals USING gin (lower(public.search_text_from_array(subcategories)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_specialties_name_pt_trgm
  ON public.specialties USING gin (lower(COALESCE(name_pt, '')) gin_trgm_ops);

-- Filter acceleration indexes
CREATE INDEX IF NOT EXISTS idx_professionals_status_category_price
  ON public.professionals (status, category, session_price_brl);

CREATE INDEX IF NOT EXISTS idx_professionals_languages_gin
  ON public.professionals USING gin (languages);

CREATE INDEX IF NOT EXISTS idx_professional_specialties_professional_id
  ON public.professional_specialties (professional_id);

CREATE OR REPLACE FUNCTION public.search_public_professionals_pgtrgm(
  p_query text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_specialty text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_min_price_brl numeric DEFAULT NULL,
  p_max_price_brl numeric DEFAULT NULL,
  p_limit integer DEFAULT 600
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
      NULLIF(TRIM(LOWER(COALESCE(p_location, ''))), '') AS location
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

REVOKE ALL ON FUNCTION public.search_public_professionals_pgtrgm(text, text, text, text, text, numeric, numeric, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.search_public_professionals_pgtrgm(text, text, text, text, text, numeric, numeric, integer) TO anon, authenticated, service_role;
