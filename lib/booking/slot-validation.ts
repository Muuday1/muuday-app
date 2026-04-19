import { createClient } from '@/lib/supabase/server'
import {
  loadAvailabilityRules,
  isSlotWithinRules,
  isSlotAllowedByExceptions,
  hasInternalConflict,
} from './availability-checks'
import { hasExternalBusyConflict } from './external-calendar-conflicts'

export interface SlotValidationOptions {
  supabase: Awaited<ReturnType<typeof createClient>>
  professionalId: string
  startUtc: Date
  endUtc: Date
  timezone: string
  bufferMinutes: number
  /** If provided, checks minimum notice hours */
  minimumNoticeHours?: number
  /** If provided, checks max booking window in days */
  maxBookingWindowDays?: number
  /** If provided, excludes this booking ID from internal conflict check */
  ignoreBookingId?: string
  /** Custom error messages */
  errorMessages?: {
    minimumNotice?: string
    maxWindow?: string
    workingHours?: string
    exception?: string
    internalConflict?: string
    externalConflict?: string
  }
}

export interface SlotValidationResult {
  valid: boolean
  error?: string
}

export async function validateSlotAvailability(
  options: SlotValidationOptions,
): Promise<SlotValidationResult> {
  const {
    supabase,
    professionalId,
    startUtc,
    endUtc,
    timezone,
    bufferMinutes,
    minimumNoticeHours,
    maxBookingWindowDays,
    ignoreBookingId,
    errorMessages = {},
  } = options

  // Minimum notice check
  if (minimumNoticeHours !== undefined) {
    const minimumStartTime = Date.now() + minimumNoticeHours * 60 * 60 * 1000
    if (startUtc.getTime() < minimumStartTime) {
      return {
        valid: false,
        error:
          errorMessages.minimumNotice ||
          `Selecione um horário com pelo menos ${minimumNoticeHours} horas de antecedência.`,
      }
    }
  }

  // Max booking window check
  if (maxBookingWindowDays !== undefined) {
    const maximumDate = new Date()
    maximumDate.setDate(maximumDate.getDate() + maxBookingWindowDays)
    if (startUtc.getTime() > maximumDate.getTime()) {
      return {
        valid: false,
        error:
          errorMessages.maxWindow ||
          `Agendamentos devem estar dentro de ${maxBookingWindowDays} dias.`,
      }
    }
  }

  // Working hours check
  const rules = await loadAvailabilityRules(supabase, professionalId, timezone)

  const fitsAvailability = isSlotWithinRules(startUtc, endUtc, timezone, rules)

  if (!fitsAvailability) {
    return {
      valid: false,
      error: errorMessages.workingHours || 'Horário não está disponível para este profissional.',
    }
  }

  // Exception check
  const allowedByException = await isSlotAllowedByExceptions(
    supabase,
    professionalId,
    timezone,
    startUtc,
    endUtc,
  )
  if (!allowedByException) {
    return {
      valid: false,
      error: errorMessages.exception || 'Horário bloqueado por indisponibilidade.',
    }
  }

  // Internal conflict check
  const conflict = await hasInternalConflict(
    supabase,
    professionalId,
    startUtc,
    endUtc,
    bufferMinutes,
    ignoreBookingId,
  )
  if (conflict) {
    return {
      valid: false,
      error: errorMessages.internalConflict || 'Horário já está reservado. Escolha outro horário.',
    }
  }

  // External calendar conflict check
  const externalConflict = await hasExternalBusyConflict(
    supabase,
    professionalId,
    startUtc.toISOString(),
    endUtc.toISOString(),
  )
  if (externalConflict) {
    return {
      valid: false,
      error:
        errorMessages.externalConflict ||
        'Horário conflita com agenda externa conectada do profissional.',
    }
  }

  return { valid: true }
}
