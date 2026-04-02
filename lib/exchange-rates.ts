import type { SupabaseClient } from '@supabase/supabase-js'
import { getOrSetUpstashJsonCache } from '@/lib/cache/upstash-json-cache'

export type ExchangeRateMap = Record<string, number>

const EXCHANGE_RATES_CACHE_KEY = 'exchange-rates:active:v1'
const EXCHANGE_RATES_CACHE_TTL_SECONDS = 60 * 60

const DEFAULT_EXCHANGE_RATES: ExchangeRateMap = {
  BRL: 1,
  USD: 0.19,
  EUR: 0.17,
  GBP: 0.15,
  CAD: 0.26,
  AUD: 0.29,
}

type ExchangeRateRow = {
  code?: string | null
  rate_to_brl?: number | null
  is_active?: boolean | null
}

function normalizeRates(input?: ExchangeRateMap | null): ExchangeRateMap {
  const merged: ExchangeRateMap = { ...DEFAULT_EXCHANGE_RATES }
  if (!input) return merged
  Object.entries(input).forEach(([code, rate]) => {
    const normalizedCode = String(code || '').toUpperCase().trim()
    if (!normalizedCode) return
    const numeric = Number(rate)
    if (!Number.isFinite(numeric) || numeric <= 0) return
    merged[normalizedCode] = numeric
  })
  return merged
}

async function loadRatesFromDatabase(supabase: SupabaseClient): Promise<ExchangeRateMap | null> {
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('code,rate_to_brl,is_active')
      .eq('is_active', true)
    if (error || !data || data.length === 0) return null

    const byCode: ExchangeRateMap = {}
    ;(data as ExchangeRateRow[]).forEach(row => {
      const code = String(row.code || '').toUpperCase().trim()
      const rate = Number(row.rate_to_brl)
      if (!code || !Number.isFinite(rate) || rate <= 0) return
      byCode[code] = rate
    })

    if (Object.keys(byCode).length === 0) return null
    if (!byCode.BRL) byCode.BRL = 1
    return byCode
  } catch {
    return null
  }
}

export async function getExchangeRates(supabase?: SupabaseClient) {
  return getOrSetUpstashJsonCache<ExchangeRateMap>({
    key: EXCHANGE_RATES_CACHE_KEY,
    ttlSeconds: EXCHANGE_RATES_CACHE_TTL_SECONDS,
    version: 'v1',
    loader: async () => {
      if (!supabase) return DEFAULT_EXCHANGE_RATES
      const fromDb = await loadRatesFromDatabase(supabase)
      return normalizeRates(fromDb)
    },
  })
}

export function normalizeExchangeRateMap(rates?: ExchangeRateMap | null) {
  return normalizeRates(rates)
}

export function getDefaultExchangeRates() {
  return { ...DEFAULT_EXCHANGE_RATES }
}
