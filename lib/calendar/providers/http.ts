const DEFAULT_TIMEOUT_MS = 15_000

function withTimeout(init: RequestInit | undefined, timeoutMs: number): RequestInit {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const signal = controller.signal

  const merged: RequestInit = {
    ...init,
    signal: init?.signal ? AbortSignal.any([init.signal, signal]) : signal,
  }

  // Attach cleanup so callers can clear if they manage their own abort flow
  ;(merged as RequestInit & { __timeoutId?: ReturnType<typeof setTimeout> }).__timeoutId = timeoutId

  return merged
}

export async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const merged = withTimeout(init, timeoutMs)
  try {
    const response = await fetch(url, {
      ...merged,
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
  } finally {
    const timeoutId = (merged as RequestInit & { __timeoutId?: ReturnType<typeof setTimeout> }).__timeoutId
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function fetchText(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
  const merged = withTimeout(init, timeoutMs)
  try {
    const response = await fetch(url, {
      ...merged,
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${body.slice(0, 400)}`)
    }

    return response.text()
  } finally {
    const timeoutId = (merged as RequestInit & { __timeoutId?: ReturnType<typeof setTimeout> }).__timeoutId
    if (timeoutId) clearTimeout(timeoutId)
  }
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
