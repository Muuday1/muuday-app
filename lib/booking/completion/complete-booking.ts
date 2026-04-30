import type { SupabaseClient } from '@supabase/supabase-js'
import { assertBookingTransition } from '@/lib/booking/state-machine'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import {
  emitUserSessionCompleted,
  emitProfessionalSessionCompleted,
} from '@/lib/email/resend-events'
import type { ManageBookingResult } from '@/lib/booking/types'

export async function completeBookingService(
  supabase: SupabaseClient,
  _userId: string,
  professionalId: string | null,
  bookingId: string,
): Promise<ManageBookingResult> {
  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, user_id, scheduled_at, duration_minutes')
    .eq('id', bookingId)
    .single()

  if (!booking) return { success: false, error: 'Agendamento não encontrado.' }
  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  const transition = assertBookingTransition(booking.status, 'completed')
  if (!transition.ok) {
    return { success: false, error: 'Apenas agendamentos confirmados podem ser concluídos.' }
  }

  const sessionEnd = new Date(booking.scheduled_at).getTime() + (booking.duration_minutes || 0) * 60 * 1000
  if (Date.now() < sessionEnd) {
    return { success: false, error: 'A sessão só pode ser concluída após o horário previsto de término.' }
  }

  let { data: completedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()

  if (error || !completedBooking) {
    return { success: false, error: 'Erro ao concluir agendamento. Tente novamente.' }
  }

  // Emit Resend automation events (non-blocking)
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', booking.user_id)
    .maybeSingle()
  if (userProfile?.email) {
    emitUserSessionCompleted(userProfile.email, {
      booking_id: bookingId,
      professional_id: booking.professional_id,
    })
  }

  const { data: profProfile } = await supabase
    .from('professionals')
    .select('profiles!professionals_user_id_fkey(email)')
    .eq('id', booking.professional_id)
    .maybeSingle()
  const profEmail = profProfile
    ? (Array.isArray((profProfile as Record<string, unknown>).profiles)
      ? (((profProfile as Record<string, unknown>).profiles as unknown[])[0] as { email?: string })?.email
      : ((profProfile as Record<string, unknown>).profiles as { email?: string })?.email)
    : null
  if (profEmail) {
    emitProfessionalSessionCompleted(profEmail, {
      booking_id: bookingId,
    })
  }

  await enqueueBookingCalendarSync({
    bookingId,
    action: 'upsert_booking',
    source: 'booking.complete',
  })

  return { success: true }
}
