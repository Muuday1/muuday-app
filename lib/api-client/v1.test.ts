import { describe, it, expect, vi } from 'vitest'
import { createV1Client } from './v1'

describe('createV1Client', () => {
  const baseUrl = 'https://api.example.com'

  function mockFetch(response: Response) {
    return vi.fn().mockResolvedValue(response)
  }

  function createClient(fetchFn: ReturnType<typeof mockFetch>) {
    return createV1Client({
      baseUrl,
      getToken: () => 'test-token',
      apiKey: 'test-api-key',
      fetchFn,
    })
  }

  it('users.me calls /users/me', async () => {
    const fetchFn = mockFetch({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ user: { id: 'u1' }, professional: null }),
    } as Response)

    const client = createClient(fetchFn)
    const result = await client.users.me()

    expect(result.user.id).toBe('u1')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/users/me',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('bookings.create calls POST /bookings', async () => {
    const fetchFn = mockFetch({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, bookingId: 'b1', createdBookingIds: ['b1'] }),
    } as Response)

    const client = createClient(fetchFn)
    const result = await client.bookings.create({ professionalId: 'p1', scheduledAt: '2026-05-01T10:00:00' })

    expect(result.bookingId).toBe('b1')
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.example.com/api/v1/bookings')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body)).toEqual({ professionalId: 'p1', scheduledAt: '2026-05-01T10:00:00' })
  })

  it('conversations.sendMessage calls POST /conversations/:id/messages', async () => {
    const fetchFn = mockFetch({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, data: { messageId: 'm1', sentAt: '2026-04-20T10:00:00Z' } }),
    } as Response)

    const client = createClient(fetchFn)
    const result = await client.conversations.sendMessage('c1', { content: 'Olá' })

    expect(result.data.messageId).toBe('m1')
    const [url] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.example.com/api/v1/conversations/c1/messages')
  })

  it('favorites.remove calls DELETE /favorites with body', async () => {
    const fetchFn = mockFetch({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true }),
    } as Response)

    const client = createClient(fetchFn)
    await client.favorites.remove({ professionalId: 'p1' })

    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.example.com/api/v1/favorites')
    expect(init?.method).toBe('DELETE')
    expect(JSON.parse(init?.body)).toEqual({ professionalId: 'p1' })
  })

  it('professionals.search calls GET /professionals/search with query', async () => {
    const fetchFn = mockFetch({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: [], nextCursor: null, total: 0 }),
    } as Response)

    const client = createClient(fetchFn)
    await client.professionals.search({ q: 'psicologo', limit: 10 })

    const [url] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.example.com/api/v1/professionals/search?q=psicologo&limit=10')
  })

  it('admin.dashboard calls GET /admin/dashboard', async () => {
    const fetchFn = mockFetch({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { stats: {}, professionals: [], reviews: [], bookings: [] } }),
    } as Response)

    const client = createClient(fetchFn)
    await client.admin.dashboard()

    const [url] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.example.com/api/v1/admin/dashboard')
  })

  it('notifications.markAllAsRead calls PATCH /notifications', async () => {
    const fetchFn = mockFetch({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { updatedCount: 3 } }),
    } as Response)

    const client = createClient(fetchFn)
    const result = await client.notifications.markAllAsRead()

    expect(result.data.updatedCount).toBe(3)
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.example.com/api/v1/notifications')
    expect(init?.method).toBe('PATCH')
  })
})
