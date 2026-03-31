-- ============================================
-- Professional public profile code foundation
-- Scope:
-- - Add 4-digit public code for professional profile URLs (name-1234)
-- - Backfill existing professionals with unique codes
-- - Auto-assign code on insert
-- ============================================

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS public_code INTEGER;

DO $$
DECLARE
  total_professionals INTEGER;
  total_with_code INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_professionals FROM public.professionals;
  SELECT COUNT(*) INTO total_with_code
  FROM public.professionals
  WHERE public_code BETWEEN 1000 AND 9999;

  IF total_professionals > 9000 THEN
    RAISE EXCEPTION
      'Cannot assign unique 4-digit public_code: professionals=% exceeds capacity=9000',
      total_professionals;
  END IF;

  WITH to_assign AS (
    SELECT
      p.id,
      (999 + ROW_NUMBER() OVER (ORDER BY p.created_at, p.id))::INTEGER AS generated_code
    FROM public.professionals p
    WHERE p.public_code IS NULL
  )
  UPDATE public.professionals p
  SET public_code = to_assign.generated_code
  FROM to_assign
  WHERE p.id = to_assign.id;
END $$;

ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_public_code_range;

ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_public_code_range
  CHECK (public_code BETWEEN 1000 AND 9999);

CREATE UNIQUE INDEX IF NOT EXISTS professionals_public_code_unique_idx
  ON public.professionals(public_code);

ALTER TABLE public.professionals
  ALTER COLUMN public_code SET NOT NULL;

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
