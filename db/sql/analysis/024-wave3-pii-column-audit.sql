-- Wave 3 preflight: financial PII and encryption readiness audit
-- Run in Supabase SQL editor (read-only checks).
-- Goal: detect forbidden card fields, map payout-sensitive columns, and verify crypto extensions.

-- 1) Forbidden card-data columns (must always return 0 rows).
-- Never store PAN, CVC/CVV, expiry, or similar raw card fields.
SELECT
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (
    lower(regexp_replace(c.column_name, '[^a-z0-9]', '', 'g')) IN (
      'cardnumber',
      'pan',
      'cvc',
      'cvv',
      'securitycode',
      'expmonth',
      'expyear',
      'expiry',
      'expirationdate'
    )
    OR c.column_name ILIKE '%card_number%'
    OR c.column_name ILIKE '%cvv%'
    OR c.column_name ILIKE '%cvc%'
    OR c.column_name ILIKE '%exp_month%'
    OR c.column_name ILIKE '%exp_year%'
  )
ORDER BY c.table_name, c.column_name;

-- 2) Candidate payout-sensitive columns (manual review list).
-- If locally stored, these should be encrypted or moved to Stripe-only references.
SELECT
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (
    c.column_name ILIKE '%iban%'
    OR c.column_name ILIKE '%routing%'
    OR c.column_name ILIKE '%bank%'
    OR c.column_name ILIKE '%account_number%'
    OR c.column_name ILIKE '%beneficiary%'
    OR c.column_name ILIKE '%tax_id%'
    OR c.column_name ILIKE '%document_number%'
  )
ORDER BY c.table_name, c.column_name;

-- 3) Extension readiness check for encryption posture.
-- Expectation for Wave 3 local encryption path: pgcrypto available, and Vault available when adopted.
SELECT
  extname AS extension_name,
  extversion AS extension_version
FROM pg_extension
WHERE extname IN ('pgcrypto', 'vault')
ORDER BY extname;

-- 4) RLS status for finance/payout-like tables.
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
  AND (
    c.relname ILIKE '%payment%'
    OR c.relname ILIKE '%payout%'
    OR c.relname ILIKE '%ledger%'
    OR c.relname ILIKE '%billing%'
    OR c.relname ILIKE '%refund%'
    OR c.relname ILIKE '%dispute%'
  )
ORDER BY c.relname;

-- 5) Existing Stripe reference columns (informational; expected safe identifiers only).
SELECT
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND (
    c.column_name ILIKE 'stripe_%'
    OR c.column_name ILIKE '%_stripe_%'
  )
ORDER BY c.table_name, c.column_name;
