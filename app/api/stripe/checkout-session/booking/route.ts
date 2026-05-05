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
import { getOrCreateStripeCustomer } from '@/lib/stripe/get-or-create-customer'
import { getAppBaseUrl } from '@/lib/config/app-url'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'

const payloadSchema = z.object({
  bookingId: z.string().uuid('ID do agendamento invalido.'),
})

type ProfessionalProfile = {
  profiles?: {
    full_name?: string
  } | null
}

type BookingWithProfessional = {
  id: string
  user_id: string
  professional_id: string
  status: string
  price_total: number | null
  user_currency: string | null
  professionals: ProfessionalProfile | null
}

function appBaseUrl(request: NextRequest) {
  return request.nextUrl.origin || getAppBaseUrl()
}

export async function POST(request: NextRequest) {
  Sentry.addBreadcrumb({ category: 'payments', message: 'POST /api/stripe/checkout-session/booking started', level: 'info' })

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

  // Rate limiting (after auth so we can include user ID in key)
  const ip = getClientIp(request)
  const rl = await rateLimit('stripeCheckoutBooking', `stripe-checkout-booking:${user.id}:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
  }

  // Load booking with payment and professional details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, professional_id, status, price_total, user_currency, professionals(id, user_id, profiles!professionals_user_id_fkey(full_name))')
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
    .select('id, status, stripe_payment_intent_id, amount_total, currency, amount_total_minor')
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
  const proProfile = (booking as BookingWithProfessional).professionals?.profiles
  const professionalName = proProfile?.full_name || 'Profissional'

  try {
    // Get or create Stripe Customer (race-safe)
    let customerId: string | undefined
    try {
      customerId = await getOrCreateStripeCustomer(stripe, supabase, user.id, user.email || undefined)
    } catch (customerError) {
      Sentry.captureException(customerError, {
        tags: { area: 'stripe-checkout-booking', context: 'customer-creation' },
      })
      // Non-blocking: continue without customer association
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

    // Use PostgreSQL RPC to update stripe_payment_intent_id with internal ownership check.
    // This eliminates the need for createAdminClient() in user-facing code.
    if (session.payment_intent) {
      const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id
      const { error: updateError } = await supabase.rpc('update_payment_provider_id', {
        p_payment_id: payment.id,
        p_stripe_payment_intent_id: piId,
      })

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
