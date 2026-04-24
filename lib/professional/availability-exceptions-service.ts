import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const exceptionIdSchema = z.string().uuid('Identificador inválido.')
const reasonSchema = z.string().trim().max(200, 'Motivo muito longo.').optional()

export type ExceptionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function addAvailabilityException(
  supabase: SupabaseClient,
  professionalId: string,
  dateLocal: string,
  options: {
    isAvailable?: boolean
    startTimeLocal?: string
    endTimeLocal?: string
    timezone?: string
    reason?: string
  } = {},
): Promise<ExceptionResult<{ exceptionId: string }>> {
  const dateParsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use YYYY-MM-DD.').safeParse(dateLocal)
  if (!dateParsed.success) {
    return { success: false, error: dateParsed.error.issues[0]?.message || 'Data inválida.' }
  }

  const timezone = options.timezone || 'America/Sao_Paulo'
  const isAvailable = options.isAvailable ?? false

  let startTimeLocal: string | null = null
  let endTimeLocal: string | null = null

  const hasTimeRange = Boolean(options.startTimeLocal && options.endTimeLocal)

  if (isAvailable || hasTimeRange) {
    const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido. Use HH:MM.')
    const startParsed = timeSchema.safeParse(options.startTimeLocal)
    const endParsed = timeSchema.safeParse(options.endTimeLocal)

    if (!startParsed.success || !endParsed.success) {
      return { success: false, error: 'Horários de início e fim são obrigatórios para blocos de horário ou slots disponíveis.' }
    }
    startTimeLocal = startParsed.data
    endTimeLocal = endParsed.data
  }

  const { data, error } = await supabase
    .from('availability_exceptions')
    .insert({
      professional_id: professionalId,
      date_local: dateParsed.data,
      is_available: isAvailable,
      start_time_local: startTimeLocal,
      end_time_local: endTimeLocal,
      timezone,
      reason: options.reason || null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: 'Erro ao criar exceção de disponibilidade.' }
  }

  return { success: true, data: { exceptionId: data.id } }
}

export async function removeAvailabilityException(
  supabase: SupabaseClient,
  professionalId: string,
  exceptionId: string,
): Promise<ExceptionResult<{ removed: boolean }>> {
  const parsed = exceptionIdSchema.safeParse(exceptionId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { error } = await supabase
    .from('availability_exceptions')
    .delete()
    .eq('id', parsed.data)
    .eq('professional_id', professionalId)

  if (error) {
    return { success: false, error: 'Erro ao remover exceção de disponibilidade.' }
  }

  return { success: true, data: { removed: true } }
}

export async function getAvailabilityExceptions(
  supabase: SupabaseClient,
  professionalId: string,
  from: string,
  to: string,
): Promise<ExceptionResult<{ exceptions: unknown[] }>> {
  const fromParsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(from)
  const toParsed = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(to)
  if (!fromParsed.success || !toParsed.success) {
    return { success: false, error: 'Datas inválidas. Use YYYY-MM-DD.' }
  }

  const { data, error } = await supabase
    .from('availability_exceptions')
    .select('id, date_local, is_available, start_time_local, end_time_local, timezone, reason, created_at')
    .eq('professional_id', professionalId)
    .gte('date_local', fromParsed.data)
    .lte('date_local', toParsed.data)
    .order('date_local', { ascending: true })

  if (error) {
    return { success: false, error: 'Erro ao carregar exceções de disponibilidade.' }
  }

  return { success: true, data: { exceptions: data || [] } }
}
