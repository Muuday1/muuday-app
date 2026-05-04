'use client'

import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RECURRING_SESSION_OPTIONS } from '../helpers'

interface BookingControlsProps {
  selectedDuration: number
  durationOptions: number[]
  timezoneMode: 'user' | 'professional'
  bookingType: 'one_off' | 'recurring'
  recurringSessionsCount: number
  enableRecurring: boolean
  onDurationChange: (duration: number) => void
  onTimezoneModeChange: (mode: 'user' | 'professional') => void
  onBookingTypeChange: (type: 'one_off' | 'recurring') => void
  onRecurringSessionsChange: (count: number) => void
}

export function BookingControls({
  selectedDuration,
  durationOptions,
  timezoneMode,
  bookingType,
  recurringSessionsCount,
  enableRecurring,
  onDurationChange,
  onTimezoneModeChange,
  onBookingTypeChange,
  onRecurringSessionsChange,
}: BookingControlsProps) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
          <Calendar className="h-5 w-5 text-[#9FE870]" />
          Disponibilidade
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={selectedDuration}
            onChange={event => onDurationChange(Number(event.target.value))}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
            aria-label="Escolher duração da sessão"
          >
            {durationOptions.map(duration => (
              <option key={duration} value={duration}>
                {duration} min
              </option>
            ))}
          </select>

          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => onTimezoneModeChange('user')}
              className={cn(
                'rounded-md px-2 py-1 font-medium transition-colors',
                timezoneMode === 'user'
                  ? 'bg-white text-[#3d6b1f]'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Meu fuso
            </button>
            <button
              type="button"
              onClick={() => onTimezoneModeChange('professional')}
              className={cn(
                'rounded-md px-2 py-1 font-medium transition-colors',
                timezoneMode === 'professional'
                  ? 'bg-white text-[#3d6b1f]'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Fuso profissional
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onBookingTypeChange('one_off')}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
            bookingType === 'one_off'
              ? 'border-[#9FE870] bg-[#9FE870]/8 text-[#3d6b1f]'
              : 'border-slate-200 text-slate-600 hover:border-[#9FE870]/40',
          )}
        >
          Sessão única
        </button>
        <button
          type="button"
          onClick={() => {
            if (!enableRecurring) return
            onBookingTypeChange('recurring')
          }}
          disabled={!enableRecurring}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
            bookingType === 'recurring'
              ? 'border-[#9FE870] bg-[#9FE870]/8 text-[#3d6b1f]'
              : 'border-slate-200 text-slate-600 hover:border-[#9FE870]/40',
            !enableRecurring && 'cursor-not-allowed opacity-50',
          )}
        >
          Recorrência
        </button>
        {bookingType === 'recurring' ? (
          <select
            value={recurringSessionsCount}
            onChange={event => onRecurringSessionsChange(Number(event.target.value))}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
            aria-label="Quantidade de sessões recorrentes"
          >
            {RECURRING_SESSION_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option} sessões
              </option>
            ))}
          </select>
        ) : null}
        {!enableRecurring ? (
          <span className="text-xs text-slate-500">Recorrência indisponível para este profissional.</span>
        ) : null}
      </div>
    </>
  )
}
