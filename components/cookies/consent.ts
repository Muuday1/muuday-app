export type ConsentMode = 'gdpr' | 'lgpd' | 'ccpa' | 'notice'

export type CookieConsent = {
  version: 1
  updatedAt: string // ISO
  country?: string
  mode: ConsentMode
  necessary: true
  analytics: boolean
  marketing: boolean
}

export const COOKIE_CONSENT_NAME = 'muuday_cookie_consent'

export function resolveConsentMode(country: string): ConsentMode {
  const c = (country || 'BR').toUpperCase()

  const gdpr = new Set([
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
    'IS','LI','NO',
    'UK','GB',
    'CH',
  ])
  if (gdpr.has(c)) return 'gdpr'

  if (c === 'BR') return 'lgpd'
  if (c === 'US') return 'ccpa'
  return 'notice'
}

export function defaultConsentForCountry(country: string): CookieConsent {
  const mode = resolveConsentMode(country)
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    country: (country || 'BR').toUpperCase(),
    mode,
    necessary: true,
    analytics: false,
    marketing: false,
  }
}

export function safeParseConsent(raw: string | undefined | null): CookieConsent | null {
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded) as Partial<CookieConsent>
    if (parsed?.version !== 1) return null
    if (parsed.necessary !== true) return null
    if (typeof parsed.analytics !== 'boolean') return null
    if (typeof parsed.marketing !== 'boolean') return null
    if (!parsed.updatedAt || typeof parsed.updatedAt !== 'string') return null
    if (!parsed.mode || typeof parsed.mode !== 'string') return null
    return parsed as CookieConsent
  } catch {
    return null
  }
}

export function serializeConsent(consent: CookieConsent): string {
  return encodeURIComponent(JSON.stringify(consent))
}

