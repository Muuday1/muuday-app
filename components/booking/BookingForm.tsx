'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle2,
  ArrowLeft, Loader2, AlertCircle, Globe
} from 'lucide-react'
import { createBooking } from '@/lib/actions/booking'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AvailabilitySlot {
  id: string
  day_of_week: number // 0=Sunday
  start_time: string  // "HH:MM:SS"
  end_time: string
}

interface ExistingBooking {
  scheduled_at: string
  duration_minutes: number
}

interface BookingFormProps {
  professional: {
    id: string
    session_price_brl: number
    session_duration_minutes: number
    category: string
  }
  profileName: string
  availability: AvailabilitySlot[]
  existingBookings: ExistingBooking[]
  userTimezone: string
  userCurrency: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DAY_NAMES_PT_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_NAMES_PT_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function toLocalDateStr(date: Date) {
  // Returns YYYY-MM-DD in local time
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Generate all HH:MM time slots between start and end with step = durationMinutes */
function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
): string[] {
  const slots: string[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let current = sh * 60 + sm
  const end = eh * 60 + em

  while (current + durationMinutes <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    current += durationMinutes
  }
  return slots
}

/** Build a UTC ISO string from a local date (YYYY-MM-DD) + time (HH:MM) + a known timezone offset
 *  We use the simple approach: construct as if the date/time is in UTC, then offset.
 *  For production, date-fns-tz fromZonedTime would be ideal but we keep it simple here.
 */
function buildScheduledAt(dateStr: string, timeStr: string): string {
  // We'll store as-is local time in the ISO string (the server will store as UTC timestamptz)
  // This gives us "YYYY-MM-DDTHH:MM:00" which the DB will interpret as the user's device timezone
  return `${dateStr}T${timeStr}:00`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BookingForm({
  professional,
  profileName,
  availability,
  existingBookings,
  userTimezone,
  userCurrency,
}: BookingFormProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [bookingResult, setBookingResult] = useState<{ success: true; bookingId: string } | { success: false; error: string } | null>(null)

  // ── Available days in current month view ──
  const availableDayOfWeeks = useMemo(() => new Set(availability.map(a => a.day_of_week)), [availability])

  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)

  const isDateAvailable = (date: Date) => {
    if (date < today || date > maxDate) return false
    return availableDayOfWeeks.has(date.getDay())
  }

  // ── Calendar grid ──
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
    return days
  }, [currentMonth])

