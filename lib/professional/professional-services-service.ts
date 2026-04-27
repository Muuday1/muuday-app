import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { loadPlanConfigMap, getPlanConfigForTier } from '@/lib/plan-config'

const serviceIdSchema = z.string().uuid('Identificador de serviço inválido.')
const nameSchema = z.string().trim().min(1, 'Nome é obrigatório.').max(100, 'Nome muito longo.')
const descriptionSchema = z.string().trim().max(500, 'Descrição muito longa.').optional()

export type ServiceResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createProfessionalService(
  supabase: SupabaseClient,
  professionalId: string,
  name: string,
  durationMinutes: number,
  priceBrl: number,
  description?: string,
): Promise<ServiceResult<{ serviceId: string }>> {
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

  const [
    { data: professionalRow, error: tierError },
    { count: activeServicesCount, error: countError },
  ] = await Promise.all([
    supabase.from('professionals').select('tier').eq('id', professionalId).maybeSingle(),
    supabase
      .from('professional_services')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professionalId)
      .eq('is_active', true),
  ])

  if (tierError || countError) {
    console.error('[createProfessionalService] tier/count query failed', {
      professionalId,
      tierError: tierError?.message,
      countError: countError?.message,
    })
    return { success: false, error: 'Erro ao validar limite do plano.' }
  }

  const planConfigMap = await loadPlanConfigMap()
  const tierConfig = getPlanConfigForTier(planConfigMap, professionalRow?.tier)
  const currentActiveServices = Number(activeServicesCount || 0)

  if (currentActiveServices >= tierConfig.limits.services) {
    return {
      success: false,
      error: `Seu plano permite até ${tierConfig.limits.services} serviço(s). Você já tem ${currentActiveServices} ativo(s). Edite um existente ou exclua antes de criar outro.`,
    }
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

export async function updateProfessionalService(
  supabase: SupabaseClient,
  professionalId: string,
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

export async function deleteProfessionalService(
  supabase: SupabaseClient,
  professionalId: string,
  serviceId: string,
): Promise<ServiceResult<{ deleted: boolean }>> {
  const idParsed = serviceIdSchema.safeParse(serviceId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

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

export async function getProfessionalServices(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<ServiceResult<{ services: unknown[] }>> {
  const parsed = z.string().uuid().safeParse(professionalId)
  if (!parsed.success) {
    return { success: false, error: 'Identificador de profissional inválido.' }
  }

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
