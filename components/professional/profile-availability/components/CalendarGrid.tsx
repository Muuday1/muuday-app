'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MONTH_NAMES_PT, DAY_NAMES_PT_SHORT, isSameDay } from '../helpers'

interface CalendarGridProps {
  currentMonth: Date
  selectedDate: Date | null
  today: Date
  canGoPrev: boolean
  canGoNext: boolean
  calendarDays: (Date | null)[]
  isDateAvailable: (date: Date) => boolean
  onDateSelect: (date: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function CalendarGrid({
  currentMonth,
  selectedDate,
  today,
  canGoPrev,
  canGoNext,
  calendarDays,
  isDateAvailable,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-slate-50/70 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4 text-slate-600" />
        </button>
        <span className="font-display text-sm font-semibold text-slate-900">
          {MONTH_NAMES_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          onClick={onNextMonth}
          disabled={!canGoNext}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-slate-50/70 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7">
        {DAY_NAMES_PT_SHORT.map(day => (
          <div key={day} className="py-1 text-center text-xs font-medium text-slate-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} />
          const available = isDateAvailable(date)
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
          const isToday = isSameDay(date, today)

          return (
            <button
              key={date.toISOString()}
              onClick={() => {
                if (!available) return
                onDateSelect(date)
              }}
              disabled={!available}
              className={cn(
                'relative flex h-9 w-full items-center justify-center rounded-md text-sm font-medium transition-all',
                isSelected
                  ? 'bg-[#9FE870] text-white'
                  : available
                    ? 'cursor-pointer text-slate-800 hover:bg-[#9FE870]/8 hover:text-[#3d6b1f]'
                    : 'cursor-not-allowed text-slate-300',
                isToday && !isSelected && 'ring-1 ring-[#9FE870]/40',
              )}
            >
              {date.getDate()}
              {available && !isSelected ? (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#9FE870]/40" />
              ) : null}
            </button>
          )
        })}
      </div>
    </>
  )
}
