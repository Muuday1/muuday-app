import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({
  inngest: {
    createFunction: vi.fn((_config, handler) => ({ config: _config, fn: handler })),
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/notifications/payout-notifications', () => ({
  notifyProfessionalAboutPayout: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/analytics/server-events', () => ({
  trackPayoutCompleted: vi.fn(),
  trackPayoutFailed: vi.fn(),
}))

const { processTrolleyWebhook } = await import('./trolley-webhook-processor')
const { createAdminClient } = await import('@/lib/supabase/admin')
const { notifyProfessionalAboutPayout } = await import('@/lib/notifications/payout-notifications')
const { trackPayoutCompleted, trackPayoutFailed } = await import('@/lib/analytics/server-events')

const mockedCreateAdminClient = vi.mocked(createAdminClient)
const mockedNotifyProfessional = vi.mocked(notifyProfessionalAboutPayout)
const mockedTrackCompleted = vi.mocked(trackPayoutCompleted)
const mockedTrackFailed = vi.mocked(trackPayoutFailed)

describe('processTrolleyWebhook', () => {
  const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const mockStep = {
    run: vi.fn(async (_name: string, fn: () => Promise<unknown>) => fn()),
  }

  function makeEvent(eventType: string, data?: Record<string, unknown>) {
    return {
      name: 'trolley/webhook.received',
      data: {
        eventType,
        payload: { data: data || {} },
      },
    } as any
  }

  function buildAdminClient(scenario: string) {
    const insertMock = vi.fn().mockReturnValue({ error: null })
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'trolley_recipients') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (scenario === 'recipient_exists') {
              return Promise.resolve({ data: { id: 'tr-1', trolley_recipient_id: 'rec-1' }, error: null })
            }
            if (scenario === 'recipient_not_found') {
              return Promise.resolve({ data: null, error: null })
            }
            if (scenario === 'recipient_with_professional') {
              return Promise.resolve({ data: { id: 'tr-1', trolley_recipient_id: 'rec-1', professional_id: 'prof-1' }, error: null })
            }
            return Promise.resolve({ data: null, error: null })
          }),
          insert: insertMock,
          update: updateMock,
        }
      }

      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: scenario === 'profile_found' ? { id: 'user-1', email: 'pro@example.com' } : null,
            error: null,
          }),
        }
      }

      if (table === 'professionals') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: scenario === 'profile_found' ? { id: 'prof-1', user_id: 'user-1' } : null,
            error: null,
          }),
        }
      }

      if (table === 'payout_batch_items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (scenario === 'all_completed' || scenario === 'all_completed_with_fail' || scenario === 'payment_item_found') {
              return Promise.resolve({ data: { id: 'item-1', batch_id: 'batch-1', professional_id: 'prof-1', amount: 10000, net_amount: 9500, debt_deducted: 500 }, error: null })
            }
            return Promise.resolve({ data: null, error: null })
          }),
          single: vi.fn().mockResolvedValue({ data: { professional_id: 'prof-1', amount: 10000, net_amount: 9500, debt_deducted: 500 }, error: null }),
          then: vi.fn().mockImplementation((cb: (value: { data: Array<{ status: string }>; error: null }) => void) => {
            cb({
              data: scenario === 'all_completed'
                ? [{ status: 'completed' }, { status: 'completed' }]
                : scenario === 'all_completed_with_fail'
                  ? [{ status: 'completed' }, { status: 'failed' }]
                  : [{ status: 'processing' }],
              error: null,
            })
            return Promise.resolve({ data: [], error: null })
          }),
          update: updateMock,
        }
      }

      if (table === 'payout_batches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (scenario === 'batch_found') {
              return Promise.resolve({ data: { id: 'batch-local-1' }, error: null })
            }
            return Promise.resolve({ data: null, error: null })
          }),
          update: updateMock,
        }
      }

      if (table === 'notifications') {
        return {
          insert: insertMock,
        }
      }

      if (table === 'professional_settings') {
        return {
          update: updateMock,
        }
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    })

    return { from: fromMock, insert: insertMock, update: updateMock } as any
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger.info.mockClear()
    mockLogger.warn.mockClear()
    mockLogger.error.mockClear()
    mockStep.run.mockClear()
    mockedNotifyProfessional.mockClear()
    mockedTrackCompleted.mockClear()
    mockedTrackFailed.mockClear()
  })

  it('throws when admin client is not configured', async () => {
    mockedCreateAdminClient.mockReturnValue(null)

    await expect(
      (processTrolleyWebhook as any).fn({ step: mockStep, event: makeEvent('recipient.created'), logger: mockLogger }),
    ).rejects.toThrow('Admin client not configured')
  })

  it('handles recipient.created and inserts linked record when profile found', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient('profile_found'))

    const result = await (processTrolleyWebhook as any).fn({
      step: mockStep,
      event: makeEvent('recipient.created', { id: 'rec-1', email: 'pro@example.com', firstName: 'John', lastName: 'Doe' }),
      logger: mockLogger,
    })

    expect(result.handled).toBe(true)
    expect(result.action).toBe('inserted_linked')
    expect(result.recipientId).toBe('rec-1')
  })

  it('handles recipient.created and inserts unlinked record when profile not found', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient('recipient_not_found'))

    const result = await (processTrolleyWebhook as any).fn({
      step: mockStep,
      event: makeEvent('recipient.created', { id: 'rec-1', email: 'unknown@example.com' }),
      logger: mockLogger,
    })

    expect(result.handled).toBe(true)
    expect(result.action).toBe('inserted_unlinked')
  })

  it('handles recipient.created as already exists when duplicate', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient('recipient_exists'))

    const result = await (processTrolleyWebhook as any).fn({
      step: mockStep,
      event: makeEvent('recipient.created', { id: 'rec-1', email: 'pro@example.com' }),
      logger: mockLogger,
    })

    expect(result.handled).toBe(true)
    expect(result.action).toBe('already_exists')
  })

  it('handles recipient.updated with active status', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient('recipient_exists'))

    const result = await (processTrolleyWebhook as any).fn({
      step: mockStep,
      event: makeEvent('recipient.updated', { id: 'rec-1', status: 'active', payoutMethod: 'paypal', paypalEmail: 'pro@example.com' }),
      logger: mockLogger,
    })

    expect(result.handled).toBe(true)
    expect(result.action).toBe('updated')
  })

  it('syncs payout_kyc_completed to professional_settings when recipient.updated becomes active with professional_id', async () => {
    const adminClient = buildAdminClient('recipient_with_professional')
    mockedCreateAdminClient.mockReturnValue(adminClient)

    const result = await (processTrolleyWebhook as any).fn({
      step: mockStep,
      event: makeEvent('recipient.updated', { id: 'rec-1', status: 'active', payoutMethod: 'paypal', paypalEmail: 'pro@example.com' }),
      logger: mockLogger,
    })

    expect(result.handled).toBe(true)
    expect(result.action).toBe('updated')

    // Verify professional_settings was updated with payout_kyc_completed = true
    const settingsUpdateCall = adminClient.from('professional_settings').update
    expect(settingsUpdateCall).toHaveBeenCalledWith(
      expect.objectContaining({ payout_kyc_completed: true }),
    )
  })

  it('handles payment.updated with completed status and updates batch', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient('all_completed'))

    const result = await (processTrolleyWebhook as any).fn({
      step: mockStep,
      event: makeEvent('payment.updated', { id: 'pay-1', status: 'completed', recipient: { id: 'rec-1' } }),
      logger: mockLogger,
    })

    expect(result.handled).toBe(true)
    expect(result.action).toBe('updated')
  })

  it('handles batch.updated with completed status', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient('batch_found'))

    const result = await (processTrolleyWebhook as any).fn({
      step: mockStep,
      event: makeEvent('batch.updated', { id: 'batch-1', status: 'completed' }),
      logger: mockLogger,
    })

    expect(result.handled).toBe(true)
    expect(result.action).toBe('updated')
    expect(result.batchId).toBe('batch-1')
  })

  it('returns unhandled for unknown event types', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient('recipient_not_found'))

    const result = await (processTrolleyWebhook as any).fn({
      step: mockStep,
      event: makeEvent('unknown.event'),
      logger: mockLogger,
    })

    expect(result.handled).toBe(false)
    expect(result.reason).toBe('unhandled_event_type')
  })
})
