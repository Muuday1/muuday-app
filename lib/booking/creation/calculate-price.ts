import type { SupabaseClient } from '@supabase/supabase-js'
import { getExchangeRates } from '@/lib/exchange-rates'
import { roundCurrency } from '@/lib/booking/cancellation-policy'

export async function calculateBookingPrice(
  supabase: SupabaseClient,
  priceBrlRaw: number | string | null,
  sessionCount: number,
  currency: string | null,
): Promise<{ perSessionPriceUserCurrency: number; totalPriceUserCurrency: number }> {
  const priceBrl = Number(priceBrlRaw) || 0
  const effectiveCurrency = currency || 'BRL'
  const rates = await getExchangeRates(supabase)
  const perSessionPriceUserCurrency = roundCurrency(priceBrl * (rates[effectiveCurrency] || 1))
  const totalPriceUserCurrency = roundCurrency(perSessionPriceUserCurrency * sessionCount)

  return { perSessionPriceUserCurrency, totalPriceUserCurrency }
}
