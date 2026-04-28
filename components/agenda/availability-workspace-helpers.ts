export const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
] as const

export const TIME_OPTIONS: string[] = []
for (let h = 5; h <= 23; h++) {
  for (const m of [0, 30]) {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    TIME_OPTIONS.push(`${hh}:${mm}`)
  }
}

export type DayAvailability = {
  is_available: boolean
  start_time: string
  end_time: string
}

export type AvailabilityState = Record<number, DayAvailability>

const DEFAULT_DAY: DayAvailability = {
  is_available: false,
  start_time: '09:00',
  end_time: '18:00',
}

export function buildDefaultState(): AvailabilityState {
  const state: AvailabilityState = {}
  for (const day of DAYS_OF_WEEK) {
    state[day.value] = { ...DEFAULT_DAY }
  }
  return state
}

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

export function isValidTimeRange(day: DayAvailability): boolean {
  if (!day.is_available) return true
  return day.start_time < day.end_time
}
