'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
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
import { useFeatureFlagEnabled } from 'posthog-js/react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { createBooking } from '@/lib/actions/booking'
import { cn, formatCurrency } from '@/lib/utils'
import { captureEvent } from '@/lib/analytics/posthog-client'
import { generateIcsContent, downloadIcsFile } from '@/lib/calendar/ics-generator'
import { FEATURE_FLAGS } from '@/lib/analytics/feature-flags'
import {
  isSlotBlockedByException,
  hasUtcBookingConflict,
} from '@/lib/booking/slot-filtering'
import {
  generateRecurrenceSlots,
  detectRecurrenceConflicts,
} from '@/lib/booking/recurrence-engine'
import { RecurringPreview } from './RecurringPreview'

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

interface AvailabilityException {
  date_local: string
  is_available: boolean
  start_time_local: string | null
  end_time_local: string | null
}

interface BookingFormProps {
  professional: {
    id: string
    session_price_brl: number
    session_duration_minutes: number
    category: string
  }
  profileName: string
  profileHref: string
  availability: AvailabilitySlot[]
  existingBookings: ExistingBooking[]
  availabilityExceptions?: AvailabilityException[]
  userTimezone: string
  userCurrency: string
  professionalTimezone: string
  minimumNoticeHours: number
  maxBookingWindowDays: number
  confirmationMode: 'auto_accept' | 'manual'
  requireSessionPurpose: boolean
  enableRecurring: boolean
  initialBookingType?: 'one_off' | 'recurring' | 'batch'
  initialRecurringSessionsCount?: number
  initialDate?: string
  initialTime?: string
}

import {
  MONTH_NAMES_PT,
  DAY_NAMES_PT_SHORT,
  DAY_NAMES_PT_FULL,
  RECURRING_SESSION_OPTIONS,
  PLATFORM_CANCELLATION_POLICY,
  isSameDay,
  toLocalDateStr,
  fromIsoDateToLocalDate,
  addDaysToIsoDate,
  generateTimeSlots,
  buildScheduledAt,
  timezoneLabel,
  deriveRecurringOccurrencesFromEndDate,
} from './booking-form-helpers'

