/**
 * POST /api/sessao/event
 *
 * Receives session lifecycle telemetry from the client.
 * Used for:
 *   - no-show evidence collection
 *   - actual start/end timestamps
 *   - failure auditing
 *
 * Events are idempotent (e.g. multiple "session_started" calls for the
 * same booking are safe because DB columns only write once).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import {
  recordParticipantJoined,
  recordActualStartIfBothJoined,
  recordSessionEnded,
  setSessionStatus,
} from '@/lib/session/tracker'
import type { SessionFailureReason } from '@/lib/session/types'
import { withApiHandler } from '@/lib/api/with-api-handler'

const payloadSchema = z.object({
  bookingId: z.string().uuid(),
  eventType: z.enum([
    'session_join_attempted',
    'session_joined',
    'session_left',
    'session_started',
    'session_ended',
    'session_failed',
    'media_published',
    'media_subscribed',
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const POST = withApiHandler(async (request: NextRequest) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados invalidos.' }, { status: 400 })
  }

  const rl = await rateLimit('bookingManage', `sessao-event:${user.id}:${getClientIp(request)}`)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.max(1, rl.retryAfterSeconds)) },
      },
    )
  }

  const { bookingId, eventType, metadata } = parsed.data

  // Verify participant
  const { data: booking } = await supabase
    .from('bookings')
    .select('id,user_id,professional_id,professionals!bookings_professional_id_fkey(user_id)')
    .eq('id', bookingId)
    .maybeSingle()

  if (!booking) {
    return NextResponse.json({ error: 'Sessao nao encontrada.' }, { status: 404 })
  }

  const professionalOwnerId = Array.isArray(booking.professionals)
    ? booking.professionals[0]?.user_id
    : (booking.professionals as { user_id?: string } | null)?.user_id

  const isParticipant = booking.user_id === user.id || professionalOwnerId === user.id
  if (!isParticipant) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const role: 'client' | 'professional' =
    professionalOwnerId === user.id ? 'professional' : 'client'

  switch (eventType) {
    case 'session_join_attempted':
      // Log only; DB write happens on /api/agora/token (the server-side gate)
      break

    case 'session_joined':
      await recordParticipantJoined(bookingId, role)
      await recordActualStartIfBothJoined(bookingId)
      break

    case 'session_started':
      await setSessionStatus(bookingId, 'in_progress')
      break

    case 'session_ended':
      await recordSessionEnded(bookingId, 'ended')
      break

    case 'session_failed': {
      const reason = (metadata?.reason as SessionFailureReason) || 'provider_sdk_error'
      await recordSessionEnded(bookingId, 'failed', reason)
      break
    }

    case 'session_left':
      // Don't mark as ended immediately — the other party may still be there.
      // actual_ended_at is only written when session_ended is explicitly sent
      // or when the join window closes (background job).
      break

    case 'media_published':
    case 'media_subscribed':
      // No-op for now; reserved for future analytics
      break
  }

  return NextResponse.json({ success: true, eventType })
})