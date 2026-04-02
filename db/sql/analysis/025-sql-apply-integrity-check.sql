-- ============================================
-- SQL apply integrity check (Wave 2/3 critical)
-- Run in Supabase SQL Editor after applying migrations.
-- ============================================

WITH checks AS (
  -- 013
  SELECT '013-first-booking-gate-column'::text AS check_name,
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'professionals'
             AND column_name = 'first_booking_enabled'
         ) AS ok
  UNION ALL
  -- 014
  SELECT '014-request-bookings-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'request_bookings'
         )
  UNION ALL
  -- 015
  SELECT '015-professional-services-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'professional_services'
         )
  UNION ALL
  SELECT '015-professional-settings-billing-card-column',
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'professional_settings'
             AND column_name = 'billing_card_on_file'
         )
  UNION ALL
  SELECT '015-professional-settings-payout-kyc-column',
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'professional_settings'
             AND column_name = 'payout_kyc_completed'
         )
  UNION ALL
  -- 016
  SELECT '016-professional-public-code-column',
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'professionals'
             AND column_name = 'public_code'
         )
  UNION ALL
  -- 017
  SELECT '017-professional-applications-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'professional_applications'
         )
  UNION ALL
  -- 018
  SELECT '018-real-professions-taxonomy-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'specialties'
         )
  UNION ALL
  -- 019
  SELECT '019-pgtrgm-function-search',
         EXISTS (
           SELECT 1
           FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public'
             AND p.proname = 'search_public_professionals_pgtrgm'
         )
  UNION ALL
  -- 020
  SELECT '020-index-bookings-professional-status',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'idx_bookings_professional_status'
         )
  UNION ALL
  SELECT '020-index-bookings-user-status',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'idx_bookings_user_status'
         )
  UNION ALL
  SELECT '020-index-availability-rules-professional-active',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'idx_availability_rules_professional_active'
         )
  UNION ALL
  SELECT '020-index-payments-booking-status',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'idx_payments_booking_status'
         )
  UNION ALL
  -- 021
  SELECT '021-atomic-slot-unique-index',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'bookings_unique_active_professional_start_idx'
         )
  UNION ALL
  -- 022
  SELECT '022-admin-audit-log-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'admin_audit_log'
         )
  UNION ALL
  SELECT '022-admin-audit-log-policy-select',
         EXISTS (
           SELECT 1
           FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename = 'admin_audit_log'
             AND policyname = 'admin_audit_log_select_admin_only'
         )
  UNION ALL
  -- 023
  SELECT '023-stripe-webhook-events-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'stripe_webhook_events'
         )
  UNION ALL
  SELECT '023-stripe-payment-retry-queue-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'stripe_payment_retry_queue'
         )
  UNION ALL
  SELECT '023-stripe-subscription-check-queue-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'stripe_subscription_check_queue'
         )
  UNION ALL
  SELECT '023-stripe-job-runs-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'stripe_job_runs'
         )
  UNION ALL
  -- 024 (this hardening)
  SELECT '024-payments-policy-insert-hardened',
         EXISTS (
           SELECT 1
           FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename = 'payments'
             AND policyname = 'System creates payments for booking owner'
         )
  UNION ALL
  SELECT '024-payments-policy-update-hardened',
         EXISTS (
           SELECT 1
           FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename = 'payments'
             AND policyname = 'Users and professionals update own payments'
         )
  UNION ALL
  SELECT '024-payments-update-guard-trigger',
         EXISTS (
           SELECT 1
           FROM pg_trigger t
           JOIN pg_class c ON c.oid = t.tgrelid
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public'
             AND c.relname = 'payments'
             AND t.tgname = 'trg_guard_payments_non_admin_update'
             AND t.tgisinternal = false
         )
),
summary AS (
  SELECT
    COUNT(*) AS total_checks,
    COUNT(*) FILTER (WHERE ok) AS passed_checks,
    COUNT(*) FILTER (WHERE NOT ok) AS failed_checks
  FROM checks
)
SELECT
  c.check_name,
  CASE WHEN c.ok THEN 'PASS' ELSE 'FAIL' END AS status
