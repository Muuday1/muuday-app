export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${body.slice(0, 400)}`)
  }

  return (await response.json()) as T
}

export async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${body.slice(0, 400)}`)
  }

  return response.text()
}

export function toIsoFromSeconds(nowMs: number, expiresInSeconds?: number): string | null {
  if (!expiresInSeconds || Number.isNaN(expiresInSeconds)) return null
  return new Date(nowMs + expiresInSeconds * 1000).toISOString()
}

export function toQueryString(params: Record<string, string | undefined | null>) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })
  return query.toString()
}
