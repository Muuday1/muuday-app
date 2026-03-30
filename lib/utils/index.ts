import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
export { COUNTRIES } from '@/lib/countries'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amountBRL: number, currency = 'BRL'): string {
  const rates: Record<string, number> = {
    BRL: 1,
    USD: 0.19,
    EUR: 0.17,
    GBP: 0.15,
    CAD: 0.26,
    AUD: 0.29,
  }

  const symbols: Record<string, string> = {
    BRL: 'R$',
    USD: 'US$',
    EUR: 'EUR',
    GBP: 'GBP',
    CAD: 'CA$',
    AUD: 'A$',
  }

  const rate = rates[currency] || 1
  const converted = amountBRL * rate
  const symbol = symbols[currency] || currency
  return `${symbol} ${converted.toFixed(2)}`
}

export function formatDateTime(date: string, timezone: string): string {
  return formatInTimeZone(new Date(date), timezone, "dd 'de' MMMM 'as' HH:mm", { locale: ptBR })
}

export function getTimezoneOffset(timezone: string): string {
  const now = new Date()
  return formatInTimeZone(now, timezone, 'zzz')
}

export const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']