export default function BookingForm({
  professional,
  profileName,
  profileHref,
  availability,
  existingBookings,
  availabilityExceptions = [],
  userTimezone,
  userCurrency,
  professionalTimezone,
  minimumNoticeHours,
  maxBookingWindowDays,
  confirmationMode,
  requireSessionPurpose,
  enableRecurring,
  initialBookingType = 'one_off',
  initialRecurringSessionsCount = 4,
  initialDate,
  initialTime,
}: BookingFormProps) {
  const bookingViewTracked = useRef(false)
  const slotSelectionTracked = useRef(false)
  const prefillApplied = useRef(false)
  const recurringFlagEnabled = useFeatureFlagEnabled(FEATURE_FLAGS.bookingRecurringEnabled)

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
  const [bookingType, setBookingType] = useState<'one_off' | 'recurring' | 'batch'>(initialBookingType)
  const [recurringSessionsCount, setRecurringSessionsCount] = useState(
    RECURRING_SESSION_OPTIONS.includes(initialRecurringSessionsCount)
      ? initialRecurringSessionsCount
      : 4,
  )
  const [recurringPeriodicity, setRecurringPeriodicity] = useState<'weekly' | 'biweekly' | 'monthly' | 'custom_days'>('weekly')
  const [recurringIntervalDays, setRecurringIntervalDays] = useState(7)
  const [recurringDurationMode, setRecurringDurationMode] = useState<'occurrences' | 'end_date'>('occurrences')
  const [recurringEndDate, setRecurringEndDate] = useState('')
  const [recurringAutoRenew, setRecurringAutoRenew] = useState(false)
  const [batchDateTimes, setBatchDateTimes] = useState<string[]>([])
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

          if (isSlotBlockedByException(rawSlot, professional.session_duration_minutes, professionalDate, availabilityExceptions)) {
            continue
          }

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
    availabilityExceptions,
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

    return candidateSlots.filter(time => {
      const slotUtc = fromZonedTime(`${selectedDateStr}T${time}:00`, userTimezone)
      if (Number.isNaN(slotUtc.getTime())) return false
      const slotEndUtc = new Date(slotUtc.getTime() + professional.session_duration_minutes * 60 * 1000)
      return !hasUtcBookingConflict(slotUtc, slotEndUtc, existingBookings)
    })
  }, [
    existingBookings,
    professional.session_duration_minutes,
    selectedDate,
    slotsByUserDate,
    userTimezone,
  ])

  const resolvedRecurringSessionsCount = useMemo(() => {
    if (bookingType !== 'recurring') return 1
    if (recurringDurationMode === 'occurrences') return recurringSessionsCount
    if (!selectedDate) return 0
    return deriveRecurringOccurrencesFromEndDate({
      startDate: selectedDate,
      endDate: recurringEndDate,
      periodicity: recurringPeriodicity,
      intervalDays: recurringIntervalDays,
      maxBookingWindowDays,
    })
  }, [
    bookingType,
    maxBookingWindowDays,
    recurringDurationMode,
    recurringEndDate,
    recurringIntervalDays,
    recurringPeriodicity,
    recurringSessionsCount,
    selectedDate,
  ])

  const totalSessions =
    bookingType === 'recurring'
      ? Math.max(1, resolvedRecurringSessionsCount)
      : bookingType === 'batch'
        ? batchDateTimes.length
        : 1
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

  const hasValidRecurringDuration =
    bookingType !== 'recurring'
      ? true
      : recurringDurationMode === 'occurrences'
        ? recurringSessionsCount >= 2
        : resolvedRecurringSessionsCount >= 2

  const canSubmit =
    !isPending &&
    acceptPolicy &&
    acceptTimezone &&
    (!requireSessionPurpose || sessionPurpose.trim().length > 0) &&
    (bookingType === 'batch'
      ? batchDateTimes.length >= 2
      : Boolean(selectedDate && selectedTime) && hasValidRecurringDuration)

  const canUseRecurring = enableRecurring && recurringFlagEnabled !== false

  const recurringConflicts = useMemo(() => {
    if (bookingType !== 'recurring' || !selectedDate || !selectedTime || !hasValidRecurringDuration) return []

    const selectedDateStr = toLocalDateStr(selectedDate)
    const startUtc = fromZonedTime(`${selectedDateStr}T${selectedTime}:00`, userTimezone)
    const endUtc = new Date(startUtc.getTime() + professional.session_duration_minutes * 60 * 1000)

    const { slots } = generateRecurrenceSlots({
      startDateUtc: startUtc,
      endDateUtc: endUtc,
      periodicity: recurringPeriodicity,
      intervalDays: recurringIntervalDays,
      occurrences: resolvedRecurringSessionsCount,
      bookingWindowDays: maxBookingWindowDays,
    })

    const existing = existingBookings.map(b => {
      const s = new Date(b.scheduled_at)
      return { startUtc: s, endUtc: new Date(s.getTime() + b.duration_minutes * 60 * 1000) }
    })

    return detectRecurrenceConflicts(slots, existing, [])
  }, [bookingType, selectedDate, selectedTime, hasValidRecurringDuration, userTimezone, professional.session_duration_minutes, recurringPeriodicity, recurringIntervalDays, resolvedRecurringSessionsCount, maxBookingWindowDays, existingBookings])

  const submitLabel =
    confirmationMode === 'manual'
      ? bookingType === 'recurring'
        ? 'Pagar pacote e solicitar'
        : bookingType === 'batch'
          ? 'Pagar lote e solicitar'
        : 'Pagar e solicitar agendamento'
      : bookingType === 'recurring'
        ? 'Pagar pacote e confirmar'
        : bookingType === 'batch'
          ? 'Pagar lote e confirmar'
        : 'Pagar e confirmar agendamento'

  const batchSlotsPreview = useMemo(() => {
    return batchDateTimes.map(value => {
      const startUtc = fromZonedTime(value, userTimezone)
      const userDateTime = formatInTimeZone(startUtc, userTimezone, "EEE, dd/MM 'às' HH:mm")
      const professionalDateTime = formatInTimeZone(
        startUtc,
        professionalTimezone,
        "EEE, dd/MM 'às' HH:mm",
      )
      return {
        value,
        userDateTime,
        professionalDateTime,
      }
    })
  }, [batchDateTimes, professionalTimezone, userTimezone])

  useEffect(() => {
    if (bookingViewTracked.current) return
    bookingViewTracked.current = true

    captureEvent('booking_form_viewed', {
      professional_id: professional.id,
      confirmation_mode: confirmationMode,
      recurring_enabled: enableRecurring,
      recurring_flag_enabled: recurringFlagEnabled,
      min_notice_hours: minimumNoticeHours,
      max_window_days: maxBookingWindowDays,
    })
  }, [
    confirmationMode,
    enableRecurring,
    maxBookingWindowDays,
    minimumNoticeHours,
    professional.id,
    recurringFlagEnabled,
  ])

  useEffect(() => {
    if (!canUseRecurring && bookingType === 'recurring') {
      setBookingType('one_off')
    }
  }, [bookingType, canUseRecurring])

  useEffect(() => {
    if (prefillApplied.current) return
    prefillApplied.current = true

    if (initialBookingType === 'recurring' && canUseRecurring) {
      setBookingType('recurring')
      if (RECURRING_SESSION_OPTIONS.includes(initialRecurringSessionsCount)) {
        setRecurringSessionsCount(initialRecurringSessionsCount)
      }
    }

    if (!initialDate) return
    const parsedDate = fromIsoDateToLocalDate(initialDate)
    if (Number.isNaN(parsedDate.getTime())) return
    if (parsedDate < today || parsedDate > maxDate) return
    if (!slotsByUserDate.has(initialDate)) return

    setCurrentMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1))
    setSelectedDate(parsedDate)

    if (!initialTime) return
    const availableSlots = slotsByUserDate.get(initialDate) || []
    if (availableSlots.includes(initialTime)) {
      setSelectedTime(initialTime)
    }
  }, [
    canUseRecurring,
    initialBookingType,
    initialDate,
    initialRecurringSessionsCount,
    initialTime,
    maxDate,
    slotsByUserDate,
    today,
  ])

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
    slotSelectionTracked.current = false
    captureEvent('booking_date_selected', {
      professional_id: professional.id,
      selected_date: toLocalDateStr(date),
      booking_type: bookingType,
    })
  }

  function renderSlotLabel(time: string) {
    if (!selectedDate || timezoneMode === 'user') return time
    const selectedDateStr = toLocalDateStr(selectedDate)
    const selectedUtc = fromZonedTime(`${selectedDateStr}T${time}:00`, userTimezone)
    return formatInTimeZone(selectedUtc, professionalTimezone, 'HH:mm')
  }

  function addCurrentSelectionToBatch() {
    if (!selectedDate || !selectedTime) return
    const value = buildScheduledAt(toLocalDateStr(selectedDate), selectedTime)
    setBatchDateTimes(prev => {
      if (prev.includes(value)) return prev
      return [...prev, value].sort()
    })
  }

  function removeBatchDate(dateTime: string) {
    setBatchDateTimes(prev => prev.filter(item => item !== dateTime))
  }

  const bookingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearBookingTimeout() {
    if (bookingTimeoutRef.current) {
      clearTimeout(bookingTimeoutRef.current)
      bookingTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => clearBookingTimeout()
  }, [])

  function handleConfirm() {
    if (!canSubmit) return
    if (bookingType !== 'batch' && (!selectedDate || !selectedTime)) return

    captureEvent('booking_submit_clicked', {
      professional_id: professional.id,
      booking_type: bookingType,
      confirmation_mode: confirmationMode,
      recurring_sessions_count: bookingType === 'recurring' ? resolvedRecurringSessionsCount : 1,
      batch_sessions_count: bookingType === 'batch' ? batchDateTimes.length : undefined,
    })

    clearBookingTimeout()
    bookingTimeoutRef.current = setTimeout(() => {
      setBookingResult({
        success: false,
        error: 'A solicitação demorou muito. Verifique sua conexão e tente novamente.',
      })
    }, 15000)

    startTransition(async () => {
      try {
        const scheduledAt =
          selectedDate && selectedTime
            ? buildScheduledAt(toLocalDateStr(selectedDate), selectedTime)
            : undefined
        const result = await createBooking({
          professionalId: professional.id,
          scheduledAt,
          notes: sessionPurpose.trim() || undefined,
          sessionPurpose: sessionPurpose.trim() || undefined,
          bookingType,
          recurringSessionsCount:
            bookingType === 'recurring' && recurringDurationMode === 'occurrences'
              ? recurringSessionsCount
              : undefined,
          recurringOccurrences:
            bookingType === 'recurring' && recurringDurationMode === 'end_date'
              ? Math.max(2, resolvedRecurringSessionsCount)
              : undefined,
          recurringPeriodicity: bookingType === 'recurring' ? recurringPeriodicity : undefined,
          recurringIntervalDays:
            bookingType === 'recurring' && recurringPeriodicity === 'custom_days'
              ? recurringIntervalDays
              : undefined,
          recurringEndDate:
            bookingType === 'recurring' && recurringDurationMode === 'end_date'
              ? recurringEndDate
              : undefined,
          recurringAutoRenew: bookingType === 'recurring' ? recurringAutoRenew : undefined,
          batchDates: bookingType === 'batch' ? batchDateTimes : undefined,
        })
        clearBookingTimeout()
        setBookingResult(result)
        if (result.success) {
          captureEvent('booking_created', {
            professional_id: professional.id,
            booking_type: bookingType,
            confirmation_mode: confirmationMode,
            recurring_sessions_count:
              bookingType === 'recurring' ? resolvedRecurringSessionsCount : undefined,
            batch_sessions_count: bookingType === 'batch' ? batchDateTimes.length : undefined,
          })
        } else {
          captureEvent('booking_create_failed', {
            professional_id: professional.id,
            booking_type: bookingType,
            reason: result.error,
          })
        }
      } catch (error) {
        clearBookingTimeout()
        setBookingResult({
          success: false,
          error: 'Erro inesperado ao processar agendamento. Tente novamente.',
        })
        captureEvent('booking_create_failed', {
          professional_id: professional.id,
          booking_type: bookingType,
          reason: error instanceof Error ? error.message : 'unknown_exception',
        })
      }
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
        <h2 className="mb-2 text-2xl font-bold text-slate-900 font-display">
          {confirmationMode === 'manual' ? 'Solicitação enviada' : 'Sessão confirmada'}
        </h2>
        <p className="mb-1 text-slate-500">
          {bookingType === 'recurring' ? 'Seu pacote de sessões' : 'Sua sessão'} com{' '}
          <span className="font-semibold text-slate-700">{profileName}</span> foi criado.
        </p>
        {bookingType === 'batch' ? (
          <p className="mb-1 text-sm text-slate-500">
            {batchDateTimes.length} sessões avulsas agendadas no mesmo checkout.
          </p>
        ) : (
          <>
            <p className="mb-1 text-sm text-slate-500">
              {dateLabel} às {selectedTime} ({timezoneLabel(userTimezone)})
            </p>
            {selectedTimeInProfessionalTimezone && (
              <p className="mb-6 text-xs text-slate-500">
                Horário no fuso do profissional: {selectedTimeInProfessionalTimezone} ({timezoneLabel(professionalTimezone)})
              </p>
            )}
          </>
        )}
        {bookingType === 'recurring' && (
          <p className="mb-6 text-xs text-slate-500">
            Pacote recorrente com {resolvedRecurringSessionsCount} sessões (mesmo dia e horário).
          </p>
        )}

        {confirmationMode === 'manual' ? (
          <div className="mb-8 w-full rounded-md border border-amber-100 bg-amber-50 p-4 text-left text-sm text-amber-700">
            <p className="mb-1 font-semibold">Aguardando confirmação do profissional</p>
            <p>Se não houver resposta dentro do prazo, o sistema cancela e reembolsa automaticamente.</p>
          </div>
        ) : (
          <div className="mb-8 w-full rounded-md border border-green-100 bg-green-50 p-4 text-left text-sm text-green-700">
            <p className="mb-1 font-semibold">Sessão confirmada</p>
            <p>Você receberá notificações e lembretes por email e no app.</p>
          </div>
        )}

        {bookingType === 'recurring' && selectedDate && selectedTime && (
          <button
            onClick={() => {
              const selectedDateStr = toLocalDateStr(selectedDate)
              const startUtc = fromZonedTime(`${selectedDateStr}T${selectedTime}:00`, userTimezone)
              const endUtc = new Date(startUtc.getTime() + professional.session_duration_minutes * 60 * 1000)
              const { slots } = generateRecurrenceSlots({
                startDateUtc: startUtc,
                endDateUtc: endUtc,
                periodicity: recurringPeriodicity,
                intervalDays: recurringIntervalDays,
                occurrences: resolvedRecurringSessionsCount,
                bookingWindowDays: maxBookingWindowDays,
              })
              const events = slots.map((slot, i) => ({
                uid: `${professional.id}-${i + 1}@muuday.com`,
                startUtc: slot.startUtc,
                endUtc: slot.endUtc,
                summary: `Sessão com ${profileName}`,
                description: `Sessão de ${professional.session_duration_minutes} minutos agendada via Muuday`,
                url: `${typeof window !== 'undefined' ? window.location.origin : ''}/agenda`,
              }))
              const ics = generateIcsContent(events)
              downloadIcsFile(`muuday-sessoes-${profileName.replace(/\s+/g, '-')}.ics`, ics)
              captureEvent('booking_ics_downloaded', {
                professional_id: professional.id,
                sessions_count: slots.length,
              })
            }}
            className="mb-4 w-full rounded-md border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50/70"
          >
            📅 Baixar calendário (.ics)
          </button>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href="/agenda"
            className="flex-1 rounded-md bg-[#9FE870] py-3 text-center text-sm font-semibold text-white transition-all hover:bg-[#8ed85f]"
          >
            Ver minha agenda
          </Link>
          <Link
            href="/buscar"
            className="flex-1 rounded-md border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50/70"
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
        href={profileHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao perfil
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-lg border border-slate-200/80 bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-900 font-display">Tipo de agendamento</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setBookingType('one_off')}
                className={cn(
                  'rounded-md border px-4 py-3 text-left text-sm transition-all',
                  bookingType === 'one_off'
                    ? 'border-[#9FE870]/60 bg-[#9FE870]/8 text-[#3d6b1f]'
                    : 'border-slate-200 text-slate-700 hover:border-[#9FE870]/40',
                )}
              >
                <p className="font-semibold">Sessão única</p>
                  <p className="mt-0.5 text-xs text-slate-500">1 sessão com pagamento único.</p>
                </button>
              <button
                type="button"
                onClick={() => canUseRecurring && setBookingType('recurring')}
                disabled={!canUseRecurring}
                className={cn(
                  'rounded-md border px-4 py-3 text-left text-sm transition-all',
                  bookingType === 'recurring'
                    ? 'border-[#9FE870]/60 bg-[#9FE870]/8 text-[#3d6b1f]'
                    : 'border-slate-200 text-slate-700 hover:border-[#9FE870]/40',
                  !canUseRecurring && 'cursor-not-allowed opacity-50',
                )}
              >
                <p className="font-semibold">Recorrente</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {!enableRecurring
                    ? 'Este profissional não oferece pacote recorrente.'
                    : recurringFlagEnabled === false
                      ? 'Pacote recorrente indisponível temporariamente.'
                      : 'Mesmo dia e horário, com periodicidade configurável.'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setBookingType('batch')}
                className={cn(
                  'rounded-md border px-4 py-3 text-left text-sm transition-all',
                  bookingType === 'batch'
                    ? 'border-[#9FE870]/60 bg-[#9FE870]/8 text-[#3d6b1f]'
                    : 'border-slate-200 text-slate-700 hover:border-[#9FE870]/40',
                )}
              >
                <p className="font-semibold">Várias datas</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Escolha datas avulsas e reserve todas de uma vez.
                </p>
              </button>
            </div>

            {bookingType === 'recurring' && (
              <div className="mt-4 space-y-3 rounded-md border border-slate-200 bg-slate-50/70 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Periodicidade</label>
                    <select
                      value={recurringPeriodicity}
                      onChange={e => setRecurringPeriodicity(e.target.value as 'weekly' | 'biweekly' | 'monthly' | 'custom_days')}
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
                        onChange={e => setRecurringIntervalDays(Math.max(1, Number(e.target.value || 1)))}
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Duração</label>
                    <select
                      value={recurringDurationMode}
                      onChange={e => setRecurringDurationMode(e.target.value as 'occurrences' | 'end_date')}
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
                      onChange={e => setRecurringSessionsCount(Number(e.target.value))}
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
                    >
                      {RECURRING_SESSION_OPTIONS.map(option => (
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
                      onChange={e => setRecurringEndDate(e.target.value)}
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
                    onChange={e => setRecurringAutoRenew(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/50"
                  />
                  Renovar automaticamente após o término deste pacote
                </label>

                {/* Recurrence preview */}
                {selectedDate && selectedTime && hasValidRecurringDuration && (
                  <RecurringPreview
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    durationMinutes={professional.session_duration_minutes}
                    periodicity={recurringPeriodicity}
                    intervalDays={recurringIntervalDays}
                    occurrences={recurringDurationMode === 'occurrences' ? recurringSessionsCount : resolvedRecurringSessionsCount}
                    bookingWindowDays={maxBookingWindowDays}
                    existingBookings={existingBookings}
                    userTimezone={userTimezone}
                  />
                )}
              </div>
            )}

            {bookingType === 'batch' ? (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
                Selecione data e horário e clique em <strong>Adicionar ao lote</strong>. Para concluir, escolha ao menos 2 sessões.
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200/80 bg-white p-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 font-display">
                <Calendar className="h-5 w-5 text-[#9FE870]" />
                Escolha a data
              </h2>
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50/70 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTimezoneMode('user')}
                  className={cn(
                    'rounded-md px-2 py-1 font-medium transition-colors',
                    timezoneMode === 'user'
                      ? 'bg-white text-[#3d6b1f]'
                      : 'text-slate-500 hover:text-slate-700',
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
                      ? 'bg-white text-[#3d6b1f]'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  Ver no fuso do profissional
                </button>
              </div>
            </div>
            <p className="mb-5 text-xs text-slate-500">
              Fuso atual de visualização:{' '}
              <span className="font-medium text-slate-700">
                {timezoneMode === 'user'
                  ? timezoneLabel(userTimezone)
                  : timezoneLabel(professionalTimezone)}
              </span>
            </p>

            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={prevMonth}
                disabled={!canGoPrev}
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-slate-50/70 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <span className="text-sm font-semibold text-slate-900 font-display">
                {MONTH_NAMES_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={nextMonth}
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
                      'relative flex h-9 w-full items-center justify-center rounded-md text-sm font-medium transition-all',
                      isSelected
                        ? 'bg-[#9FE870] text-white'
                        : available
                          ? 'cursor-pointer text-slate-800 hover:bg-[#9FE870]/8 hover:text-[#3d6b1f]'
                          : 'cursor-not-allowed text-slate-300',
                      isToday && !isSelected && 'ring-1 ring-[#9FE870]/40',
                    )}
                    aria-label={date.toLocaleDateString('pt-BR')}
                    aria-pressed={isSelected}
                  >
                    {date.getDate()}
                    {available && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#9FE870]/40" />
                    )}
                  </button>
                )
              })}
            </div>

            {availability.length === 0 && (
              <p className="mt-4 py-2 text-center text-sm text-slate-400">
                Este profissional ainda não configurou disponibilidade.
              </p>
            )}
          </div>

          {selectedDate && (
            <div className="rounded-lg border border-slate-200/80 bg-white p-6">
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-slate-900 font-display">
                <Clock className="h-5 w-5 text-[#9FE870]" />
                Horários disponíveis
              </h2>
              <p className="mb-5 text-sm text-slate-400">
                {DAY_NAMES_PT_FULL[selectedDate.getDay()]},{' '}
                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </p>

              {timeSlots.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-slate-50/70">
                    <Clock className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Nenhum horário disponível</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Todos os horários desta data já foram reservados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelectedTime(time)
                        if (!slotSelectionTracked.current) {
                          slotSelectionTracked.current = true
                          captureEvent('booking_time_selected', {
                            professional_id: professional.id,
                            selected_time: time,
                            booking_type: bookingType,
                          })
                        }
                      }}
                      className={cn(
                        'rounded-md border px-3 py-2.5 text-sm font-medium transition-all',
                        selectedTime === time
                          ? 'border-[#9FE870] bg-[#9FE870] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-[#9FE870]/40 hover:bg-[#9FE870]/8 hover:text-[#3d6b1f]',
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
            <div className="rounded-lg border border-slate-200/80 bg-white p-6">
              <label className="mb-3 block text-sm font-semibold text-slate-900 font-display">
                Objetivo da sessão{' '}
                <span className="font-normal text-slate-400">
                  {requireSessionPurpose ? '(obrigatório)' : '(opcional)'}
                </span>
              </label>
              <textarea
                value={sessionPurpose}
                onChange={e => setSessionPurpose(e.target.value)}
                placeholder="Descreva brevemente o que você quer trabalhar nesta sessão."
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-lg border border-slate-200/80 bg-slate-50/30 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 transition-all hover:border-slate-300 focus:border-[#9FE870] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/15"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{sessionPurpose.length}/500</p>
            </div>
          )}

          {bookingType === 'batch' && (
            <div className="rounded-lg border border-slate-200/80 bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 font-display">
                Lote de sessões avulsas
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Selecione uma data e um horário e adicione ao lote. Você precisa de pelo menos 2 sessões.
              </p>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addCurrentSelectionToBatch}
                  disabled={!selectedDate || !selectedTime}
                  className={cn(
                    'rounded-md px-4 py-2 text-xs font-semibold transition',
                    selectedDate && selectedTime
                      ? 'bg-[#9FE870] text-white hover:bg-[#8ed85f]'
                      : 'cursor-not-allowed bg-slate-100 text-slate-400',
                  )}
                >
                  Adicionar ao lote
                </button>
                <span className="text-xs text-slate-500">
                  {batchDateTimes.length} sessão(ões) adicionada(s)
                </span>
              </div>
              {batchSlotsPreview.length > 0 ? (
                <ul className="space-y-2">
                  {batchSlotsPreview.map(item => (
                    <li
                      key={item.value}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{item.userDateTime}</p>
                        <p className="text-slate-500">
                          Profissional: {item.professionalDateTime} ({timezoneLabel(professionalTimezone)})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBatchDate(item.value)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-red-200 hover:text-red-600"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Nenhuma sessão adicionada ao lote ainda.</p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-lg border border-slate-200/80 bg-white p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-200/80 pb-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#9FE870]/80 to-[#8ed85f] text-lg font-bold text-white font-display">
                {profileName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{profileName}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {professional.session_duration_minutes} min • {priceFormatted}
                </p>
              </div>
            </div>

            <div className="mb-5 space-y-3">
              <div className="flex items-start gap-2.5 text-sm">
                <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="mb-0.5 text-xs text-slate-400">Data</p>
                  {selectedDate ? (
                    <p className="font-medium text-slate-800">
                      {selectedDate.toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  ) : (
                    <p className="italic text-slate-400">Não selecionada</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-sm">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="mb-0.5 text-xs text-slate-400">Horário</p>
                  {selectedTime ? (
                    <p className="font-medium text-slate-800">
                      {selectedTime} ({timezoneLabel(userTimezone)})
                    </p>
                  ) : (
                    <p className="italic text-slate-400">Não selecionado</p>
                  )}
                  {selectedTimeInProfessionalTimezone && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      Profissional: {selectedTimeInProfessionalTimezone} ({timezoneLabel(professionalTimezone)})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-sm">
                <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="mb-0.5 text-xs text-slate-400">Fuso padrão do checkout</p>
                  <p className="text-xs font-medium leading-snug text-slate-800">
                    {timezoneLabel(userTimezone)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-lg bg-slate-50/60 p-4 border border-slate-100">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  Sessão ({professional.session_duration_minutes} min) x {totalSessions}
                </span>
                <span className="font-semibold text-slate-800">{priceFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Taxa de serviço</span>
                <span className="font-medium text-green-600">Grátis</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-lg font-bold text-slate-900">{totalPriceFormatted}</span>
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-slate-200/80 bg-slate-50/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Política de cancelamento
              </p>
              <div className="space-y-1.5">
                {PLATFORM_CANCELLATION_POLICY.map(item => (
                  <p key={item} className="text-xs text-slate-500">
                    • {item}
                  </p>
                ))}
              </div>
            </div>

            {recurringConflicts.length > 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-sm text-amber-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Atenção: conflitos detectados</p>
                  <p className="mt-0.5">
                    {recurringConflicts.length} sessão(ões) conflitam com agendamentos existentes. O profissional pode recusar ou ajustar.
                  </p>
                </div>
              </div>
            )}

            {bookingResult && !bookingResult.success && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50/70 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>{bookingResult.error}</p>
              </div>
            )}

            <div className="mb-4 space-y-2 rounded-lg border border-slate-200/80 bg-slate-50/30 p-3">
              <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptPolicy}
                  onChange={e => setAcceptPolicy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/50"
                />
                <span>Li e concordo com a política de cancelamento e reembolso.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptTimezone}
                  onChange={e => setAcceptTimezone(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/50"
                />
                <span>Confirmo que revisei data e horário nos fusos corretos.</span>
              </label>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!canSubmit}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-all active:scale-[0.98]',
                canSubmit
                  ? 'bg-[#9FE870] text-white hover:bg-[#8ed85f]'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400',
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
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                Sessão por vídeo (Agora)
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                Lembretes por email e notificações no app
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                Proteção contra conflito de agenda
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

