/**
 * Web-specific API v1 client.
 *
 * Uses cookie-based auth (no bearer token needed — browser sends cookies
 * automatically with `credentials: 'include'`).
 *
 * Usage in client components:
 *   import { webV1 } from '@/lib/api-client/web'
 *   const result = await webV1.notifications.list()
 */

import { createV1Client, type V1Client } from './v1'

export type WebV1Client = V1Client

function webFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, credentials: 'include' })
}

/**
 * Singleton web API client instance.
 * Safe to import and use directly in client components.
 */
export const webV1 = createV1Client({
  baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
  getToken: () => null, // cookies handle auth
  fetchFn: webFetch,
})

/**
 * Factory for creating a web API client with a custom base URL.
 * Useful for SSR or testing.
 */
export function createWebV1Client(baseUrl: string) {
  return createV1Client({
    baseUrl,
    getToken: () => null,
    fetchFn: webFetch,
  })
}
