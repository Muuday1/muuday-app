import type { SupabaseClient } from '@supabase/supabase-js'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

export interface CompleteProfileInput {
  bio: string
  category: string
  tags: string[]
  languages: string[]
  yearsExperience: number
  sessionPriceBrl: number
  sessionDurationMinutes: number
}

export interface CompleteProfileResult {
  success: boolean
  error?: string
  professionalId?: string
}

export async function completeProfessionalProfileService(
  supabase: SupabaseClient,
  userId: string,
  input: CompleteProfileInput,
): Promise<CompleteProfileResult> {
  const { data: existing, error: existingError } = await getPrimaryProfessionalForUser(
    supabase,
    userId,
    'id,status',
  )

  if (existingError) {
    return { success: false, error: 'Erro ao verificar perfil existente.' }
  }

  const profileData = {
    bio: input.bio,
    category: input.category,
    tags: input.tags,
    languages: input.languages,
    years_experience: input.yearsExperience,
    session_price_brl: input.sessionPriceBrl,
    session_duration_minutes: input.sessionDurationMinutes,
    updated_at: new Date().toISOString(),
  }

  let professionalId: string | undefined
  let err: Error | null = null

  if (existing?.id) {
    const normalizedStatus = String((existing as Record<string, unknown>)?.status || 'draft').toLowerCase()
    const statusForUpdate = normalizedStatus === 'draft' ? 'pending_review' : normalizedStatus

    const { error } = await supabase
      .from('professionals')
      .update({
        ...profileData,
        status: statusForUpdate,
      })
      .eq('id', existing.id)

    professionalId = existing.id
    err = error
  } else {
    const { data: inserted, error } = await supabase
      .from('professionals')
      .insert({
        user_id: userId,
        ...profileData,
        status: 'pending_review',
      })
      .select('id')
      .single()

    professionalId = inserted?.id
    err = error
  }

  if (err) {
    return { success: false, error: err.message }
  }

  if (!professionalId) {
    return { success: false, error: 'Erro ao criar/atualizar perfil profissional.' }
  }

  // Upsert primary service
  const { data: existingService, error: findServiceError } = await supabase
    .from('professional_services')
    .select('id')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (findServiceError) {
    return { success: false, error: 'Erro ao verificar serviço existente.' }
  }

  const categoryLabel =
    input.category.charAt(0).toUpperCase() + input.category.slice(1).replace(/-/g, ' ')

  const servicePayload = {
    professional_id: professionalId,
    name: `Sessão principal (${categoryLabel})`,
    service_type: 'one_off' as const,
    description: input.bio?.trim() || 'Sessão profissional na Muuday',
    duration_minutes: input.sessionDurationMinutes,
    price_brl: input.sessionPriceBrl,
    enable_recurring: false,
    enable_monthly: false,
    is_active: true,
    is_draft: false,
    updated_at: new Date().toISOString(),
  }

  if (existingService?.id) {
    const { error: updateError } = await supabase
      .from('professional_services')
      .update(servicePayload)
      .eq('id', existingService.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }
  } else {
    const { error: insertError } = await supabase.from('professional_services').insert(servicePayload)

    if (insertError) {
      return { success: false, error: insertError.message }
    }
  }

  return { success: true, professionalId }
}
