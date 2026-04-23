/**
 * Resend Inactivity Events — scan for inactive users/professionals and emit
 * Resend automation events to trigger re-engagement email sequences.
 *
 * All functions are idempotent-safe: Resend automations only run once per
 * contact for each event type, so duplicate emits are harmless.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  emitUserInactive,
  emitProfessionalInactive,
} from '@/lib/email/resend-events'

export type InactivityScanResult = {
  checked: number
  emitted: number
  at: string
}

async function scanInactiveUsers(
  admin: SupabaseClient,
  days: 30 | 60 | 90,
): Promise<InactivityScanResult> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: users, error } = await admin
    .from('profiles')
    .select('id, email, updated_at')
    .eq('role', 'usuario')
    .lte('updated_at', cutoff)
    .not('email', 'is', null)
    .limit(500)

  if (error) {
    throw new Error(`Failed to scan inactive users (${days}d): ${error.message}`)
  }

  let emitted = 0
  for (const user of users || []) {
    if (!user.email) continue

    // Check if user has any recent booking activity
    const { data: recentBooking } = await admin
      .from('bookings')
      .select('id, scheduled_at')
      .eq('user_id', user.id)
      .gte('scheduled_at', cutoff)
      .limit(1)
      .maybeSingle()

    if (recentBooking) continue // User had recent activity, skip

    emitUserInactive(user.email, days)
    emitted++
  }

  return {
    checked: users?.length || 0,
    emitted,
    at: new Date().toISOString(),
  }
}

async function scanInactiveProfessionals(
  admin: SupabaseClient,
): Promise<InactivityScanResult> {
  const days = 30
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: professionals, error } = await admin
    .from('professionals')
    .select('id, user_id, profiles!professionals_user_id_fkey(email)')
    .eq('status', 'approved')
    .limit(500)

  if (error) {
    throw new Error(`Failed to scan inactive professionals: ${error.message}`)
  }

  let emitted = 0
  for (const prof of professionals || []) {
    const profRecord = prof as Record<string, unknown>
    const profiles = profRecord.profiles
    const email = Array.isArray(profiles)
      ? (profiles[0] as { email?: string } | null)?.email
      : (profiles as { email?: string } | null)?.email

    if (!email) continue

    // Check if professional has any recent booking activity
    const { data: recentBooking } = await admin
      .from('bookings')
      .select('id')
      .eq('professional_id', prof.id)
      .gte('created_at', cutoff)
      .limit(1)
      .maybeSingle()

    if (recentBooking) continue // Professional had recent activity, skip

    emitProfessionalInactive(email, { email })
    emitted++
  }

  return {
    checked: professionals?.length || 0,
    emitted,
    at: new Date().toISOString(),
  }
}

export async function runUserInactivityScan(
  admin: SupabaseClient,
  days: 30 | 60 | 90,
): Promise<InactivityScanResult> {
  return scanInactiveUsers(admin, days)
}

export async function runProfessionalInactivityScan(
  admin: SupabaseClient,
): Promise<InactivityScanResult> {
  return scanInactiveProfessionals(admin)
}
