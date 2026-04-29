import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/push/sender'
import { autoCreateCase } from '@/lib/disputes/dispute-service'
import { patchBookingMetadata } from '@/lib/booking/metadata'

/**
 * Auto-detect no-show bookings that passed their scheduled end time
 * without being marked as completed.
 *
 * Policy (as defined by product):
 * - Client no-show (<24h notice): 0% refund
 * - Client no-show (>24h notice): 50% refund
 * - Professional no-show: 100% refund + strike
 */
export async function runNoShowDetection(
  admin: SupabaseClient,
  nowInput: Date = new Date(),
): Promise<{
  checked: number
  detected: number
  refunded: number
  at: string
}> {
  const now = new Date(nowInput)
  const nowIso = now.toISOString()
  const graceMinutes = 15
  const cutoff = new Date(now.getTime() - graceMinutes * 60 * 1000).toISOString()

  // Load confirmed bookings that ended before cutoff and are not yet resolved
  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, user_id, professional_id, scheduled_at, start_time_utc, end_time_utc, status, metadata, updated_at')
    .eq('status', 'confirmed')
    .lte('end_time_utc', cutoff)
    .order('end_time_utc', { ascending: true })
    .limit(200)

  if (error) {
    throw new Error(`Failed to load bookings for no-show detection: ${error.message}`)
  }

  const candidates = bookings || []
  if (candidates.length === 0) {
    return { checked: 0, detected: 0, refunded: 0, at: nowIso }
  }

  let detected = 0
  let refunded = 0

  for (const booking of candidates) {
    const metadata = (booking.metadata as Record<string, unknown> | null) || {}
    const noShowActor = metadata?.no_show_actor as string | undefined
    const alreadyHandled = booking.status === 'no_show' || booking.status === 'completed'
    if (alreadyHandled) continue

    const hoursUntilStart = Math.round(
      (new Date(booking.start_time_utc).getTime() - now.getTime()) / (1000 * 60 * 60),
    )

    // If a participant already reported no-show, apply policy and finalize
    if (noShowActor === 'user') {
      // Client reported professional no-show -> 100% refund
      const resolved = await applyNoShowResolution(admin, booking.id, 'professional', 100, nowIso)
      if (resolved) {
        refunded++
        detected++
      }
      // Ensure case exists for operator review
      const caseResult = await autoCreateCase(
        admin,
        booking.id,
        'no_show_claim',
        `Usuário reportou no-show do profissional para sessão em ${new Date(booking.scheduled_at).toLocaleDateString('pt-BR')}.`,
        booking.user_id,
      )
      if (!caseResult.success) {
        console.error(`[no-show-detection] failed to auto-create case for booking ${booking.id}:`, caseResult.error)
      }
      continue
    }

    if (noShowActor === 'professional') {
      // Professional reported client no-show -> apply tiered refund
      // If booking was >24h away when marked: 50%, else 0%
      const refundPercent = hoursUntilStart >= 24 ? 50 : 0
      const resolved = await applyNoShowResolution(admin, booking.id, 'user', refundPercent, nowIso)
      if (resolved) {
        refunded++
        detected++
      }
      continue
    }

    // Nobody reported yet -> system detects and flags both parties
    const { error: updateError } = await admin
      .from('bookings')
      .update({
        status: 'no_show',
        metadata: {
          ...metadata,
          no_show_actor: 'system',
          no_show_detected_at: nowIso,
          no_show_detected_reason: 'Session ended without completion or manual report',
        },
        updated_at: nowIso,
      })
      .eq('id', booking.id)
      .eq('status', 'confirmed')

    if (updateError) {
      console.error(`[no-show-detection] failed to update booking ${booking.id}:`, updateError.message)
      continue
    }

    // Notify both parties only after successful status update
    await insertNoShowNotification(admin, booking.user_id, booking.id, 'client', nowIso)
    const professionalUserId = await resolveProfessionalUserId(admin, booking.professional_id)
    if (professionalUserId) {
      await insertNoShowNotification(admin, professionalUserId, booking.id, 'professional', nowIso)
    }

    // Auto-create case for operator review
    const caseResult = await autoCreateCase(
      admin,
      booking.id,
      'no_show_claim',
      `No-show detectado automaticamente: sessão agendada para ${new Date(booking.scheduled_at).toLocaleDateString('pt-BR')} não teve participação confirmada.`,
      booking.user_id,
    )
    if (!caseResult.success) {
      console.error(`[no-show-detection] failed to auto-create case for booking ${booking.id}:`, caseResult.error)
    }

    detected++
  }

  return { checked: candidates.length, detected, refunded, at: nowIso }
}

async function applyNoShowResolution(
  admin: SupabaseClient,
  bookingId: string,
  responsibleParty: 'professional' | 'user',
  refundPercent: number,
  nowIso: string,
): Promise<boolean> {
  const { data: booking, error: fetchError } = await admin
    .from('bookings')
    .select('metadata')
    .eq('id', bookingId)
    .maybeSingle()

  if (fetchError) {
    console.error(`[no-show-detection] failed to fetch booking ${bookingId}:`, fetchError.message)
    return false
  }

  const { error: updateError } = await admin
    .from('bookings')
    .update({
      status: 'no_show',
      metadata: patchBookingMetadata(booking?.metadata, {
        no_show_resolved_at: nowIso,
        no_show_responsible_party: responsibleParty,
        no_show_refund_percent: refundPercent,
        no_show_refund_status: refundPercent > 0 ? 'pending' : 'none',
      }),
      updated_at: nowIso,
    })
    .eq('id', bookingId)

  if (updateError) {
    console.error(`[no-show-detection] failed to resolve booking ${bookingId}:`, updateError.message)
    return false
  }

  // TODO: Fase 6 — invoke refund engine when payment stack is ready
  // For now, we store the policy in metadata so the future refund engine can process it
  return true
}

async function insertNoShowNotification(
  admin: SupabaseClient,
  userId: string,
  bookingId: string,
  role: 'client' | 'professional',
  nowIso: string,
) {
  const title = 'Sessão marcada como ausente (no-show)'
  const body =
    role === 'client'
      ? 'Sua sessão foi marcada como no-show porque não houve confirmação de participação. Se houve um erro, por favor entre em contato com o suporte.'
      : 'Uma sessão foi marcada como no-show. Se o cliente não compareceu, confirme no sistema para aplicar a política de cancelamento.'

  await admin.from('notifications').insert({
    user_id: userId,
    booking_id: bookingId,
    type: 'booking_no_show_detected',
    title,
    body,
    payload: { role, detected_at: nowIso },
  })

  const url = role === 'client' ? '/agenda' : '/dashboard'
  void sendPushToUser(
    userId,
    {
      title,
      body,
      url,
      tag: 'booking_no_show_detected',
    },
    { notifType: 'booking_no_show_detected', admin },
  ).catch(err => {
    console.warn('[no-show-detection] push failed:', err)
  })
}

async function resolveProfessionalUserId(
  admin: SupabaseClient,
  professionalId: string | null,
): Promise<string | null> {
  if (!professionalId) return null
  const { data } = await admin
    .from('professionals')
    .select('user_id')
    .eq('id', professionalId)
    .maybeSingle()
  return data?.user_id ?? null
}
