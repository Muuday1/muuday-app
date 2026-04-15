'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidateTag } from 'next/cache'
import { rateLimit } from '@/lib/security/rate-limit'
import { z } from 'zod'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'
import { getPlanConfigForTier, loadPlanConfigMap } from '@/lib/plan-config'

const VALID_CATEGORIES = [
  'saude-mental-bem-estar', 'saude-corpo-movimento', 'educacao-desenvolvimento',
  'contabilidade-financas', 'direito-suporte-juridico', 'carreira-negocios-desenvolvimento',
  'traducao-suporte-documental', 'outro',
  // Legacy slugs (backward compatibility)
  'psicologia', 'direito', 'contabilidade', 'nutricao',
  'fisioterapia', 'educacao', 'coaching', 'medicina',
] as const

const professionalSchema = z.object({
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

async function upsertPrimaryService(args: {
  professionalId: string
  category: string
  bio: string
  durationMinutes: number
  priceBrl: number
}) {
  const supabase = createClient()
  const { data: existingService, error: serviceError } = await supabase
    .from('professional_services')
    .select('id')
    .eq('professional_id', args.professionalId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (serviceError) return

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
    await supabase.from('professional_services').update(payload).eq('id', existingService.id)
    return
  }

  await supabase.from('professional_services').insert(payload)
}

export async function createProfessionalProfile(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rl = await rateLimit('professionalProfile', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const raw = {
    bio: formData.get('bio') as string || '',
    category: formData.get('category') as string || '',
    tags: formData.get('tags') as string || '',
    languages: formData.get('languages') as string || '',
    years_experience: formData.get('years_experience') as string || '0',
    session_price_brl: formData.get('session_price_brl') as string || '0',
    session_duration_minutes: formData.get('session_duration_minutes') as string || '60',
  }

  const parsed = professionalSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Dados inválidos'
    return { error: firstError }
  }

  const { bio, category, tags, languages, years_experience: yearsExperience, session_price_brl: sessionPriceBrl, session_duration_minutes: sessionDurationMinutes } = parsed.data

  // Check if professional profile already exists
  const { data: existing } = await getPrimaryProfessionalForUser(supabase, user.id, 'id, tier')

  const tierForValidation = String(existing?.tier || 'basic').toLowerCase()
  const planConfigs = await loadPlanConfigMap()
  const tierLimits = getPlanConfigForTier(planConfigs, tierForValidation).limits
  if (tags.length > tierLimits.tags) {
    return { error: `Seu plano permite até ${tierLimits.tags} tags.` }
  }

  let professionalId = existing?.id || ''

  if (existing) {
    // Update existing
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
    // Create new
    const { data: inserted, error } = await supabase
      .from('professionals')
      .insert({
        user_id: user.id,
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
      professionalId,
      category,
      bio,
      durationMinutes: sessionDurationMinutes,
      priceBrl: sessionPriceBrl,
    })
    await recomputeProfessionalVisibility(supabase, professionalId)
    revalidateTag('public-profiles')
  }

  redirect('/perfil')
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const slotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(timeRegex, 'Horário inválido (HH:MM)'),
  end_time: z.string().regex(timeRegex, 'Horário inválido (HH:MM)'),
}).refine(s => s.start_time < s.end_time, { message: 'Horário início deve ser antes do fim' })

const slotsSchema = z.array(slotSchema).max(50, 'Máximo 50 horários')

const professionalDraftSchema = z.object({
  professionalId: z.string().uuid(),
  category: z.enum(VALID_CATEGORIES, { errorMap: () => ({ message: 'Categoria inválida' }) }),
  bio: z.string().trim().min(20, 'Bio muito curta').max(5000, 'Bio muito longa'),
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

export async function updateAvailability(slots: { day_of_week: number; start_time: string; end_time: string }[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const rl = await rateLimit('availability', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const parsed = slotsSchema.safeParse(slots)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Dados inválidos'
    return { error: firstError }
  }

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')

  if (!professional) return { error: 'Perfil profissional não encontrado' }

  // Delete existing availability
  await supabase
    .from('availability')
    .delete()
    .eq('professional_id', professional.id)

  // Insert new slots
  if (parsed.data.length > 0) {
    const { error } = await supabase
      .from('availability')
      .insert(parsed.data.map(slot => ({
        professional_id: professional.id,
        ...slot,
      })))

    if (error) return { error: error.message }
  }

  await recomputeProfessionalVisibility(supabase, professional.id)
  revalidateTag('public-profiles')
  return { success: true }
}

export async function saveProfessionalProfileDraft(input: {
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
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

  const rl = await rateLimit('professionalProfile', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

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

  const { data: professional } = await getPrimaryProfessionalForUser(
    supabase,
    user.id,
    'id,tier',
  )
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
    professionalId: parsed.data.professionalId,
    category: parsed.data.category,
    bio: parsed.data.bio,
    durationMinutes: parsed.data.sessionDurationMinutes,
    priceBrl: parsed.data.sessionPriceBrl,
  })

  await supabase.from('professional_credentials').delete().eq('professional_id', parsed.data.professionalId)
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
  revalidateTag('public-profiles')
  return { success: true as const }
}
