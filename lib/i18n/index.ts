/**
 * Lightweight i18n helper for Muuday.
 *
 * Convention:
 * - Keys use dot notation: 'auth.login.emailLabel'
 * - Portuguese (pt-BR) is the source of truth.
 * - English (en) is a partial fallback for international pages.
 *
 * This is intentionally minimal. It will be replaced by next-intl
 * in Sprint 2 if the team decides to adopt a full i18n framework.
 */

import ptBR from './messages/pt-BR.json'
import en from './messages/en.json'

export type Locale = 'pt-BR' | 'en'

const MESSAGES: Record<Locale, Record<string, string>> = {
  'pt-BR': ptBR as Record<string, string>,
  en: en as Record<string, string>,
}

const DEFAULT_LOCALE: Locale = 'pt-BR'

function getLocale(): Locale {
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang
    if (htmlLang === 'en' || htmlLang.startsWith('en')) return 'en'
  }
  return DEFAULT_LOCALE
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function t(key: string, params?: Record<string, string | number>): string {
  const locale = getLocale()
  const messages = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE]
  let value = messages[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value.replace(new RegExp(`\\{${escapeRegExp(paramKey)}\\}`, 'g'), String(paramValue))
    })
  }

  return value
}
