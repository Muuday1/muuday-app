'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import {
  createRequestBookingService,
  offerRequestBookingService,
  declineRequestBookingByProfessionalService,
  cancelRequestBookingByUserService,
  declineRequestBookingByUserService,
  acceptRequestBookingService,
} from '@/lib/booking/request-booking-service'

type RequestBookingResult =
  | { success: true; requestId: string }
  | { success: false; error: string; reasonCode?: string }

type RequestBookingActionResult =
  | { success: true }
  | { success: false; error: string; reasonCode?: string }

async function getAuthenticatedContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')

  return {
    supabase,
    user,
    professionalId: professional?.id ?? null,
  }
}

export async function createRequestBooking(input: {
  professionalId: string
  preferredStartLocal: string
  durationMinutes?: number
  userMessage?: string
}): Promise<RequestBookingResult> {
  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingCreate', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const result = await createRequestBookingService(supabase, user.id, input)

  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
    revalidatePath(`/profissional/${input.professionalId}`)
  }

  return result
}

export async function offerRequestBooking(input: {
  requestId: string
  proposalStartLocal: string
  proposalDurationMinutes?: number
  proposalMessage?: string
}): Promise<RequestBookingActionResult> {
  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const result = await offerRequestBookingService(
    supabase,
    user.id,
    professionalId,
    input.requestId,
    {
      proposalStartLocal: input.proposalStartLocal,
      proposalDurationMinutes: input.proposalDurationMinutes,
      proposalMessage: input.proposalMessage,
    },
  )

  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }

  return result
}

export async function declineRequestBookingByProfessional(
  requestId: string,
  reason?: string,
): Promise<RequestBookingActionResult> {
  const { supabase, user, professionalId } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const result = await declineRequestBookingByProfessionalService(
    supabase,
    user.id,
    professionalId,
    requestId,
    reason,
  )

  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
  }

  return result
}

export async function cancelRequestBookingByUser(
  requestId: string,
): Promise<RequestBookingActionResult> {
  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const result = await cancelRequestBookingByUserService(supabase, user.id, requestId)

  if (result.success) {
    revalidatePath('/agenda')
  }

  return result
}

export async function declineRequestBookingByUser(
  requestId: string,
): Promise<RequestBookingActionResult> {
  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingManage', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const result = await declineRequestBookingByUserService(supabase, user.id, requestId)

  if (result.success) {
    revalidatePath('/agenda')
  }

  return result
}

export async function acceptRequestBooking(
  requestId: string,
): Promise<
  { success: true; bookingId: string } | { success: false; error: string; reasonCode?: string }
> {
  const { supabase, user } = await getAuthenticatedContext()
  const rl = await rateLimit('bookingCreate', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const result = await acceptRequestBookingService(supabase, user.id, requestId)

  if (result.success) {
    revalidatePath('/agenda')
    revalidatePath('/dashboard')
    revalidatePath(`/profissional/${result.professionalId}`)
  }

  return result
}
