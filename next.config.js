const { withSentryConfig } = require('@sentry/nextjs')

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
          // Note: Content-Security-Policy is set dynamically in middleware.ts with per-request nonces
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
