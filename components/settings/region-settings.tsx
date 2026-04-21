'use client'

import { Globe, Check } from 'lucide-react'
import { STRIPE_CURRENCIES, ALL_TIMEZONES } from '@/lib/constants'

interface RegionSettingsProps {
  timezone: string
  currency: string
  savedField: string | null
  onTimezoneChange: (value: string) => void
  onCurrencyChange: (value: string) => void
}

export function RegionSettings({
  timezone,
  currency,
  savedField,
  onTimezoneChange,
  onCurrencyChange,
}: RegionSettingsProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100/80 px-6 py-4">
        <Globe className="h-4 w-4 text-[#9FE870]" />
        <h2 className="font-display font-bold text-slate-900">Idioma e região</h2>
      </div>
      <div className="divide-y divide-slate-100/80">
        <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50/70/50">
          <div>
            <p className="text-sm font-medium text-slate-700">Idioma</p>
            <p className="mt-0.5 text-xs text-slate-400">Português (BR)</p>
          </div>
          <span className="rounded-full bg-slate-50/70 px-3 py-1.5 text-xs font-medium text-slate-400">
            Em breve
          </span>
        </div>

        <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50/70/50">
          <div className="mr-4 flex-1">
            <p className="text-sm font-medium text-slate-700">Fuso horário</p>
          </div>
          <div className="flex items-center gap-2">
            {savedField === 'timezone' && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <Check className="h-3 w-3" /> Salvo!
              </span>
            )}
            <select
              value={timezone}
              onChange={e => onTimezoneChange(e.target.value)}
              className="max-w-[220px] rounded-md border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-sm text-slate-700 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]"
            >
              {ALL_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50/70/50">
          <div className="mr-4 flex-1">
            <p className="text-sm font-medium text-slate-700">Moeda preferida</p>
          </div>
          <div className="flex items-center gap-2">
            {savedField === 'currency' && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <Check className="h-3 w-3" /> Salvo!
              </span>
            )}
            <select
              value={currency}
              onChange={e => onCurrencyChange(e.target.value)}
              className="max-w-[220px] rounded-md border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-sm text-slate-700 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]"
            >
              {STRIPE_CURRENCIES.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
