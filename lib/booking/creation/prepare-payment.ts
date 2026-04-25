import * as Sentry from '@sentry/nextjs'
import { assertNoSensitivePaymentPayload } from '@/lib/stripe/pii-guards'
import type { CreateBookingInput } from './types'

export type PaymentData = {
  user_id: string
  professional_id: string
  provider: 'stripe'
  amount_total: number
  currency: string
  status: 'requires_payment'
  metadata: Record<string, unknown>
  captured_at: null
}

export function prepareBookingPayment(
  user: { id: string },
  professionalId: string,
  totalPriceUserCurrency: number,
  currency: string | null,
  bookingInput: CreateBookingInput,
  recurrenceGroupId: string | null,
  batchBookingGroupId: string | null,
  sessionCount: number,
  confirmationMode: string,
): { paymentData: PaymentData; paymentMetadata: Record<string, unknown> } {
  const bookingType = bookingInput.bookingType || 'one_off'
  const paymentMetadata = {
    capturedBy: 'stripe_payment_intent',
    confirmationMode,
    bookingType,
    sessionsCount: sessionCount,
    recurrenceGroupId,
    batchBookingGroupId,
  }

  const paymentData: PaymentData = {
    user_id: user.id,
    professional_id: professionalId,
    provider: 'stripe',
    amount_total: totalPriceUserCurrency,
    currency: currency || 'BRL',
    status: 'requires_payment',
    metadata: paymentMetadata,
    captured_at: null,
  }

  try {
    assertNoSensitivePaymentPayload(paymentMetadata, 'payments.metadata.createBooking')
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: 'booking_create' },
      extra: { paymentAnchorBookingId: null, bookingType: bookingInput.bookingType },
    })
    Sentry.captureMessage('booking_payment_sensitive_metadata_blocked', {
      level: 'error',
      tags: { area: 'booking_create' },
      extra: { paymentAnchorBookingId: null, bookingType: bookingInput.bookingType },
    })
    throw error
  }

  return { paymentData, paymentMetadata }
}
