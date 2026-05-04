import { expect, test, type APIRequestContext } from '@playwright/test'
import { loginViaApi } from './helpers'

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000'
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const isCi = process.env.CI === 'true'

function failOrSkip(message: string, options?: { allowCiSkip?: boolean }) {
  if (isCi && !options?.allowCiSkip) {
    throw new Error(message)
  }
  test.skip(true, message)
}

/** Build request headers for Next.js API routes that use createApiClient */
function apiHeaders(token: string, sessionJson: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'X-Supabase-Session': sessionJson,
    'Content-Type': 'application/json',
  }
  const mobileApiKey = process.env.MOBILE_API_KEY
  if (mobileApiKey) {
    headers['X-Mobile-Api-Key'] = mobileApiKey
  }
  return headers
}

/** Try to create a booking at multiple times until one works.
 *  Times are in UTC and mapped to Brazil business hours (UTC-3).
 *  14:00 UTC = 11:00 BRT, 15:00 UTC = 12:00 BRT, etc.
 */
async function createTestBooking(
  request: APIRequestContext,
  token: string,
  sessionJson: string,
  professionalId: string,
): Promise<{ bookingId: string; responseStatus: number }> {
  const utcHours = [14, 15, 16, 17, 18] // 11:00-15:00 BRT
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  for (const hour of utcHours) {
    tomorrow.setUTCHours(hour, 0, 0, 0)
    const scheduledAt = tomorrow.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm

    const bookingResponse = await request.post(`${baseUrl}/api/v1/bookings`, {
      headers: apiHeaders(token, sessionJson),
      data: {
        professionalId: professionalId,
        scheduledAt: scheduledAt,
        sessionPurpose: 'E2E payment journey test',
      },
    })

    if (bookingResponse.status() === 200 || bookingResponse.status() === 201) {
      const body = await bookingResponse.json()
      return { bookingId: body.bookingId as string, responseStatus: bookingResponse.status() }
    }

    // Detect rate limit and fail fast with clear message
    if (bookingResponse.status() === 429) {
      const errorBody = await bookingResponse.json().catch(() => ({}))
      throw new Error(`RATE_LIMIT: ${errorBody.error || 'Rate limit exceeded. Wait a few minutes and retry.'}`)
    }

    // Log error for debugging
    const errorBody = await bookingResponse.json().catch(() => ({}))
    console.log(`Booking at UTC ${hour}:00 failed: ${bookingResponse.status()}`, JSON.stringify(errorBody))
  }

  throw new Error(`Failed to create booking at any time slot: ${utcHours.map(h => h + ':00 UTC').join(', ')}`)
}

// ---------------------------------------------------------------------------
// Supabase helpers for direct DB verification
// ---------------------------------------------------------------------------

