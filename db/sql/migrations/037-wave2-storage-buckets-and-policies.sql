-- ============================================
-- 037 - Storage buckets and minimum RLS policies for professional media
-- ============================================

BEGIN;

-- Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'professional-profile-media',
    'professional-profile-media',
    true,
    3145728,
    ARRAY['image/jpeg','image/png','image/webp']::text[]
  ),
  (
    'professional-credentials',
    'professional-credentials',
    true,
    2097152,
    ARRAY['application/pdf','image/jpeg','image/png']::text[]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Cleanup previous policy names if present
DROP POLICY IF EXISTS "Profile media is public" ON storage.objects;
DROP POLICY IF EXISTS "Profile media upload by owner" ON storage.objects;
DROP POLICY IF EXISTS "Profile media update by owner" ON storage.objects;
DROP POLICY IF EXISTS "Profile media delete by owner" ON storage.objects;

DROP POLICY IF EXISTS "Credentials read by owner or admin" ON storage.objects;
DROP POLICY IF EXISTS "Credentials upload by owner or admin" ON storage.objects;
DROP POLICY IF EXISTS "Credentials update by owner or admin" ON storage.objects;
DROP POLICY IF EXISTS "Credentials delete by owner or admin" ON storage.objects;

-- Public profile media read (needed by public professional page)
CREATE POLICY "Profile media is public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'professional-profile-media');

-- Profile media write restricted to authenticated owner path: {professional_id}/...
CREATE POLICY "Profile media upload by owner"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-profile-media'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = ((storage.foldername(name))[1])::uuid
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Profile media update by owner"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'professional-profile-media'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = ((storage.foldername(name))[1])::uuid
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'professional-profile-media'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = ((storage.foldername(name))[1])::uuid
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Profile media delete by owner"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-profile-media'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND EXISTS (
    SELECT 1
    FROM public.professionals p
    WHERE p.id = ((storage.foldername(name))[1])::uuid
      AND p.user_id = auth.uid()
  )
);

-- Credentials read/write only by owner professional or admin
CREATE POLICY "Credentials read by owner or admin"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'professional-credentials'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  )
);

CREATE POLICY "Credentials upload by owner or admin"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'professional-credentials'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  )
);

CREATE POLICY "Credentials update by owner or admin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'professional-credentials'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'professional-credentials'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  )
);

CREATE POLICY "Credentials delete by owner or admin"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'professional-credentials'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
  AND (
    EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role = 'admin'
    )
  )
);

COMMIT;

