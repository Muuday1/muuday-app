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

  // Payments (Stripe)
  STRIPE_SECRET_KEY: optionalString,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString,
  STRIPE_CONNECT_CLIENT_ID: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_BR_SECRET_KEY: optionalString,
  NEXT_PUBLIC_STRIPE_BR_PUBLISHABLE_KEY: optionalString,

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
  E2E_BASE_URL: z.preprocess((val) => (val === '' ? undefined : val), z.string().url().optional()),
  E2E_USER_EMAIL: z.preprocess((val) => (val === '' ? undefined : val), z.string().email().optional()),
  E2E_USER_PASSWORD: optionalString,
  E2E_PROFESSIONAL_EMAIL: z.preprocess((val) => (val === '' ? undefined : val), z.string().email().optional()),
  E2E_PROFESSIONAL_PASSWORD: optionalString,
  E2E_ADMIN_EMAIL: z.preprocess((val) => (val === '' ? undefined : val), z.string().email().optional()),
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
