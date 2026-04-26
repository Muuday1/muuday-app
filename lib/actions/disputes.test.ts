import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  openCase,
  addCaseMessage,
  resolveCase,
  getCaseById,
  getCaseMessages,
  listCases,
} from './disputes'
import type { DisputeResult } from '@/lib/disputes/dispute-service'

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

// ─── Type Assertion Helpers ───────────────────────────────────────────────

function assertSuccess<T>(result: DisputeResult<T>): asserts result is { success: true; data: T } {
  expect(result.success).toBe(true)
}

function assertError<T>(result: DisputeResult<T>): asserts result is { success: false; error: string } {
  expect(result.success).toBe(false)
}

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
  } as unknown as Awaited<ReturnType<typeof createClient>>
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('openCase action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, limit: 100, retryAfterSeconds: 0, source: 'memory' as const })
    mockedOpenCaseService.mockResolvedValue({ success: true, data: { caseId: 'case-1' } })
  })

  it('returns caseId on success', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    const result = await openCase('book-1', 'refund_request', 'Valid reason here')
    assertSuccess(result)
    expect(result.data?.caseId).toBe('case-1')
    expect(mockedOpenCaseService).toHaveBeenCalled()
  })

  it('returns rate limit error', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, limit: 100, retryAfterSeconds: 60, source: 'memory' as const })
    const result = await openCase('book-1', 'refund_request', 'Valid reason here')
    assertError(result)
    expect(result.error).toContain('tentativas')
  })
})

describe('addCaseMessage action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, limit: 100, retryAfterSeconds: 0, source: 'memory' as const })
    mockedAddCaseMessageService.mockResolvedValue({ success: true, data: { messageId: 'msg-1' } })
  })

  it('returns messageId on success for reporter', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    const result = await addCaseMessage('case-1', 'Hello')
    assertSuccess(result)
    expect(result.data?.messageId).toBe('msg-1')
  })

  it('returns messageId on success for admin', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    const result = await addCaseMessage('case-1', 'Hello admin')
    assertSuccess(result)
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
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, limit: 100, retryAfterSeconds: 60, source: 'memory' as const })
    const result = await addCaseMessage('case-1', 'Hello')
    assertError(result)
    expect(result.error).toContain('mensagens')
  })
})

describe('resolveCase action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, limit: 100, retryAfterSeconds: 0, source: 'memory' as const })
    mockedResolveCaseService.mockResolvedValue({
      success: true,
      data: { resolvedAt: new Date().toISOString() },
    })
  })

  it('returns error when not admin', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    const result = await resolveCase('case-1', 'Resolution here')
    assertError(result)
    expect(result.error).toContain('Acesso restrito')
  })

  it('resolves case successfully', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin', 'admin-1'))
    const result = await resolveCase('case-1', 'Resolution here', 50)
    assertSuccess(result)
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
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, limit: 100, retryAfterSeconds: 60, source: 'memory' as const })
    const result = await resolveCase('case-1', 'Resolution here')
    assertError(result)
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
    assertSuccess(result)
    expect(result.data?.id).toBe('case-1')
  })

  it('returns case for admin', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('admin'))
    mockedGetCaseByIdService.mockResolvedValue({
      success: true,
      data: { id: 'case-1', reporter_id: 'other-user' } as any,
    })
    const result = await getCaseById('case-1')
    assertSuccess(result)
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
    assertSuccess(result)
    expect(result.data?.messages).toHaveLength(1)
  })
})

describe('listCases action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedRateLimit.mockResolvedValue({ allowed: true, remaining: 100, limit: 100, retryAfterSeconds: 0, source: 'memory' as const })
    mockedListCasesService.mockResolvedValue({
      success: true,
      data: { cases: [{ id: 'case-1' }], nextCursor: null },
    })
  })

  it('returns cases successfully', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    const result = await listCases()
    assertSuccess(result)
    expect(result.data?.cases).toHaveLength(1)
  })

  it('returns rate limit error', async () => {
    mockedCreateClient.mockResolvedValue(makeSupabaseClient('member'))
    mockedRateLimit.mockResolvedValue({ allowed: false, remaining: 0, limit: 100, retryAfterSeconds: 60, source: 'memory' as const })
    const result = await listCases()
    assertError(result)
    expect(result.error).toContain('requisições')
  })
})
