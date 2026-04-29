import { resolve } from 'path'
import dotenv from 'dotenv'

// Load .env.local
function loadEnv() {
  // dotenv does not override existing env vars by default, matching previous behaviour
  dotenv.config({ path: resolve(process.cwd(), '.env.local') })
}

const WARMUP_ROUTES = [
  // Public
  { route: '/api/v1/taxonomy/catalog', method: 'GET' },
  { route: '/api/v1/professionals/search?limit=1', method: 'GET' },
  { route: '/api/v1/guides/useful?guideSlug=guia-teste', method: 'GET' },
  { route: '/api/v1/blog/comments?articleSlug=test-article', method: 'GET' },
  { route: '/api/v1/blog/likes?articleSlug=test-article', method: 'GET' },
  { route: '/api/v1/professionals/fake-id/services', method: 'GET' },
  // Auth-required (will return 401/403 but still warm up the route)
  { route: '/api/v1/users/me', method: 'GET' },
  { route: '/api/v1/bookings', method: 'GET' },
  { route: '/api/v1/notifications/unread-count', method: 'GET' },
  { route: '/api/v1/notifications', method: 'GET' },
  { route: '/api/v1/conversations', method: 'GET' },
  { route: '/api/v1/disputes', method: 'GET' },
  { route: '/api/v1/reviews', method: 'POST' },
  { route: '/api/v1/onboarding/complete-account', method: 'POST' },
  { route: '/api/v1/onboarding/complete-profile', method: 'POST' },
  { route: '/api/v1/admin/dashboard', method: 'GET' },
  { route: '/api/v1/admin/plans', method: 'GET' },
  { route: '/api/v1/admin/taxonomy', method: 'GET' },
  { route: '/api/v1/admin/taxonomy/items', method: 'POST' },
  { route: '/api/v1/admin/taxonomy/items/fake-id', method: 'PATCH' },
  { route: '/api/v1/admin/taxonomy/items/fake-id/toggle-active', method: 'PATCH' },
  { route: '/api/v1/admin/tag-suggestions', method: 'PATCH' },
  { route: '/api/v1/client-records', method: 'GET' },
  { route: '/api/v1/push/subscribe', method: 'POST' },
  { route: '/api/v1/push/unsubscribe', method: 'DELETE' },
  { route: '/api/v1/bookings/requests', method: 'POST' },
  { route: '/api/v1/bookings/fake-id', method: 'GET' },
  { route: '/api/v1/bookings/fake-id/cancel', method: 'PATCH' },
  { route: '/api/v1/bookings/fake-id/complete', method: 'PATCH' },
  { route: '/api/v1/bookings/fake-id/confirm', method: 'PATCH' },
  { route: '/api/v1/bookings/fake-id/reschedule', method: 'PATCH' },
  { route: '/api/v1/bookings/fake-id/session-link', method: 'PATCH' },
  { route: '/api/v1/conversations/fake-id/messages', method: 'GET' },
  { route: '/api/v1/conversations/fake-id/read', method: 'PATCH' },
  { route: '/api/v1/notifications/fake-id/read', method: 'PATCH' },
  { route: '/api/v1/disputes/fake-case-id', method: 'GET' },
  { route: '/api/v1/disputes/fake-case-id', method: 'PATCH' },
  { route: '/api/v1/disputes/fake-case-id/messages', method: 'GET' },
  { route: '/api/v1/kyc/scan', method: 'POST' },
  { route: '/api/v1/guides/reports', method: 'POST' },
  { route: '/api/v1/professionals/me', method: 'POST' },
  { route: '/api/v1/favorites', method: 'GET' },
]

async function warmupRoute(baseURL: string, route: string, method: string) {
  const url = new URL(route, baseURL.trim()).toString()
  const start = Date.now()
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(20000),
    })
    const elapsed = Date.now() - start
    console.log(`  ${res.status} ${elapsed}ms ${method} ${route}`)
  } catch (err) {
    const elapsed = Date.now() - start
    console.log(`  ERR ${elapsed}ms ${method} ${route} (${err instanceof Error ? err.message : String(err)})`)
  }
}

export default async function globalSetup() {
  loadEnv()
  const baseURL = process.env.E2E_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  console.log(`\n🔥 Warming up API routes at ${baseURL}...`)
  const totalStart = Date.now()

  // Warm up in batches of 5 to avoid overwhelming the dev server
  const batchSize = 5
  for (let i = 0; i < WARMUP_ROUTES.length; i += batchSize) {
    const batch = WARMUP_ROUTES.slice(i, i + batchSize)
    await Promise.all(batch.map(({ route, method }) => warmupRoute(baseURL, route, method)))
  }

  const elapsed = Date.now() - totalStart
  console.log(`✅ Warmup complete in ${elapsed}ms\n`)
}
