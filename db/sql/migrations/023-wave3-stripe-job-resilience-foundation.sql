-- Wave 3 foundation: Stripe webhook resilience + background job orchestration.
-- Scope:
-- 1) Webhook idempotency inbox (durable, retry-aware).
-- 2) Payment retry queue for failed payment intents.
-- 3) Subscription renewal check queue.
-- 4) Background job run ledger for idempotent batch execution windows.

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  api_version TEXT,
  livemode BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'processed', 'failed', 'ignored')
  ),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature_header TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts BETWEEN 1 AND 20),
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_status_retry_idx
  ON public.stripe_webhook_events(status, next_retry_at);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_type_status_idx
  ON public.stripe_webhook_events(event_type, status);

CREATE TABLE IF NOT EXISTS public.stripe_payment_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  provider_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled')
  ),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_payment_retry_queue_status_next_idx
  ON public.stripe_payment_retry_queue(status, next_attempt_at);

CREATE INDEX IF NOT EXISTS stripe_payment_retry_queue_provider_payment_idx
  ON public.stripe_payment_retry_queue(provider_payment_id);

CREATE TABLE IF NOT EXISTS public.stripe_subscription_check_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT NOT NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (
    status IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled')
  ),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stripe_subscription_check_queue_status_next_idx
  ON public.stripe_subscription_check_queue(status, next_attempt_at);

CREATE INDEX IF NOT EXISTS stripe_subscription_check_queue_subscription_idx
  ON public.stripe_subscription_check_queue(stripe_subscription_id);

CREATE TABLE IF NOT EXISTS public.stripe_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  run_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_name, run_key)
);

CREATE INDEX IF NOT EXISTS stripe_job_runs_job_started_idx
  ON public.stripe_job_runs(job_name, started_at DESC);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payment_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscription_check_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_job_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stripe_webhook_events'
      AND policyname = 'Admins can read stripe webhook events'
  ) THEN
    CREATE POLICY "Admins can read stripe webhook events"
      ON public.stripe_webhook_events
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stripe_payment_retry_queue'
      AND policyname = 'Admins can read stripe payment retry queue'
  ) THEN
    CREATE POLICY "Admins can read stripe payment retry queue"
      ON public.stripe_payment_retry_queue
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stripe_subscription_check_queue'
      AND policyname = 'Admins can read stripe subscription check queue'
  ) THEN
    CREATE POLICY "Admins can read stripe subscription check queue"
      ON public.stripe_subscription_check_queue
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'stripe_job_runs'
      AND policyname = 'Admins can read stripe job runs'
  ) THEN
    CREATE POLICY "Admins can read stripe job runs"
      ON public.stripe_job_runs
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;
