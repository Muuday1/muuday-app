import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prepareBookingPayment } from './prepare-payment'

vi.mock('@/lib/stripe/pii-guards', () => ({
  assertNoSensitivePaymentPayload: vi.fn(),
}))

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import { assertNoSensitivePaymentPayload } from '@/lib/stripe/pii-guards'
import * as Sentry from '@sentry/nextjs'

describe('prepareBookingPayment', () => {
  const user = { id: 'user-1' }
  const professionalId = 'prof-1'
  const totalPrice = 300
  const currency = 'BRL'
  const bookingInput = {
    professionalId: 'prof-1',
    bookingType: 'one_off' as const,
  }
  const recurrenceGroupId = 'rec-1'
  const batchBookingGroupId = 'batch-1'
  const sessionCount = 3
  const confirmationMode = 'auto_accept'

  beforeEach(() => {
    vi.mocked(assertNoSensitivePaymentPayload).mockImplementation(() => {
      // default: no throw
    })
    vi.clearAllMocks()
  })

  it('returns correct payment data for one_off', () => {
    const result = prepareBookingPayment(
      user, professionalId, totalPrice, currency,
      bookingInput, recurrenceGroupId, batchBookingGroupId,
      sessionCount, confirmationMode,
    )

    expect(result.paymentData.user_id).toBe('user-1')
    expect(result.paymentData.professional_id).toBe('prof-1')
    expect(result.paymentData.provider).toBe('stripe')
    expect(result.paymentData.amount_total).toBe(300)
    expect(result.paymentData.currency).toBe('BRL')
    expect(result.paymentData.status).toBe('requires_payment')
    expect(result.paymentData.captured_at).toBeNull()
    expect(result.paymentData.metadata.capturedBy).toBe('stripe_payment_intent')
    expect(result.paymentData.metadata.confirmationMode).toBe('auto_accept')
    expect(result.paymentData.metadata.bookingType).toBe('one_off')
    expect(result.paymentData.metadata.sessionsCount).toBe(3)
    expect(result.paymentData.metadata.recurrenceGroupId).toBe('rec-1')
    expect(result.paymentData.metadata.batchBookingGroupId).toBe('batch-1')
  })

  it('defaults currency to BRL when null', () => {
    const result = prepareBookingPayment(
      user, professionalId, totalPrice, null,
      bookingInput, null, null, 1, 'manual',
    )

    expect(result.paymentData.currency).toBe('BRL')
  })

  it('defaults bookingType to one_off when undefined', () => {
    const result = prepareBookingPayment(
      user, professionalId, totalPrice, currency,
      { professionalId: 'prof-1' }, null, null, 1, 'manual',
    )

    expect(result.paymentData.metadata.bookingType).toBe('one_off')
  })

  it('throws when PII guard fails', () => {
    vi.mocked(assertNoSensitivePaymentPayload).mockImplementation(() => {
      throw new Error('Sensitive data detected')
    })

    expect(() =>
      prepareBookingPayment(
        user, professionalId, totalPrice, currency,
        bookingInput, null, null, 1, 'manual',
      ),
    ).toThrow('Sensitive data detected')

    expect(Sentry.captureException).toHaveBeenCalled()
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'booking_payment_sensitive_metadata_blocked',
      expect.any(Object),
    )
  })

  it('returns paymentMetadata alongside paymentData', () => {
    const result = prepareBookingPayment(
      user, professionalId, totalPrice, currency,
      { ...bookingInput, bookingType: 'recurring' },
      recurrenceGroupId, null, 4, 'manual',
    )

    expect(result.paymentMetadata).toEqual(result.paymentData.metadata)
  })
})
