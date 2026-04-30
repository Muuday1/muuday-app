'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import {
  confirmBookingService,
  cancelBookingService,
  cancelBookingWithScopeService,
  rescheduleBookingService,
  addSessionLinkService,
  completeBookingService,
  reportProfessionalNoShowService,
  markUserNoShowService,
} from '@/lib/booking/manage-booking-service'
import type { ManageBookingResult } from '@/lib/booking/types'

export type ActionResult = ManageBookingResult

const RATE_LIMIT_ERROR: ActionResult = {
  success: false,
  error: 'Muitas tentativas. Tente novamente em breve.',
}

async function getAuthenticatedContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')

  return { supabase, user, professionalId: professional?.id ?? null }
}

export async function confirmBooking(bookingId: string): Promise<ActionResult> {
  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const result = await confirmBookingService(supabase, user.id, professionalId, bookingId)
  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }
  return result
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<ActionResult> {
  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const result = await cancelBookingService(supabase, user.id, professionalId, bookingId, reason)
  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }
  return result
}

export async function cancelBookingWithScope(
  bookingId: string,
  scope: 'this' | 'future' | 'series',
  reason?: string,
): Promise<ActionResult> {
  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const result = await cancelBookingWithScopeService(supabase, user.id, professionalId, bookingId, scope, reason)
  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }
  return result
}

export async function rescheduleBooking(
  bookingId: string,
  newScheduledAt: string,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const result = await rescheduleBookingService(supabase, user.id, bookingId, newScheduledAt)
  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }
  return result
}

export async function addSessionLink(bookingId: string, link: string): Promise<ActionResult> {
  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const result = await addSessionLinkService(supabase, user.id, professionalId, bookingId, link)
  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }
  return result
}

export async function completeBooking(bookingId: string): Promise<ActionResult> {
  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const result = await completeBookingService(supabase, user.id, professionalId, bookingId)
  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }
  return result
}

export async function reportProfessionalNoShow(bookingId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const result = await reportProfessionalNoShowService(supabase, user.id, bookingId)
  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }
  return result
}

export async function markUserNoShow(bookingId: string): Promise<ActionResult> {
  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return RATE_LIMIT_ERROR

  const result = await markUserNoShowService(supabase, user.id, professionalId, bookingId)
  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }
  return result
}
