'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

const serviceIdSchema = z.string().uuid('Identificador de serviço inválido.')
const nameSchema = z.string().trim().min(1, 'Nome é obrigatório.').max(100, 'Nome muito longo.')
const descriptionSchema = z.string().trim().max(500, 'Descrição muito longa.').optional()

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

/**
 * Create a new service for the current professional.
 */
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

  const nameParsed = nameSchema.safeParse(name)
  if (!nameParsed.success) {
    return { success: false, error: nameParsed.error.issues[0]?.message || 'Nome inválido.' }
  }

  const descParsed = descriptionSchema.safeParse(description)
  if (!descParsed.success) {
    return { success: false, error: descParsed.error.issues[0]?.message || 'Descrição inválida.' }
  }

  const durationParsed = z.number().int().min(15).max(300).safeParse(durationMinutes)
  if (!durationParsed.success) {
    return { success: false, error: 'Duração deve ser entre 15 e 300 minutos.' }
  }

  const priceParsed = z.number().min(0).safeParse(priceBrl)
  if (!priceParsed.success) {
    return { success: false, error: 'Preço inválido.' }
  }

  const { data, error } = await supabase
    .from('professional_services')
    .insert({
      professional_id: professionalId,
      name: nameParsed.data,
      description: descParsed.data || null,
      duration_minutes: durationParsed.data,
      price_brl: priceParsed.data,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: 'Erro ao criar serviço.' }
  }

  return { success: true, data: { serviceId: data.id } }
}

/**
 * Update an existing service.
 */
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
  const idParsed = serviceIdSchema.safeParse(serviceId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem gerenciar serviços.' }
  }

  const rl = await rateLimit('professionalProfile', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas alterações. Tente novamente em breve.' }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) {
    const parsed = nameSchema.safeParse(updates.name)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Nome inválido.' }
    patch.name = parsed.data
  }

  if (updates.description !== undefined) {
    const parsed = descriptionSchema.safeParse(updates.description)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Descrição inválida.' }
    patch.description = parsed.data || null
  }

  if (updates.durationMinutes !== undefined) {
    const parsed = z.number().int().min(15).max(300).safeParse(updates.durationMinutes)
    if (!parsed.success) return { success: false, error: 'Duração inválida.' }
    patch.duration_minutes = parsed.data
  }

  if (updates.priceBrl !== undefined) {
    const parsed = z.number().min(0).safeParse(updates.priceBrl)
    if (!parsed.success) return { success: false, error: 'Preço inválido.' }
    patch.price_brl = parsed.data
  }

  if (updates.isActive !== undefined) {
    patch.is_active = updates.isActive
  }

  const { error } = await supabase
    .from('professional_services')
    .update(patch)
    .eq('id', idParsed.data)
    .eq('professional_id', professionalId)

  if (error) {
    return { success: false, error: 'Erro ao atualizar serviço.' }
  }

  return { success: true, data: { updated: true } }
}

/**
 * Soft-delete (deactivate) a service.
 */
export async function deleteProfessionalService(serviceId: string): Promise<ServiceResult<{ deleted: boolean }>> {
  const idParsed = serviceIdSchema.safeParse(serviceId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem gerenciar serviços.' }
  }

  const rl = await rateLimit('professionalProfile', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas alterações. Tente novamente em breve.' }

  const { error } = await supabase
    .from('professional_services')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', idParsed.data)
    .eq('professional_id', professionalId)

  if (error) {
    return { success: false, error: 'Erro ao remover serviço.' }
  }

  return { success: true, data: { deleted: true } }
}

/**
 * Get services for a professional (public).
 */
export async function getProfessionalServices(
  professionalId: string,
): Promise<ServiceResult<{ services: unknown[] }>> {
  const parsed = z.string().uuid().safeParse(professionalId)
  if (!parsed.success) {
    return { success: false, error: 'Identificador de profissional inválido.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('professional_services')
    .select('id, name, description, duration_minutes, price_brl, is_active, created_at')
    .eq('professional_id', parsed.data)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    return { success: false, error: 'Erro ao carregar serviços.' }
  }

  return { success: true, data: { services: data || [] } }
}
