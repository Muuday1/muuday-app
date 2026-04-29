import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getPrimaryProfessionalForUser } from './current-professional'
import { recomputeProfessionalVisibility } from './public-visibility'
import { getPlanConfigForTier, loadPlanConfigMap } from '@/lib/plan-config'

const VALID_CATEGORIES = [
  'saude-mental-bem-estar', 'saude-corpo-movimento', 'educacao-desenvolvimento',
  'contabilidade-financas', 'direito-suporte-juridico', 'carreira-negocios-desenvolvimento',
  'traducao-suporte-documental', 'outro',
  // Legacy slugs (backward compatibility)
  'psicologia', 'direito', 'contabilidade', 'nutricao',
  'fisioterapia', 'educacao', 'coaching', 'medicina',
] as const

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const professionalSchema = z.object({
  bio: z.string().trim().min(10, 'Bio muito curta').max(2000, 'Bio muito longa'),
  category: z.enum(VALID_CATEGORIES, { errorMap: () => ({ message: 'Categoria inválida' }) }),
  tags: z.string().transform(s => s.split(',').map(t => t.trim()).filter(Boolean)).pipe(
    z.array(z.string().max(50)).max(20, 'Máximo 20 tags')
  ),
  languages: z.string().transform(s => s.split(',').map(l => l.trim()).filter(Boolean)).pipe(
    z.array(z.string().max(50)).max(10, 'Máximo 10 idiomas')
  ),
  years_experience: z.coerce.number().int().min(0).max(60),
  session_price_brl: z.coerce.number().min(0).max(50000),
  session_duration_minutes: z.coerce.number().int().min(15).max(480),
})

export const professionalDraftSchema = z.object({
  professionalId: z.string().uuid(),
  category: z.enum(VALID_CATEGORIES, { errorMap: () => ({ message: 'Categoria inválida' }) }),
  bio: z.string().trim().min(10, 'Bio muito curta').max(5000, 'Bio muito longa'),
  tags: z.array(z.string().trim().min(1).max(50)).max(10, 'Limite de tags excedido'),
  languages: z.array(z.string().trim().min(1).max(50)).min(1, 'Selecione pelo menos um idioma').max(10),
  yearsExperience: z.number().int().min(0).max(60),
  sessionPriceBrl: z.number().min(0).max(50000),
  sessionDurationMinutes: z.number().int().min(15).max(480),
  whatsappNumber: z.string().trim().max(32).optional().default(''),
  coverPhotoUrl: z.string().trim().url('URL de capa inválida').optional().or(z.literal('')),
  videoIntroUrl: z.string().trim().url('URL de vídeo inválida').optional().or(z.literal('')),
  socialLinks: z.array(z.string().trim().url('Link social inválido')).max(5).default([]),
  credentialUrls: z.array(z.string().trim().url('URL de credencial inválida')).max(10).default([]),
})

const slotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(timeRegex, 'Horário inválido (HH:MM)'),
  end_time: z.string().regex(timeRegex, 'Horário inválido (HH:MM)'),
}).refine(s => s.start_time < s.end_time, { message: 'Horário início deve ser antes do fim' })

export const slotsSchema = z.array(slotSchema).max(50, 'Máximo 50 horários')

export interface ProfessionalProfileResult {
  success?: boolean
  error?: string
  professionalId?: string
}