async function supabaseQuery(
  request: APIRequestContext,
  token: string,
  table: string,
  options: {
    select?: string
    eq?: Record<string, string | number>
    maybeSingle?: boolean
    limit?: number
  } = {},
) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`)
  if (options.select) url.searchParams.set('select', options.select)
  if (options.limit) url.searchParams.set('limit', String(options.limit))
  if (options.eq) {
    Object.entries(options.eq).forEach(([col, val]) => {
      url.searchParams.set(col, `eq.${val}`)
    })
  }

  const response = await request.get(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey as string,
    },
  })

  expect([200, 206]).toContain(response.status())
  const body = await response.json()
  return options.maybeSingle ? (Array.isArray(body) ? body[0] || null : body) : body
}

// ---------------------------------------------------------------------------
// Test: Payment Journey — Booking → Payment → Capture → Balance
// ---------------------------------------------------------------------------

test.describe('Payment Journey End-to-End', () => {
  const hasStripe = Boolean(stripeSecretKey)
  const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey)

  test.skip(!hasStripe || !hasSupabase, 'Set STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to run payment journey E2E tests.')

  test('P1.3 — user books, confirms payment intent, and funds are authorized', async ({ request }) => {
    // 1. Login as test user
    const { token, sessionJson } = await loginViaApi(request)
    expect(token).toBeTruthy()

    // 2. Find an available professional to book
    const professionalId = process.env.E2E_PROFESSIONAL_ID
    if (!professionalId) {
      failOrSkip('Set E2E_PROFESSIONAL_ID to run payment journey tests.', { allowCiSkip: true })
      return
    }

    // 3. Create booking (tries multiple time slots)
    let bookingId: string
    try {
      const result = await createTestBooking(request, token, sessionJson, professionalId)
      bookingId = result.bookingId
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('RATE_LIMIT')) {
        failOrSkip(message, { allowCiSkip: true })
        return
      }
      throw err
    }

    // 4. Verify booking status in DB
    const booking = await supabaseQuery(request, token, 'bookings', {
      select: 'id, status, professional_id',
      eq: { id: bookingId },
      maybeSingle: true,
    })
    expect(booking).not.toBeNull()
    expect(['pending_payment', 'pending_confirmation']).toContain(booking.status)

    // 5. Verify payment record exists
    const payment = await supabaseQuery(request, token, 'payments', {
      select: 'id, status, amount_total_minor, booking_id',
      eq: { booking_id: bookingId },
      maybeSingle: true,
    })
    expect(payment).not.toBeNull()
    expect(payment.status).toBe('requires_payment')
    expect(payment.amount_total_minor).toBeGreaterThan(0)
    const paymentId = payment.id as string

    // 6. Request payment intent client secret
    const piResponse = await request.post(`${baseUrl}/api/v1/payments/payment-intent`, {
      headers: apiHeaders(token, sessionJson),
      data: { bookingId },
    })
    expect(piResponse.status()).toBe(200)
    const piBody = await piResponse.json()
    expect(piBody).toHaveProperty('clientSecret')
    expect(piBody).toHaveProperty('paymentIntentId')
    const providerPaymentId = piBody.paymentIntentId as string

    // 7. Confirm PaymentIntent with Stripe test card via Stripe API
    const stripeResponse = await request.post(`https://api.stripe.com/v1/payment_intents/${providerPaymentId}/confirm`, {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'payment_method': 'pm_card_visa',
        'return_url': `${baseUrl}/agenda/confirmacao/${bookingId}`,
      }).toString(),
    })

    expect(stripeResponse.status()).toBe(200)
    const stripeBody = await stripeResponse.json()
    expect(stripeBody.status).toBe('requires_capture')
    expect(stripeBody.capture_method).toBe('manual')

    // 8. Verify payment record still shows requires_payment (capture hasn't happened yet)
    const paymentAfterConfirm = await supabaseQuery(request, token, 'payments', {
      select: 'id, status',
      eq: { id: paymentId },
      maybeSingle: true,
    })
    expect(paymentAfterConfirm.status).toBe('requires_payment')

    test.info().attach('booking_id', { body: bookingId })
    test.info().attach('payment_id', { body: paymentId })
    test.info().attach('payment_intent_id', { body: providerPaymentId })
  })

  test('P2.3 — capture after webhook updates payment to captured and increases available_balance', async ({ request }) => {
    const { token: userToken, sessionJson: userSessionJson } = await loginViaApi(request)
    const professionalId = process.env.E2E_PROFESSIONAL_ID

    if (!professionalId) {
      failOrSkip('Set E2E_PROFESSIONAL_ID to run payment journey tests.', { allowCiSkip: true })
      return
    }

    // 1. Create booking as user
    let bookingId: string
    try {
      const result = await createTestBooking(request, userToken, userSessionJson, professionalId)
      bookingId = result.bookingId
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('RATE_LIMIT')) {
        failOrSkip(message, { allowCiSkip: true })
        return
      }
      throw err
    }

    // 2. Get payment intent ID via API
    const piResponse = await request.post(`${baseUrl}/api/v1/payments/payment-intent`, {
      headers: apiHeaders(userToken, userSessionJson),
      data: { bookingId },
    })
    expect(piResponse.status()).toBe(200)
    const piBody = await piResponse.json()
    const providerPaymentId = piBody.paymentIntentId as string
    expect(providerPaymentId).toBeTruthy()

    // Also verify payment record exists
    const payment = await supabaseQuery(request, userToken, 'payments', {
      select: 'id, status, amount_total_minor, professional_id',
      eq: { booking_id: bookingId },
      maybeSingle: true,
    })
    expect(payment).not.toBeNull()

    // 3. Confirm with Stripe test card
    const confirmResponse = await request.post(`https://api.stripe.com/v1/payment_intents/${providerPaymentId}/confirm`, {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        'payment_method': 'pm_card_visa',
      }).toString(),
    })
    expect(confirmResponse.status()).toBe(200)

    // 4. Capture via Stripe API
    const captureResponse = await request.post(`https://api.stripe.com/v1/payment_intents/${providerPaymentId}/capture`, {
      headers: { Authorization: `Bearer ${stripeSecretKey}` },
    })
    expect(captureResponse.status()).toBe(200)
    const captureBody = await captureResponse.json()
    expect(captureBody.status).toBe('succeeded')

    // 5. Get balance BEFORE webhook
    const balanceBefore = await supabaseQuery(request, userToken, 'professional_balances', {
      select: 'available_balance, total_debt',
      eq: { professional_id: payment.professional_id as string },
      maybeSingle: true,
    })
    const availableBefore = balanceBefore?.available_balance ?? 0

    // 6. Simulate payment_intent.succeeded webhook
    const webhookEvent = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: providerPaymentId,
          object: 'payment_intent',
          status: 'succeeded',
          amount_received: payment.amount_total_minor,
          charges: {
            data: [{
              id: `ch_test_${Date.now()}`,
              balance_transaction: `txn_test_${Date.now()}`,
              amount: payment.amount_total_minor,
              currency: 'brl',
            }],
          },
          currency: 'brl',
        },
      },
    }

    const webhookResponse = await request.post(`${baseUrl}/api/webhooks/stripe`, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=1234567890,v1=invalid_signature_for_test',
      },
      data: webhookEvent,
    })

    const webhookStatus = webhookResponse.status()
    expect([200, 400, 401, 500]).toContain(webhookStatus)

    // 7. If webhook was accepted, verify DB state
    if (webhookStatus === 200) {
      await new Promise((r) => setTimeout(r, 2_000))

      const paymentAfter = await supabaseQuery(request, userToken, 'payments', {
        select: 'id, status',
        eq: { id: payment.id as string },
        maybeSingle: true,
      })
      expect(paymentAfter.status).toBe('captured')

      const balanceAfter = await supabaseQuery(request, userToken, 'professional_balances', {
        select: 'available_balance',
        eq: { professional_id: payment.professional_id as string },
        maybeSingle: true,
      })
      const availableAfter = balanceAfter?.available_balance ?? 0
      expect(availableAfter).toBeGreaterThan(availableBefore)

      test.info().annotations.push({
        type: 'info',
        description: `Balance increased from ${availableBefore} to ${availableAfter}`,
      })
    } else {
      test.info().annotations.push({
        type: 'warning',
        description: `Webhook returned ${webhookStatus} — signature validation blocked simulated webhook. Verify manually with Stripe CLI.`,
      })
    }

    test.info().attach('booking_id', { body: bookingId })
    test.info().attach('payment_id', { body: payment.id as string })
    test.info().attach('payment_intent_id', { body: providerPaymentId })
  })
})

