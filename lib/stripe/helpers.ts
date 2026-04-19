export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

export function asIdFromStringOrObject(value: unknown): string | null {
  const direct = asString(value)
  if (direct) return direct
  const record = asRecord(value)
  return asString(record.id)
}

export function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export function truncateErrorMessage(message: string, max = 500) {
  if (message.length <= max) return message
  return `${message.slice(0, max - 3)}...`
}

export function buildNextRetryDate(attempt: number, now: Date) {
  // Progressive backoff without creating very long dead-time.
  const minutes = Math.min(60, Math.max(1, Math.pow(2, Math.min(attempt, 6))))
  return new Date(now.getTime() + minutes * 60 * 1000)
}

export function toIsoWeekKey(date: Date) {
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = normalized.getUTCDay() || 7
  normalized.setUTCDate(normalized.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((normalized.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const year = normalized.getUTCFullYear()
  return `${year}-W${String(weekNo).padStart(2, '0')}`
}
