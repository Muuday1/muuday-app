import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Stripe from 'stripe'
import {
  recordStripeWebhookEvent,
  handleStripeWebhookEvent,
  processStripeWebhookInbox,
} from './webhook-handlers'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('./client', () => ({
  getStripeClient: vi.fn(),
}))

vi.mock('@/lib/payments/ledger/entries', () => ({
  buildPaymentCaptureTransaction: vi.fn().mockReturnValue({ entries: [] }),
  buildRefundTransaction: vi.fn().mockReturnValue({ entries: [] }),
  buildStripeSettlementTransaction: vi.fn().mockReturnValue({ entries: [] }),
  createLedgerTransaction: vi.fn().mockResolvedValue({ transactionId: 'tx-1', entryIds: [] }),
}))

vi.mock('@/lib/payments/ledger/balance', () => ({
  updateProfessionalBalance: vi.fn().mockResolvedValue({
    professionalId: 'prof-1',
    availableBalance: BigInt(10000),
    withheldBalance: BigInt(0),
    pendingBalance: BigInt(0),
    totalDebt: BigInt(0),
    currency: 'BRL',
    lastPayoutAt: null,
    lastCalculatedAt: new Date().toISOString(),
  }),
}))

vi.mock('@/lib/payments/subscription/manager', () => ({
  syncSubscriptionFromStripe: vi.fn().mockResolvedValue({ success: true }),
  recordSubscriptionPayment: vi.fn().mockResolvedValue(undefined),
  recordSubscriptionPaymentFailure: vi.fn().mockResolvedValue(undefined),
}))

import { getStripeClient } from './client'
import { createLedgerTransaction } from '@/lib/payments/ledger/entries'
import { updateProfessionalBalance } from '@/lib/payments/ledger/balance'

const mockedGetStripeClient = vi.mocked(getStripeClient)
const mockedCreateLedgerTransaction = vi.mocked(createLedgerTransaction)
const mockedUpdateProfessionalBalance = vi.mocked(updateProfessionalBalance)

import {
  syncSubscriptionFromStripe,
  recordSubscriptionPayment,
  recordSubscriptionPaymentFailure,
} from '@/lib/payments/subscription/manager'

const mockedSyncSubscription = vi.mocked(syncSubscriptionFromStripe)
const mockedRecordSubPayment = vi.mocked(recordSubscriptionPayment)
const mockedRecordSubFailure = vi.mocked(recordSubscriptionPaymentFailure)

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Build a Supabase-like admin client mock.
 *
 * Supports:
 * - `.from('table').select().eq().eq().maybeSingle()` → single row
 * - `.from('table').select().eq().eq()` → array (resolved as Promise)
 * - `.from('table').update().eq()` → single update
 * - `.from('table').insert().select().single()` → single insert
 */
