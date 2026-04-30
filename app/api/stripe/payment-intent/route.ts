/**
 * Stripe PaymentIntent Creation for Bookings
 *
 * POST /api/stripe/payment-intent
 * Body: { bookingId: string }
 * Response: { clientSecret: string, paymentIntentId: string }
 *
 * Security:
 * - Authenticated users only
 * - User must own the booking
 * - Payment must be in 'requires_payment' status
 * - Rate limited per IP
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { createAdminClient } from '@/lib/supabase/admin'

const payloadSchema = z.object({
  bookingId: z.string().uuid('ID do agendamento invalido.'),
})

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'payments', message: 'POST /api/stripe/payment-intent started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('stripePaymentIntent', `stripe-payment-intent:${ip}`)
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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faca login para continuar.' }, { status: 401 })
  }

  const { bookingId } = parsed.data

  // Load booking with payment and professional details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, professional_id, status, price_total, user_currency, professionals(id, user_id, profiles(first_name, last_name, email))')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError) {
    Sentry.captureException(bookingError, {
      tags: { area: 'stripe-payment-intent', context: 'booking-load' },
    })
    return NextResponse.json({ error: 'Erro ao carregar agendamento.' }, { status: 500 })
  }

  if (!booking) {
    return NextResponse.json({ error: 'Agendamento nao encontrado.' }, { status: 404 })
  }

  // Authorization: user must own the booking
  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  // Booking must be in a state that requires payment
  if (booking.status !== 'pending_payment') {
    return NextResponse.json(
      { error: 'Este agendamento nao requer pagamento no momento.', bookingStatus: booking.status },
      { status: 409 },
    )
  }

  // Load the associated payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, status, provider_payment_id, amount_total, currency, amount_total_minor')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (paymentError) {
    Sentry.captureException(paymentError, {
      tags: { area: 'stripe-payment-intent', context: 'payment-load' },
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
  if (payment.provider_payment_id) {
    const stripe = getStripeClient()
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe indisponivel no momento.' }, { status: 503 })
    }

    try {
      const existingPi = await stripe.paymentIntents.retrieve(payment.provider_payment_id)
      if (existingPi.status === 'requires_payment_method' || existingPi.status === 'requires_confirmation') {
        return NextResponse.json({
          clientSecret: existingPi.client_secret,
          paymentIntentId: existingPi.id,
          status: existingPi.status,
        })
      }
      // If PI is in a different state, we need to create a new one
    } catch (retrieveError) {
      Sentry.captureException(retrieveError instanceof Error ? retrieveError : new Error(String(retrieveError)), {
        tags: { area: 'stripe_payment_intent', context: 'retrieve-existing-pi' },
      })
      // Continue to create a new PI
    }
  }

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe indisponivel no momento.' }, { status: 503 })
  }

  // Amount in minor units (cents) for Stripe
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

      // Persist the new customer mapping (best effort)
      await supabase.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
      }).then(({ error }) => {
        if (error) {
          Sentry.captureException(error, {
            tags: { area: 'stripe-payment-intent', context: 'persist-customer-mapping' },
          })
        }
      })
    }
  } catch (customerError) {
    Sentry.captureException(customerError, {
      tags: { area: 'stripe-payment-intent', context: 'customer-creation' },
    })
    // Non-blocking: continue without customer association
  }

  try {
    const proProfile = (booking.professionals as unknown as { profiles?: { first_name?: string; last_name?: string } } | null)?.profiles
    const professionalName = [proProfile?.first_name, proProfile?.last_name].filter(Boolean).join(' ') || 'Profissional'

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountMinor,
      currency,
      customer: customerId,
      capture_method: 'manual',
      confirmation_method: 'manual',
      metadata: {
        muuday_booking_id: bookingId,
        muuday_user_id: user.id,
        muuday_professional_id: booking.professional_id,
        muuday_payment_id: payment.id,
      },
      description: `Sessao com ${professionalName}`,
      // Enable automatic payment methods (card, Apple Pay, Google Pay, etc.)
      automatic_payment_methods: { enabled: true },
    })

    // SECURITY NOTE: We use createAdminClient() here because the RLS guard trigger
    // (trg_guard_payments_non_admin_update) blocks non-admins from updating
    // provider_payment_id. Authorization is already verified above: the user owns
    // the booking, the payment is in 'requires_payment' status, etc.
    // TODO: Migrate to a PostgreSQL RPC function that validates ownership internally
    // and updates provider_payment_id, eliminating the need for admin client here.
    const admin = createAdminClient()
    if (admin) {
      const { error: updateError } = await admin
        .from('payments')
        .update({
          provider_payment_id: paymentIntent.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      if (updateError) {
        Sentry.captureException(updateError, {
          tags: { area: 'stripe-payment-intent', context: 'update-payment-provider-id' },
        })
        // Non-blocking: client_secret is still valid, we can reconcile later
      }
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