  // ── Time slots for selected date ──
  const timeSlots = useMemo(() => {
    if (!selectedDate) return []

    const dayOfWeek = selectedDate.getDay()
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek)
    if (dayAvailability.length === 0) return []

    const allSlots: string[] = []
    for (const slot of dayAvailability) {
      const slots = generateTimeSlots(slot.start_time, slot.end_time, professional.session_duration_minutes)
      allSlots.push(...slots)
    }

    // Filter out already-booked slots
    const bookedTimes = new Set<string>()
    const dateStr = toLocalDateStr(selectedDate)
    for (const booking of existingBookings) {
      const bookingDate = new Date(booking.scheduled_at)
      if (isSameDay(bookingDate, selectedDate)) {
        const h = String(bookingDate.getHours()).padStart(2, '0')
        const m = String(bookingDate.getMinutes()).padStart(2, '0')
        bookedTimes.add(`${h}:${m}`)
      }
    }

    // Also filter past times if today is selected
    const now = new Date()
    return allSlots.filter(time => {
      if (bookedTimes.has(time)) return false
      if (isSameDay(selectedDate, today)) {
        const [h, m] = time.split(':').map(Number)
        const slotTime = new Date()
        slotTime.setHours(h, m, 0, 0)
        // Require at least 2 hours notice
        return slotTime.getTime() > now.getTime() + 2 * 60 * 60 * 1000
      }
      return true
    })
  }, [selectedDate, availability, existingBookings, professional.session_duration_minutes, today])

  // ── Price formatted ──
  const priceFormatted = formatCurrency(professional.session_price_brl, userCurrency)

  // ── Month navigation ──
  const canGoPrev = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoNext = currentMonth < new Date(today.getFullYear(), today.getMonth() + 1, 1)

  function prevMonth() {
    if (!canGoPrev) return
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  function nextMonth() {
    if (!canGoNext) return
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  function handleDateSelect(date: Date) {
    if (!isDateAvailable(date)) return
    setSelectedDate(date)
    setSelectedTime(null)
  }

  // ── Confirm booking ──
  function handleConfirm() {
    if (!selectedDate || !selectedTime) return

    startTransition(async () => {
      const scheduledAt = buildScheduledAt(toLocalDateStr(selectedDate), selectedTime)
      const result = await createBooking({
        professionalId: professional.id,
        scheduledAt,
        notes: notes.trim() || undefined,
      })
      setBookingResult(result)
    })
  }

  // ── Success state ──
  if (bookingResult?.success) {
    const dateLabel = selectedDate!.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="font-display font-bold text-2xl text-neutral-900 mb-2">
          Sessão agendada!
        </h2>
        <p className="text-neutral-500 mb-1">
          Sua sessão com <span className="font-semibold text-neutral-700">{profileName}</span> foi solicitada.
        </p>
        <p className="text-neutral-500 text-sm mb-6">
          {dateLabel} às {selectedTime}
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 mb-8 text-left w-full">
          <p className="font-semibold mb-1">Aguardando confirmação</p>
          <p>O profissional irá confirmar a sessão em breve. Você receberá uma notificação com o link do Google Meet.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/agenda"
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition-all text-center text-sm"
          >
            Ver minha agenda
          </Link>
          <Link
            href="/buscar"
            className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold py-3 rounded-xl border border-neutral-200 transition-all text-center text-sm"
          >
            Buscar mais profissionais
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href={`/profissional/${professional.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao perfil
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calendar + Time Slots */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section: Choose date */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-display font-semibold text-lg text-neutral-900 mb-5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              Escolha a data
            </h2>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                disabled={!canGoPrev}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-600" />
              </button>
              <span className="font-display font-semibold text-neutral-900 text-sm">
                {MONTH_NAMES_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={nextMonth}
                disabled={!canGoNext}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES_PT_SHORT.map(day => (
                <div key={day} className="text-center text-xs font-medium text-neutral-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, i) => {
                if (!date) {
                  return <div key={`empty-${i}`} />
                }
                const available = isDateAvailable(date)
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
                const isToday = isSameDay(date, today)

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    disabled={!available}
                    className={cn(
                      'relative h-9 w-full flex items-center justify-center rounded-xl text-sm font-medium transition-all',
                      isSelected
                        ? 'bg-brand-500 text-white shadow-sm'
                        : available
                        ? 'text-neutral-800 hover:bg-brand-50 hover:text-brand-700 cursor-pointer'
                        : 'text-neutral-300 cursor-not-allowed',
                      isToday && !isSelected && 'ring-1 ring-brand-300',
                    )}
                    aria-label={date.toLocaleDateString('pt-BR')}
                    aria-pressed={isSelected}
                  >
                    {date.getDate()}
                    {available && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-400" />
                    )}
                  </button>
                )
              })}
            </div>

            {availability.length === 0 && (
              <p className="text-center text-sm text-neutral-400 mt-4 py-2">
                Este profissional ainda não configurou disponibilidade.
              </p>
            )}
          </div>

          {/* Section: Choose time */}
          {selectedDate && (
            <div className="bg-white rounded-2xl border border-neutral-100 p-6">
              <h2 className="font-display font-semibold text-lg text-neutral-900 mb-1 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-500" />
                Horários disponíveis
              </h2>
              <p className="text-sm text-neutral-400 mb-5">
                {DAY_NAMES_PT_FULL[selectedDate.getDay()]},{' '}
                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </p>

              {timeSlots.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">Nenhum horário disponível</p>
                  <p className="text-xs text-neutral-400 mt-1">Todos os horários desta data já foram reservados.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        'py-2.5 px-3 rounded-xl text-sm font-medium border transition-all',
                        selectedTime === time
                          ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700',
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Notes (optional) */}
          {selectedDate && selectedTime && (
            <div className="bg-white rounded-2xl border border-neutral-100 p-6">
              <label className="block font-display font-semibold text-neutral-900 mb-3 text-sm">
                Observações <span className="text-neutral-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Descreva brevemente o que você gostaria de trabalhar nesta sessão..."
                rows={3}
                maxLength={500}
                className="w-full border border-neutral-200 rounded-xl p-3 text-sm text-neutral-700 placeholder-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent transition"
              />
              <p className="text-xs text-neutral-400 text-right mt-1">{notes.length}/500</p>
            </div>
          )}
        </div>

        {/* Right: Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 sticky top-6">
            {/* Professional info */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-neutral-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-display font-bold text-lg flex-shrink-0">
                {profileName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900 text-sm truncate">{profileName}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{professional.session_duration_minutes} min · {priceFormatted}</p>
              </div>
            </div>

            {/* Session details */}
            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">Data</p>
                  {selectedDate ? (
                    <p className="font-medium text-neutral-800">
                      {selectedDate.toLocaleDateString('pt-BR', {
                        weekday: 'short', day: 'numeric', month: 'short',
                      })}
                    </p>
                  ) : (
                    <p className="text-neutral-400 italic">Não selecionada</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-sm">
                <Clock className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">Horário</p>
                  {selectedTime ? (
                    <p className="font-medium text-neutral-800">{selectedTime}</p>
                  ) : (
                    <p className="text-neutral-400 italic">Não selecionado</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-sm">
                <Globe className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">Fuso horário</p>
                  <p className="font-medium text-neutral-800 text-xs leading-snug">{userTimezone}</p>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-neutral-50 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-neutral-500">Sessão ({professional.session_duration_minutes} min)</span>
                <span className="font-semibold text-neutral-800">{priceFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Taxa de serviço</span>
                <span className="text-green-600 font-medium">Grátis</span>
              </div>
              <div className="border-t border-neutral-200 mt-3 pt-3 flex items-center justify-between">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="font-bold text-lg text-neutral-900">{priceFormatted}</span>
              </div>
            </div>

            {/* Error state */}
            {bookingResult && !bookingResult.success && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{bookingResult.error}</p>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime || isPending}
              className={cn(
                'w-full font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm',
                selectedDate && selectedTime && !isPending
                  ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-md'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Confirmar agendamento
                </>
              )}
            </button>

            {/* Fine print */}
            <div className="mt-4 space-y-1.5">
              {[
                'Cancelamento gratuito até 24h antes',
                'Sessão por vídeo (Google Meet)',
                'Pagamento após confirmação',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-neutral-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
