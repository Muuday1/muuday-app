import type { CalendarProvider } from '../types'
import { appleCaldavAdapter } from './apple-caldav'
import type { CalendarProviderAdapter } from './adapter'
import { googleCalendarAdapter } from './google'
import { outlookCalendarAdapter } from './outlook'

const ADAPTERS: Record<CalendarProvider, CalendarProviderAdapter> = {
  google: googleCalendarAdapter,
  outlook: outlookCalendarAdapter,
  apple: appleCaldavAdapter,
}

export function getCalendarProviderAdapter(provider: CalendarProvider): CalendarProviderAdapter {
  const adapter = ADAPTERS[provider]
  if (!adapter) {
    throw new Error(`Unsupported calendar provider: ${provider}`)
  }
  return adapter
}
