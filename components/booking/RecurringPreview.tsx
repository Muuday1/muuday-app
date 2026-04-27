'use client'

import { useMemo } from 'react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { AlertCircle, CalendarDays } from 'lucide-react'
import {
  generateRecurrenceSlots,
  detectRecurrenceConflicts,
} from '@/lib/booking/recurrence-engine'

interface ExistingBooking {
  scheduled_at: string
  duration_minutes: number
}

interface RecurringPreviewProps {
  selectedDate: Date
  selectedTime: string
  durationMinutes: number
  periodicity: 'weekly' | 'biweekly' | 'monthly' | 'custom_days'
  intervalDays: number
  occurrences: number
  bookingWindowDays: number
  existingBookings: ExistingBooking[]
  userTimezone: string
}

export function RecurringPreview({
  selectedDate,
  selectedTime,
  durationMinutes,
  periodicity,
  intervalDays,
  occurrences,
  bookingWindowDays,
  existingBookings,
  userTimezone,
}: RecurringPreviewProps) {
  const preview = useMemo(() => {
    const dateStr = selectedDate.toISOString().slice(0, 10)
    const startLocal = fromZonedTime(`${dateStr}T${selectedTime}:00`, userTimezone)
    const endLocal = new Date(startLocal.getTime() + durationMinutes * 60_000)

    const decision = generateRecurrenceSlots({
      startDateUtc: startLocal,
      endDateUtc: endLocal,
      periodicity,
      intervalDays,
      occurrences,
      bookingWindowDays,
    })

    const existing = existingBookings.map(b => {
      const start = new Date(b.scheduled_at)
      const end = new Date(start.getTime() + b.duration_minutes * 60_000)
      return { startUtc: start, endUtc: end }
    })

    const conflicts = detectRecurrenceConflicts(decision.slots, existing, [])

    return { slots: decision.slots, conflicts }
  }, [
    selectedDate,
    selectedTime,
    durationMinutes,
    periodicity,
    intervalDays,
    occurrences,
    bookingWindowDays,
    existingBookings,
    userTimezone,
  ])

  if (preview.slots.length === 0) {
    return (
      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
        Nenhuma sessão pode ser gerada com a configuração atual. Verifique a data e periodicidade.
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <CalendarDays className="h-3.5 w-3.5 text-[#9FE870]" />
        Pré-visualização do pacote ({preview.slots.length} sessões)
      </div>

      {preview.conflicts.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p className="font-medium">Conflitos detectados</p>
            <p className="mt-0.5">
              {preview.conflicts.length} sessão(ões) conflitam com agendamentos existentes.
              Ajuste a data inicial ou a periodicidade.
            </p>
          </div>
        </div>
      )}

      <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {preview.slots.map((slot, index) => {
            const hasConflict = preview.conflicts.some(
              c => c.startUtc === slot.startUtc.toISOString()
            )
            const dateLabel = formatInTimeZone(
              slot.startUtc,
              userTimezone,
              "dd/MM/yyyy 'às' HH:mm"
            )
            return (
              <li
                key={index}
                className={`flex items-center justify-between px-3 py-2 text-xs ${
                  hasConflict ? 'bg-red-50/50 text-red-700' : 'text-slate-700'
                }`}
              >
                <span className="font-medium">
                  #{slot.occurrenceIndex} — {dateLabel}
                </span>
                {hasConflict && (
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                    Conflito
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
