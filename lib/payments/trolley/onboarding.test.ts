import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateTrolleyRecipient = vi.fn()
const mockGetTrolleyRecipient = vi.fn()

vi.mock('./client', () => ({
  createTrolleyRecipient: mockCreateTrolleyRecipient,
  getTrolleyRecipient: mockGetTrolleyRecipient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

const {
  createProfessionalTrolleyRecipient,
  getProfessionalPayoutStatus,
  syncTrolleyRecipientStatus,
} = await import('./onboarding')

const { createAdminClient } = await import('@/lib/supabase/admin')

const mockedCreateAdminClient = vi.mocked(createAdminClient)

function buildAdminClient(overrides?: Record<string, unknown>) {
  const base = {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockReturnValue({ error: null }),
      update: vi.fn().mockReturnThis(),
    }),
  }
  return { ...base, ...overrides } as any
}

describe('createProfessionalTrolleyRecipient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateTrolleyRecipient.mockResolvedValue({ id: 'rec-1', email: 'pro@example.com', status: 'pending' })
  })

  it('returns already exists when professional has a recipient', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'tr-1', trolley_recipient_id: 'rec-1', kyc_status: 'approved', is_active: true },
          error: null,
        }),
      }),
    }))

    const result = await createProfessionalTrolleyRecipient({} as any, 'prof-1')
    expect(result.success).toBe(true)
    expect(result.alreadyExists).toBe(true)
    expect(result.recipientId).toBe('rec-1')
    expect(mockCreateTrolleyRecipient).not.toHaveBeenCalled()
  })

  it('returns error when professional not found', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'trolley_recipients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        if (table === 'professionals') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }
      }),
    }))

    const result = await createProfessionalTrolleyRecipient({} as any, 'prof-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('returns error when professional has no email', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'trolley_recipients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        if (table === 'professionals') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'prof-1',
                user_id: 'user-1',
                profiles: { email: null, full_name: 'Test' },
              },
              error: null,
            }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }
      }),
    }))

    const result = await createProfessionalTrolleyRecipient({} as any, 'prof-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('no email')
  })

  it('creates recipient and inserts local record on success', async () => {
    const insertMock = vi.fn().mockReturnValue({ error: null })
    mockedCreateAdminClient.mockReturnValue(buildAdminClient({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'trolley_recipients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: insertMock,
          }
        }
        if (table === 'professionals') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'prof-1',
                user_id: 'user-1',
                profiles: { email: 'pro@example.com', full_name: 'John Doe', first_name: 'John', last_name: 'Doe' },
              },
              error: null,
            }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }
      }),
    }))

    const result = await createProfessionalTrolleyRecipient({} as any, 'prof-1')

    expect(result.success).toBe(true)
    expect(result.recipientId).toBe('rec-1')
    expect(result.alreadyExists).toBe(false)
    expect(mockCreateTrolleyRecipient).toHaveBeenCalledWith(expect.objectContaining({ email: 'pro@example.com' }))
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      professional_id: 'prof-1',
      trolley_recipient_id: 'rec-1',
      kyc_status: 'pending',
      is_active: false,
    }))
  })

  it('returns error when Trolley API fails', async () => {
    mockCreateTrolleyRecipient.mockRejectedValue(new Error('API rate limit'))

    mockedCreateAdminClient.mockReturnValue(buildAdminClient({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'trolley_recipients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        if (table === 'professionals') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'prof-1',
                user_id: 'user-1',
                profiles: { email: 'pro@example.com', full_name: 'John Doe' },
              },
              error: null,
            }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }
      }),
    }))

    const result = await createProfessionalTrolleyRecipient({} as any, 'prof-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('API rate limit')
  })

  it('returns error when admin client is not configured', async () => {
    mockedCreateAdminClient.mockReturnValue(null)

    const result = await createProfessionalTrolleyRecipient({} as any, 'prof-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Admin client not configured')
  })
})

describe('getProfessionalPayoutStatus', () => {
  it('returns hasRecipient false when no record', async () => {
    const admin = buildAdminClient()
    const result = await getProfessionalPayoutStatus(admin, 'prof-1')
    expect(result.hasRecipient).toBe(false)
  })

  it('returns status when record exists', async () => {
    const admin = buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { kyc_status: 'approved', is_active: true, payout_method: 'paypal', paypal_email: 'pro@example.com' },
          error: null,
        }),
      }),
    })

    const result = await getProfessionalPayoutStatus(admin, 'prof-1')
    expect(result.hasRecipient).toBe(true)
    expect(result.kycStatus).toBe('approved')
    expect(result.isActive).toBe(true)
    expect(result.payoutMethod).toBe('paypal')
    expect(result.paypalEmail).toBe('pro@example.com')
  })
})

describe('syncTrolleyRecipientStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when no local recipient found', async () => {
    mockedCreateAdminClient.mockReturnValue(buildAdminClient({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockReturnThis(),
      }),
    }))

    const result = await syncTrolleyRecipientStatus({} as any, 'prof-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('No Trolley recipient found')
  })

  it('maps active → approved and updates local record', async () => {
    mockGetTrolleyRecipient.mockResolvedValue({
      id: 'rec-1',
      email: 'pro@example.com',
      status: 'active',
      payoutMethod: 'paypal',
      paypalEmail: 'pro@example.com',
    })

    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
    mockedCreateAdminClient.mockReturnValue(buildAdminClient({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'trolley_recipients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { trolley_recipient_id: 'rec-1' }, error: null }),
            update: updateMock,
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }
      }),
    }))

    const result = await syncTrolleyRecipientStatus({} as any, 'prof-1')
    expect(result.success).toBe(true)
    expect(result.kycStatus).toBe('approved')
    expect(result.isActive).toBe(true)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      kyc_status: 'approved',
      is_active: true,
      activated_at: expect.any(String),
    }))
  })

  it('maps incomplete → in_review', async () => {
    mockGetTrolleyRecipient.mockResolvedValue({ id: 'rec-1', email: 'pro@example.com', status: 'incomplete' })

    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
    mockedCreateAdminClient.mockReturnValue(buildAdminClient({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'trolley_recipients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { trolley_recipient_id: 'rec-1' }, error: null }),
            update: updateMock,
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }
      }),
    }))

    const result = await syncTrolleyRecipientStatus({} as any, 'prof-1')
    expect(result.kycStatus).toBe('in_review')
    expect(result.isActive).toBe(false)
  })

  it('maps inactive → rejected', async () => {
    mockGetTrolleyRecipient.mockResolvedValue({ id: 'rec-1', email: 'pro@example.com', status: 'inactive' })

    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })
    mockedCreateAdminClient.mockReturnValue(buildAdminClient({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'trolley_recipients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { trolley_recipient_id: 'rec-1' }, error: null }),
            update: updateMock,
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }
      }),
    }))

    const result = await syncTrolleyRecipientStatus({} as any, 'prof-1')
    expect(result.kycStatus).toBe('rejected')
    expect(result.isActive).toBe(false)
  })
})
