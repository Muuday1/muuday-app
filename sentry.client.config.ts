import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const tracesSampleRate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0')

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: Number.isNaN(tracesSampleRate) ? 0 : tracesSampleRate,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
})
