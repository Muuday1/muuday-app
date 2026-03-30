-- ============================================
-- Wave 0 safety patch: Auth signup trigger hardening
-- Purpose:
-- 1) Prevent production signup failures caused by trigger/role drift.
-- 2) Normalize legacy role inputs to canonical values.
-- 3) Keep profile creation idempotent and resilient.
-- ============================================

-- 1) Normalize existing legacy role values before re-adding strict constraint.
UPDATE public.profiles
SET role = CASE
  WHEN lower(role) IN ('user', 'cliente', 'client', 'customer') THEN 'usuario'
  WHEN lower(role) IN ('professional', 'provider') THEN 'profissional'
  ELSE role
END
WHERE lower(role) IN (
  'user',
  'cliente',
  'client',
  'customer',
  'professional',
  'provider'
);

-- 2) Drop existing role-related check constraints safely, then re-add canonical.
DO $$
DECLARE
  _constraint RECORD;
BEGIN
  FOR _constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', _constraint.conname);
  END LOOP;
END
$$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('usuario', 'profissional', 'admin'));

-- 3) Recreate trigger function with role normalization + upsert fallback.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _raw_role text;
  _role text;
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
