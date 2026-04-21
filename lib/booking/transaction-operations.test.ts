import { describe, it, expect, vi } from 'vitest'
import {
  createBookingWithPaymentAtomic,
  createBatchBookingsWithPaymentAtomic,
  createRecurringBookingWithPaymentAtomic,
} from './transaction-operations'

function mockSupabaseClient(rpcResult: { data?: unknown; error?: { message: string } | null }) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
  } as unknown as Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>
}

describe('createBookingWithPaymentAtomic', () => {
  const bookingData = {
    user_id: 'user-1',
    professional_id: 'prof-1',
    scheduled_at: '2024-06-15T10:00:00Z',
    start_time_utc: '2024-06-15T10:00:00Z',
    end_time_utc: '2024-06-15T11:00:00Z',
    timezone_user: 'America/Sao_Paulo',
    timezone_professional: 'America/Sao_Paulo',
    duration_minutes: 60,
    status: 'confirmed',
    booking_type: 'one_off',
    confirmation_mode_snapshot: 'auto_accept',
    cancellation_policy_snapshot: { code: 'standard' },
    price_brl: 100,
    price_user_currency: 100,
    price_total: 100,
    user_currency: 'BRL',
    notes: null,
    session_purpose: null,
    metadata: { source: 'test' },
  }

  const paymentData = {
    provider: 'legacy',
    amount_total: 100,
    currency: 'BRL',
    status: 'captured',
    metadata: {},
    captured_at: '2024-06-15T10:00:00Z',
  }

  it('returns success with booking and payment ids on atomic success', async () => {
    const supabase = mockSupabaseClient({
      data: [{ booking_id: 'booking-1', payment_id: 'payment-1' }],
      error: null,
    })

    const result = await createBookingWithPaymentAtomic(supabase, bookingData, paymentData)

    expect(result.ok).toBe(true)
    expect(result.bookingId).toBe('booking-1')
    expect(result.paymentId).toBe('payment-1')
    expect(supabase.rpc).toHaveBeenCalledWith('create_booking_with_payment', expect.any(Object))
  })

  it('returns fallback=true when RPC function does not exist', async () => {
    const supabase = mockSupabaseClient({
      data: null,
      error: { message: 'function public.create_booking_with_payment() does not exist' },
    })

    const result = await createBookingWithPaymentAtomic(supabase, bookingData, paymentData)

    expect(result.ok).toBe(false)
    expect(result.fallback).toBe(true)
  })

  it('returns fallback=false for other RPC errors', async () => {
    const supabase = mockSupabaseClient({
      data: null,
      error: { message: 'duplicate key value violates unique constraint' },
    })

    const result = await createBookingWithPaymentAtomic(supabase, bookingData, paymentData)

    expect(result.ok).toBe(false)
    expect(result.fallback).toBe(false)
  })
})

describe('createBatchBookingsWithPaymentAtomic', () => {
  const bookings = [{ scheduled_at: '2024-06-15T10:00:00Z', status: 'confirmed' }]
  const paymentData = {
    user_id: 'user-1',
    professional_id: 'prof-1',
    provider: 'legacy',
    amount_total: 100,
    currency: 'BRL',
    status: 'captured',
    metadata: {},
    captured_at: '2024-06-15T10:00:00Z',
  }

  it('returns success with booking ids on atomic success', async () => {
    const supabase = mockSupabaseClient({
      data: [{ booking_id: 'booking-1' }, { booking_id: 'booking-2' }],
      error: null,
    })

    const result = await createBatchBookingsWithPaymentAtomic(supabase, bookings, paymentData)

    expect(result.ok).toBe(true)
    expect(result.bookingIds).toEqual(['booking-1', 'booking-2'])
  })

  it('returns fallback=true when RPC function does not exist', async () => {
    const supabase = mockSupabaseClient({
      data: null,
      error: { message: 'function public.create_batch_bookings_with_payment() does not exist' },
    })

    const result = await createBatchBookingsWithPaymentAtomic(supabase, bookings, paymentData)

    expect(result.ok).toBe(false)
    expect(result.fallback).toBe(true)
  })
})

describe('createRecurringBookingWithPaymentAtomic', () => {
  const parent = { scheduled_at: '2024-06-15T10:00:00Z', status: 'confirmed' }
  const children = [{ scheduled_at: '2024-06-22T10:00:00Z', status: 'confirmed' }]
  const sessions = [{ start_time_utc: '2024-06-15T10:00:00Z', end_time_utc: '2024-06-15T11:00:00Z', status: 'confirmed', session_number: 1 }]
  const paymentData = {
    user_id: 'user-1',
    professional_id: 'prof-1',
    provider: 'legacy',
    amount_total: 100,
    currency: 'BRL',
    status: 'captured',
    metadata: {},
    captured_at: '2024-06-15T10:00:00Z',
  }

  it('returns success with all ids on atomic success', async () => {
    const supabase = mockSupabaseClient({
      data: [{
        parent_booking_id: 'parent-1',
        child_booking_ids: ['child-1'],
        session_ids: ['session-1'],
        payment_id: 'payment-1',
      }],
      error: null,
    })

    const result = await createRecurringBookingWithPaymentAtomic(supabase, parent, children, sessions, paymentData)

    expect(result.ok).toBe(true)
    expect(result.parentBookingId).toBe('parent-1')
    expect(result.childBookingIds).toEqual(['child-1'])
    expect(result.sessionIds).toEqual(['session-1'])
    expect(result.paymentId).toBe('payment-1')
  })

  it('returns fallback=true when RPC function does not exist', async () => {
    const supabase = mockSupabaseClient({
      data: null,
      error: { message: 'function public.create_recurring_booking_with_payment() does not exist' },
    })

    const result = await createRecurringBookingWithPaymentAtomic(supabase, parent, children, sessions, paymentData)

    expect(result.ok).toBe(false)
    expect(result.fallback).toBe(true)
  })
})
