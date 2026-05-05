-- Add UNIQUE constraint on stripe_payment_retry_queue.provider_payment_id
-- to prevent duplicate retry rows for the same Stripe PaymentIntent.
-- This prevents wasted retry attempts and potential duplicate side-effects.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'stripe_payment_retry_queue'
      AND indexname = 'stripe_payment_retry_queue_provider_payment_id_unique'
  ) THEN
    CREATE UNIQUE INDEX stripe_payment_retry_queue_provider_payment_id_unique
      ON public.stripe_payment_retry_queue(provider_payment_id)
      WHERE provider_payment_id IS NOT NULL;
  END IF;
END $$;
