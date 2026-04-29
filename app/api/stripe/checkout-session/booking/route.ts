/**
 * Stripe Checkout Session Creation for Bookings
 *
 * POST /api/stripe/checkout-session/booking
 * Body: { bookingId: string }
 * Response: { sessionUrl: string, sessionId: string }
 *
 * Security:
 * - Authenticated users only
 * - User must own the booking
 * - Payment must be in 'requires_payment' status
 * - Rate limited per IP
 *
 * This is a fallback for users who prefer Stripe Checkout over embedded Elements,
 * or for environments where Stripe Elements is not available.
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'
import { getAppBaseUrl } from '@/lib/config/app-url'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { createAdminClient } from '@/lib/supabase/admin'

const payloadSchema = z.object({
  bookingId: z.string().uuid('ID do agendamento invalido.'),
})

function appBaseUrl(request: NextRequest) {
  return request.nextUrl.origin || getAppBaseUrl()
}

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'payments', message: 'POST /api/stripe/checkout-session/booking started', level: 'info' })

  const ip = getClientIp(request)
  const rl = await rateLimit('stripeCheckoutBooking', `stripe-checkout-booking:${ip}`)
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
    .select('id, user_id, professional_id, status, price_total, user_currency, professionals(id, user_id, profiles(first_name, last_name))')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError) {
    Sentry.captureException(bookingError, {
      tags: { area: 'stripe-checkout-booking', context: 'booking-load' },
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
      tags: { area: 'stripe-checkout-booking', context: 'payment-load' },
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

  const stripe = getStripeClient()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe indisponivel no momento.' }, { status: 503 })
  }

  const amountMinor = payment.amount_total_minor ?? Math.round((payment.amount_total ?? 0) * 100)
  const currency = (payment.currency ?? 'brl').toLowerCase()
  const baseUrl = appBaseUrl(request)
  const proProfile = (booking.professionals as unknown as { profiles?: { first_name?: string; last_name?: string } } | null)?.profiles
  const professionalName = [proProfile?.first_name, proProfile?.last_name].filter(Boolean).join(' ') || 'Profissional'

  try {
    // Get or create Stripe Customer
    let customerId: string | undefined
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_intent_data: {
        capture_method: 'manual',
        metadata: {
          muuday_booking_id: bookingId,
          muuday_user_id: user.id,
          muuday_professional_id: booking.professional_id,
          muuday_payment_id: payment.id,
        },
      },
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amountMinor,
            product_data: {
              name: `Sessao com ${professionalName}`,
              description: 'Consulta online via Muuday',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/agenda/confirmacao/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/agenda/confirmacao/${bookingId}?cancelled=1`,
      metadata: {
        muuday_booking_id: bookingId,
        muuday_user_id: user.id,
        muuday_professional_id: booking.professional_id,
        muuday_payment_id: payment.id,
      },
      // Enable customer email collection if no customer association
      customer_email: customerId ? undefined : user.email || undefined,
    })

    // SECURITY NOTE: We use createAdminClient() here because the RLS guard trigger
    // (trg_guard_payments_non_admin_update) blocks non-admins from updating
    // provider_payment_id. Authorization is already verified above: the user owns
    // the booking, the payment is in 'requires_payment' status, etc.
    // TODO: Migrate to a PostgreSQL RPC function that validates ownership internally
    // and updates provider_payment_id, eliminating the need for admin client here.
    const admin = createAdminClient()
    if (admin && session.payment_intent) {
      const { error: updateError } = await admin
        .from('payments')
        .update({
          provider_payment_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      if (updateError) {
        Sentry.captureException(updateError, {
          tags: { area: 'stripe-checkout-booking', context: 'update-payment-provider-id' },
        })
      }
    }

    // If we created a new customer, persist the mapping
    if (!customerId && session.customer) {
      const customerIdStr = typeof session.customer === 'string' ? session.customer : session.customer.id
      await supabase.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customerIdStr,
      }).then(({ error }) => {
        if (error) {
          Sentry.captureException(error, {
            tags: { area: 'stripe-checkout-booking', context: 'persist-customer-mapping' },
          })
        }
      })
    }

    Sentry.addBreadcrumb({
      category: 'payments',
      message: 'Checkout session created for booking',
      level: 'info',
      data: { bookingId, sessionId: session.id, amount: amountMinor, currency },
    })

    return NextResponse.json({
      sessionUrl: session.url,
      sessionId: session.id,
    })
  } catch (stripeError) {
    const message = stripeError instanceof Error ? stripeError.message : 'Erro ao criar sessao de checkout'
    Sentry.captureException(stripeError, {
      tags: { area: 'stripe_checkout_session_create' },
      extra: { bookingId, userId: user.id, amount: amountMinor, currency },
    })
    return NextResponse.json({ error: 'Erro ao iniciar checkout. Tente novamente.' }, { status: 502 })
  }
}
