'use client'

import { useState } from 'react'
import { AlertCircle, Copy, Check } from 'lucide-react'
import { DAYS_OF_WEEK, TIME_OPTIONS, type AvailabilityState, isValidTimeRange } from './availability-workspace-helpers'

interface WeeklyScheduleEditorProps {
  availability: AvailabilityState
  onToggleDay: (dayValue: number) => void
  onUpdateTime: (dayValue: number, field: 'start_time' | 'end_time', value: string) => void
  onCopyDay?: (fromDayValue: number, toDayValues: number[]) => void
}

export function WeeklyScheduleEditor({
  availability,
  onToggleDay,
  onUpdateTime,
  onCopyDay,
}: WeeklyScheduleEditorProps) {
  const [copiedDay, setCopiedDay] = useState<number | null>(null)

  function handleCopy(fromDayValue: number, toDayValues: number[]) {
    onCopyDay?.(fromDayValue, toDayValues)
    setCopiedDay(fromDayValue)
    setTimeout(() => setCopiedDay(null), 1500)
  }

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

              {/* Time selectors + copy */}
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

                  {/* Copy-to dropdown */}
                  {onCopyDay && (
                    <CopyDayDropdown
                      fromDay={day}
                      availability={availability}
                      copiedDay={copiedDay}
                      onCopy={handleCopy}
                    />
                  )}
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

function CopyDayDropdown({
  fromDay,
  availability,
  copiedDay,
  onCopy,
}: {
  fromDay: (typeof DAYS_OF_WEEK)[number]
  availability: AvailabilityState
  copiedDay: number | null
  onCopy: (from: number, to: number[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const otherDays = DAYS_OF_WEEK.filter(d => d.value !== fromDay.value)
  const isCopied = copiedDay === fromDay.value

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(prev => !prev)
          setSelected(new Set())
        }}
        title="Copiar horário para outros dias"
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-all ${
          isCopied
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-slate-200 text-slate-500 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
        }`}
      >
        {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        <span className="hidden sm:inline">{isCopied ? 'Copiado' : 'Copiar'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
            <p className="mb-2 text-xs font-semibold text-slate-700">Copiar para:</p>
            <div className="space-y-1.5">
              {otherDays.map(d => (
                <label
                  key={d.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(d.value)}
                    onChange={e => {
                      setSelected(prev => {
                        const next = new Set(prev)
                        if (e.target.checked) next.add(d.value)
                        else next.delete(d.value)
                        return next
                      })
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]"
                  />
                  <span className="text-xs">{d.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onCopy(fromDay.value, Array.from(selected))
                  setOpen(false)
                  setSelected(new Set())
                }}
                disabled={selected.size === 0}
                className="flex-1 rounded-md bg-[#9FE870] px-2 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setSelected(new Set())
                }}
                className="rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
