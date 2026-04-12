-- ============================================
-- Wave 2 signup step-3 structured metadata support
-- ============================================

BEGIN;

ALTER TABLE IF EXISTS public.professional_applications
  ADD COLUMN IF NOT EXISTS taxonomy_suggestions JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_audiences TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS qualifications_structured JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS other_languages TEXT[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE IF EXISTS public.professional_credentials
  ADD COLUMN IF NOT EXISTS scan_status TEXT NOT NULL DEFAULT 'pending_scan',
  ADD COLUMN IF NOT EXISTS scan_checked_at TIMESTAMPTZ NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'professional_credentials_scan_status_check'
      AND conrelid = 'public.professional_credentials'::regclass
  ) THEN
    ALTER TABLE public.professional_credentials
      ADD CONSTRAINT professional_credentials_scan_status_check
      CHECK (scan_status IN ('pending_scan', 'clean', 'rejected'));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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
  _other_languages TEXT[];
  _target_audiences TEXT[];
  _taxonomy_suggestions JSONB;
  _qualifications_structured JSONB;
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

      SELECT COALESCE(array_agg(trim(value)), '{}'::text[])
      INTO _other_languages
      FROM jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'professional_other_languages', '[]'::jsonb)) AS value
      WHERE trim(value) <> '';

      SELECT COALESCE(array_agg(trim(value)), '{}'::text[])
      INTO _target_audiences
      FROM jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'professional_target_audiences', '[]'::jsonb)) AS value
      WHERE trim(value) <> '';

      BEGIN
        _taxonomy_suggestions := COALESCE((NEW.raw_user_meta_data->>'professional_taxonomy_suggestions')::jsonb, '{}'::jsonb);
      EXCEPTION WHEN OTHERS THEN
        _taxonomy_suggestions := COALESCE(NEW.raw_user_meta_data->'professional_taxonomy_suggestions', '{}'::jsonb);
      END;

      BEGIN
        _qualifications_structured := COALESCE((NEW.raw_user_meta_data->>'professional_qualifications_structured')::jsonb, '[]'::jsonb);
      EXCEPTION WHEN OTHERS THEN
        _qualifications_structured := COALESCE(NEW.raw_user_meta_data->'professional_qualifications_structured', '[]'::jsonb);
      END;

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
        years_experience,
        session_price_brl,
        session_duration_minutes,
        qualification_file_names,
        qualification_note,
        taxonomy_suggestions,
        target_audiences,
        qualifications_structured,
        other_languages,
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
        _years_experience,
        _session_price_brl,
        _session_duration_minutes,
        COALESCE(_qualification_file_names, '{}'::text[]),
        _qualification_note,
        COALESCE(_taxonomy_suggestions, '{}'::jsonb),
        COALESCE(_target_audiences, '{}'::text[]),
        COALESCE(_qualifications_structured, '[]'::jsonb),
        COALESCE(_other_languages, '{}'::text[]),
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
        years_experience = EXCLUDED.years_experience,
        session_price_brl = EXCLUDED.session_price_brl,
        session_duration_minutes = EXCLUDED.session_duration_minutes,
        qualification_file_names = EXCLUDED.qualification_file_names,
        qualification_note = EXCLUDED.qualification_note,
        taxonomy_suggestions = EXCLUDED.taxonomy_suggestions,
        target_audiences = EXCLUDED.target_audiences,
        qualifications_structured = EXCLUDED.qualifications_structured,
        other_languages = EXCLUDED.other_languages,
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

COMMIT;
