import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amountBRL: number, currency = 'BRL'): string {
  const rates: Record<string, number> = {
    BRL: 1, USD: 0.19, EUR: 0.17, GBP: 0.15, CAD: 0.26, AUD: 0.29,
  }
  const symbols: Record<string, string> = {
    BRL: 'R$', USD: 'US$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$',
  }
  const rate = rates[currency] || 1
  const converted = amountBRL * rate
  const symbol = symbols[currency] || currency
  return `${symbol} ${converted.toFixed(2)}`
}

export function formatDateTime(date: string, timezone: string): string {
  return formatInTimeZone(new Date(date), timezone, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
}

export function getTimezoneOffset(timezone: string): string {
  const now = new Date()
  const formatted = formatInTimeZone(now, timezone, 'zzz')
  return formatted
}

export const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']

export const COUNTRIES = [
  { code: 'US', name: 'Estados Unidos', timezone: 'America/New_York', currency: 'USD' },
  { code: 'GB', name: 'Reino Unido', timezone: 'Europe/London', currency: 'GBP' },
  { code: 'PT', name: 'Portugal', timezone: 'Europe/Lisbon', currency: 'EUR' },
  { code: 'DE', name: 'Alemanha', timezone: 'Europe/Berlin', currency: 'EUR' },
  { code: 'FR', name: 'França', timezone: 'Europe/Paris', currency: 'EUR' },
  { code: 'CA', name: 'Canadá', timezone: 'America/Toronto', currency: 'CAD' },
  { code: 'AU', name: 'Austrália', timezone: 'Australia/Sydney', currency: 'AUD' },
  { code: 'BR', name: 'Brasil', timezone: 'America/Sao_Paulo', currency: 'BRL' },
  { code: 'JP', name: 'Japão', timezone: 'Asia/Tokyo', currency: 'JPY' },
  { code: 'AE', name: 'Emirados Árabes', timezone: 'Asia/Dubai', currency: 'AED' },
]
