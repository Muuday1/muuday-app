'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { createBooking } from '@/lib/actions/booking'
import { cn, formatCurrency } from '@/lib/utils'

interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
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
  professionalTimezone: string
  minimumNoticeHours: number
  maxBookingWindowDays: number
  confirmationMode: 'auto_accept' | 'manual'
  requireSessionPurpose: boolean
  enableRecurring: boolean
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const DAY_NAMES_PT_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const DAY_NAMES_PT_FULL = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

const PLATFORM_CANCELLATION_POLICY = [
  'Cancelamento com 48h ou mais: reembolso de 100%',
  'Cancelamento entre 24h e 48h: reembolso de 50%',
  'Cancelamento com menos de 24h: sem reembolso',
]

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toLocalDateStr(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromIsoDateToLocalDate(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDaysToIsoDate(isoDate: string, daysToAdd: number) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + daysToAdd)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
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

function buildScheduledAt(dateStr: string, timeStr: string) {
  return `${dateStr}T${timeStr}:00`
}

function timezoneLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export default function BookingForm({
  professional,
  profileName,
  availability,
  existingBookings,
  userTimezone,
  userCurrency,
  professionalTimezone,
  minimumNoticeHours,
  maxBookingWindowDays,
  confirmationMode,
  requireSessionPurpose,
  enableRecurring,
}: BookingFormProps) {
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [sessionPurpose, setSessionPurpose] = useState('')
  const [acceptPolicy, setAcceptPolicy] = useState(false)
  const [acceptTimezone, setAcceptTimezone] = useState(false)
  const [timezoneMode, setTimezoneMode] = useState<'user' | 'professional'>('user')
  const [bookingType, setBookingType] = useState<'one_off' | 'recurring'>('one_off')
  const [recurringSessionsCount, setRecurringSessionsCount] = useState(4)
  const [isPending, startTransition] = useTransition()
  const [bookingResult, setBookingResult] = useState<
    { success: true; bookingId: string } | { success: false; error: string } | null
  >(null)

  const maxDate = useMemo(() => {
    const result = new Date(today)
    result.setDate(result.getDate() + maxBookingWindowDays)
    return result
  }, [maxBookingWindowDays, today])

  const minNoticeTimestamp = Date.now() + minimumNoticeHours * 60 * 60 * 1000

  const slotsByUserDate = useMemo(() => {
    const map = new Map<string, string[]>()
    const now = new Date()
    const professionalToday = formatInTimeZone(now, professionalTimezone, 'yyyy-MM-dd')

    for (let dayOffset = -1; dayOffset <= maxBookingWindowDays + 8; dayOffset++) {
      const professionalDate = addDaysToIsoDate(professionalToday, dayOffset)
      const professionalNoonUtc = fromZonedTime(`${professionalDate}T12:00:00`, professionalTimezone)
      const weekdayIso = Number(formatInTimeZone(professionalNoonUtc, professionalTimezone, 'i'))
      const professionalWeekday = weekdayIso % 7

      const dayRules = availability.filter(rule => rule.day_of_week === professionalWeekday)
      if (dayRules.length === 0) continue

      for (const rule of dayRules) {
        const rawSlots = generateTimeSlots(
          rule.start_time,
          rule.end_time,
          professional.session_duration_minutes,
        )

        for (const rawSlot of rawSlots) {
          const slotUtc = fromZonedTime(`${professionalDate}T${rawSlot}:00`, professionalTimezone)
          if (slotUtc.getTime() <= minNoticeTimestamp) continue

          const slotUserDate = formatInTimeZone(slotUtc, userTimezone, 'yyyy-MM-dd')
          const slotUserDateObj = fromIsoDateToLocalDate(slotUserDate)
          if (slotUserDateObj < today || slotUserDateObj > maxDate) continue

          const slotUserTime = formatInTimeZone(slotUtc, userTimezone, 'HH:mm')
          const existingSlots = map.get(slotUserDate) || []
          existingSlots.push(slotUserTime)
          map.set(slotUserDate, existingSlots)
        }
      }
    }

    const entries = Array.from(map.entries())
    for (const [dateKey, values] of entries) {
      const uniqueSorted = Array.from(new Set(values)).sort()
      map.set(dateKey, uniqueSorted)
    }

    return map
  }, [
    availability,
    maxBookingWindowDays,
    maxDate,
    minNoticeTimestamp,
    professional.session_duration_minutes,
    professionalTimezone,
    today,
    userTimezone,
  ])

  const isDateAvailable = (date: Date) => {
    if (date < today || date > maxDate) return false
    return slotsByUserDate.has(toLocalDateStr(date))
  }

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

  const timeSlots = useMemo(() => {
    if (!selectedDate) return []
    const selectedDateStr = toLocalDateStr(selectedDate)
    const candidateSlots = slotsByUserDate.get(selectedDateStr) || []
    if (candidateSlots.length === 0) return []

    const blockedRanges = existingBookings
      .map(booking => {
        const bookingStart = new Date(booking.scheduled_at)
        if (Number.isNaN(bookingStart.getTime())) return null

        const bookingDateStr = formatInTimeZone(bookingStart, userTimezone, 'yyyy-MM-dd')
        if (bookingDateStr !== selectedDateStr) return null

        const bookingStartStr = formatInTimeZone(bookingStart, userTimezone, 'HH:mm')
        const bookingEnd = new Date(bookingStart.getTime() + booking.duration_minutes * 60 * 1000)
        const bookingEndStr = formatInTimeZone(bookingEnd, userTimezone, 'HH:mm')
        const [startH, startM] = bookingStartStr.split(':').map(Number)
        const [endH, endM] = bookingEndStr.split(':').map(Number)

        return {
          startMinutes: startH * 60 + startM,
          endMinutes: endH * 60 + endM,
        }
      })
      .filter((range): range is { startMinutes: number; endMinutes: number } => Boolean(range))

    return candidateSlots.filter(time => {
      const [slotH, slotM] = time.split(':').map(Number)
      const slotStartMinutes = slotH * 60 + slotM
      const slotEndMinutes = slotStartMinutes + professional.session_duration_minutes

      const overlapsExisting = blockedRanges.some(
        range => slotStartMinutes < range.endMinutes && slotEndMinutes > range.startMinutes,
      )
      return !overlapsExisting
    })
  }, [
    existingBookings,
    professional.session_duration_minutes,
    selectedDate,
    slotsByUserDate,
    userTimezone,
  ])

  const totalSessions = bookingType === 'recurring' ? recurringSessionsCount : 1
  const totalPrice = professional.session_price_brl * totalSessions
  const priceFormatted = formatCurrency(professional.session_price_brl, userCurrency)
  const totalPriceFormatted = formatCurrency(totalPrice, userCurrency)
  const canGoPrev = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
  const canGoNext = currentMonth < maxMonth

  const selectedTimeInProfessionalTimezone = useMemo(() => {
    if (!selectedDate || !selectedTime) return null
    const selectedDateStr = toLocalDateStr(selectedDate)
    const selectedUtc = fromZonedTime(`${selectedDateStr}T${selectedTime}:00`, userTimezone)
    const professionalDate = formatInTimeZone(selectedUtc, professionalTimezone, 'yyyy-MM-dd')
    const professionalTime = formatInTimeZone(selectedUtc, professionalTimezone, 'HH:mm')
    return `${professionalDate} ${professionalTime}`
  }, [professionalTimezone, selectedDate, selectedTime, userTimezone])

  const canSubmit =
    Boolean(selectedDate && selectedTime) &&
    !isPending &&
    acceptPolicy &&
    acceptTimezone &&
    (!requireSessionPurpose || sessionPurpose.trim().length > 0)

  const submitLabel =
    confirmationMode === 'manual'
      ? bookingType === 'recurring'
        ? 'Pagar pacote e solicitar'
        : 'Pagar e solicitar agendamento'
      : bookingType === 'recurring'
        ? 'Pagar pacote e confirmar'
        : 'Pagar e confirmar agendamento'

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
    setAcceptPolicy(false)
    setAcceptTimezone(false)
  }

  function renderSlotLabel(time: string) {
    if (!selectedDate || timezoneMode === 'user') return time
    const selectedDateStr = toLocalDateStr(selectedDate)
    const selectedUtc = fromZonedTime(`${selectedDateStr}T${time}:00`, userTimezone)
    return formatInTimeZone(selectedUtc, professionalTimezone, 'HH:mm')
  }

  function handleConfirm() {
    if (!selectedDate || !selectedTime || !canSubmit) return

    startTransition(async () => {
      const scheduledAt = buildScheduledAt(toLocalDateStr(selectedDate), selectedTime)
      const result = await createBooking({
        professionalId: professional.id,
        scheduledAt,
        notes: sessionPurpose.trim() || undefined,
        sessionPurpose: sessionPurpose.trim() || undefined,
        bookingType,
        recurringSessionsCount: bookingType === 'recurring' ? recurringSessionsCount : undefined,
      })
      setBookingResult(result)
    })
  }

  if (bookingResult?.success) {
    const dateLabel = selectedDate?.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-neutral-900 font-display">
          {confirmationMode === 'manual' ? 'Solicitacao enviada' : 'Sessao confirmada'}
        </h2>
        <p className="mb-1 text-neutral-500">
          {bookingType === 'recurring' ? 'Seu pacote de sessoes' : 'Sua sessao'} com{' '}
          <span className="font-semibold text-neutral-700">{profileName}</span> foi criado.
        </p>
        <p className="mb-1 text-sm text-neutral-500">
          {dateLabel} as {selectedTime} ({timezoneLabel(userTimezone)})
        </p>
        {selectedTimeInProfessionalTimezone && (
          <p className="mb-6 text-xs text-neutral-500">
            Horario no fuso do profissional: {selectedTimeInProfessionalTimezone} ({timezoneLabel(professionalTimezone)})
          </p>
        )}
        {bookingType === 'recurring' && (
          <p className="mb-6 text-xs text-neutral-500">
            Pacote semanal com {recurringSessionsCount} sessoes (mesmo dia e horario).
          </p>
        )}

        {confirmationMode === 'manual' ? (
          <div className="mb-8 w-full rounded-xl border border-amber-100 bg-amber-50 p-4 text-left text-sm text-amber-700">
            <p className="mb-1 font-semibold">Aguardando confirmacao do profissional</p>
            <p>Se nao houver resposta dentro do prazo, o sistema cancela e reembolsa automaticamente.</p>
          </div>
        ) : (
          <div className="mb-8 w-full rounded-xl border border-green-100 bg-green-50 p-4 text-left text-sm text-green-700">
            <p className="mb-1 font-semibold">Sessao confirmada</p>
            <p>Voce recebera notificacoes e lembretes por email e no app.</p>
          </div>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href="/agenda"
            className="flex-1 rounded-xl bg-brand-500 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-brand-600"
          >
            Ver minha agenda
          </Link>
          <Link
            href="/buscar"
            className="flex-1 rounded-xl border border-neutral-200 bg-white py-3 text-center text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50"
          >
            Buscar mais profissionais
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <Link
        href={`/profissional/${professional.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao perfil
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-neutral-100 bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900 font-display">Tipo de agendamento</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setBookingType('one_off')}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left text-sm transition-all',
                  bookingType === 'one_off'
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-neutral-200 text-neutral-700 hover:border-brand-300',
                )}
              >
                <p className="font-semibold">Sessao unica</p>
                <p className="mt-0.5 text-xs text-neutral-500">1 sessao com pagamento unico.</p>
              </button>
              <button
                type="button"
                onClick={() => enableRecurring && setBookingType('recurring')}
                disabled={!enableRecurring}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left text-sm transition-all',
                  bookingType === 'recurring'
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-neutral-200 text-neutral-700 hover:border-brand-300',
                  !enableRecurring && 'cursor-not-allowed opacity-50',
                )}
              >
                <p className="font-semibold">Pacote semanal</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Mesmo dia e horario toda semana, pago antecipado.
                </p>
              </button>
            </div>

            {bookingType === 'recurring' && (
              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium text-neutral-700">Quantidade de sessoes:</label>
                <select
                  value={recurringSessionsCount}
                  onChange={e => setRecurringSessionsCount(Number(e.target.value))}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value={4}>4 sessoes</option>
                  <option value={8}>8 sessoes</option>
                </select>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-white p-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 font-display">
                <Calendar className="h-5 w-5 text-brand-500" />
                Escolha a data
              </h2>
              <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTimezoneMode('user')}
                  className={cn(
                    'rounded-md px-2 py-1 font-medium transition-colors',
                    timezoneMode === 'user'
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700',
                  )}
                >
                  Ver no meu fuso
                </button>
                <button
                  type="button"
                  onClick={() => setTimezoneMode('professional')}
                  className={cn(
                    'rounded-md px-2 py-1 font-medium transition-colors',
                    timezoneMode === 'professional'
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700',
                  )}
                >
                  Ver no fuso do profissional
                </button>
              </div>
            </div>
            <p className="mb-5 text-xs text-neutral-500">
              Fuso atual de visualizacao:{' '}
              <span className="font-medium text-neutral-700">
                {timezoneMode === 'user'
                  ? timezoneLabel(userTimezone)
                  : timezoneLabel(professionalTimezone)}
              </span>
            </p>

            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={prevMonth}
                disabled={!canGoPrev}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4 text-neutral-600" />
              </button>
              <span className="text-sm font-semibold text-neutral-900 font-display">
                {MONTH_NAMES_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={nextMonth}
                disabled={!canGoNext}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Proximo mes"
              >
                <ChevronRight className="h-4 w-4 text-neutral-600" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7">
              {DAY_NAMES_PT_SHORT.map(day => (
                <div key={day} className="py-1 text-center text-xs font-medium text-neutral-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} />

                const available = isDateAvailable(date)
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
                const isToday = isSameDay(date, today)

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    disabled={!available}
                    className={cn(
                      'relative flex h-9 w-full items-center justify-center rounded-xl text-sm font-medium transition-all',
                      isSelected
                        ? 'bg-brand-500 text-white shadow-sm'
                        : available
                          ? 'cursor-pointer text-neutral-800 hover:bg-brand-50 hover:text-brand-700'
                          : 'cursor-not-allowed text-neutral-300',
                      isToday && !isSelected && 'ring-1 ring-brand-300',
                    )}
                    aria-label={date.toLocaleDateString('pt-BR')}
                    aria-pressed={isSelected}
                  >
                    {date.getDate()}
                    {available && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-400" />
                    )}
                  </button>
                )
              })}
            </div>

            {availability.length === 0 && (
              <p className="mt-4 py-2 text-center text-sm text-neutral-400">
                Este profissional ainda nao configurou disponibilidade.
              </p>
            )}
          </div>

          {selectedDate && (
            <div className="rounded-2xl border border-neutral-100 bg-white p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-neutral-900 font-display">
                <Clock className="h-5 w-5 text-brand-500" />
                Horarios disponiveis
              </h2>
              <p className="mb-5 text-sm text-neutral-400">
                {DAY_NAMES_PT_FULL[selectedDate.getDay()]},{' '}
                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </p>

              {timeSlots.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50">
                    <Clock className="h-6 w-6 text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">Nenhum horario disponivel</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Todos os horarios desta data ja foram reservados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
                        selectedTime === time
                          ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700',
                      )}
                    >
                      {renderSlotLabel(time)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="rounded-2xl border border-neutral-100 bg-white p-6">
              <label className="mb-3 block text-sm font-semibold text-neutral-900 font-display">
                Objetivo da sessao{' '}
                <span className="font-normal text-neutral-400">
                  {requireSessionPurpose ? '(obrigatorio)' : '(opcional)'}
                </span>
              </label>
              <textarea
                value={sessionPurpose}
                onChange={e => setSessionPurpose(e.target.value)}
                placeholder="Descreva brevemente o que voce quer trabalhar nesta sessao."
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-xl border border-neutral-200 p-3 text-sm text-neutral-700 placeholder-neutral-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <p className="mt-1 text-right text-xs text-neutral-400">{sessionPurpose.length}/500</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-neutral-100 bg-white p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-neutral-100 pb-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold text-white font-display">
                {profileName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-900">{profileName}</p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {professional.session_duration_minutes} min · {priceFormatted}
                </p>
              </div>
            </div>

            <div className="mb-5 space-y-3">
              <div className="flex items-start gap-2.5 text-sm">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <p className="mb-0.5 text-xs text-neutral-400">Data</p>
                  {selectedDate ? (
                    <p className="font-medium text-neutral-800">
                      {selectedDate.toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  ) : (
                    <p className="italic text-neutral-400">Nao selecionada</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-sm">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <p className="mb-0.5 text-xs text-neutral-400">Horario</p>
                  {selectedTime ? (
                    <p className="font-medium text-neutral-800">
                      {selectedTime} ({timezoneLabel(userTimezone)})
                    </p>
                  ) : (
                    <p className="italic text-neutral-400">Nao selecionado</p>
                  )}
                  {selectedTimeInProfessionalTimezone && (
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Profissional: {selectedTimeInProfessionalTimezone} ({timezoneLabel(professionalTimezone)})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-sm">
                <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
                <div>
                  <p className="mb-0.5 text-xs text-neutral-400">Fuso padrao do checkout</p>
                  <p className="text-xs font-medium leading-snug text-neutral-800">
                    {timezoneLabel(userTimezone)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-xl bg-neutral-50 p-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-neutral-500">
                  Sessao ({professional.session_duration_minutes} min) x {totalSessions}
                </span>
                <span className="font-semibold text-neutral-800">{priceFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Taxa de servico</span>
                <span className="font-medium text-green-600">Gratis</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="text-lg font-bold text-neutral-900">{totalPriceFormatted}</span>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-neutral-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Politica de cancelamento
              </p>
              <div className="space-y-1.5">
                {PLATFORM_CANCELLATION_POLICY.map(item => (
                  <p key={item} className="text-xs text-neutral-500">
                    • {item}
                  </p>
                ))}
              </div>
            </div>

            {bookingResult && !bookingResult.success && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>{bookingResult.error}</p>
              </div>
            )}

            <div className="mb-4 space-y-2 rounded-xl border border-neutral-200 p-3">
              <label className="flex cursor-pointer items-start gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={acceptPolicy}
                  onChange={e => setAcceptPolicy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
                />
                <span>Li e concordo com a politica de cancelamento e reembolso.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={acceptTimezone}
                  onChange={e => setAcceptTimezone(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
                />
                <span>Confirmo que revisei data e horario nos fusos corretos.</span>
              </label>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!canSubmit}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all',
                canSubmit
                  ? 'bg-brand-500 text-white shadow-sm hover:bg-brand-600 hover:shadow-md'
                  : 'cursor-not-allowed bg-neutral-100 text-neutral-400',
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </button>

            <div className="mt-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                Sessao por video (Google Meet)
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                Lembretes por email e notificacoes no app
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                Protecao contra conflito de agenda
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