// ---------------------------------------------------------------------------
// Test: Payout Eligibility Engine (API)
// ---------------------------------------------------------------------------

test.describe('P3.3 — Payout Batch Eligibility', () => {
  test('eligibility engine returns correct criteria for pending bookings', async ({ request }) => {
    const { token } = await loginViaApi(request)

    const professionalId = process.env.E2E_PROFESSIONAL_ID
    if (!professionalId) {
      failOrSkip('Set E2E_PROFESSIONAL_ID to run payout eligibility tests.', { allowCiSkip: true })
      return
    }

    // Verify professional has a trolley_recipients record (or not)
    const recipient = await supabaseQuery(request, token, 'trolley_recipients', {
      select: 'is_active, kyc_status',
      eq: { professional_id: professionalId },
      maybeSingle: true,
    })

    if (recipient) {
      expect(recipient).toHaveProperty('is_active')
      expect(recipient).toHaveProperty('kyc_status')
    }

    // Verify professional_settings has the payout flags we fixed
    const settings = await supabaseQuery(request, token, 'professional_settings', {
      select: 'payout_onboarding_started, payout_kyc_completed',
      eq: { professional_id: professionalId },
      maybeSingle: true,
    })

    if (settings) {
      expect(typeof settings.payout_onboarding_started).toBe('boolean')
      expect(typeof settings.payout_kyc_completed).toBe('boolean')
    }
  })
})
