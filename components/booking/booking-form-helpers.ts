export const MONTH_NAMES_PT = [
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

export const DAY_NAMES_PT_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DAY_NAMES_PT_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const RECURRING_SESSION_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export const PLATFORM_CANCELLATION_POLICY = [
  'Cancelamento com 48h ou mais: reembolso de 100%',
  'Cancelamento entre 24h e 48h: reembolso de 50%',
  'Cancelamento com menos de 24h: sem reembolso',
]

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function toLocalDateStr(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromIsoDateToLocalDate(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDaysToIsoDate(isoDate: string, daysToAdd: number) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + daysToAdd)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
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

export function buildScheduledAt(dateStr: string, timeStr: string) {
  return `${dateStr}T${timeStr}:00`
}

export function timezoneLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export function deriveRecurringOccurrencesFromEndDate(params: {
  startDate: Date
  endDate: string
  periodicity: 'weekly' | 'biweekly' | 'monthly' | 'custom_days'
  intervalDays: number
  maxBookingWindowDays: number
}) {
  if (!params.endDate) return 0
  const [year, month, day] = params.endDate.split('-').map(Number)
  const endDate = new Date(year, (month || 1) - 1, day || 1, 23, 59, 59, 999)
  if (Number.isNaN(endDate.getTime())) return 0

  const hardMaxDate = new Date(params.startDate.getTime())
  hardMaxDate.setDate(hardMaxDate.getDate() + params.maxBookingWindowDays)

  let count = 0
  let cursor = new Date(params.startDate.getTime())
  while (cursor <= endDate && cursor <= hardMaxDate && count < 52) {
    count += 1
    if (params.periodicity === 'monthly') {
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate(), cursor.getHours(), cursor.getMinutes(), cursor.getSeconds())
      continue
    }
    const jumpDays =
      params.periodicity === 'weekly'
        ? 7
        : params.periodicity === 'biweekly'
          ? 14
          : Math.max(1, params.intervalDays)
    cursor = new Date(cursor.getTime())
    cursor.setDate(cursor.getDate() + jumpDays)
  }
  return count
}
