import { Redis } from '@upstash/redis'

let redisClient: Redis | null | undefined

function getRedisClient() {
  if (redisClient !== undefined) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    redisClient = null
    return redisClient
  }
  redisClient = new Redis({ url, token })
  return redisClient
}

function buildVersionedPayload<T>(value: T, version: string) {
  return {
    __cacheVersion: version,
    value,
    cachedAt: new Date().toISOString(),
  }
}

type VersionedPayload<T> = {
  __cacheVersion?: string
  value?: T
}

export async function getOrSetUpstashJsonCache<T>(args: {
  key: string
  ttlSeconds: number
  version?: string
  loader: () => Promise<T>
}) {
  const redis = getRedisClient()
  const version = args.version || 'v1'
  if (!redis) return args.loader()

  try {
    const cached = await redis.get<VersionedPayload<T>>(args.key)
    if (
      cached &&
      cached.__cacheVersion === version &&
      typeof cached.value !== 'undefined'
    ) {
      return cached.value
    }
  } catch {
    return args.loader()
  }

  let loaded: T
  try {
    loaded = await args.loader()
  } catch {
    return null as unknown as T
  }

  try {
    const payload = buildVersionedPayload(loaded, version)
    await redis.set(args.key, payload, { ex: args.ttlSeconds })
  } catch {
    return loaded
  }

  return loaded
}

export async function deleteUpstashCacheKey(key: string) {
  const redis = getRedisClient()
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    return
  }
}
