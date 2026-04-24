import { describe, it, expect, vi } from 'vitest'
import { createApiClient, ApiClientError } from './base'

describe('createApiClient', () => {
  const baseUrl = 'https://api.example.com'

  it('sends GET request with query params', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: 'hello' }),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: () => null,
      fetchFn,
    })

    const result = await client.get('/test', { query: { page: 1, search: 'foo' } })

    expect(result).toEqual({ data: 'hello' })
    expect(fetchFn).toHaveBeenCalledTimes(1)
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.example.com/test?page=1&search=foo')
    expect(init?.method).toBe('GET')
    expect(init?.headers).toMatchObject({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    })
  })

  it('sends POST request with body and auth token', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ id: '123' }),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: () => 'my-jwt-token',
      apiKey: 'mobile-key',
      fetchFn,
    })

    const result = await client.post('/bookings', { body: { professionalId: 'abc' } })

    expect(result).toEqual({ id: '123' })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.example.com/bookings')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ professionalId: 'abc' }))
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer my-jwt-token')
    expect(headers['X-Mobile-API-Key']).toBe('mobile-key')
  })

  it('sends DELETE request with body', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: () => null,
      fetchFn,
    })

    const result = await client.delete('/favorites', { body: { professionalId: 'abc' } })

    expect(result).toEqual({ success: true })
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.example.com/favorites')
    expect(init?.method).toBe('DELETE')
    expect(init?.body).toBe(JSON.stringify({ professionalId: 'abc' }))
  })

  it('handles 204 No Content', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
      json: async () => ({}),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: () => null,
      fetchFn,
    })

    const result = await client.get('/empty')
    expect(result).toBeUndefined()
  })

  it('throws ApiClientError on 4xx response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Rate limit exceeded.' }),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: () => null,
      fetchFn,
    })

    await expect(client.get('/test')).rejects.toThrow(ApiClientError)
    await expect(client.get('/test')).rejects.toMatchObject({
      status: 429,
      message: 'Rate limit exceeded.',
    })
  })

  it('throws ApiClientError on 5xx response with fallback message', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: () => null,
      fetchFn,
    })

    await expect(client.get('/test')).rejects.toThrow(ApiClientError)
    await expect(client.get('/test')).rejects.toMatchObject({
      status: 500,
      message: 'HTTP 500',
    })
  })

  it('throws ApiClientError with code when provided', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: 'Bad request.', code: 'INVALID_FIELD' }),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: () => null,
      fetchFn,
    })

    await expect(client.post('/test', { body: {} })).rejects.toMatchObject({
      status: 400,
      message: 'Bad request.',
      code: 'INVALID_FIELD',
    })
  })

  it('supports async getToken', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: async () => 'async-token',
      fetchFn,
    })

    await client.get('/test')
    const [, init] = fetchFn.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer async-token')
  })

  it('omits Authorization when token is null', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: () => null,
      fetchFn,
    })

    await client.get('/test')
    const [, init] = fetchFn.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('sends X-Supabase-Session header when getSessionJson returns session', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    } as Response)

    const sessionJson = JSON.stringify({ access_token: 'at', refresh_token: 'rt' })
    const client = createApiClient({
      baseUrl,
      getToken: () => 'token',
      getSessionJson: () => sessionJson,
      fetchFn,
    })

    await client.get('/test')
    const [, init] = fetchFn.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer token')
    expect(headers['X-Supabase-Session']).toBe(sessionJson)
  })

  it('omits X-Supabase-Session when getSessionJson returns null', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
    } as Response)

    const client = createApiClient({
      baseUrl,
      getToken: () => null,
      getSessionJson: () => null,
      fetchFn,
    })

    await client.get('/test')
    const [, init] = fetchFn.mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers['X-Supabase-Session']).toBeUndefined()
  })
})
