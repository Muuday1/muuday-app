'use client'

import { RecurringPreview } from '../../RecurringPreview'
import { RECURRING_SESSION_OPTIONS } from '../../booking-form-helpers'

interface RecurringConfigPanelProps {
  recurringPeriodicity: 'weekly' | 'biweekly' | 'monthly' | 'custom_days'
  onPeriodicityChange: (value: 'weekly' | 'biweekly' | 'monthly' | 'custom_days') => void
  recurringIntervalDays: number
  onIntervalDaysChange: (value: number) => void
  recurringDurationMode: 'occurrences' | 'end_date'
  onDurationModeChange: (value: 'occurrences' | 'end_date') => void
  recurringSessionsCount: number
  onSessionsCountChange: (value: number) => void
  recurringEndDate: string
  onEndDateChange: (value: string) => void
  recurringAutoRenew: boolean
  onAutoRenewChange: (value: boolean) => void
  resolvedRecurringSessionsCount: number
  hasValidRecurringDuration: boolean
  selectedDate: Date | null
  selectedTime: string | null
  sessionDurationMinutes: number
  maxBookingWindowDays: number
  existingBookings: { scheduled_at: string; duration_minutes: number }[]
  userTimezone: string
}

export function RecurringConfigPanel({
  recurringPeriodicity,
  onPeriodicityChange,
  recurringIntervalDays,
  onIntervalDaysChange,
  recurringDurationMode,
  onDurationModeChange,
  recurringSessionsCount,
  onSessionsCountChange,
  recurringEndDate,
  onEndDateChange,
  recurringAutoRenew,
  onAutoRenewChange,
  resolvedRecurringSessionsCount,
  hasValidRecurringDuration,
  selectedDate,
  selectedTime,
  sessionDurationMinutes,
  maxBookingWindowDays,
  existingBookings,
  userTimezone,
}: RecurringConfigPanelProps) {
  return (
    <div className="mt-4 space-y-3 rounded-md border border-slate-200 bg-slate-50/70 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Periodicidade</label>
          <select
            value={recurringPeriodicity}
            onChange={e => onPeriodicityChange(e.target.value as 'weekly' | 'biweekly' | 'monthly' | 'custom_days')}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
          >
            <option value="weekly">Semanal</option>
            <option value="biweekly">Quinzenal</option>
            <option value="monthly">Mensal</option>
            <option value="custom_days">A cada X dias</option>
          </select>
        </div>

        {recurringPeriodicity === 'custom_days' ? (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Intervalo (dias)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={recurringIntervalDays}
              onChange={e => onIntervalDaysChange(Math.max(1, Number(e.target.value || 1)))}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Duração</label>
          <select
            value={recurringDurationMode}
            onChange={e => onDurationModeChange(e.target.value as 'occurrences' | 'end_date')}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
          >
            <option value="occurrences">Por ocorrências</option>
            <option value="end_date">Até data final</option>
          </select>
        </div>
      </div>

      {recurringDurationMode === 'occurrences' ? (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Quantidade de sessões:</label>
          <select
            value={recurringSessionsCount}
            onChange={e => onSessionsCountChange(Number(e.target.value))}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
          >
            {RECURRING_SESSION_OPTIONS.map((option: number) => (
              <option key={option} value={option}>
                {option} sessões
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Data final:</label>
          <input
            type="date"
            value={recurringEndDate}
            onChange={e => onEndDateChange(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
          />
          <span className="text-xs text-slate-500">
            {resolvedRecurringSessionsCount > 0
              ? `${resolvedRecurringSessionsCount} sessão(ões) dentro da janela`
              : 'Escolha uma data final válida'}
          </span>
        </div>
      )}

      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={recurringAutoRenew}
          onChange={e => onAutoRenewChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/50"
        />
        Renovar automaticamente após o término deste pacote
      </label>

      {/* Recurrence preview */}
      {selectedDate && selectedTime && hasValidRecurringDuration && (
        <RecurringPreview
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          durationMinutes={sessionDurationMinutes}
          periodicity={recurringPeriodicity}
          intervalDays={recurringIntervalDays}
          occurrences={recurringDurationMode === 'occurrences' ? recurringSessionsCount : resolvedRecurringSessionsCount}
          bookingWindowDays={maxBookingWindowDays}
          existingBookings={existingBookings}
          userTimezone={userTimezone}
        />
      )}
    </div>
  )
}