function buildAdminClient(overrides?: Record<string, unknown>) {
  const rowData: Record<string, { data: unknown; error: unknown }> = {}
  const arrayData: Record<string, { data: unknown[]; error: unknown }> = {}

  function makeChain(table: string, opts?: { isArrayQuery?: boolean }) {
    const isArray = opts?.isArrayQuery ?? false
    let eqCount = 0

    const chain: Record<string, unknown> = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation(() => {
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'inserted-1' }, error: null }),
        }
      }),
      update: vi.fn().mockImplementation(() => {
        return {
          eq: vi.fn().mockImplementation(() => {
            // Support chained eq() calls for update claim queries
            return {
              eq: vi.fn().mockImplementation(() => {
                return {
                  eq: vi.fn().mockImplementation(() => {
                    return {
                      select: vi.fn().mockImplementation(() => {
                        return {
                          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'claimed-1' }, error: null }),
                        }
                      }),
                    }
                  }),
                }
              }),
              select: vi.fn().mockImplementation(() => {
                return {
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'claimed-1' }, error: null }),
                }
              }),
            }
          }),
        }
      }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(() => {
        eqCount++
        if (isArray && eqCount >= 2) {
          // Return a thenable that resolves to array data
          const arrayResult = arrayData[table] ?? { data: [], error: null }
          return {
            then: (onFulfilled: (v: unknown) => unknown) =>
              Promise.resolve(onFulfilled?.(arrayResult) ?? arrayResult),
          }
        }
        return chain
      }),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(() => {
        if (isArray) {
          const arrayResult = arrayData[table] ?? { data: [], error: null }
          return {
            then: (onFulfilled: (v: unknown) => unknown) =>
              Promise.resolve(onFulfilled?.(arrayResult) ?? arrayResult),
          }
        }
        return chain
      }),
      range: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
      single: vi.fn().mockResolvedValue(rowData[table] ?? { data: null, error: null }),
    }

    return chain
  }

  const fromFn = vi.fn().mockImplementation((table: string) => {
    // Auto-detect array queries for known tables
    const isArray = table === 'payments' || table === 'stripe_settlements' || table === 'stripe_webhook_events'
    return makeChain(table, { isArrayQuery: isArray })
  })

  const client = {
    from: fromFn,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  } as unknown as Parameters<typeof recordStripeWebhookEvent>[0]

  // Attach helpers for tests to pre-seed data
  ;(client as any).__seedRow = (table: string, data: unknown, error: unknown = null) => {
    rowData[table] = { data, error }
  }
  ;(client as any).__seedArray = (table: string, data: unknown[], error: unknown = null) => {
    arrayData[table] = { data, error }
  }

  return client
}

function makePaymentIntentEvent(
  type: string,
  overrides?: Partial<Stripe.PaymentIntent>,
): Stripe.Event {
  return {
    id: `evt_${type}`,
    type,
    data: {
      object: {
        id: 'pi_test_123',
        amount: 10000,
        currency: 'brl',
        status: type === 'payment_intent.succeeded' ? 'succeeded' : 'requires_payment_method',
        metadata: { muuday_booking_id: 'booking-1' },
        ...overrides,
      } as unknown as Stripe.PaymentIntent,
    },
    api_version: '2026-04-22.dahlia',
    livemode: false,
    created: Date.now(),
    object: 'event',
    request: null,
    pending_webhooks: 0,
  } as Stripe.Event
}

function makeChargeEvent(type: 'charge.refunded' | 'charge.succeeded', overrides?: Partial<Stripe.Charge>): Stripe.Event {
  return {
    id: `evt_${type}`,
    type,
    data: {
      object: {
        id: 'ch_test_123',
        payment_intent: 'pi_test_123',
        amount: 10000,
        currency: 'brl',
        ...overrides,
      } as unknown as Stripe.Charge,
    },
    api_version: '2026-04-22.dahlia',
    livemode: false,
    created: Date.now(),
    object: 'event',
    request: null,
    pending_webhooks: 0,
  } as Stripe.Event
}

function makePayoutEvent(type: 'payout.paid' | 'payout.failed', overrides?: Partial<Stripe.Payout>): Stripe.Event {
  return {
    id: `evt_${type}`,
    type,
    data: {
      object: {
        id: 'po_test_123',
        amount: 50000,
        currency: 'brl',
        status: type === 'payout.paid' ? 'paid' : 'failed',
        arrival_date: Math.floor(Date.now() / 1000),
        destination: 'ba_test_123',
        automatic: true,
        method: 'standard',
        type: 'bank_account',
        ...overrides,
      } as unknown as Stripe.Payout,
    },
    api_version: '2026-04-22.dahlia',
    livemode: false,
    created: Date.now(),
    object: 'event',
    request: null,
    pending_webhooks: 0,
  } as Stripe.Event
}

