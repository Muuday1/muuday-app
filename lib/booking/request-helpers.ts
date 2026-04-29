import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  REQUEST_BOOKING_STATUSES,
  assertRequestBookingTransition,
  type RequestBookingStatus,
} from '@/lib/booking/request-booking-state-machine'

export const REQUEST_BOOKING_STATUS_SET = new Set<string>(REQUEST_BOOKING_STATUSES)

export const REQUEST_BOOKING_FIELDS =
  'id,user_id,professional_id,status,preferred_start_utc,preferred_end_utc,user_timezone,user_message,proposal_start_utc,proposal_end_utc,proposal_timezone,proposal_message,proposal_expires_at,declined_at,cancelled_at,expired_at,created_at,updated_at'

export function toRequestBookingStatus(value: unknown): RequestBookingStatus | null {
  if (typeof value !== 'string') return null
  if (!REQUEST_BOOKING_STATUS_SET.has(value)) return null
  return value as RequestBookingStatus
}

export async function expireRequestIfNeeded(
  supabase: SupabaseClient,
  request: Record<string, unknown>,
) {
  if (request.status !== 'offered') return request
  if (!request.proposal_expires_at || typeof request.proposal_expires_at !== 'string') return request

  const expiresAt = new Date(request.proposal_expires_at)
  if (Number.isNaN(expiresAt.getTime())) return request
  if (expiresAt.getTime() > Date.now()) return request

  const status = toRequestBookingStatus(request.status)
  if (!status) return request
  const transition = assertRequestBookingTransition(status, 'expired')
  if (!transition.ok) return request

  const { data: expiredRequest, error: expireError } = await supabase
    .from('request_bookings')
    .update({
      status: 'expired',
      expired_at: new Date().toISOString(),
    })
    .eq('id', String(request.id))
    .eq('status', status)
    .select(REQUEST_BOOKING_FIELDS)
    .maybeSingle()

  if (expireError) {
    Sentry.captureException(expireError, { tags: { area: 'request_helpers' } })
  }

  return expiredRequest || { ...request, status: 'expired' }
}
