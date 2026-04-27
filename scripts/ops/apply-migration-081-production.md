# Runbook: Apply Migration 081 to Production

> **Migration:** `081-professional-subscriptions.sql`  
> **Target:** Production Supabase (`jbbnbbrroifghrshplsq`)  
> **Risk:** Low — additive-only (new table, indexes, RLS policy). No existing data modified.  
> **Estimated downtime:** Zero (CREATE TABLE IF NOT EXISTS is safe under concurrent load).

---

## Prerequisites

- [ ] Supabase project dashboard access (owner or admin role)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` available (for API method)
- [ ] Production deploy is **not** actively running a high-traffic event
- [ ] Migration 081 file reviewed: `db/sql/migrations/081-professional-subscriptions.sql`

---

## Method A: Supabase SQL Editor (Recommended — Manual)

**Best for:** Immediate, visual confirmation. No local tooling required.

### Step 1 — Open SQL Editor

1. Navigate to: https://supabase.com/dashboard/project/jbbnbbrroifghrshplsq/sql/new
2. Ensure you are in the **production** project (check URL / project name).

### Step 2 — Paste Migration

1. Open `db/sql/migrations/081-professional-subscriptions.sql` locally.
2. Copy the **entire** file contents.
3. Paste into the SQL Editor query pane.

### Step 3 — Run

1. Click **Run**.
2. Verify green checkmark in the output panel.
3. Expected output:
   ```
   Success. No rows returned
   ```
   (or similar — `CREATE TABLE IF NOT EXISTS` returns no rows on idempotent re-run)

### Step 4 — Verify

Run this verification query in the SQL Editor:

```sql
SELECT
  EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'professional_subscriptions'
  ) AS table_exists,
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'professional_subscriptions'
      AND indexname = 'idx_professional_subscriptions_professional'
  ) AS unique_index_exists,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'professional_subscriptions'
      AND policyname = 'Admins can read professional subscriptions'
  ) AS rls_policy_exists;
```

**Expected result:** all three columns = `true`.

---

## Method B: Supabase Management API (Scripted)

**Best for:** CI/automation or if you prefer a curl-based workflow.

### Step 1 — Set environment

```bash
# Windows PowerShell
$env:SUPABASE_PROJECT_REF="jbbnbbrroifghrshplsq"
$env:SUPABASE_SERVICE_ROLE_KEY="<paste-key-here>"
```

### Step 2 — Execute via API

```powershell
# Read the SQL file
$sql = Get-Content -Raw "db/sql/migrations/081-professional-subscriptions.sql"

# Call Management API
Invoke-RestMethod `
  -Uri "https://api.supabase.com/v1/projects/$env:SUPABASE_PROJECT_REF/database/query" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type"  = "application/json"
  } `
  -Body (@{ query = $sql } | ConvertTo-Json -Depth 10)
```

> **Note:** The Management API endpoint above is illustrative. Supabase's exact endpoint may differ. If the standard endpoint is unavailable, use Method A (SQL Editor) as the fallback.

### Step 3 — Verify

Run the same verification query from Method A, Step 4.

---

## Rollback

This migration is **additive-only**. Rollback is a manual DROP if absolutely required:

```sql
-- DANGER: Only run if you are certain no live subscriptions exist
DROP TABLE IF EXISTS public.professional_subscriptions CASCADE;
```

> **Before rollback:** Ensure no Stripe subscriptions have been created, or export their IDs first. The table has `ON DELETE CASCADE` on `professional_id`, so dropping it does not affect professionals data.

---

## Post-Application Checklist

- [ ] Migration 081 verified in production (table + indexes + RLS)
- [ ] Admin subscriptions page loads without errors: `/admin/finance/subscriptions`
- [ ] Stripe webhook endpoint is healthy: check Vercel logs for `api/webhooks/stripe`
- [ ] Inngest functions registered: `process-stripe-webhook-inbox`, `stripe-subscription-renewal-checks`, `stripe-failed-payment-retries`
- [ ] `docs/engineering/database-and-migrations.md` updated: mark 081 as applied
- [ ] `docs/NEXT_STEPS.md` updated: check off P0.3 migration criteria

---

## Troubleshooting

### Error: `relation "professional_subscriptions" already exists`

This is benign if running `CREATE TABLE IF NOT EXISTS`. The migration is idempotent. Verify indexes and RLS policies exist (Step 4 query).

### Error: `policy "Admins can read professional subscriptions" for relation "professional_subscriptions" already exists`

The `DO $$` block in the migration is idempotent. This error should not occur. If it does, the policy already exists — migration is effectively applied.

### Admin page shows "no subscriptions" after application

Expected until the first professional subscribes. To test:
1. Create a Stripe subscription for a test professional (use test mode).
2. Verify the row appears in `professional_subscriptions`.
3. Verify the admin page displays it.

---

## References

- Migration source: `db/sql/migrations/081-professional-subscriptions.sql`
- Subscription manager: `lib/payments/subscription/manager.ts`
- Webhook handler: `lib/stripe/webhook-handlers.ts`
- Admin page: `app/(app)/admin/finance/subscriptions/page.tsx`
- Inngest functions: `inngest/functions/index.ts` (lines 405–498)
