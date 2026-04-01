type RuntimeCacheEntry<T> = {
  value: T
  expiresAt: number
}

type RuntimeCacheStore = Map<string, RuntimeCacheEntry<unknown>>
type RuntimeCacheInflightStore = Map<string, Promise<unknown>>

declare global {
  // eslint-disable-next-line no-var
  var __muudayRuntimeCache: RuntimeCacheStore | undefined
  // eslint-disable-next-line no-var
  var __muudayRuntimeCacheInflight: RuntimeCacheInflightStore | undefined
}

function getStore() {
  if (!globalThis.__muudayRuntimeCache) {
    globalThis.__muudayRuntimeCache = new Map<string, RuntimeCacheEntry<unknown>>()
  }
  return globalThis.__muudayRuntimeCache
}

function getInflightStore() {
  if (!globalThis.__muudayRuntimeCacheInflight) {
    globalThis.__muudayRuntimeCacheInflight = new Map<string, Promise<unknown>>()
  }
  return globalThis.__muudayRuntimeCacheInflight
}

export async function getCachedRuntimeValue<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const store = getStore()
  const inflightStore = getInflightStore()
  const existing = store.get(key)
  if (existing && existing.expiresAt > now) {
    return existing.value as T
  }

  const inflight = inflightStore.get(key)
  if (inflight) {
    return inflight as Promise<T>
  }

  const pending = producer()
    .then(value => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs })
      return value
    })
    .finally(() => {
      inflightStore.delete(key)
    })

  inflightStore.set(key, pending)
  return pending as Promise<T>
}

export function invalidateRuntimeCache(prefix?: string) {
  const store = getStore()
  const inflightStore = getInflightStore()
  if (!prefix) {
    store.clear()
    inflightStore.clear()
    return
  }
  store.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  })
  inflightStore.forEach((_, key) => {
    if (key.startsWith(prefix)) {
      inflightStore.delete(key)
    }
  })
}
