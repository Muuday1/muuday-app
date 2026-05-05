import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { patchBookingMetadata } from '@/lib/booking/metadata'
import { applyPaymentRefund } from '@/lib/booking/cancellation/apply-refund'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import type { ManageBookingResult } from '@/lib/booking/types'

export async function reportProfessionalNoShowService(
  supabase: SupabaseClient,
  userId: string,
  bookingId: string,
): Promise<ManageBookingResult> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, user_id, professional_id, scheduled_at, metadata')
    .eq('id', bookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.user_id !== userId) {
    return { success: false, error: 'Apenas o cliente pode reportar no-show do profissional.' }
  }
  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Somente sessões confirmadas podem ser marcadas como no-show.' }
  }
  if (Date.now() < new Date(booking.scheduled_at).getTime()) {
    return { success: false, error: 'A sessão ainda não iniciou.' }
  }

  const patch = {
    status: 'no_show',
    metadata: patchBookingMetadata(booking.metadata, {
      no_show_actor: 'professional',
      flagged_for_support: true,
      no_show_reported_at: new Date().toISOString(),
    }),
  }

  let { data: updated, error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', bookingId)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    return { success: false, error: 'Não foi possível registrar no-show. Tente novamente.' }
  }

  await applyPaymentRefund(supabase, bookingId, 100)

  const { error: notifyError } = await supabase.from('notifications').insert({
    user_id: null,
    booking_id: bookingId,
    type: 'ops.professional_no_show',
    title: 'No-show reportado para profissional',
    body: 'Um cliente reportou ausência do profissional. Revisão manual recomendada.',
    payload: {
      booking_id: bookingId,
      professional_id: booking.professional_id,
    },
  })
  if (notifyError) {
    Sentry.captureException(notifyError, {
      tags: { area: 'booking_no_show', flow: 'admin_notification' },
      extra: { bookingId },
    })
  }

  await enqueueBookingCalendarSync({
    bookingId,
    action: 'cancel_booking',
    source: 'booking.no_show_professional',
  })

  return { success: true }
}

export async function markUserNoShowService(
  supabase: SupabaseClient,
  _userId: string,
  professionalId: string | null,
  bookingId: string,
): Promise<ManageBookingResult> {
  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode marcar no-show do cliente.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, scheduled_at, metadata')
    .eq('id', bookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode marcar no-show do cliente.' }
  }
  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Somente sessões confirmadas podem ser marcadas como no-show.' }
  }
  if (Date.now() < new Date(booking.scheduled_at).getTime()) {
    return { success: false, error: 'A sessão ainda não iniciou.' }
  }

  const patch = {
    status: 'no_show',
    metadata: patchBookingMetadata(booking.metadata, {
      no_show_actor: 'user',
      no_show_reported_at: new Date().toISOString(),
    }),
  }

  let { data: updated, error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', bookingId)
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()

  if (error || !updated) {
    return { success: false, error: 'Não foi possível registrar no-show. Tente novamente.' }
  }

  // Apply refund policy: client no-show with >24h notice = 50% refund, else 0%
  const hoursUntilStart = Math.round(
    (new Date(booking.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60),
  )
  const refundPercent = hoursUntilStart >= 24 ? 50 : 0
  if (refundPercent > 0) {
    try {
      await applyPaymentRefund(supabase, bookingId, refundPercent)
    } catch (refundError) {
      Sentry.captureException(refundError instanceof Error ? refundError : new Error(String(refundError)), {
        tags: { area: 'booking_no_show', flow: 'user_no_show_refund' },
        extra: { bookingId, refundPercent, hoursUntilStart },
      })
    }
  }

  await enqueueBookingCalendarSync({
    bookingId,
    action: 'cancel_booking',
    source: 'booking.no_show_user',
  })

  return { success: true }
}