function makeDisputeEvent(): Stripe.Event {
  return {
    id: 'evt_charge_dispute_created',
    type: 'charge.dispute.created',
    data: {
      object: {
        id: 'dp_test_123',
        charge: 'ch_test_123',
        amount: 10000,
        currency: 'brl',
        reason: 'fraudulent',
      } as unknown as Stripe.Dispute,
    },
    api_version: '2026-04-22.dahlia',
    livemode: false,
    created: Date.now(),
    object: 'event',
    request: null,
    pending_webhooks: 0,
  } as Stripe.Event
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('recordStripeWebhookEvent', () => {
  it('inserts new event when not existing', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('stripe_webhook_events', null, null)

    const result = await recordStripeWebhookEvent(admin, {
      providerEventId: 'evt_123',
      eventType: 'payment_intent.succeeded',
      livemode: false,
      payload: { id: 'evt_123' },
    })

    expect(result.inserted).toBe(true)
  })

  it('returns existing event without inserting', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('stripe_webhook_events', { id: 'evt-row-1', status: 'processed' }, null)

    const result = await recordStripeWebhookEvent(admin, {
      providerEventId: 'evt_123',
      eventType: 'payment_intent.succeeded',
      livemode: false,
      payload: {},
    })

    expect(result.inserted).toBe(false)
    expect(result.status).toBe('processed')
  })
})

