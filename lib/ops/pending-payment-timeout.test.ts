import { describe, it, expect } from 'vitest'
import { runPendingPaymentTimeout } from './pending-payment-timeout'

describe('runPendingPaymentTimeout', () => {
  const now = new Date('2026-04-21T12:00:00.000Z')
  const cutoff = new Date('2026-04-21T11:30:00.000Z')

  function makeAdmin(opts: {
    bookings?: Array<{
      id: string
      user_id: string
      professional_id: string
      created_at: string
      metadata?: Record<string, unknown> | null
    }>
    payment?: { id: string } | null
    bookingsError?: string
    paymentError?: string
    updateError?: string
  }) {
    return {
      from: (table: string) => {
        if (table === 'bookings') {
          return {
            select: () => ({
              eq: () => ({
                lte: () => ({
                  order: () => ({
                    limit: () =>
                      Promise.resolve({
                        data: opts.bookings || [],
                        error: opts.bookingsError ? { message: opts.bookingsError } : null,
                      }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    maybeSingle: () =>
                      Promise.resolve({
                        data: { id: 'bk-1' },
                        error: opts.updateError ? { message: opts.updateError } : null,
                      }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'payments') {
          return {
            select: () => ({
              eq: () => ({
                limit: () => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: opts.payment ?? null,
                      error: opts.paymentError ? { message: opts.paymentError } : null,
                    }),
                }),
              }),
            }),
          }
        }
        if (table === 'notifications') {
          return {
            insert: () => Promise.resolve({ error: null }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    } as any
  }

  it('returns zero when no pending_payment bookings exist', async () => {
    const admin = makeAdmin({ bookings: [] })
    const result = await runPendingPaymentTimeout(admin, now)
    expect(result.checked).toBe(0)
    expect(result.cancelled).toBe(0)
  })

  it('cancels orphaned pending_payment bookings without payment', async () => {
    const admin = makeAdmin({
      bookings: [
        {
          id: 'bk-1',
          user_id: 'user-1',
          professional_id: 'prof-1',
          created_at: cutoff.toISOString(),
          metadata: null,
        },
      ],
      payment: null,
    })
    const result = await runPendingPaymentTimeout(admin, now)
    expect(result.checked).toBe(1)
    expect(result.cancelled).toBe(1)
  })

  it('skips bookings that have a payment', async () => {
    const admin = makeAdmin({
      bookings: [
        {
          id: 'bk-1',
          user_id: 'user-1',
          professional_id: 'prof-1',
          created_at: cutoff.toISOString(),
          metadata: null,
        },
      ],
      payment: { id: 'pay-1' },
    })
    const result = await runPendingPaymentTimeout(admin, now)
    expect(result.checked).toBe(1)
    expect(result.cancelled).toBe(0)
  })

  it('throws on bookings query error', async () => {
    const admin = makeAdmin({ bookingsError: 'db down' })
    await expect(runPendingPaymentTimeout(admin, now)).rejects.toThrow('db down')
  })
})
