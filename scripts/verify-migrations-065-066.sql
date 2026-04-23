-- ============================================================
-- VERIFICAÇÃO: Migrations 065 + 066 aplicadas corretamente
-- Rode isso no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Verifica se a tabela search_sessions existe com todas as colunas
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'search_sessions'
ORDER BY ordinal_position;

-- 2. Verifica se os índices existem
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'search_sessions';

-- 3. Verifica se RLS está habilitado e quais policies existem
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'search_sessions';

-- 4. Verifica se as colunas da migration 066 existem em professionals
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'professionals'
  AND column_name IN ('stripe_account_id', 'stripe_account_status');

-- 5. Verifica índices da migration 066
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'professionals'
  AND indexname LIKE '%stripe%';

-- ============================================================
-- RESULTADO ESPERADO:
--
-- search_sessions deve ter 10 colunas:
--   id, user_id, query, filters, result_count, searched_at,
--   converted_at, converted_booking_id, abandoned_event_emitted_at, created_at
--
-- Índices em search_sessions:
--   idx_search_sessions_abandoned_scan (partial)
--   idx_search_sessions_user_recent
--
-- Policies em search_sessions (3):
--   Users can read own search sessions       → SELECT
--   Users can insert own search sessions     → INSERT
--   Service role can manage all search sessions → ALL (service_role)
--
-- professionals deve ter 2 colunas novas:
--   stripe_account_id (text, nullable)
--   stripe_account_status (text, default 'none')
--
-- Índices em professionals (2):
--   idx_professionals_stripe_account_enabled (partial, stripe_account_status='enabled')
--   idx_professionals_stripe_account_id (partial, stripe_account_id IS NOT NULL)
-- ============================================================
