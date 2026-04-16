const { withSentryConfig } = require('@sentry/nextjs')

const isProduction = process.env.NODE_ENV === 'production'

function buildContentSecurityPolicy() {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://js.stripe.com',
    'https://cdn.agora.io',
    'https://us.i.posthog.com',
  ]

  if (!isProduction) {
    scriptSrc.push("'unsafe-eval'")
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://jbbnbbrroifghrshplsq.supabase.co https://ui-avatars.com https://lh3.googleusercontent.com data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://us.i.posthog.com https://*.sentry.io https://*.ingest.us.sentry.io https://api.stripe.com https://*.stripe.com https://*.agora.io wss://*.agora.io",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

/** @type {import('next').NextConfig} */
if (process.env.NODE_ENV === 'production' && !process.env.APP_BASE_URL) {
  console.warn('[muuday] APP_BASE_URL not set — middleware host redirect is disabled')
}

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'jbbnbbrroifghrshplsq.supabase.co' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking - only allow your own site to frame pages
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Block MIME-type sniffing (prevents script injection via mistyped content)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer info sent to external sites
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restrict browser features (camera, mic, geolocation, payment, etc.)
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), payment=(self)',
          },
          // Force HTTPS for 1 year (includeSubDomains for all *.muuday.com)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Prevent cross-origin attacks (isolate browsing context)
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Content Security Policy - primary XSS defense
          {
            key: 'Content-Security-Policy',
            value: buildContentSecurityPolicy(),
          },
        ],
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
