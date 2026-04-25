-- Migration 081: Professional Stripe Subscriptions
--
-- Tracks monthly subscription billing for professionals via Stripe.
-- Each approved professional gets a Stripe subscription that bills
-- automatically every month. Failed payments trigger grace period.
--
-- The subscription fee is separate from payouts — it is NOT deducted
-- from professional earnings.

-- ---------------------------------------------------------------------------
-- 1. Professional subscriptions table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.professional_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (
    status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'paused', 'unpaid')
  ),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  amount_minor BIGINT NOT NULL DEFAULT 29900, -- R$ 299.00 default
  currency TEXT NOT NULL DEFAULT 'BRL',
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_payment_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one subscription per professional
CREATE UNIQUE INDEX IF NOT EXISTS idx_professional_subscriptions_professional
ON public.professional_subscriptions(professional_id)
WHERE status NOT IN ('canceled', 'incomplete_expired');

-- Index for Stripe ID lookups
CREATE INDEX IF NOT EXISTS idx_professional_subscriptions_stripe_id
ON public.professional_subscriptions(stripe_subscription_id);

-- Index for status-based queries (dashboard)
CREATE INDEX IF NOT EXISTS idx_professional_subscriptions_status
ON public.professional_subscriptions(status, current_period_end);

-- ---------------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.professional_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'professional_subscriptions'
      AND policyname = 'Admins can read professional subscriptions'
  ) THEN
    CREATE POLICY "Admins can read professional subscriptions"
      ON public.professional_subscriptions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Comment
-- ---------------------------------------------------------------------------

COMMENT ON TABLE public.professional_subscriptions IS
  'Stripe subscriptions for professional monthly fees. One active subscription per professional.';
