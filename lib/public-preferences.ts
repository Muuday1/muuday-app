export const PUBLIC_LANGUAGE_COOKIE = 'muuday_public_language'
export const PUBLIC_CURRENCY_COOKIE = 'muuday_public_currency'

export const PUBLIC_LANGUAGE_OPTIONS = [
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español (ES)' },
]

export const PUBLIC_CURRENCY_OPTIONS = [
  { value: 'BRL', label: 'R$ BRL' },
  { value: 'USD', label: 'US$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'CAD', label: 'CA$ CAD' },
  { value: 'AUD', label: 'A$ AUD' },
]

const REGION_TO_CURRENCY: Record<string, string> = {
  BR: 'BRL',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  IE: 'EUR',
  PT: 'EUR',
  ES: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  AU: 'AUD',
  NZ: 'AUD',
}

const ALLOWED_CURRENCIES = new Set(PUBLIC_CURRENCY_OPTIONS.map(option => option.value))
const ALLOWED_LANGUAGES = new Set(PUBLIC_LANGUAGE_OPTIONS.map(option => option.value))

function extractPrimaryLocale(acceptLanguage?: string | null) {
  if (!acceptLanguage) return ''
  return acceptLanguage
    .split(',')[0]
    ?.trim()
    ?.replace('_', '-')
    ?.toLowerCase()
}

function extractRegionCode(locale?: string | null) {
  if (!locale) return ''
  const [, region] = locale.replace('_', '-').split('-')
  return (region || '').toUpperCase()
}

export function resolveDefaultLanguageFromAcceptLanguage(acceptLanguage?: string | null) {
  const locale = extractPrimaryLocale(acceptLanguage)
  if (locale.startsWith('en')) return 'en-US'
  if (locale.startsWith('es')) return 'es-ES'
  return 'pt-BR'
}

export function resolveDefaultCurrencyFromAcceptLanguage(acceptLanguage?: string | null) {
  const locale = extractPrimaryLocale(acceptLanguage)
  const region = extractRegionCode(locale)
  return REGION_TO_CURRENCY[region] || 'BRL'
}

export function normalizeCurrency(value?: string | null) {
  const normalized = (value || '').toUpperCase().trim()
  return ALLOWED_CURRENCIES.has(normalized) ? normalized : ''
}

export function normalizeLanguage(value?: string | null) {
  const normalized = (value || '').trim()
  return ALLOWED_LANGUAGES.has(normalized) ? normalized : ''
}
