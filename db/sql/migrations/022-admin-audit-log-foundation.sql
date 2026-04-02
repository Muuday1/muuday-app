-- Wave 3 compliance foundation: admin audit trail
-- Creates immutable audit log for privileged admin mutations.

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON public.admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target
  ON public.admin_audit_log(target_table, target_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user
  ON public.admin_audit_log(admin_user_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_audit_log'
      AND policyname = 'admin_audit_log_select_admin_only'
  ) THEN
    CREATE POLICY admin_audit_log_select_admin_only
      ON public.admin_audit_log
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_audit_log'
      AND policyname = 'admin_audit_log_insert_admin_only'
  ) THEN
    CREATE POLICY admin_audit_log_insert_admin_only
      ON public.admin_audit_log
      FOR INSERT
      TO authenticated
      WITH CHECK (
        admin_user_id = auth.uid()
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
      );
  END IF;
END
$$;

COMMENT ON TABLE public.admin_audit_log IS
  'Compliance audit trail for admin privileged mutations.';
