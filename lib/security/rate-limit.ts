import 'server-only'

import { createClient } from '@/lib/supabase/server'

type MemoryBucket = {
  hits: number
  windowStartedAt: number
}

type RateLimitOptions = {
  key: string
  limit: number
  windowSeconds: number
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
  source: 'supabase' | 'memory'
}

declare global {
  // eslint-disable-next-line no-var
  var __muudayRateLimitStore: Map<string, MemoryBucket> | undefined
}

function getStore() {
  if (!globalThis.__muudayRateLimitStore) {
    globalThis.__muudayRateLimitStore = new Map<string, MemoryBucket>()
  }
  return globalThis.__muudayRateLimitStore
}

async function checkSupabaseRateLimit({
  key,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })

    if (error || !Array.isArray(data) || !data[0]) {
      return null
    }

    const row = data[0] as {
      allowed?: boolean
      remaining?: number
      retry_after_seconds?: number
    }

    return {
      allowed: Boolean(row.allowed),
      limit,
      remaining: Number.isFinite(Number(row.remaining)) ? Math.max(0, Number(row.remaining)) : 0,
      retryAfterSeconds: Number.isFinite(Number(row.retry_after_seconds))
        ? Math.max(0, Number(row.retry_after_seconds))
        : 0,
      source: 'supabase',
    }
  } catch {
    return null
  }
}

function checkMemoryRateLimit({ key, limit, windowSeconds }: RateLimitOptions): RateLimitResult {
  const store = getStore()
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const existing = store.get(key)

  if (!existing || now - existing.windowStartedAt >= windowMs) {
    store.set(key, { hits: 1, windowStartedAt: now })
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: 0,
      source: 'memory',
    }
  }

  existing.hits += 1
  store.set(key, existing)

  if (existing.hits <= limit) {
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - existing.hits),
      retryAfterSeconds: 0,
      source: 'memory',
    }
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - existing.windowStartedAt)) / 1000))
  return {
    allowed: false,
    limit,
    remaining: 0,
    retryAfterSeconds,
    source: 'memory',
  }
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const supabaseResult = await checkSupabaseRateLimit(options)
  if (supabaseResult) return supabaseResult
  return checkMemoryRateLimit(options)
}
