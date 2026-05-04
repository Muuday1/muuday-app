import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createApiClient } from '@/lib/supabase/api-client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { getStripeClient } from '@/lib/stripe/client'
import { validateApiCsrf } from '@/lib/http/csrf'

const payloadSchema = z.object({
  bookingId: z.string().uuid('ID do agendamento invalido.'),
})

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'payments', message: 'POST /api/v1/payments/payment-intent started', level: 'info' })

  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('stripePaymentIntent', `api-v1-payment-intent:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisicao invalido.' }, { status: 400 })
  }

  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados invalidos.' }, { status: 400 })
  }

  const supabase = await createApiClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faca login para continuar.' }, { status: 401 })
  }

  const { bookingId } = parsed.data

  // Load booking with payment and professional details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, professional_id, status, price_total, user_currency, professionals(id, user_id, profiles!professionals_user_id_fkey(full_name, email))')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError) {
    console.error('[payment-intent] bookingError:', JSON.stringify(bookingError))
    Sentry.captureException(bookingError, {
      tags: { area: 'api-v1-payments-payment-intent', context: 'booking-load' },
    })
    return NextResponse.json({ error: 'Erro ao carregar agendamento.' }, { status: 500 })
  }

  if (!booking) {
    return NextResponse.json({ error: 'Agendamento nao encontrado.' }, { status: 404 })
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  if (booking.status !== 'pending_payment') {
    return NextResponse.json(
      { error: 'Este agendamento nao requer pagamento no momento.', bookingStatus: booking.status },
      { status: 409 },
    )
  }

  // Load the associated payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, status, stripe_payment_intent_id, amount_total, currency, amount_total_minor')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (paymentError) {
    Sentry.captureException(paymentError, {
      tags: { area: 'api-v1-payments-payment-intent', context: 'payment-load' },
    })
    return NextResponse.json({ error: 'Erro ao carregar pagamento.' }, { status: 500 })
  }

  if (!payment) {
    return NextResponse.json({ error: 'Pagamento nao encontrado para este agendamento.' }, { status: 404 })
  }

  if (payment.status !== 'requires_payment') {
    return NextResponse.json(
      { error: 'Pagamento ja foi processado ou nao esta pendente.', paymentStatus: payment.status },
      { status: 409 },
    )
  }

  // If a PaymentIntent already exists, return its client_secret
  if (payment.stripe_payment_intent_id) {
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe indisponivel no momento.' }, { status: 503 })
    }

    try {
      const existingPi = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id)
      if (existingPi.status === 'requires_payment_method' || existingPi.status === 'requires_confirmation') {
        return NextResponse.json({
          clientSecret: existingPi.client_secret,
          paymentIntentId: existingPi.id,
          status: existingPi.status,
        })
      }
    } catch (retrieveError) {
      Sentry.captureException(retrieveError, {
        tags: { area: 'api-v1-payments-payment-intent', context: 'retrieve-existing-pi' },
      })
    }
  }

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe indisponivel no momento.' }, { status: 503 })
  }

  const amountMinor = payment.amount_total_minor ?? Math.round((payment.amount_total ?? 0) * 100)
  const currency = (payment.currency ?? 'brl').toLowerCase()

  // Get or create Stripe Customer
  let customerId: string | undefined
  try {
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id
    } else {
      const userEmail = user.email || undefined
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { muuday_user_id: user.id },
      })
      customerId = customer.id

      await supabase.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
      }).then(({ error }) => {
        if (error) {
          Sentry.captureException(error, {
            tags: { area: 'api-v1-payments-payment-intent', context: 'persist-customer-mapping' },
          })
        }
      })
    }
  } catch (customerError) {
    Sentry.captureException(customerError, {
      tags: { area: 'api-v1-payments-payment-intent', context: 'customer-creation' },
    })
  }

  try {
    const proProfile = (booking.professionals as unknown as { profiles?: { full_name?: string } } | null)?.profiles
    const professionalName = proProfile?.full_name || 'Profissional'

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency,
      customer: customerId,
      capture_method: 'manual',
      metadata: {
        muuday_booking_id: bookingId,
        muuday_user_id: user.id,
        muuday_professional_id: booking.professional_id,
        muuday_payment_id: payment.id,
      },
      description: `Sessao com ${professionalName}`,
      automatic_payment_methods: { enabled: true },
    })

    // Use PostgreSQL RPC to update stripe_payment_intent_id with internal ownership check.
    // This eliminates the need for createAdminClient() in user-facing code.
    const { error: updateError } = await supabase.rpc('update_payment_provider_id', {
      p_payment_id: payment.id,
      p_stripe_payment_intent_id: paymentIntent.id,
    })

    if (updateError) {
      Sentry.captureException(updateError, {
        tags: { area: 'api-v1-payments-payment-intent', context: 'update-payment-provider-id' },
      })
    }

    Sentry.addBreadcrumb({
      category: 'payments',
      message: 'PaymentIntent created',
      level: 'info',
      data: { bookingId, paymentIntentId: paymentIntent.id, amount: amountMinor, currency },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    })
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : 'Erro ao criar pagamento'
    Sentry.captureException(stripeError, {
      tags: { area: 'stripe_payment_intent_create' },
      extra: { bookingId, userId: user.id, amount: amountMinor, currency },
    })
    return NextResponse.json({ error: 'Erro ao iniciar pagamento. Tente novamente.' }, { status: 502 })
  }
}
