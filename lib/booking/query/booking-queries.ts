import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const bookingIdSchema = z.string().uuid('Identificador de agendamento inválido.')

export async function listBookingsService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  options?: {
    status?: string | string[]
    limit?: number
    offset?: number
  },
): Promise<
  | { success: true; data: { bookings: unknown[]; total: number } }
  | { success: false; error: string }
> {
  const limit = Math.min(100, Math.max(1, options?.limit || 50))
  const offset = Math.max(0, options?.offset || 0)

  let query = supabase
    .from('bookings')
    .select(
      'id, user_id, professional_id, scheduled_at, start_time_utc, end_time_utc, duration_minutes, status, session_link, timezone_user, timezone_professional, booking_type, metadata, cancellation_reason, created_at, updated_at',
      { count: 'exact' }
    )
    .or(`user_id.eq.${userId}${professionalId ? `,professional_id.eq.${professionalId}` : ''}`)
    .order('scheduled_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.status) {
    const statuses = Array.isArray(options.status) ? options.status : [options.status]
    query = query.in('status', statuses)
  }

  const { data, error, count } = await query

  if (error) {
    Sentry.captureException(error, {
      tags: { area: 'booking_list' },
      extra: { userId, professionalId },
    })
    return { success: false, error: 'Erro ao carregar agendamentos.' }
  }

  return { success: true, data: { bookings: data || [], total: count || 0 } }
}

export async function getBookingDetailService(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  bookingId: string,
): Promise<
  | { success: true; data: unknown }
  | { success: false; error: string }
> {
  const parsed = bookingIdSchema.safeParse(bookingId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      'id, user_id, professional_id, scheduled_at, start_time_utc, end_time_utc, duration_minutes, status, session_link, timezone_user, timezone_professional, booking_type, metadata, cancellation_reason, created_at, updated_at'
    )
    .eq('id', parsed.data)
    .maybeSingle()

  if (error) {
    Sentry.captureException(error, {
      tags: { area: 'booking_detail' },
      extra: { userId, professionalId, bookingId },
    })
    return { success: false, error: 'Erro ao carregar agendamento.' }
  }

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  const isClient = (booking as Record<string, unknown>).user_id === userId
  let isProfessional = false
  if (!isClient && professionalId && (booking as Record<string, unknown>).professional_id === professionalId) {
    isProfessional = true
  }

  if (!isClient && !isProfessional) {
    return { success: false, error: 'Você não tem acesso a este agendamento.' }
  }

  return { success: true, data: booking }
}
