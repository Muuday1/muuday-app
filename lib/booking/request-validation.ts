import { z } from 'zod'
import { formatInTimeZone } from 'date-fns-tz'

export function isValidIsoLocalDateTime(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  )
  if (!match) return false

  const [, yearRaw, monthRaw, dayRaw, hourRaw, minuteRaw, secondRaw] = match
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  const second = Number(secondRaw || '0')

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  )
}

export const localDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/, 'Horário inválido.')
  .refine(isValidIsoLocalDateTime, 'Horário inválido.')

export const createRequestSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional invalido.'),
  preferredStartLocal: localDateTimeSchema,
  durationMinutes: z.number().int().min(15).max(240).optional(),
  userMessage: z.string().trim().max(1200, 'Mensagem muito longa.').optional(),
})

export const offerRequestSchema = z.object({
  requestId: z.string().uuid('Solicitacao invalida.'),
  proposalStartLocal: localDateTimeSchema,
  proposalDurationMinutes: z.number().int().min(15).max(240).optional(),
  proposalMessage: z.string().trim().max(1200, 'Mensagem da proposta muito longa.').optional(),
})

export const requestIdSchema = z.string().uuid('Solicitacao invalida.')

export function hhmmToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

export function getMinutesInTimezone(date: Date, timezone: string) {
  return hhmmToMinutes(formatInTimeZone(date, timezone, 'HH:mm'))
}

type PostgrestLikeError = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

export function isUniqueConstraintError(error: unknown, constraintName: string) {
  const pgError = error as PostgrestLikeError | null
  if (!pgError || pgError.code !== '23505') return false
  const details = `${pgError.message || ''} ${pgError.details || ''} ${pgError.hint || ''}`
  return details.includes(constraintName)
}

export function isActiveSlotCollision(error: unknown, activeBookingSlotUniqueIndex: string) {
  if (isUniqueConstraintError(error, activeBookingSlotUniqueIndex)) return true
  const pgError = error as PostgrestLikeError | null
  if (!pgError || pgError.code !== '23505') return false
  const details = `${pgError.message || ''} ${pgError.details || ''} ${pgError.hint || ''}`
  return details.includes('(professional_id, start_time_utc)')
}
