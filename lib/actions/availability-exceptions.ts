'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import {
  addAvailabilityException as addAvailabilityExceptionService,
  removeAvailabilityException as removeAvailabilityExceptionService,
  getAvailabilityExceptions as getAvailabilityExceptionsService,
} from '@/lib/professional/availability-exceptions-service'
export type ExceptionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getAuthenticatedProfessional() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (!professional) {
    return { success: false, error: 'Apenas profissionais podem gerenciar exceções de disponibilidade.' } as const
  }

  return { supabase, userId: user.id, professionalId: professional.id }
}

export async function addAvailabilityException(
  dateLocal: string,
  options: {
    isAvailable?: boolean
    startTimeLocal?: string
    endTimeLocal?: string
    timezone?: string
    reason?: string
  } = {},
): Promise<ExceptionResult<{ exceptionId: string }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem gerenciar exceções de disponibilidade.' }
  }

  const rl = await rateLimit('availability', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas alterações. Tente novamente em breve.' }

  return addAvailabilityExceptionService(supabase, professionalId, dateLocal, options)
}

export async function removeAvailabilityException(exceptionId: string): Promise<ExceptionResult<{ removed: boolean }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem gerenciar exceções de disponibilidade.' }
  }

  const rl = await rateLimit('availability', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas alterações. Tente novamente em breve.' }

  return removeAvailabilityExceptionService(supabase, professionalId, exceptionId)
}

export async function getAvailabilityExceptions(
  from: string,
  to: string,
): Promise<ExceptionResult<{ exceptions: unknown[] }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem gerenciar exceções de disponibilidade.' }
  }

  const rl = await rateLimit('availability', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }

  return getAvailabilityExceptionsService(supabase, professionalId, from, to)
}
