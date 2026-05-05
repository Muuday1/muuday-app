'use client'

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CalendarView } from './types'

interface CalendarHeaderProps {
  timezone: string
  periodLabel: string
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarHeader({
  timezone,
  periodLabel,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 px-3 py-2.5 md:px-4 md:py-3">
      <div className="inline-flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-[#3d6b1f]" />
        <p className="text-sm font-semibold text-slate-900">Calendário</p>
        <p className="text-xs text-slate-500">{timezone}</p>
      </div>

      <p className="text-xs font-semibold text-slate-700 md:text-sm">{periodLabel}</p>

      <div className="inline-flex items-center gap-1">
        <button type="button" onClick={onPrev} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50/70">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onToday} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50/70">
          Hoje
        </button>
        <button type="button" onClick={onNext} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50/70">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="inline-flex rounded-md border border-slate-200 p-0.5 text-xs">
        {(['day', 'week', 'month'] as const).map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewChange(mode)}
            className={`rounded px-2 py-1 font-semibold ${view === mode ? 'bg-[#9FE870] text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>
    </div>
  )
}
