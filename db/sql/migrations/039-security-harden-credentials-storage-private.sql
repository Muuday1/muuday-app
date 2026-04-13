-- ============================================
-- 039 - Security hardening: credentials bucket must be private
-- ============================================

BEGIN;

UPDATE storage.buckets
SET public = false
WHERE id = 'professional-credentials';

COMMIT;
