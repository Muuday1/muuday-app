import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assertBookingTransition } from '@/lib/booking/state-machine'
import { patchBookingMetadata } from '@/lib/booking/metadata'
import {
  getHoursUntilSession,
  getProfessionalCancellationRefundDecision,
  getUserCancellationRefundDecision,
} from '@/lib/booking/cancellation-policy'
import { evaluateRecurringPauseDeadline } from '@/lib/booking/recurring-deadlines'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import { emitUserCancelledBooking } from '@/lib/email/resend-events'
import { applyPaymentRefund } from './apply-refund'
import type { ManageBookingResult } from '@/lib/booking/types'

export async function executeCancelSingleBooking(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string | null,
  booking: {
    id: string
    status: string
    professional_id: string
    user_id: string
    scheduled_at: string
    booking_type: string | null
    metadata: Record<string, unknown> | null
  },
  normalizedReason?: string,
): Promise<ManageBookingResult> {
  const isBookingUser = booking.user_id === userId
  const isBookingProfessional = professionalId ? booking.professional_id === professionalId : false
  if (!isBookingUser && !isBookingProfessional) {
    return { success: false, error: 'Você não tem permissão para cancelar este agendamento.' }
  }

  const transition = assertBookingTransition(booking.status as Parameters<typeof assertBookingTransition>[0], 'cancelled')
  if (!transition.ok) return { success: false, error: 'Este agendamento não pode ser cancelado.' }

  if (booking.booking_type === 'recurring_parent' || booking.booking_type === 'recurring_child') {
    const deadlineDecision = evaluateRecurringPauseDeadline(booking.scheduled_at)
    if (!deadlineDecision.allowed) {
      const message =
        booking.booking_type === 'recurring_parent'
          ? 'Pausa de pacote recorrente fora do prazo de 7 dias.'
          : 'Pausa de sessão recorrente fora do prazo de 7 dias.'
      return {
        success: false,
        error: message,
        reasonCode: deadlineDecision.reason_code,
        deadlineAtUtc: deadlineDecision.deadline_at_utc,
      }
    }
  }

  const hoursUntilSession = getHoursUntilSession(booking.scheduled_at)
  const refundDecision = isBookingUser
    ? getUserCancellationRefundDecision(hoursUntilSession)
    : getProfessionalCancellationRefundDecision()

  const updateData: Record<string, unknown> = {
    status: 'cancelled',
    metadata: patchBookingMetadata(booking.metadata, {
      cancelled_by: isBookingUser ? 'user' : 'professional',
      cancelled_at: new Date().toISOString(),
      refund_percentage: refundDecision.refundPercentage,
      refund_rule: refundDecision.rule,
    }),
  }

  if (normalizedReason) {
    updateData.cancellation_reason = normalizedReason
  }

  let cancelQuery = supabase
    .from('bookings')
    .update(updateData)
    .eq('id', booking.id)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])

  if (isBookingUser) {
    cancelQuery = cancelQuery.eq('user_id', userId)
  } else if (professionalId) {
    cancelQuery = cancelQuery.eq('professional_id', professionalId)
  }

  const { data: cancelledBooking, error } = await cancelQuery.select('id').maybeSingle()

  if (error || !cancelledBooking) {
    return { success: false, error: 'Erro ao cancelar agendamento. Tente novamente.' }
  }

  await applyPaymentRefund(supabase, booking.id, refundDecision.refundPercentage)
  await enqueueBookingCalendarSync({
    bookingId: booking.id,
    action: 'cancel_booking',
    source: 'booking.cancel',
  })

  const cancelledBy = isBookingUser ? 'user' : 'professional'
  const { data: cancelledUserProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', isBookingUser ? userId : booking.user_id)
    .maybeSingle()
  if (cancelledUserProfile?.email) {
    emitUserCancelledBooking(cancelledUserProfile.email, {
      booking_id: booking.id,
      cancelled_by: cancelledBy,
    })
  }

  return { success: true }
}
