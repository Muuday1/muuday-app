/**
 * Base HTTP client for Muuday API v1.
 * Works in browser, React Native, and Node.js.
 * No 'use server' — this is a universal client.
 */

export type ApiClientConfig = {
  baseUrl: string
  getToken: () => string | null | Promise<string | null>
  getSessionJson?: () => string | null | Promise<string | null>
  apiKey?: string
  fetchFn?: typeof fetch
}

export type ApiError = {
  status: number
  message: string
  code?: string
}

export class ApiClientError extends Error {
  status: number
  code?: string

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiClientError'
    this.status = error.status
    this.code = error.code
  }
}

async function defaultFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init)
}

export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, getToken, apiKey, fetchFn = defaultFetch } = config

  async function request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown
      query?: Record<string, string | number | boolean | undefined>
      headers?: Record<string, string>
    },
  ): Promise<T> {
    const url = new URL(path.replace(/^\//, ''), baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)

    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    }

    const token = await getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const sessionJson = config.getSessionJson ? await config.getSessionJson() : null
    if (sessionJson) {
      headers['X-Supabase-Session'] = sessionJson
    }

    if (apiKey) {
      headers['X-Mobile-API-Key'] = apiKey
    }

    const init: RequestInit = {
      method,
      headers,
    }

    if (options?.body !== undefined) {
      init.body = JSON.stringify(options.body)
    }

    const response = await fetchFn(url.toString(), init)

    if (response.status === 204) {
      return undefined as T
    }

    let data: unknown
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = { error: await response.text() }
    }

    if (!response.ok) {
      const errorBody = data as { error?: string; code?: string; message?: string }
      throw new ApiClientError({
        status: response.status,
        message: errorBody.error || errorBody.message || `HTTP ${response.status}`,
        code: errorBody.code,
      })
    }

    return data as T
  }

  return {
    get: <T>(path: string, options?: { query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
      request<T>('GET', path, options),
    post: <T>(path: string, options?: { body?: unknown; query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
      request<T>('POST', path, options),
    patch: <T>(path: string, options?: { body?: unknown; query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
      request<T>('PATCH', path, options),
    put: <T>(path: string, options?: { body?: unknown; query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
      request<T>('PUT', path, options),
    delete: <T>(path: string, options?: { body?: unknown; query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
      request<T>('DELETE', path, options),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
