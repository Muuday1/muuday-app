'use client'

import { AlertCircle } from 'lucide-react'
import { DAYS_OF_WEEK, TIME_OPTIONS, type AvailabilityState, isValidTimeRange } from './availability-workspace-helpers'

interface WeeklyScheduleEditorProps {
  availability: AvailabilityState
  onToggleDay: (dayValue: number) => void
  onUpdateTime: (dayValue: number, field: 'start_time' | 'end_time', value: string) => void
}

export function WeeklyScheduleEditor({
  availability,
  onToggleDay,
  onUpdateTime,
}: WeeklyScheduleEditorProps) {
  return (
    <div className="mb-6 space-y-3">
      {DAYS_OF_WEEK.map(day => {
        const dayData = availability[day.value]
        const isEnabled = dayData.is_available
        const hasError = !isValidTimeRange(dayData)

        return (
          <div
            key={day.value}
            className={`rounded-lg border transition-all ${
              isEnabled
                ? hasError
                  ? 'border-red-200'
                  : 'border-[#9FE870]/20'
                : 'border-slate-200/80'
            }`}
          >
            {/* Day header row */}
            <div className="flex items-center gap-4 px-5 py-4">
              {/* Toggle */}
              <button
                type="button"
                onClick={() => onToggleDay(day.value)}
                aria-label={isEnabled ? `Desativar ${day.label}` : `Ativar ${day.label}`}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#9FE870] focus:ring-offset-2 ${
                  isEnabled ? 'bg-[#9FE870]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>

              {/* Day name */}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold transition-colors ${
                  isEnabled ? 'text-slate-900' : 'text-slate-400'
                }`}>
                  <span className="hidden sm:inline">{day.label}</span>
                  <span className="sm:hidden">{day.short}</span>
                </p>
                {!isEnabled && (
                  <p className="hidden text-xs text-slate-300 sm:block">Indisponível</p>
                )}
              </div>

              {/* Time selectors */}
              {isEnabled && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="flex items-center gap-2">
                    <label className="hidden whitespace-nowrap text-xs text-slate-400 sm:block">De</label>
                    <select
                      value={dayData.start_time}
                      onChange={e => onUpdateTime(day.value, 'start_time', e.target.value)}
                      className={`rounded-md border bg-white px-3 py-1.5 text-sm transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 ${
                        hasError ? 'border-red-300 text-red-600' : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <span className="text-sm text-slate-300">-</span>

                  <div className="flex items-center gap-2">
                    <label className="hidden whitespace-nowrap text-xs text-slate-400 sm:block">Até</label>
                    <select
                      value={dayData.end_time}
                      onChange={e => onUpdateTime(day.value, 'end_time', e.target.value)}
                      className={`rounded-md border bg-white px-3 py-1.5 text-sm transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 ${
                        hasError ? 'border-red-300 text-red-600' : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Disabled state placeholder */}
              {!isEnabled && (
                <span className="text-xs font-medium text-slate-300">Inativo</span>
              )}
            </div>

            {/* Error message */}
            {isEnabled && hasError && (
              <div className="flex items-center gap-1.5 px-5 pb-3">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                <p className="text-xs text-red-500">
                  O horário de início deve ser anterior ao horário de fim
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