FROM checks c
ORDER BY c.check_name;

WITH checks AS (
  SELECT '013-first-booking-gate-column'::text AS check_name,
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'professionals'
             AND column_name = 'first_booking_enabled'
         ) AS ok
  UNION ALL SELECT '014-request-bookings-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'request_bookings'
         )
  UNION ALL SELECT '015-professional-services-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'professional_services'
         )
  UNION ALL SELECT '015-professional-settings-billing-card-column',
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'professional_settings'
             AND column_name = 'billing_card_on_file'
         )
  UNION ALL SELECT '015-professional-settings-payout-kyc-column',
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'professional_settings'
             AND column_name = 'payout_kyc_completed'
         )
  UNION ALL SELECT '016-professional-public-code-column',
         EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name = 'professionals'
             AND column_name = 'public_code'
         )
  UNION ALL SELECT '017-professional-applications-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'professional_applications'
         )
  UNION ALL SELECT '018-real-professions-taxonomy-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'specialties'
         )
  UNION ALL SELECT '019-pgtrgm-function-search',
         EXISTS (
           SELECT 1
           FROM pg_proc p
           JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public'
             AND p.proname = 'search_public_professionals_pgtrgm'
         )
  UNION ALL SELECT '020-index-bookings-professional-status',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'idx_bookings_professional_status'
         )
  UNION ALL SELECT '020-index-bookings-user-status',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'idx_bookings_user_status'
         )
  UNION ALL SELECT '020-index-availability-rules-professional-active',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'idx_availability_rules_professional_active'
         )
  UNION ALL SELECT '020-index-payments-booking-status',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'idx_payments_booking_status'
         )
  UNION ALL SELECT '021-atomic-slot-unique-index',
         EXISTS (
           SELECT 1
           FROM pg_indexes
           WHERE schemaname = 'public'
             AND indexname = 'bookings_unique_active_professional_start_idx'
         )
  UNION ALL SELECT '022-admin-audit-log-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'admin_audit_log'
         )
  UNION ALL SELECT '022-admin-audit-log-policy-select',
         EXISTS (
           SELECT 1
           FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename = 'admin_audit_log'
             AND policyname = 'admin_audit_log_select_admin_only'
         )
  UNION ALL SELECT '023-stripe-webhook-events-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'stripe_webhook_events'
         )
  UNION ALL SELECT '023-stripe-payment-retry-queue-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'stripe_payment_retry_queue'
         )
  UNION ALL SELECT '023-stripe-subscription-check-queue-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'stripe_subscription_check_queue'
         )
  UNION ALL SELECT '023-stripe-job-runs-table',
         EXISTS (
           SELECT 1
           FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'stripe_job_runs'
         )
  UNION ALL SELECT '024-payments-policy-insert-hardened',
         EXISTS (
           SELECT 1
           FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename = 'payments'
             AND policyname = 'System creates payments for booking owner'
         )
  UNION ALL SELECT '024-payments-policy-update-hardened',
         EXISTS (
           SELECT 1
           FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename = 'payments'
             AND policyname = 'Users and professionals update own payments'
         )
  UNION ALL SELECT '024-payments-update-guard-trigger',
         EXISTS (
           SELECT 1
           FROM pg_trigger t
           JOIN pg_class c ON c.oid = t.tgrelid
           JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public'
             AND c.relname = 'payments'
             AND t.tgname = 'trg_guard_payments_non_admin_update'
             AND t.tgisinternal = false
         )
)
SELECT
  COUNT(*) AS total_checks,
  COUNT(*) FILTER (WHERE ok) AS passed_checks,
  COUNT(*) FILTER (WHERE NOT ok) AS failed_checks
FROM checks;

-- Useful detail query when any row above is FAIL:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename IN ('payments', 'admin_audit_log');
-- SELECT schemaname, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname;
