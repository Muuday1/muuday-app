import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitUserSignedUp, emitProfessionalSignedUp } from './resend-events'

describe('resend-events', () => {
  let fetchSpy: typeof globalThis.fetch

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => '' }) as unknown as typeof globalThis.fetch
    globalThis.fetch = fetchSpy
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('emitUserSignedUp sends correct payload', async () => {
    emitUserSignedUp('user@example.com', { first_name: 'Joao', country: 'BR', user_type: 'client' })
    await new Promise(r => setTimeout(r, 50))
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [, init] = (fetchSpy as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(init.body)
    expect(body.event).toBe('user.signed_up')
    expect(body.email).toBe('user@example.com')
  })

  it('emitProfessionalSignedUp sends correct payload', async () => {
    emitProfessionalSignedUp('pro@example.com', { first_name: 'Maria', specialty: 'Psicologia' })
    await new Promise(r => setTimeout(r, 50))
    const [, init] = (fetchSpy as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(init.body)
    expect(body.event).toBe('professional.signed_up')
  })

  it('does not call fetch when RESEND_API_KEY is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    emitUserSignedUp('user@example.com', { first_name: 'Joao', country: 'BR', user_type: 'client' })
    await new Promise(r => setTimeout(r, 50))
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
