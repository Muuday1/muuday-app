'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import {
  createProfessionalService as createProfessionalServiceService,
  updateProfessionalService as updateProfessionalServiceService,
  deleteProfessionalService as deleteProfessionalServiceService,
  getProfessionalServices as getProfessionalServicesService,
} from '@/lib/professional/professional-services-service'
export type ServiceResult<T = unknown> =
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
    return { success: false, error: 'Apenas profissionais podem gerenciar serviços.' } as const
  }

  return { supabase, userId: user.id, professionalId: professional.id }
}

export async function createProfessionalService(
  name: string,
  durationMinutes: number,
  priceBrl: number,
  description?: string,
): Promise<ServiceResult<{ serviceId: string }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem gerenciar serviços.' }
  }

  const rl = await rateLimit('professionalProfile', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas alterações. Tente novamente em breve.' }

  return createProfessionalServiceService(supabase, professionalId, name, durationMinutes, priceBrl, description)
}

export async function updateProfessionalService(
  serviceId: string,
  updates: {
    name?: string
    durationMinutes?: number
    priceBrl?: number
    description?: string
    isActive?: boolean
  },
): Promise<ServiceResult<{ updated: boolean }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem gerenciar serviços.' }
  }

  const rl = await rateLimit('professionalProfile', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas alterações. Tente novamente em breve.' }

  return updateProfessionalServiceService(supabase, professionalId, serviceId, updates)
}

export async function deleteProfessionalService(serviceId: string): Promise<ServiceResult<{ deleted: boolean }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem gerenciar serviços.' }
  }

  const rl = await rateLimit('professionalProfile', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas alterações. Tente novamente em breve.' }

  return deleteProfessionalServiceService(supabase, professionalId, serviceId)
}

export async function getProfessionalServices(
  professionalId: string,
): Promise<ServiceResult<{ services: unknown[] }>> {
  const supabase = await createClient()
  return getProfessionalServicesService(supabase, professionalId)
}
