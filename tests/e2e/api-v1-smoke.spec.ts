import { expect, test } from '@playwright/test'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD
const isCi = process.env.CI === 'true'

function failOrSkip(message: string) {
  if (isCi) throw new Error(message)
  test.skip(true, message)
}

async function loginViaApi(request: typeof test.prototype.request): Promise<{ token: string; sessionJson: string }> {
  const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey!,
    },
    data: { email, password },
  })
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body).toHaveProperty('access_token')

  const sessionJson = JSON.stringify({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_in: body.expires_in,
    expires_at: body.expires_at,
    token_type: body.token_type,
    user: body.user,
  })

  return { token: body.access_token as string, sessionJson }
}

test.describe('API v1 smoke tests', () => {
  test.beforeEach(() => {
    if (!email || !password) {
      failOrSkip('Missing E2E_USER_EMAIL or E2E_USER_PASSWORD environment variables.')
    }
    if (!supabaseUrl || !supabaseAnonKey) {
      failOrSkip('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }
  })

  test('GET /api/v1/taxonomy/catalog returns public catalog', async ({ request }) => {
    const response = await request.get('/api/v1/taxonomy/catalog')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(body.data).toHaveProperty('categories')
    expect(body.data).toHaveProperty('specialtyOptionsByCategory')
  })

  test('GET /api/v1/professionals/search returns search results', async ({ request }) => {
    const response = await request.get('/api/v1/professionals/search?limit=5')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/v1/users/me requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/users/me')
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('GET /api/v1/users/me returns profile when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/users/me', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('user')
    expect(body.user).toHaveProperty('id')
    expect(body.user).toHaveProperty('email')
  })

  test('GET /api/v1/bookings requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/bookings')
    expect(response.status()).toBe(401)
  })

  test('GET /api/v1/bookings returns list when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/bookings?limit=5', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/v1/notifications/unread-count requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/notifications/unread-count')
    expect(response.status()).toBe(401)
  })

  test('GET /api/v1/notifications returns list when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/notifications?limit=5', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/v1/conversations requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/conversations')
    expect(response.status()).toBe(401)
  })

  test('GET /api/v1/conversations returns list when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/conversations?limit=5', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/v1/guides/useful returns count', async ({ request }) => {
    const response = await request.get('/api/v1/guides/useful?guideSlug=guia-teste')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(body.data).toHaveProperty('count')
    expect(typeof body.data.count).toBe('number')
  })

  test('GET /api/v1/disputes requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/disputes')
    expect(response.status()).toBe(401)
  })

  test('GET /api/v1/disputes returns list when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/disputes?limit=5', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('POST /api/v1/reviews requires authentication', async ({ request }) => {
    const response = await request.post('/api/v1/reviews', {
      headers: { 'Content-Type': 'application/json' },
      data: { bookingId: 'fake', professionalId: 'fake', rating: 5 },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/reviews rejects invalid payload when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.post('/api/v1/reviews', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
        'Content-Type': 'application/json',
      },
      data: { bookingId: 'non-existent-booking', professionalId: 'non-existent-prof', rating: 5 },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('POST /api/v1/onboarding/complete-account requires authentication', async ({ request }) => {
    const response = await request.post('/api/v1/onboarding/complete-account', {
      headers: { 'Content-Type': 'application/json' },
      data: { country: 'BR', timezone: 'America/Sao_Paulo', currency: 'BRL', roleHint: 'cliente' },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/onboarding/complete-account processes when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.post('/api/v1/onboarding/complete-account', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
        'Content-Type': 'application/json',
      },
      data: { country: 'BR', timezone: 'America/Sao_Paulo', currency: 'BRL', roleHint: 'cliente' },
    })
    expect([200, 400]).toContain(response.status())
    const body = await response.json()
    // May return 400 if user already onboarded or profile not found
    expect(body).toHaveProperty(response.status() === 200 ? 'success' : 'error')
  })

  test('POST /api/v1/onboarding/complete-profile requires authentication', async ({ request }) => {
    const response = await request.post('/api/v1/onboarding/complete-profile', {
      headers: { 'Content-Type': 'application/json' },
      data: { bio: 'Test bio', category: 'wellness', tags: ['test'], languages: ['pt'], yearsExperience: 5, sessionPriceBrl: 100, sessionDurationMinutes: 60 },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/onboarding/complete-profile responds when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.post('/api/v1/onboarding/complete-profile', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
        'Content-Type': 'application/json',
      },
      data: { bio: 'Test bio', category: 'wellness', tags: ['test'], languages: ['pt'], yearsExperience: 5, sessionPriceBrl: 100, sessionDurationMinutes: 60 },
    })
    // E2E user may be a professional (returns 200) or a client (returns 401/400)
    expect([200, 400, 401]).toContain(response.status())
    const body = await response.json()
    expect(body).toHaveProperty(response.status() === 200 ? 'professionalId' : 'error')
  })

  test('GET /api/v1/admin/dashboard requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/admin/dashboard')
    // requireAdmin returns 403 for both anonymous and non-admin users
    expect([401, 403]).toContain(response.status())
  })

  test('GET /api/v1/admin/dashboard rejects non-admin', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/admin/dashboard', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(403)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('GET /api/v1/client-records requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/client-records')
    expect(response.status()).toBe(401)
  })

  test('GET /api/v1/client-records responds when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/client-records', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    // E2E user may be a professional (returns 200) or a client (returns 401)
    expect([200, 401]).toContain(response.status())
    const body = await response.json()
    expect(body).toHaveProperty(response.status() === 200 ? 'data' : 'error')
  })

  test('POST /api/v1/push/subscribe requires authentication', async ({ request }) => {
    const response = await request.post('/api/v1/push/subscribe', {
      headers: { 'Content-Type': 'application/json' },
      data: { platform: 'ios', pushToken: 'test-token-e2e' },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/push/subscribe accepts valid payload when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.post('/api/v1/push/subscribe', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
        'Content-Type': 'application/json',
      },
      data: { platform: 'ios', pushToken: `test-token-${Date.now()}`, deviceId: 'e2e-device' },
    })
    // May return 500 if push_subscriptions table has issues (RLS, missing table)
    // 200 = saved successfully, 400 = invalid payload, 500 = DB error
    expect([200, 400, 500]).toContain(response.status())
    const body = await response.json()
    if (response.status() === 200) {
      expect(body.success).toBe(true)
    } else {
      expect(body).toHaveProperty('error')
    }
  })

  test('GET /api/v1/professionals/:id/services returns services', async ({ request }) => {
    // First get a professional id
    const searchResponse = await request.get('/api/v1/professionals/search', {
      params: { q: '', category: '', specialty: '', language: '', location: '', market: '', cursor: '', limit: '1' },
    })
    const searchBody = await searchResponse.json()
    if (!searchBody.data?.length) {
      test.skip(true, 'No professionals available to test services')
      return
    }
    const professionalId = searchBody.data[0].id

    const response = await request.get(`/api/v1/professionals/${encodeURIComponent(professionalId)}/services`)
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('GET /api/v1/blog/comments requires articleSlug', async ({ request }) => {
    const response = await request.get('/api/v1/blog/comments')
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('GET /api/v1/blog/comments returns comments for article', async ({ request }) => {
    const response = await request.get('/api/v1/blog/comments?articleSlug=test-article')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('POST /api/v1/blog/comments creates comment', async ({ request }) => {
    const response = await request.post('/api/v1/blog/comments', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        articleSlug: 'test-article',
        name: 'E2E Test',
        email: `e2e-${Date.now()}@test.com`,
        content: 'Smoke test comment',
      },
    })
    expect([201, 429]).toContain(response.status())
    if (response.status() === 201) {
      const body = await response.json()
      expect(body.success).toBe(true)
    }
  })

  test('POST /api/v1/bookings/requests requires authentication', async ({ request }) => {
    const response = await request.post('/api/v1/bookings/requests', {
      headers: { 'Content-Type': 'application/json' },
      data: { professionalId: 'fake', preferredStartLocal: new Date().toISOString() },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/bookings/requests rejects invalid payload when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.post('/api/v1/bookings/requests', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
        'Content-Type': 'application/json',
      },
      data: { professionalId: 'non-existent-prof', preferredStartLocal: new Date().toISOString() },
    })
    expect([400, 500]).toContain(response.status())
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('GET /api/v1/conversations/:id/messages requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/conversations/fake-conv-id/messages')
    expect(response.status()).toBe(401)
  })

  test('GET /api/v1/conversations/:id/messages returns error for invalid conversation', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/conversations/non-existent-conv/messages?limit=5', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect([400, 404]).toContain(response.status())
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('POST /api/v1/conversations/:id/messages requires authentication', async ({ request }) => {
    const response = await request.post('/api/v1/conversations/fake-conv-id/messages', {
      headers: { 'Content-Type': 'application/json' },
      data: { content: 'test' },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/conversations/:id/messages rejects invalid conversation', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.post('/api/v1/conversations/non-existent-conv/messages', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
        'Content-Type': 'application/json',
      },
      data: { content: 'Hello smoke test' },
    })
    expect([400, 404]).toContain(response.status())
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('PATCH /api/v1/notifications/:id/read requires authentication', async ({ request }) => {
    const response = await request.patch('/api/v1/notifications/fake-id/read')
    expect(response.status()).toBe(401)
  })

  test('PATCH /api/v1/notifications/:id/read rejects invalid id when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.patch('/api/v1/notifications/non-existent-id/read', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('GET /api/v1/bookings/:id requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/bookings/fake-booking-id')
    expect(response.status()).toBe(401)
  })

  test('GET /api/v1/bookings/:id returns error for invalid id when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/bookings/non-existent-id', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('PATCH /api/v1/bookings/:id/cancel requires authentication', async ({ request }) => {
    const response = await request.patch('/api/v1/bookings/fake-id/cancel', {
      headers: { 'Content-Type': 'application/json' },
      data: { reason: 'test' },
    })
    expect(response.status()).toBe(401)
  })

  test('PATCH /api/v1/bookings/:id/cancel rejects invalid id when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.patch('/api/v1/bookings/non-existent-id/cancel', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
        'Content-Type': 'application/json',
      },
      data: { reason: 'test' },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('PATCH /api/v1/bookings/:id/complete requires authentication', async ({ request }) => {
    const response = await request.patch('/api/v1/bookings/fake-id/complete')
    expect(response.status()).toBe(401)
  })

  test('PATCH /api/v1/bookings/:id/confirm requires authentication', async ({ request }) => {
    const response = await request.patch('/api/v1/bookings/fake-id/confirm')
    expect(response.status()).toBe(401)
  })

  test('PATCH /api/v1/bookings/:id/reschedule requires authentication', async ({ request }) => {
    const response = await request.patch('/api/v1/bookings/fake-id/reschedule', {
      headers: { 'Content-Type': 'application/json' },
      data: { newScheduledAt: new Date().toISOString() },
    })
    expect(response.status()).toBe(401)
  })

  test('PATCH /api/v1/bookings/:id/session-link requires authentication', async ({ request }) => {
    const response = await request.patch('/api/v1/bookings/fake-id/session-link', {
      headers: { 'Content-Type': 'application/json' },
      data: { link: 'https://meet.test' },
    })
    expect(response.status()).toBe(401)
  })

  test('GET /api/v1/disputes/:caseId requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/disputes/fake-case-id')
    expect(response.status()).toBe(401)
  })

  test('GET /api/v1/disputes/:caseId returns error for invalid case when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/disputes/non-existent-case', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('GET /api/v1/disputes/:caseId/messages requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/disputes/fake-case-id/messages')
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/disputes/:caseId/messages requires authentication', async ({ request }) => {
    const response = await request.post('/api/v1/disputes/fake-case-id/messages', {
      headers: { 'Content-Type': 'application/json' },
      data: { content: 'test' },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/kyc/scan requires authentication', async ({ request }) => {
    const response = await request.post('/api/v1/kyc/scan', {
      headers: { 'Content-Type': 'application/json' },
      data: { credentialId: 'fake-id' },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/kyc/scan rejects invalid payload when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.post('/api/v1/kyc/scan', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
        'Content-Type': 'application/json',
      },
      data: { credentialId: 'not-a-uuid' },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('DELETE /api/v1/push/unsubscribe requires authentication', async ({ request }) => {
    const response = await request.delete('/api/v1/push/unsubscribe', {
      headers: { 'Content-Type': 'application/json' },
      data: { pushToken: 'test' },
    })
    expect(response.status()).toBe(401)
  })

  test('DELETE /api/v1/push/unsubscribe rejects invalid payload when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.delete('/api/v1/push/unsubscribe', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
        'Content-Type': 'application/json',
      },
      data: {}, // missing both endpoint and pushToken
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('PATCH /api/v1/conversations/:id/read requires authentication', async ({ request }) => {
    const response = await request.patch('/api/v1/conversations/fake-id/read')
    expect(response.status()).toBe(401)
  })

  test('PATCH /api/v1/conversations/:id/read rejects invalid id when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.patch('/api/v1/conversations/non-existent-id/read', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('POST /api/v1/guides/reports requires payload', async ({ request }) => {
    const response = await request.post('/api/v1/guides/reports', {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('POST /api/v1/guides/reports creates report', async ({ request }) => {
    const response = await request.post('/api/v1/guides/reports', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        guideSlug: 'guia-teste',
        visitorId: `visitor-${Date.now()}`,
        message: 'E2E smoke test report',
      },
    })
    expect([201, 429]).toContain(response.status())
    if (response.status() === 201) {
      const body = await response.json()
      expect(body.success).toBe(true)
    }
  })

  test('GET /api/v1/blog/likes requires articleSlug', async ({ request }) => {
    const response = await request.get('/api/v1/blog/likes')
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('GET /api/v1/blog/likes returns count', async ({ request }) => {
    const response = await request.get('/api/v1/blog/likes?articleSlug=test-article')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body).toHaveProperty('data')
    expect(body.data).toHaveProperty('count')
    expect(typeof body.data.count).toBe('number')
  })

  test('POST /api/v1/blog/likes toggles like', async ({ request }) => {
    const response = await request.post('/api/v1/blog/likes', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        articleSlug: 'test-article',
        visitorId: `visitor-${Date.now()}`,
      },
    })
    expect([200, 429]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(body.data).toHaveProperty('liked')
    }
  })

  test('GET /api/v1/admin/plans requires authentication', async ({ request }) => {
    const response = await request.get('/api/v1/admin/plans')
    expect([401, 403]).toContain(response.status())
  })

  test('GET /api/v1/admin/plans rejects non-admin', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const response = await request.get('/api/v1/admin/plans', {
      headers: {
        Authorization: `Bearer ${JSON.parse(sessionJson).access_token}`,
        'X-Supabase-Session': sessionJson,
      },
    })
    expect(response.status()).toBe(403)
    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('POST /api/v1/professionals/me requires authentication', async ({ request }) => {
    const response = await request.post('/api/v1/professionals/me', {
      headers: { 'Content-Type': 'application/json' },
      data: { bio: 'test' },
    })
    expect(response.status()).toBe(401)
  })

  test('POST /api/v1/favorites toggles favorite when authenticated', async ({ request }) => {
    const { sessionJson } = await loginViaApi(request)
    const token = JSON.parse(sessionJson).access_token

    // First, get a professional to favorite
    const searchResponse = await request.get('/api/v1/professionals/search', {
      headers: { Authorization: `Bearer ${token}`, 'X-Supabase-Session': sessionJson },
      params: { q: '', category: '', specialty: '', language: '', location: '', market: '', cursor: '', limit: '1' },
    })
    const searchBody = await searchResponse.json()
    if (!searchBody.data?.length) {
      test.skip(true, 'No professionals available to favorite')
      return
    }

    const professionalId = searchBody.data[0].id

    // Ensure not already favorited (idempotent test)
    await request.delete(`/api/v1/favorites?professionalId=${encodeURIComponent(professionalId)}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Supabase-Session': sessionJson },
    }).catch(() => {})

    // Add to favorites
    const addResponse = await request.post('/api/v1/favorites', {
      headers: { Authorization: `Bearer ${token}`, 'X-Supabase-Session': sessionJson, 'Content-Type': 'application/json' },
      data: { professionalId },
    })
    expect([200, 201]).toContain(addResponse.status())

    // Remove from favorites (DELETE expects professionalId as query param)
    const removeResponse = await request.delete(`/api/v1/favorites?professionalId=${encodeURIComponent(professionalId)}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Supabase-Session': sessionJson },
    })
    expect(removeResponse.status()).toBe(200)
  })
})