async function upsertPrimaryService(args: {
  supabase: SupabaseClient
  professionalId: string
  category: string
  bio: string
  durationMinutes: number
  priceBrl: number
}) {
  const { data: existingService, error: serviceError } = await args.supabase
    .from('professional_services')
    .select('id')
    .eq('professional_id', args.professionalId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (serviceError) {
    Sentry.captureException(serviceError, { tags: { area: 'professional_upsert_primary_service' } })
    return
  }

  const payload = {
    professional_id: args.professionalId,
    name: `Sessao principal (${args.category})`,
    service_type: 'one_off',
    description: args.bio || 'Sessao profissional na Muuday',
    duration_minutes: args.durationMinutes,
    price_brl: args.priceBrl,
    enable_recurring: false,
    enable_monthly: false,
    is_active: true,
    is_draft: false,
    updated_at: new Date().toISOString(),
  }

  if (existingService?.id) {
    const { error: updateError } = await args.supabase
      .from('professional_services')
      .update(payload)
      .eq('id', existingService.id)
    if (updateError) {
      Sentry.captureException(updateError, { tags: { area: 'professional_upsert_primary_service' } })
    }
    return
  }

  const { error: insertError } = await args.supabase.from('professional_services').insert(payload)
  if (insertError) {
    Sentry.captureException(insertError, { tags: { area: 'professional_upsert_primary_service' } })
  }
}

export async function createOrUpdateProfessionalProfile(
  supabase: SupabaseClient,
  userId: string,
  raw: {
    bio: string
    category: string
    tags: string
    languages: string
    years_experience: string
    session_price_brl: string
    session_duration_minutes: string
  },
): Promise<ProfessionalProfileResult> {
  const parsed = professionalSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Dados inválidos'
    return { error: firstError }
  }

  const {
    bio,
    category,
    tags,
    languages,
    years_experience: yearsExperience,
    session_price_brl: sessionPriceBrl,
    session_duration_minutes: sessionDurationMinutes,
  } = parsed.data

  const { data: existing, error: existingError } = await getPrimaryProfessionalForUser(
    supabase,
    userId,
    'id, tier',
  )
  if (existingError) {
    Sentry.captureException(existingError, { tags: { area: 'professional_create' } })
  }

  const tierForValidation = String(existing?.tier || 'basic').toLowerCase()
  const planConfigs = await loadPlanConfigMap()
  const tierLimits = getPlanConfigForTier(planConfigs, tierForValidation).limits
  if (tags.length > tierLimits.tags) {
    return { error: `Seu plano permite até ${tierLimits.tags} tags.` }
  }

  let professionalId = existing?.id || ''

  if (existing) {
    const { error } = await supabase
      .from('professionals')
      .update({
        bio,
        category,
        tags,
        languages: languages.length > 0 ? languages : ['Português'],
        years_experience: yearsExperience,
        session_price_brl: sessionPriceBrl,
        session_duration_minutes: sessionDurationMinutes,
        status: 'pending_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { data: inserted, error } = await supabase
      .from('professionals')
      .insert({
        user_id: userId,
        bio,
        category,
        tags,
        languages: languages.length > 0 ? languages : ['Português'],
        years_experience: yearsExperience,
        session_price_brl: sessionPriceBrl,
        session_duration_minutes: sessionDurationMinutes,
        status: 'pending_review',
      })
      .select('id')
      .single()

    professionalId = inserted?.id || ''
    if (error) return { error: error.message }
  }

  if (professionalId) {
    await upsertPrimaryService({
      supabase,
      professionalId,
      category,
      bio,
      durationMinutes: sessionDurationMinutes,
      priceBrl: sessionPriceBrl,
    })
    await recomputeProfessionalVisibility(supabase, professionalId)
  }

  return { success: true, professionalId }
}

export async function saveProfessionalProfileDraft(
  supabase: SupabaseClient,
  userId: string,
  input: {
    professionalId: string
    category: string
    bio: string
    tags: string[]
    languages: string[]
    yearsExperience: number
    sessionPriceBrl: number
    sessionDurationMinutes: number
    whatsappNumber?: string
    coverPhotoUrl?: string
    videoIntroUrl?: string
    socialLinks?: string[]
    credentialUrls?: string[]
  },
): Promise<ProfessionalProfileResult> {
  const parsed = professionalDraftSchema.safeParse({
    professionalId: input.professionalId,
    category: input.category,
    bio: input.bio,
    tags: (input.tags || []).filter(Boolean),
    languages: (input.languages || []).filter(Boolean),
    yearsExperience: Number(input.yearsExperience || 0),
    sessionPriceBrl: Number(input.sessionPriceBrl || 0),
    sessionDurationMinutes: Number(input.sessionDurationMinutes || 60),
    whatsappNumber: input.whatsappNumber || '',
    coverPhotoUrl: input.coverPhotoUrl || '',
    videoIntroUrl: input.videoIntroUrl || '',
    socialLinks: (input.socialLinks || []).filter(Boolean),
    credentialUrls: (input.credentialUrls || []).filter(Boolean),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Dados inválidos.' }
  }

  const { data: professional, error: profError } = await getPrimaryProfessionalForUser(
    supabase,
    userId,
    'id,tier',
  )
  if (profError) {
    Sentry.captureException(profError, { tags: { area: 'professional_save_draft' } })
  }
  if (!professional || professional.id !== parsed.data.professionalId) {
    return { error: 'Perfil profissional inválido para este usuário.' }
  }

  const tier = String(professional.tier || 'basic').toLowerCase()
  const planConfigs = await loadPlanConfigMap()
  const tierConfig = getPlanConfigForTier(planConfigs, tier)
  const tierLimits = tierConfig.limits
  const socialLinksLimit = tierConfig.socialLinksLimit

  if (parsed.data.tags.length > tierLimits.tags) {
    return { error: `Seu plano permite até ${tierLimits.tags} tags.` }
  }
  if (parsed.data.socialLinks.length > socialLinksLimit) {
    return {
      error:
        socialLinksLimit === 0
          ? 'Links sociais não estão disponíveis no plano atual.'
          : `Seu plano permite até ${socialLinksLimit} links sociais.`,
    }
  }
  if (!tierConfig.features.includes('video_intro') && parsed.data.videoIntroUrl) {
    return { error: 'Vídeo de apresentação disponível apenas no plano Professional ou Premium.' }
  }

  const socialLinksPayload =
    parsed.data.socialLinks.length > 0
      ? parsed.data.socialLinks.reduce<Record<string, string>>((acc, url, index) => {
          acc[`link_${index + 1}`] = url
          return acc
        }, {})
      : null

  const { error: updateError } = await supabase
    .from('professionals')
    .update({
      category: parsed.data.category,
      bio: parsed.data.bio,
      tags: parsed.data.tags,
      languages: parsed.data.languages,
      years_experience: parsed.data.yearsExperience,
      session_price_brl: parsed.data.sessionPriceBrl,
      session_duration_minutes: parsed.data.sessionDurationMinutes,
      whatsapp_number: parsed.data.whatsappNumber || null,
      cover_photo_url: parsed.data.coverPhotoUrl || null,
      video_intro_url:
        tierConfig.features.includes('video_intro') && parsed.data.videoIntroUrl
          ? parsed.data.videoIntroUrl
          : null,
      social_links: socialLinksPayload,
      status: 'pending_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.professionalId)

  if (updateError) return { error: updateError.message }

  await upsertPrimaryService({
    supabase,
    professionalId: parsed.data.professionalId,
    category: parsed.data.category,
    bio: parsed.data.bio,
    durationMinutes: parsed.data.sessionDurationMinutes,
    priceBrl: parsed.data.sessionPriceBrl,
  })

  const { error: credDeleteError } = await supabase
    .from('professional_credentials')
    .delete()
    .eq('professional_id', parsed.data.professionalId)
  if (credDeleteError) {
    Sentry.captureException(credDeleteError, { tags: { area: 'professional_save_draft' } })
    return { error: 'Erro ao atualizar credenciais.' }
  }

  if (parsed.data.credentialUrls.length > 0) {
    const { error: credentialsError } = await supabase.from('professional_credentials').insert(
      parsed.data.credentialUrls.map(fileUrl => ({
        professional_id: parsed.data.professionalId,
        file_url: fileUrl,
        file_name: fileUrl.split('/').pop() || 'documento',
        credential_type: 'other',
      })),
    )
    if (credentialsError) return { error: credentialsError.message }
  }

  await recomputeProfessionalVisibility(supabase, parsed.data.professionalId)
  return { success: true as const }
}

export async function updateAvailability(
  supabase: SupabaseClient,
  userId: string,
  slots: { day_of_week: number; start_time: string; end_time: string }[],
): Promise<{ success?: boolean; error?: string }> {
  const parsed = slotsSchema.safeParse(slots)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Dados inválidos'
    return { error: firstError }
  }

  const { data: professional, error: profError } = await getPrimaryProfessionalForUser(
    supabase,
    userId,
    'id',
  )
  if (profError) {
    Sentry.captureException(profError, { tags: { area: 'professional_update_availability' } })
  }

  if (!professional) return { error: 'Perfil profissional não encontrado' }

  const { data: settingsRow } = await supabase
    .from('professional_settings')
    .select('timezone')
    .eq('professional_id', professional.id)
    .maybeSingle()
  const timezone = String(settingsRow?.timezone || 'America/Sao_Paulo')

  const { error: deleteLegacyError } = await supabase
    .from('availability')
    .delete()
    .eq('professional_id', professional.id)

  if (deleteLegacyError) {
    Sentry.captureException(deleteLegacyError, { tags: { area: 'professional_update_availability' } })
    return { error: 'Erro ao remover disponibilidade anterior.' }
  }

  const { error: deleteModernError } = await supabase
    .from('availability_rules')
    .delete()
    .eq('professional_id', professional.id)

  if (deleteModernError) {
    Sentry.captureException(deleteModernError, { tags: { area: 'professional_update_availability' } })
    return { error: 'Erro ao remover regras de disponibilidade anteriores.' }
  }

  if (parsed.data.length > 0) {
    const { error: insertLegacyError } = await supabase
      .from('availability')
      .insert(parsed.data.map(slot => ({
        professional_id: professional.id,
        ...slot,
      })))

    if (insertLegacyError) return { error: insertLegacyError.message }

    const { error: insertModernError } = await supabase
      .from('availability_rules')
      .insert(parsed.data.map(slot => ({
        professional_id: professional.id,
        weekday: slot.day_of_week,
        start_time_local: slot.start_time,
        end_time_local: slot.end_time,
        timezone,
        is_active: true,
      })))

    if (insertModernError) return { error: insertModernError.message }
  }

  await recomputeProfessionalVisibility(supabase, professional.id)
  return { success: true }
}

export async function saveBookingSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: {
    timezone: string
    sessionDurationMinutes: number
    bufferMinutes: number
    minimumNoticeHours: number
    maxBookingWindowDays: number
    enableRecurring: boolean
    confirmationMode: 'auto_accept' | 'manual'
    cancellationPolicyCode: string
    requireSessionPurpose: boolean
  },
): Promise<{ success?: boolean; error?: string }> {
  const { data: professional, error: profError } = await getPrimaryProfessionalForUser(
    supabase,
    userId,
    'id',
  )
  if (profError) {
    Sentry.captureException(profError, { tags: { area: 'professional_save_booking_settings' } })
  }

  if (!professional) return { error: 'Perfil profissional não encontrado' }

  const nowIso = new Date().toISOString()

  const { error: settingsError } = await supabase.from('professional_settings').upsert(
    {
      professional_id: professional.id,
      timezone: settings.timezone,
      session_duration_minutes: settings.sessionDurationMinutes,
      buffer_minutes: settings.bufferMinutes,
      buffer_time_minutes: settings.bufferMinutes,
      minimum_notice_hours: settings.minimumNoticeHours,
      max_booking_window_days: settings.maxBookingWindowDays,
      enable_recurring: settings.enableRecurring,
      confirmation_mode: settings.confirmationMode,
      cancellation_policy_code: settings.cancellationPolicyCode,
      require_session_purpose: settings.requireSessionPurpose,
      updated_at: nowIso,
    },
    { onConflict: 'professional_id' },
  )

  if (settingsError) {
    Sentry.captureException(settingsError, { tags: { area: 'professional_save_booking_settings' } })
    return { error: 'Erro ao salvar configurações de agendamento.' }
  }

  const { error: professionalError } = await supabase
    .from('professionals')
    .update({
      session_duration_minutes: settings.sessionDurationMinutes,
      updated_at: nowIso,
    })
    .eq('id', professional.id)

  if (professionalError) {
    Sentry.captureException(professionalError, { tags: { area: 'professional_save_booking_settings' } })
    return { error: 'Configurações salvas, mas houve falha ao sincronizar a duração no perfil.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      timezone: settings.timezone,
      updated_at: nowIso,
    })
    .eq('id', userId)

  if (profileError) {
    Sentry.captureException(profileError, { tags: { area: 'professional_save_booking_settings' } })
    return { error: 'Configurações salvas, mas houve falha ao sincronizar o fuso no perfil.' }
  }

  await recomputeProfessionalVisibility(supabase, professional.id)
  return { success: true }
}

const availabilityDaySchema = z.object({
  is_available: z.boolean(),
  start_time: z.string().regex(timeRegex, 'Horário inválido (HH:MM)'),
  end_time: z.string().regex(timeRegex, 'Horário inválido (HH:MM)'),
}).refine(s => !s.is_available || s.start_time < s.end_time, {
  message: 'Horário início deve ser antes do fim',
})

const availabilityStateSchema = z.record(z.number().int().min(0).max(6), availabilityDaySchema)

export async function saveProfessionalAvailability(
  supabase: SupabaseClient,
  userId: string,
  availability: Record<number, { is_available: boolean; start_time: string; end_time: string }>,
  timezone: string,
): Promise<{ success?: boolean; error?: string; restored?: boolean }> {
  const parsed = availabilityStateSchema.safeParse(availability)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Dados inválidos'
    return { error: firstError }
  }

  const { data: professional, error: profError } = await getPrimaryProfessionalForUser(
    supabase,
    userId,
    'id',
  )
  if (profError) {
    Sentry.captureException(profError, { tags: { area: 'professional_save_availability' } })
  }

  if (!professional) return { error: 'Perfil profissional não encontrado' }

  // Fetch current rows as backup before any mutations
  const [{ data: backupLegacy }, { data: backupModern }] = await Promise.all([
    supabase
      .from('availability')
      .select('day_of_week,start_time,end_time,is_active')
      .eq('professional_id', professional.id)
      .limit(200),
    supabase
      .from('availability_rules')
      .select('weekday,start_time_local,end_time_local,timezone,is_active')
      .eq('professional_id', professional.id)
      .limit(200),
  ])

  // Delete existing rows
  const [{ error: deleteLegacyError }, { error: deleteModernError }] = await Promise.all([
    supabase.from('availability').delete().eq('professional_id', professional.id),
    supabase.from('availability_rules').delete().eq('professional_id', professional.id),
  ])

  if (deleteLegacyError || deleteModernError) {
    Sentry.captureMessage(
      `[professional/saveProfessionalAvailability] delete error: ${deleteLegacyError?.message || deleteModernError?.message}`,
      'error',
    )
    return { error: 'Erro ao remover disponibilidade anterior.' }
  }

  const days = Object.entries(parsed.data).map(([day, val]) => ({
    day_of_week: Number(day),
    ...val,
  }))

  // Insert legacy rows
  const legacyRows = days.map(day => ({
    professional_id: professional.id,
    day_of_week: day.day_of_week,
    start_time: day.start_time + ':00',
    end_time: day.end_time + ':00',
    is_active: day.is_available,
  }))

  const { error: insertLegacyError } = await supabase.from('availability').insert(legacyRows)

  if (insertLegacyError) {
    Sentry.captureException(insertLegacyError, { tags: { area: 'professional_save_availability' } })
    // Attempt restore
    let restored = false
    if (backupLegacy && backupLegacy.length > 0) {
      const { error: restoreError } = await supabase.from('availability').insert(
        backupLegacy.map(row => ({
          professional_id: professional.id,
          day_of_week: row.day_of_week,
          start_time: row.start_time,
          end_time: row.end_time,
          is_active: row.is_active,
        })),
      )
      restored = !restoreError
      if (restoreError) {
        Sentry.captureException(restoreError, { tags: { area: 'professional_save_availability' } })
      }
    }
    return { error: `Erro ao salvar disponibilidade: ${insertLegacyError.message}`, restored }
  }

  // Insert modern rows
  const modernRows = days.map(day => ({
    professional_id: professional.id,
    weekday: day.day_of_week,
    start_time_local: day.start_time + ':00',
    end_time_local: day.end_time + ':00',
    timezone,
    is_active: day.is_available,
  }))

  const { error: insertModernError } = await supabase.from('availability_rules').insert(modernRows)

  if (insertModernError) {
    Sentry.captureException(insertModernError, { tags: { area: 'professional_save_availability' } })
    // Attempt restore both tables to ensure consistency
    let restored = false
    const restoreLegacy = backupLegacy && backupLegacy.length > 0
      ? supabase.from('availability').insert(
          backupLegacy.map(row => ({
            professional_id: professional.id,
            day_of_week: row.day_of_week,
            start_time: row.start_time,
            end_time: row.end_time,
            is_active: row.is_active,
          })),
        )
      : Promise.resolve({ error: null })
    const restoreModern = backupModern && backupModern.length > 0
      ? supabase.from('availability_rules').insert(
          backupModern.map(row => ({
            professional_id: professional.id,
            weekday: row.weekday,
            start_time_local: row.start_time_local,
            end_time_local: row.end_time_local,
            timezone: row.timezone,
            is_active: row.is_active,
          })),
        )
      : Promise.resolve({ error: null })

    const [{ error: restoreLegacyError }, { error: restoreModernError }] = await Promise.all([restoreLegacy, restoreModern])
    restored = !restoreLegacyError && !restoreModernError
    if (restoreLegacyError) {
      Sentry.captureException(restoreLegacyError, { tags: { area: 'professional_save_availability' } })
    }
    if (restoreModernError) {
      Sentry.captureException(restoreModernError, { tags: { area: 'professional_save_availability' } })
    }
    return { error: `Erro ao salvar regras modernas: ${insertModernError.message}`, restored }
  }

  await recomputeProfessionalVisibility(supabase, professional.id)
  return { success: true }
}
