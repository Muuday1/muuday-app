import { z } from 'zod'

// Treat empty strings as undefined so optional env vars don't fail .min(1)
const optionalString = z.preprocess((val) => (val === '' ? undefined : val), z.string().min(1).optional())

const envSchema = z.object({
  // Public / client-safe (always required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),

  // Server-only critical (required for core functionality)
  APP_BASE_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Database (at least one must be configured)
  SUPABASE_DB_POOLER_URL: optionalString,
  SUPABASE_DB_DIRECT_URL: optionalString,
  DATABASE_URL: optionalString,

  // Auth / security
  CRON_SECRET: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(16).optional()),
  SUPABASE_DB_WEBHOOK_SECRET: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(16).optional()),

  // Email
  RESEND_API_KEY: optionalString,

  // Redis / caching
  UPSTASH_REDIS_REST_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),
  UPSTASH_REDIS_REST_TOKEN: optionalString,

  // Payments (Stripe — UK single region)
  STRIPE_SECRET_KEY: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,
  STRIPE_CONNECT_CLIENT_ID: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,

  // Payments (Trolley — professional payouts)
  TROLLEY_API_KEY: optionalString,
  TROLLEY_API_SECRET: optionalString,
  TROLLEY_WEBHOOK_SECRET: optionalString,
  TROLLEY_API_BASE: z.string().url().optional().default('https://api.trolley.com/v1'),

  // Payments (Revolut — treasury)
  REVOLUT_CLIENT_ID: optionalString,
  REVOLUT_API_KEY: optionalString,
  REVOLUT_REFRESH_TOKEN: optionalString,
  REVOLUT_WEBHOOK_SECRET: optionalString,
  REVOLUT_ACCOUNT_ID: optionalString,
  REVOLUT_PRIVATE_KEY: optionalString,

  // Payout Configuration
  PAYOUT_COOLDOWN_HOURS: z.coerce.number().min(0).default(48),
  PAYOUT_BATCH_SCHEDULE_CRON: z.string().default('0 8 * * 1'),
  MINIMUM_TREASURY_BUFFER_MINOR: z.coerce.number().min(0).default(1_000_000),
  MAX_PROFESSIONAL_DEBT_MINOR: z.coerce.number().min(0).default(50_000),
  // Monthly subscription fee (Phase 6) — billed separately via Stripe
  MONTHLY_SUBSCRIPTION_FEE_MINOR: z.coerce.number().min(0).default(29_900), // Default: R$ 299.00
  MONTHLY_SUBSCRIPTION_TRIAL_DAYS: z.coerce.number().min(0).default(14), // 14-day free trial
  STRIPE_SUBSCRIPTION_PRODUCT_NAME: z.string().default('Muuday Pro'),

  // Mobile app
  MOBILE_API_KEY: optionalString,

  // CMS (Sanity)
  SANITY_PROJECT_ID: optionalString,
  SANITY_DATASET: z.string().default('production'),
  SANITY_API_KEY: optionalString,

  // OCR (AWS Textract + Google Document AI)
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: optionalString,
  AWS_SECRET_ACCESS_KEY: optionalString,
  GOOGLE_DOCUMENT_AI_PROJECT_ID: optionalString,
  GOOGLE_DOCUMENT_AI_LOCATION: z.string().default('us'),
  GOOGLE_DOCUMENT_AI_PROCESSOR_ID: optionalString,

  // Observability
  SENTRY_DSN: optionalString,
  NEXT_PUBLIC_SENTRY_DSN: optionalString,
  SENTRY_ORG: optionalString,
  SENTRY_PROJECT: optionalString,
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),

  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: optionalString,
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com'),

  // Video (Agora)
  AGORA_APP_ID: optionalString,
  AGORA_APP_CERTIFICATE: optionalString,

  // Push notifications
  VAPID_PUBLIC_KEY: optionalString,
  VAPID_PRIVATE_KEY: optionalString,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: optionalString,

  // OAuth (Calendar sync)
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  OUTLOOK_CLIENT_ID: optionalString,
  OUTLOOK_CLIENT_SECRET: optionalString,
  CALENDAR_TOKEN_ENCRYPTION_KEY: optionalString,
  CALENDAR_OAUTH_STATE_SECRET: optionalString,

  // Background jobs
  INNGEST_EVENT_KEY: optionalString,
  INNGEST_SIGNING_KEY: optionalString,

  // Admin audit
  ADMIN_AUDIT_FAIL_ON_ERROR: z.enum(['true', 'false']).default('false'),

  // E2E / testing
  // These are only used in E2E tests. Use a forgiving preprocess so that
  // placeholder values in Vercel (e.g. "test", "fill-me-in") do not fail the build.
  E2E_BASE_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),
  E2E_USER_EMAIL: z.preprocess(
    (val) => {
      if (val === '' || typeof val !== 'string') return undefined
      // Forgiving email check — reject obvious placeholders but do not fail Zod validation
      if (!val.includes('@') || !val.includes('.')) return undefined
      return val
    },
    z.string().optional(),
  ),
  E2E_USER_PASSWORD: optionalString,
  E2E_PROFESSIONAL_EMAIL: z.preprocess(
    (val) => {
      if (val === '' || typeof val !== 'string') return undefined
      if (!val.includes('@') || !val.includes('.')) return undefined
      return val
    },
    z.string().optional(),
  ),
  E2E_PROFESSIONAL_PASSWORD: optionalString,
  E2E_ADMIN_EMAIL: z.preprocess(
    (val) => {
      if (val === '' || typeof val !== 'string') return undefined
      if (!val.includes('@') || !val.includes('.')) return undefined
      return val
    },
    z.string().optional(),
  ),
  E2E_ADMIN_PASSWORD: optionalString,
})

function validateEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    const message = `Invalid or missing environment variables:\n${lines.join('\n')}`

    // In CI, fail hard so we catch misconfigurations early.
    // On Vercel production, log as error but do not crash the Edge runtime.
    if (process.env.CI) {
      throw new Error(message)
    }
    if (process.env.VERCEL_ENV === 'production') {
      console.error(`[env] ${message}`)
    }

    // In local development, warn but do not crash so the dev server can still start
     
    console.warn(`[env] ${message}`)
  }

  // Cross-field validation: ensure at least one DB connection string is present
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_POOLER_URL || process.env.SUPABASE_DB_DIRECT_URL
  if (!dbUrl && process.env.CI) {
    throw new Error(
      'Missing database connection string. Set one of: DATABASE_URL, SUPABASE_DB_POOLER_URL, SUPABASE_DB_DIRECT_URL',
    )
  }
  if (!dbUrl && process.env.VERCEL_ENV === 'production') {
    console.error('Missing database connection string. Set one of: DATABASE_URL, SUPABASE_DB_POOLER_URL, SUPABASE_DB_DIRECT_URL')
  }

  return parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof envSchema>)
}

export const env = validateEnv()
