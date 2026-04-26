import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  openCase,
  addCaseMessage,
  resolveCase,
  getCaseById,
  getCaseMessages,
  listCases,
} from './disputes'

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimit: vi.fn(),
}))

vi.mock('@/lib/disputes/dispute-service', () => ({
  openCase: vi.fn(),
  addCaseMessage: vi.fn(),
  resolveCase: vi.fn(),
  getCaseById: vi.fn(),
  getCaseMessages: vi.fn(),
  listCases: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import * as disputeService from '@/lib/disputes/dispute-service'

const mockedCreateClient = vi.mocked(createClient)
const mockedRateLimit = vi.mocked(rateLimit)
const mockedOpenCaseService = vi.mocked(disputeService.openCase)
const mockedAddCaseMessageService = vi.mocked(disputeService.addCaseMessage)
const mockedResolveCaseService = vi.mocked(disputeService.resolveCase)
const mockedGetCaseByIdService = vi.mocked(disputeService.getCaseById)
const mockedGetCaseMessagesService = vi.mocked(disputeService.getCaseMessages)
const mockedListCasesService = vi.mocked(disputeService.listCases)

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeSupabaseClient(role: string | null, userId: string = 'user-1') {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: null,
      }),
    },
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: role ? { role } : null,
        error: null,
      }),
    })),
  } as unknown as ReturnType<typeof createClient>
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('openCase action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 })
    mockedOpenCaseService.mockResolvedValue({ success: true, data: { caseId: 'case-1' } })
  })

  it('returns caseId on success', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    const result = await openCase('book-1', 'refund_request', 'Valid reason here')
    expect(result.success).toBe(true)
    expect(result.data?.caseId).toBe('case-1')
    expect(mockedOpenCaseService).toHaveBeenCalled()
  })

  it('returns rate limit error', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 })
    const result = await openCase('book-1', 'refund_request', 'Valid reason here')
    expect(result.success).toBe(false)
    expect(result.error).toContain('tentativas')
  })
})

describe('addCaseMessage action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 })
    mockedAddCaseMessageService.mockResolvedValue({ success: true, data: { messageId: 'msg-1' } })
  })

  it('returns messageId on success for reporter', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    const result = await addCaseMessage('case-1', 'Hello')
    expect(result.success).toBe(true)
    expect(result.data?.messageId).toBe('msg-1')
  })

  it('returns messageId on success for admin', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    const result = await addCaseMessage('case-1', 'Hello admin')
    expect(result.success).toBe(true)
    expect(result.data?.messageId).toBe('msg-1')
    expect(mockedAddCaseMessageService).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'case-1',
      'Hello admin',
      true,
    )
  })

  it('returns rate limit error', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 })
    const result = await addCaseMessage('case-1', 'Hello')
    expect(result.success).toBe(false)
    expect(result.error).toContain('mensagens')
  })
})

describe('resolveCase action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 })
    mockedResolveCaseService.mockResolvedValue({
      success: true,
      data: { resolvedAt: new Date().toISOString() },
    })
  })

  it('returns error when not admin', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    const result = await resolveCase('case-1', 'Resolution here')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Acesso restrito')
  })

  it('resolves case successfully', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin', 'admin-1'))
    const result = await resolveCase('case-1', 'Resolution here', 50)
    expect(result.success).toBe(true)
    expect(mockedResolveCaseService).toHaveBeenCalledWith(
      expect.anything(),
      'admin-1',
      'case-1',
      'Resolution here',
      50,
    )
  })

  it('returns rate limit error', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 })
    const result = await resolveCase('case-1', 'Resolution here')
    expect(result.success).toBe(false)
    expect(result.error).toContain('tentativas')
  })
})

describe('getCaseById action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns case for reporter', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    mockedGetCaseByIdService.mockResolvedValue({
      success: true,
      data: { id: 'case-1', reporter_id: 'user-1' } as any,
    })
    const result = await getCaseById('case-1')
    expect(result.success).toBe(true)
    expect(result.data?.id).toBe('case-1')
  })

  it('returns case for admin', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    mockedGetCaseByIdService.mockResolvedValue({
      success: true,
      data: { id: 'case-1', reporter_id: 'other-user' } as any,
    })
    const result = await getCaseById('case-1')
    expect(result.success).toBe(true)
    expect(mockedGetCaseByIdService).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'case-1',
      true,
    )
  })
})

describe('getCaseMessages action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns messages for reporter', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    mockedGetCaseMessagesService.mockResolvedValue({
      success: true,
      data: { messages: [{ id: 'msg-1', content: 'Hello' }] },
    })
    const result = await getCaseMessages('case-1')
    expect(result.success).toBe(true)
    expect(result.data?.messages).toHaveLength(1)
  })
})

describe('listCases action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 })
    mockedListCasesService.mockResolvedValue({
      success: true,
      data: { cases: [{ id: 'case-1' }], nextCursor: null },
    })
  })

  it('returns cases successfully', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    const result = await listCases()
    expect(result.success).toBe(true)
    expect(result.data?.cases).toHaveLength(1)
  })

  it('returns rate limit error', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 })
    const result = await listCases()
    expect(result.success).toBe(false)
    expect(result.error).toContain('requisições')
  })
})