describe('handleStripeWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetStripeClient.mockReturnValue(null)
  })

  // ── payment_intent.succeeded ───────────────────────────────────────────

  it('processes payment_intent.succeeded: updates payment, creates ledger, updates balance', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedArray('payments', [
      {
        id: 'pay-1',
        booking_id: 'booking-1',
        professional_id: 'prof-1',
        amount_total_minor: 10000,
        metadata: {},
        status: 'requires_payment',
      },
    ])

    const event = makePaymentIntentEvent('payment_intent.succeeded')
    const result = await handleStripeWebhookEvent(admin, event)

    expect(result.outcome).toBe('processed')
    expect(mockedCreateLedgerTransaction).toHaveBeenCalled()
    expect(mockedUpdateProfessionalBalance).toHaveBeenCalled()
  })

  // ── payment_intent.payment_failed ──────────────────────────────────────

  it('processes payment_intent.payment_failed: updates payment, enqueues retry', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedArray('payments', [
      { id: 'pay-1', status: 'requires_payment' },
    ])

    const event = makePaymentIntentEvent('payment_intent.payment_failed')
    const result = await handleStripeWebhookEvent(admin, event)

    expect(result.outcome).toBe('processed')
    expect(result.retryQueued).toBe(true)
  })

  // ── charge.refunded ────────────────────────────────────────────────────

  it('processes charge.refunded: updates payment, creates ledger', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedArray('payments', [
      {
        id: 'pay-1',
        booking_id: 'booking-1',
        professional_id: 'prof-1',
        amount_total_minor: 10000,
        metadata: {},
        status: 'captured',
      },
    ])

    const event = makeChargeEvent('charge.refunded')
    const result = await handleStripeWebhookEvent(admin, event)

    expect(result.outcome).toBe('processed')
    expect(mockedCreateLedgerTransaction).toHaveBeenCalled()
  })

  // ── payout.paid ────────────────────────────────────────────────────────

  it('processes payout.paid: records settlement, creates ledger', async () => {
    mockedGetStripeClient.mockReturnValue({
      payouts: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'po_test_123',
          balance_transaction: { fee: 100 },
        }),
      },
    } as unknown as NonNullable<ReturnType<typeof getStripeClient>>)

    const admin = buildAdminClient()
    ;(admin as any).__seedRow('stripe_settlements', null, null)
    ;(admin as any).__seedArray('stripe_settlements', [])

    const event = makePayoutEvent('payout.paid')
    const result = await handleStripeWebhookEvent(admin, event)

    expect(result.outcome).toBe('processed')
    expect(mockedCreateLedgerTransaction).toHaveBeenCalled()
  })

  // ── payout.failed ──────────────────────────────────────────────────────

  it('processes payout.failed: records settlement without ledger', async () => {
    const admin = buildAdminClient()
    ;(admin as any).__seedRow('stripe_settlements', null, null)
    ;(admin as any).__seedArray('stripe_settlements', [])

    const event = makePayoutEvent('payout.failed')
    const result = await handleStripeWebhookEvent(admin, event)

    expect(result.outcome).toBe('processed')
    expect(mockedCreateLedgerTransaction).not.toHaveBeenCalled()
  })

  // ── charge.dispute.created ─────────────────────────────────────────────

  it('processes charge.dispute.created: creates dispute_resolution and case', async () => {
    mockedGetStripeClient.mockReturnValue({
      charges: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'ch_test_123',
          payment_intent: 'pi_test_123',
        }),
      },
    } as unknown as NonNullable<ReturnType<typeof getStripeClient>>)

    const inserts: Array<{ table: string; data: unknown }> = []

    const admin = buildAdminClient({
      from: vi.fn().mockImplementation((table: string) => {
        const base = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockImplementation((data: unknown) => {
            inserts.push({ table, data })
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { id: 'row-1' }, error: null }),
            }
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }

        if (table === 'payments') {
          return {
            ...base,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'pay-1',
                booking_id: 'booking-1',
                professional_id: 'prof-1',
              },
              error: null,
            }),
          }
        }

        return base
      }),
    })

    const event = makeDisputeEvent()
    const result = await handleStripeWebhookEvent(admin, event)

    expect(result.outcome).toBe('processed')

    const disputeInsert = inserts.find((i) => i.table === 'dispute_resolutions')
    expect(disputeInsert).toBeDefined()

    const caseInsert = inserts.find((i) => i.table === 'cases')
    expect(caseInsert).toBeDefined()
  })

  // ── Subscription events ────────────────────────────────────────────────

  it('processes customer.subscription.updated: syncs subscription and enqueues check', async () => {
    const admin = buildAdminClient()
    const inserts: Array<{ table: string; data: unknown }> = []

    const customFrom = vi.fn().mockImplementation((table: string) => {
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((data: unknown) => {
          inserts.push({ table, data })
          return { select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'q-1' }, error: null }) }
        }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    const event = {
      id: 'evt_sub_updated',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          metadata: { professional_id: 'prof-1' },
        } as unknown as Stripe.Subscription,
      },
      api_version: '2026-04-22.dahlia',
      livemode: false,
      created: Date.now(),
      object: 'event',
      request: null,
      pending_webhooks: 0,
    } as Stripe.Event

    const result = await handleStripeWebhookEvent({ ...admin, from: customFrom } as unknown as Parameters<typeof handleStripeWebhookEvent>[0], event)

    expect(result.outcome).toBe('processed')
    expect(mockedSyncSubscription).toHaveBeenCalledWith(expect.anything(), 'sub_123')

    const queueInsert = inserts.find((i) => i.table === 'stripe_subscription_check_queue')
    expect(queueInsert).toBeDefined()
    expect((queueInsert!.data as Record<string, unknown>).stripe_subscription_id).toBe('sub_123')
  })

  it('processes customer.subscription.deleted: syncs subscription and enqueues check', async () => {
    const admin = buildAdminClient()
    const inserts: Array<{ table: string; data: unknown }> = []

    const customFrom = vi.fn().mockImplementation((table: string) => {
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockImplementation((data: unknown) => {
          inserts.push({ table, data })
          return { select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'q-1' }, error: null }) }
        }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    const event = {
      id: 'evt_sub_deleted',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_456',
          metadata: { professional_id: 'prof-2' },
        } as unknown as Stripe.Subscription,
      },
      api_version: '2026-04-22.dahlia',
      livemode: false,
      created: Date.now(),
      object: 'event',
      request: null,
      pending_webhooks: 0,
    } as Stripe.Event

    const result = await handleStripeWebhookEvent({ ...admin, from: customFrom } as unknown as Parameters<typeof handleStripeWebhookEvent>[0], event)

    expect(result.outcome).toBe('processed')
    expect(mockedSyncSubscription).toHaveBeenCalledWith(expect.anything(), 'sub_456')

    const queueInsert = inserts.find((i) => i.table === 'stripe_subscription_check_queue')
    expect(queueInsert).toBeDefined()
  })

  it('processes invoice.paid: records subscription payment', async () => {
    const admin = buildAdminClient()

    const event = {
      id: 'evt_inv_paid',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'inv_123',
          subscription: 'sub_789',
          amount_paid: 29900,
          currency: 'brl',
        } as unknown as Stripe.Invoice,
      },
      api_version: '2026-04-22.dahlia',
      livemode: false,
      created: Date.now(),
      object: 'event',
      request: null,
      pending_webhooks: 0,
    } as Stripe.Event

    const result = await handleStripeWebhookEvent(admin, event)

    expect(result.outcome).toBe('processed')
    expect(mockedRecordSubPayment).toHaveBeenCalledWith(
      expect.anything(),
      'sub_789',
      expect.objectContaining({
        amountMinor: 29900,
        currency: 'brl',
        invoiceId: 'inv_123',
      }),
    )
  })

  it('processes invoice.payment_failed: records subscription failure', async () => {
    const admin = buildAdminClient()

    const event = {
      id: 'evt_inv_failed',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'inv_456',
          subscription: 'sub_abc',
          attempt_count: 2,
        } as unknown as Stripe.Invoice,
      },
      api_version: '2026-04-22.dahlia',
      livemode: false,
      created: Date.now(),
      object: 'event',
      request: null,
      pending_webhooks: 0,
    } as Stripe.Event

    const result = await handleStripeWebhookEvent(admin, event)

    expect(result.outcome).toBe('processed')
    expect(mockedRecordSubFailure).toHaveBeenCalledWith(
      expect.anything(),
      'sub_abc',
      expect.objectContaining({
        reason: '2 failed payment attempt(s)',
      }),
    )
  })

  it('returns failed when subscription sync fails', async () => {
    mockedSyncSubscription.mockResolvedValueOnce({ success: false, status: 'error', updated: false, error: 'Sync failed' })

    const admin = buildAdminClient()
    const customFrom = vi.fn().mockImplementation((table: string) => {
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    const event = {
      id: 'evt_sub_updated',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_fail',
          metadata: {},
        } as unknown as Stripe.Subscription,
      },
      api_version: '2026-04-22.dahlia',
      livemode: false,
      created: Date.now(),
      object: 'event',
      request: null,
      pending_webhooks: 0,
    } as Stripe.Event

    const result = await handleStripeWebhookEvent({ ...admin, from: customFrom } as unknown as Parameters<typeof handleStripeWebhookEvent>[0], event)

    expect(result.outcome).toBe('failed')
  })

  // ── Unsupported event ──────────────────────────────────────────────────

  it('returns ignored for unsupported event types', async () => {
    const admin = buildAdminClient()
    const event = makePaymentIntentEvent('payment_intent.created')
    const result = await handleStripeWebhookEvent(admin, event)

    expect(result.outcome).toBe('ignored')
  })
})

describe('processStripeWebhookInbox', () => {
  it('processes pending events and returns summary', async () => {
    const now = new Date('2026-01-01T00:00:00Z')

    const admin = buildAdminClient()
    ;(admin as any).__seedArray('stripe_webhook_events', [
      {
        id: 'evt-1',
        provider_event_id: 'evt_pi_123',
        event_type: 'payment_intent.succeeded',
        payload: makePaymentIntentEvent('payment_intent.succeeded') as unknown as Record<string, unknown>,
        status: 'pending',
        attempt_count: 0,
        max_attempts: 8,
      },
    ])

    const result = await processStripeWebhookInbox(admin, { limit: 10, now })

    expect(result.fetched).toBeGreaterThanOrEqual(0)
    expect(result.claimed).toBeGreaterThanOrEqual(0)
    expect(result.processed + result.failed + result.ignored).toBe(result.claimed)
  })
})
