# Apply Migrations 077-078 to Production

These migrations add atomic PostgreSQL RPCs that eliminate race conditions.
**Must be applied before the next deploy**, otherwise `updateProfessionalBalance()`
and `createLedgerTransaction()` will fail (they call RPCs that don't exist yet).

## Method 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor** → **New query**
3. Copy the contents of `077-payments-atomic-balance-rpc.sql`
4. Paste and click **Run**
5. Repeat for `078-payments-atomic-ledger-rpc.sql`

## Method 2: psql (if you have direct DB access)

```bash
psql $SUPABASE_DB_URL -f 077-payments-atomic-balance-rpc.sql
psql $SUPABASE_DB_URL -f 078-payments-atomic-ledger-rpc.sql
```

## Verification

After applying, verify the functions exist:

```sql
SELECT proname FROM pg_proc WHERE proname IN (
  'update_professional_balance_atomic',
  'create_ledger_transaction_atomic'
);
```

Expected: 2 rows returned.

## Rollback (if needed)

```sql
DROP FUNCTION IF EXISTS public.update_professional_balance_atomic(UUID, BIGINT, BIGINT, BIGINT, BIGINT);
DROP FUNCTION IF EXISTS public.create_ledger_transaction_atomic(UUID, UUID, UUID, UUID, TEXT, TEXT, JSONB);
```
