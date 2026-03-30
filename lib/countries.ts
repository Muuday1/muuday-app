import { countries as countriesList } from 'countries-list'
import { STRIPE_CURRENCIES } from '@/lib/constants'

export type CountryOption = {
  code: string
  name: string
  timezone: string
  currency: string
}

const STRIPE_CURRENCY_SET = new Set(STRIPE_CURRENCIES.map(currency => currency.value))

const TIMEZONE_BY_COUNTRY: Record<string, string> = {
  BR: 'America/Sao_Paulo',
  US: 'America/New_York',
  GB: 'Europe/London',
  PT: 'Europe/Lisbon',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  IE: 'Europe/Dublin',
  NL: 'Europe/Amsterdam',
  BE: 'Europe/Brussels',
  CH: 'Europe/Zurich',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo',
  DK: 'Europe/Copenhagen',
  PL: 'Europe/Warsaw',
  CA: 'America/Toronto',
  MX: 'America/Mexico_City',
  AR: 'America/Argentina/Buenos_Aires',
  CL: 'America/Santiago',
  CO: 'America/Bogota',
  PE: 'America/Lima',
  UY: 'America/Montevideo',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  CN: 'Asia/Shanghai',
  IN: 'Asia/Kolkata',
  SG: 'Asia/Singapore',
  AE: 'Asia/Dubai',
  ZA: 'Africa/Johannesburg',
  EG: 'Africa/Cairo',
}

const DEFAULT_TZ_BY_CONTINENT: Record<string, string> = {
  AF: 'Africa/Johannesburg',
  AN: 'UTC',
  AS: 'Asia/Dubai',
  EU: 'Europe/Paris',
  NA: 'America/New_York',
  OC: 'Australia/Sydney',
  SA: 'America/Sao_Paulo',
}

const displayNames = new Intl.DisplayNames(['pt-BR', 'en'], { type: 'region' })

function resolveCountryName(code: string, fallbackName: string) {
  return displayNames.of(code) || fallbackName
}

function resolveCountryCurrency(currencyCandidates: string[] | undefined) {
  const candidates = Array.isArray(currencyCandidates) ? currencyCandidates : []
  const preferred = candidates.find(candidate => STRIPE_CURRENCY_SET.has(candidate))
  return preferred || 'USD'
}

function resolveCountryTimezone(code: string, continent?: string) {
  if (TIMEZONE_BY_COUNTRY[code]) return TIMEZONE_BY_COUNTRY[code]
  if (continent && DEFAULT_TZ_BY_CONTINENT[continent]) return DEFAULT_TZ_BY_CONTINENT[continent]
  return 'UTC'
}

export const COUNTRIES: CountryOption[] = Object.entries(countriesList)
  .map(([code, countryData]) => ({
    code,
    name: resolveCountryName(code, countryData.name),
    currency: resolveCountryCurrency(countryData.currency),
    timezone: resolveCountryTimezone(code, countryData.continent),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))

export function getCountryByCode(code: string | null | undefined) {
  if (!code) return null
  const normalized = code.toUpperCase()
  return COUNTRIES.find(country => country.code === normalized) || null
}
