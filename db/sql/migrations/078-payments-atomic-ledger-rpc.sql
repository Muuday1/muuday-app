-- ============================================
-- Migration 078: Atomic Ledger Transaction RPC
-- ============================================
-- Replaces sequential INSERTs in createLedgerTransaction()
-- with a single atomic PostgreSQL function.
--
-- All entries are inserted within one implicit transaction,
-- guaranteeing atomicity: either all entries succeed or none do.
-- ============================================

CREATE OR REPLACE FUNCTION public.create_ledger_transaction_atomic(
  p_transaction_id UUID,
  p_booking_id UUID DEFAULT NULL,
  p_payment_id UUID DEFAULT NULL,
  p_payout_batch_id UUID DEFAULT NULL,
  p_currency TEXT DEFAULT 'BRL',
  p_description TEXT DEFAULT NULL,
  p_entries JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  entry_id UUID,
  account_id TEXT,
  entry_type TEXT,
  amount BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entry JSONB;
  v_account_id TEXT;
  v_entry_type TEXT;
  v_amount BIGINT;
  total_debits BIGINT := 0;
  total_credits BIGINT := 0;
  new_entry_id UUID;
BEGIN
  -- Validate at least 2 entries
  IF jsonb_array_length(p_entries) < 2 THEN
    RAISE EXCEPTION 'Ledger transaction must have at least 2 entries. Got %', jsonb_array_length(p_entries);
  END IF;

  -- Validate balance: sum of debits must equal sum of credits
  FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    v_account_id := entry->>'account_id';
    v_entry_type := entry->>'entry_type';
    v_amount := (entry->>'amount')::BIGINT;

    IF v_amount < 0 THEN
      RAISE EXCEPTION 'Ledger entry amount cannot be negative. Account: %, amount: %', v_account_id, v_amount;
    END IF;

    IF v_entry_type = 'debit' THEN
      total_debits := total_debits + v_amount;
    ELSIF v_entry_type = 'credit' THEN
      total_credits := total_credits + v_amount;
    ELSE
      RAISE EXCEPTION 'Invalid entry_type: %. Must be debit or credit.', v_entry_type;
    END IF;
  END LOOP;

  IF total_debits != total_credits THEN
    RAISE EXCEPTION 'Ledger transaction is unbalanced. Debits: %, Credits: %', total_debits, total_credits;
  END IF;

  -- Insert all entries
  FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    v_account_id := entry->>'account_id';
    v_entry_type := entry->>'entry_type';
    v_amount := (entry->>'amount')::BIGINT;

    INSERT INTO public.ledger_entries (
      transaction_id,
      booking_id,
      payment_id,
      payout_batch_id,
      account_id,
      entry_type,
      amount,
      currency,
      description,
      metadata
    ) VALUES (
      p_transaction_id,
      p_booking_id,
      p_payment_id,
      p_payout_batch_id,
      v_account_id,
      v_entry_type,
      v_amount,
      p_currency,
      COALESCE(entry->>'description', p_description),
      COALESCE(entry->'metadata', '{}'::jsonb)
    )
    RETURNING id INTO new_entry_id;

    entry_id := new_entry_id;
    account_id := v_account_id;
    entry_type := v_entry_type;
    amount := v_amount;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_ledger_transaction_atomic(UUID, UUID, UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ledger_transaction_atomic(UUID, UUID, UUID, UUID, TEXT, TEXT, JSONB) TO service_role;
