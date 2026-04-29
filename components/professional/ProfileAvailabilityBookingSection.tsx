'use client'

import { type ReactNode, useMemo, useState } from 'react'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { SearchBookingCtas } from '@/components/search/SearchBookingCtas'
import {
  isSlotBlockedByException,
  hasUtcBookingConflict,
  hasUtcExternalConflict,
} from '@/lib/booking/slot-filtering'
import { generateTimeSlots } from '@/components/booking/booking-form-helpers'
import { ProfileServicesList, type ProfessionalService } from './ProfileServicesList'

type AvailabilitySlot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

type ExistingBooking = {
  scheduled_at: string
  duration_minutes: number
}

type AvailabilityException = {
  date_local: string
  is_available: boolean
  start_time_local: string | null
  end_time_local: string | null
}

type ExternalCalendarBusySlot = {
  start_utc: string
  end_utc: string
}

type ProfileAvailabilityBookingSectionProps = {
  availability: AvailabilitySlot[]
  existingBookings: ExistingBooking[]
  availabilityExceptions?: AvailabilityException[]
  externalCalendarBusySlots?: ExternalCalendarBusySlot[]
  isLoggedIn: boolean
  isOwnProfessional: boolean
  firstBookingBlocked: boolean
  errorCode?: string
  bookHref: string
  messageHref: string
  userTimezone: string
  professionalTimezone: string
  minimumNoticeHours: number
  maxBookingWindowDays: number
  enableRecurring: boolean
  basePriceBrl: number
  baseDurationMinutes: number
  viewerCurrency: string
  services?: ProfessionalService[]
  priceRangeLabel?: string
  topSections?: ReactNode
  children?: ReactNode
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
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

const DAY_NAMES_PT_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAY_NAMES_PT_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DEFAULT_DURATION_OPTIONS = [30, 50, 60, 90]

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
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`
}

function timezoneLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export function ProfileAvailabilityBookingSection({
  availability,
  existingBookings,
  availabilityExceptions = [],
  externalCalendarBusySlots = [],
  isLoggedIn,
  isOwnProfessional,
  firstBookingBlocked,
  errorCode,
  bookHref,
  messageHref,
  userTimezone,
  professionalTimezone,
  minimumNoticeHours,
  maxBookingWindowDays,
  enableRecurring,
  basePriceBrl,
  baseDurationMinutes,
  viewerCurrency,
  services,
  priceRangeLabel,
  topSections,
  children,
}: ProfileAvailabilityBookingSectionProps) {
  const hasServices = (services?.length || 0) > 0
  const hasSingleService = (services?.length || 0) === 1
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const durationOptions = useMemo(() => {
    const unique = new Set(DEFAULT_DURATION_OPTIONS)
    if (baseDurationMinutes > 0) unique.add(baseDurationMinutes)
    return Array.from(unique).sort((a, b) => a - b)
  }, [baseDurationMinutes])

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [timezoneMode, setTimezoneMode] = useState<'user' | 'professional'>('user')
  const [bookingType, setBookingType] = useState<'one_off' | 'recurring'>('one_off')
  const [recurringSessionsCount, setRecurringSessionsCount] = useState(4)
  const [selectedDuration, setSelectedDuration] = useState(
    durationOptions.includes(60) ? 60 : Math.max(1, baseDurationMinutes),
  )
  const recurringSessionOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

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
        const rawSlots = generateTimeSlots(rule.start_time, rule.end_time, selectedDuration)
        for (const rawSlot of rawSlots) {
          const slotUtc = fromZonedTime(`${professionalDate}T${rawSlot}:00`, professionalTimezone)
          if (slotUtc.getTime() <= minNoticeTimestamp) continue
          const slotUserDate = formatInTimeZone(slotUtc, userTimezone, 'yyyy-MM-dd')
          const slotUserDateObj = fromIsoDateToLocalDate(slotUserDate)
          if (slotUserDateObj < today || slotUserDateObj > maxDate) continue

          if (isSlotBlockedByException(rawSlot, selectedDuration, professionalDate, availabilityExceptions)) {
            continue
          }

          const slotUserTime = formatInTimeZone(slotUtc, userTimezone, 'HH:mm')
          const existingSlots = map.get(slotUserDate) || []
          existingSlots.push(slotUserTime)
          map.set(slotUserDate, existingSlots)
        }
      }
    }

    map.forEach((values, dateKey) => {
      const uniqueSorted = Array.from(new Set<string>(values)).sort()
      map.set(dateKey, uniqueSorted)
    })
    return map
  }, [
    availability,
    availabilityExceptions,
    maxBookingWindowDays,
    maxDate,
    minNoticeTimestamp,
    professionalTimezone,
    selectedDuration,
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
      const slotEndUtc = new Date(slotUtc.getTime() + selectedDuration * 60 * 1000)

      if (hasUtcBookingConflict(slotUtc, slotEndUtc, existingBookings)) return false
      if (hasUtcExternalConflict(slotUtc, slotEndUtc, externalCalendarBusySlots)) return false
      return true
    })
  }, [existingBookings, externalCalendarBusySlots, selectedDate, selectedDuration, slotsByUserDate, userTimezone])

  const selectedTimeInProfessionalTimezone = useMemo(() => {
    if (!selectedDate || !selectedTime) return null
    const selectedDateStr = toLocalDateStr(selectedDate)
    const selectedUtc = fromZonedTime(`${selectedDateStr}T${selectedTime}:00`, userTimezone)
    const professionalDate = formatInTimeZone(selectedUtc, professionalTimezone, 'yyyy-MM-dd')
    const professionalTime = formatInTimeZone(selectedUtc, professionalTimezone, 'HH:mm')
    return `${professionalDate} ${professionalTime}`
  }, [professionalTimezone, selectedDate, selectedTime, userTimezone])

  const perMinute = basePriceBrl / Math.max(1, baseDurationMinutes)
  const selectedPriceBrl = Math.ceil(perMinute * selectedDuration)
  const selectedPriceText = formatCurrency(selectedPriceBrl, viewerCurrency)

  const bookHrefWithSelection = useMemo(() => {
    const params = new URLSearchParams()
    if (selectedDate) params.set('data', toLocalDateStr(selectedDate))
    if (selectedTime) params.set('hora', selectedTime)
    params.set('duracao', String(selectedDuration))
    params.set('tipo', bookingType)
    if (bookingType === 'recurring') params.set('sessoes', String(recurringSessionsCount))
    const query = params.toString()
    return query ? `${bookHref}?${query}` : bookHref
  }, [bookHref, bookingType, recurringSessionsCount, selectedDate, selectedDuration, selectedTime])

  const canGoPrev = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
  const canGoNext = currentMonth < maxMonth

  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {topSections}

        {hasServices ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
              <Calendar className="h-5 w-5 text-[#9FE870]" />
              Serviços oferecidos
            </h2>
            <ProfileServicesList
              services={services || []}
              professionalId=""
              viewerCurrency={viewerCurrency}
              bookHrefBase={bookHref.split('?')[0]}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
                <Calendar className="h-5 w-5 text-[#9FE870]" />
                Disponibilidade
              </h2>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDuration}
                  onChange={event => {
                    setSelectedDuration(Number(event.target.value))
                    setSelectedTime(null)
                  }}
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
                    onClick={() => setTimezoneMode('user')}
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
                    onClick={() => setTimezoneMode('professional')}
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
                onClick={() => setBookingType('one_off')}
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
                  setBookingType('recurring')
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
                  onChange={event => setRecurringSessionsCount(Number(event.target.value))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
                  aria-label="Quantidade de sessões recorrentes"
                >
                  {recurringSessionOptions.map(option => (
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

            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => {
                  if (!canGoPrev) return
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
                }}
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
                onClick={() => {
                  if (!canGoNext) return
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
                }}
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
                      setSelectedDate(date)
                      setSelectedTime(null)
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

            {selectedDate ? (
              <div className="mt-5">
                <p className="mb-3 text-sm text-slate-500">
                  {DAY_NAMES_PT_FULL[selectedDate.getDay()]},{' '}
                  {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                </p>
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum horário disponível para esta data.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          'rounded-md border px-3 py-2.5 text-sm font-medium transition-all',
                          selectedTime === time
                            ? 'border-[#9FE870] bg-[#9FE870] text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-[#9FE870]/40 hover:bg-[#9FE870]/8 hover:text-[#3d6b1f]',
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {children}
      </div>

      <div className="min-w-0">
        <div className="rounded-lg border border-slate-200 bg-white p-6 md:sticky md:top-24">
          <div className="mb-4 border-b border-slate-200/80 pb-4 text-center">
            {hasServices ? (
              <>
                <p className="text-3xl font-bold text-slate-900">{priceRangeLabel}</p>
                <p className="mt-1 text-sm text-slate-500">por sessão</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-slate-900">{selectedPriceText}</p>
                <p className="mt-1 text-sm text-slate-500">por sessão de {selectedDuration} min</p>
                {bookingType === 'recurring' ? (
                  <p className="mt-1 text-xs text-slate-500">
                    pacote recorrente de {recurringSessionsCount} sessões
                  </p>
                ) : null}
              </>
            )}
          </div>

          {!hasServices && selectedDate && selectedTime ? (
            <div className="mb-4 rounded-md border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Horário selecionado</p>
              <p className="mt-1">
                {selectedDate.toLocaleDateString('pt-BR')} às {selectedTime} ({timezoneLabel(userTimezone)})
              </p>
              {selectedTimeInProfessionalTimezone ? (
                <p className="mt-1">
                  Fuso profissional: {selectedTimeInProfessionalTimezone} ({timezoneLabel(professionalTimezone)})
                </p>
              ) : null}
            </div>
          ) : null}

          {isOwnProfessional ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-md bg-slate-100 py-3 text-sm font-semibold text-slate-400"
              >
                Agendar sessão
              </button>
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50/70 py-3 text-sm font-semibold text-slate-400"
              >
                Mandar mensagem
              </button>
              <p className="text-center text-xs text-slate-500">
                Não é possível agendar sessão com o próprio perfil.
              </p>
            </div>
          ) : firstBookingBlocked ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-md bg-slate-100 py-3 text-sm font-semibold text-slate-400"
              >
                Agendamento indisponível
              </button>
              <p className="text-center text-xs text-slate-500">
                Este profissional ainda não foi liberado para aceitar o primeiro agendamento.
              </p>
            </div>
          ) : (
            <SearchBookingCtas
              isLoggedIn={isLoggedIn}
              bookHref={hasServices ? bookHref : bookHrefWithSelection}
              messageHref={messageHref}
              bookLabel={hasServices && !hasSingleService ? 'Ver serviços e agendar' : 'Agendar sessão'}
              messageLabel="Mandar mensagem"
            />
          )}

          {errorCode === 'auto-agendamento' ? (
            <div
              className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700"
              role="alert"
            >
              Não é permitido agendar sessão com o próprio perfil profissional.
            </div>
          ) : null}

          {errorCode === 'primeiro-agendamento-bloqueado' ? (
            <div
              className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700"
              role="alert"
            >
              Este profissional ainda não está habilitado para aceitar o primeiro agendamento.
            </div>
          ) : null}

          <div className="mt-4 space-y-2 border-t border-slate-200/80 pt-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Cancelamento gratuito até 24h antes
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Sessão por vídeo (link enviado após confirmação)
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
              Conversão automática de fuso horário
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
