'use client'

import { DAYS_OF_WEEK, type AvailabilityState, buildDefaultState } from './availability-workspace-helpers'

interface AvailabilityQuickSelectProps {
  onChange: (updater: (prev: AvailabilityState) => AvailabilityState) => void
}

export function AvailabilityQuickSelect({ onChange }: AvailabilityQuickSelectProps) {
  return (
    <div className="mb-6 rounded-2xl border border-neutral-100 bg-white px-5 py-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">Atalhos</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            onChange(prev => {
              const next = { ...prev }
              for (const day of [1, 2, 3, 4, 5]) {
                next[day] = { is_available: true, start_time: '09:00', end_time: '18:00' }
              }
              for (const day of [6, 0]) {
                next[day] = { ...next[day], is_available: false }
              }
              return next
            })
          }}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          Segunda a Sexta
        </button>
        <button
          type="button"
          onClick={() => {
            onChange(prev => {
              const next = { ...prev }
              for (const day of DAYS_OF_WEEK) {
                next[day.value] = { is_available: true, start_time: '09:00', end_time: '18:00' }
              }
              return next
            })
          }}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          Todos os dias
        </button>
        <button
          type="button"
          onClick={() => onChange(() => buildDefaultState())}
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Limpar tudo
        </button>
      </div>
    </div>
  )
}
