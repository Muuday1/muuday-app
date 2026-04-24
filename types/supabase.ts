/**
 * Supabase type augmentations for Sprint 1 (market isolation + mobile prep).
 *
 * These are lightweight type helpers for the new columns added in migrations
 * 066 and 067. They supplement (not replace) the auto-generated Supabase types.
 */

export type MarketCode = 'BR' | 'UK' | 'MX' | 'ES'

export interface ProfessionalMarketFields {
  market_code: MarketCode
  session_price: number | null
  session_price_currency: string | null
}

export interface ProfileLanguageField {
  language: string | null
}

export interface TaxonomyI18nFields {
  name_es: string | null
}

export interface ReviewMarketField {
  client_market_code: MarketCode | null
}

// RPC parameter types for the updated search function
export interface SearchPublicProfessionalsPgTrgmParams {
  p_query?: string | null
  p_category?: string | null
  p_specialty?: string | null
  p_language?: string | null
  p_location?: string | null
  p_min_price_brl?: number | null
  p_max_price_brl?: number | null
  p_limit?: number
  p_market?: MarketCode | null
}
