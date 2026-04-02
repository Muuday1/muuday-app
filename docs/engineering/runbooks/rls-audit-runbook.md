# RLS Audit Runbook

Last updated: 2026-04-01

## Objective

Validate that user-data tables are protected by Row Level Security (RLS) and that direct API access cannot leak cross-user data.

Critical scope:

1. `bookings`
2. `payments`
3. `messages` (if table exists)
4. `reviews`

## Step 1 — Inventory in Supabase SQL Editor

Run:

- `db/sql/analysis/022-rls-audit-inventory.sql`

Capture:

1. Which tables exist.
2. `rls_enabled` for each user-data table.
3. Policy count by table.
4. Any risky permissive policy in critical tables.
5. Any table with user-ish foreign keys and RLS OFF.

## Step 2 — Cross-user SQL isolation test

Run:

- `db/sql/analysis/023-rls-cross-user-isolation.sql`

Before running, replace UUID placeholders in the file:

1. `user_a`
2. `user_b`
3. `sample_booking_id`
4. `sample_payment_id`
5. `sample_hidden_review_id`
6. `sample_message_id` (only if `messages` exists)

Expected:

- Script ends with success `NOTICE`.
- Any leakage raises `EXCEPTION` and fails immediately.

## Step 3 — Direct API audit (anon key path)

Run:

```bash
npm run audit:rls:api
```

Script:

- `scripts/ops/audit-rls-direct-api.cjs`

Required env:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `RLS_A_EMAIL` + `RLS_A_PASSWORD` (or fallback `E2E_USER_*`)
4. `RLS_B_EMAIL` + `RLS_B_PASSWORD` (or fallback `E2E_PROFESSIONAL_*`)

Optional env for deterministic run when auto-discovery has no sample rows:

1. `RLS_SAMPLE_BOOKING_ID`
2. `RLS_SAMPLE_PAYMENT_ID`
3. `RLS_SAMPLE_HIDDEN_REVIEW_ID`
4. `RLS_SAMPLE_MESSAGE_ID`

Expected:

1. Owner can read own row.
2. Cross-user read by direct `id` returns no rows / blocked.
3. Any leak exits with code `1`.

## Acceptance Criteria

RLS audit is considered complete only when:

1. Inventory output shows all existing user-data tables with RLS enabled.
2. Cross-user SQL test passes.
3. Direct API script passes with at least one executed check for each applicable critical table.
4. Evidence (query output + command output) is attached to handover.
