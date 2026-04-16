const DEFAULT_DEV_URL = 'http://localhost:3000'
const DEFAULT_PROD_URL = 'https://muuday-app.vercel.app'
let didWarnMissingAppBaseUrl = false

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) return null

  const cleaned = stripWrappingQuotes(value.trim()).replace(/\/+$/, '')
  if (!cleaned) return null

  if (!/^https?:\/\//i.test(cleaned)) {
    return null
  }

  return cleaned
}

function normalizeHost(value: string | null | undefined): string | null {
  if (!value) return null

  const cleaned = stripWrappingQuotes(value.trim())
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')

  return cleaned || null
}

function splitCsv(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function getPrimaryDomainHost(): string | null {
  return normalizeHost(process.env.APP_PRIMARY_DOMAIN)
}

export function getAppBaseUrl(): string {
  const candidates = [
    process.env.APP_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    getPrimaryDomainHost() ? `https://${getPrimaryDomainHost()}` : null,
  ]
  const hasExplicitBaseUrl = Boolean(
    normalizeUrl(process.env.APP_BASE_URL) || normalizeUrl(process.env.NEXT_PUBLIC_APP_URL),
  )

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate)
    if (normalized) return normalized
  }

  if (process.env.NODE_ENV === 'production' && !hasExplicitBaseUrl && !didWarnMissingAppBaseUrl) {
    didWarnMissingAppBaseUrl = true
    console.warn('[muuday] APP_BASE_URL/NEXT_PUBLIC_APP_URL not set; falling back to default app URL')
  }

  return process.env.NODE_ENV === 'development' ? DEFAULT_DEV_URL : DEFAULT_PROD_URL
}

export function getWaitlistAllowedOrigins(): Set<string> {
  const origins = new Set<string>()
  const appBaseUrl = normalizeUrl(getAppBaseUrl())
  const primaryDomainHost = getPrimaryDomainHost()

  if (appBaseUrl) {
    origins.add(appBaseUrl)
  }

  if (primaryDomainHost) {
    origins.add(`https://${primaryDomainHost}`)
    origins.add(`https://www.${primaryDomainHost}`)
  }

  for (const candidate of splitCsv(process.env.WAITLIST_CORS_ORIGINS)) {
    const normalized = normalizeUrl(candidate)
    if (normalized) origins.add(normalized)
  }

  if (process.env.NODE_ENV === 'development') {
    origins.add(DEFAULT_DEV_URL)
  }

  return origins
}
