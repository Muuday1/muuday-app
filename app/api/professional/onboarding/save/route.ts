import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'
import { getPlanConfigForTier, loadPlanConfigMap } from '@/lib/plan-config'
import { SECTION_TO_REVIEW_FIELD_KEYS, SECTION_TO_REVIEW_STAGES } from '@/lib/professional/review-adjustments'

const qualificationFileSchema = z.object({
  id: z.string(),
  file_name: z.string(),
  file_url: z.string().url(),
  scan_status: z.string(),
  verified: z.boolean(),
  credential_type: z.string().nullable(),
})

const qualificationSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  requires_registration: z.boolean(),
  course_name: z.string().default(''),
  registration_number: z.string().default(''),
  issuer: z.string().default(''),
  country: z.string().default(''),
  evidence_files: z.array(qualificationFileSchema),
})

const identitySchema = z.object({
  section: z.literal('identity'),
  professionalId: z.string().uuid().optional(),
  resolvedAdjustmentIds: z.array(z.string().uuid()).optional().default([]),
  title: z.string().optional().default(''),
  displayName: z.string().trim().max(160).default(''),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  primaryLanguage: z.string().trim().min(1).max(80),
  secondaryLanguages: z.array(z.string().trim().min(1).max(80)).max(20),
  targetAudiences: z.array(z.string().trim().min(1).max(80)).max(20),
  focusAreas: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  qualifications: z.array(qualificationSchema).max(20),
})

const publicProfileSchema = z.object({
  section: z.literal('public_profile'),
  professionalId: z.string().uuid().optional(),
  resolvedAdjustmentIds: z.array(z.string().uuid()).optional().default([]),
  bio: z.string().trim().min(1).max(500),
  avatarUrl: z.string().url().or(z.literal('')),
  avatarPath: z.string().trim().optional().default(''),
})

const serviceSchema = z.object({
  section: z.literal('service'),
  professionalId: z.string().uuid().optional(),
  resolvedAdjustmentIds: z.array(z.string().uuid()).optional().default([]),
  operation: z.enum(['create', 'update', 'delete']).optional().default('create'),
  serviceId: z.string().uuid().optional(),
  name: z.string().trim().max(30).optional().default(''),
  description: z.string().trim().max(120).optional().default(''),
  priceBrl: z.coerce.number().positive().max(50000).optional(),
  durationMinutes: z.coerce.number().int().min(15).max(240).optional(),
})

const availabilityDaySchema = z.object({
  is_available: z.boolean(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
})

const availabilitySchema = z.object({
  section: z.literal('availability'),
  professionalId: z.string().uuid().optional(),
  resolvedAdjustmentIds: z.array(z.string().uuid()).optional().default([]),
  profileTimezone: z.string().trim().min(1).max(80),
  availabilityMap: z.record(z.string(), availabilityDaySchema),
  minimumNoticeHours: z.coerce.number().int().min(0).max(168),
  maxBookingWindowDays: z.coerce.number().int().min(1).max(365),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  confirmationMode: z.enum(['auto_accept', 'manual']),
  enableRecurring: z.boolean(),
  allowMultiSession: z.boolean(),
  requireSessionPurpose: z.boolean(),
})

const payloadSchema = z.discriminatedUnion('section', [
  identitySchema,
  publicProfileSchema,
  serviceSchema,
  availabilitySchema,
])

function normalizeLanguages(primary: string, secondary: string[]) {
  return Array.from(new Set([primary, ...secondary].map(item => item.trim()).filter(Boolean)))
}

function isMissingAllowMultiSessionColumnError(error: { message?: string; details?: string; code?: string } | null | undefined) {
  if (!error) return false
  const haystack = `${String(error.code || '')} ${String(error.message || '')} ${String(error.details || '')}`.toLowerCase()
  return haystack.includes('allow_multi_session') && (haystack.includes('column') || haystack.includes('42703'))
}

function isPermissionError(error: { message?: string; details?: string; code?: string } | null | undefined) {
  if (!error) return false
  const haystack = `${String(error.code || '')} ${String(error.message || '')} ${String(error.details || '')}`.toLowerCase()
  return haystack.includes('42501') || haystack.includes('permission denied') || haystack.includes('row-level security')
}

function extractMissingColumnName(error: { message?: string; details?: string; code?: string } | null | undefined) {
  if (!error) return null
  const message = `${String(error.message || '')} ${String(error.details || '')}`
  const match = message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+of\s+relation\s+"?[a-zA-Z0-9_]+"?\s+does\s+not\s+exist/i)
  return match?.[1] ?? null
}

function isMissingOnConflictConstraint(error: { message?: string; details?: string; code?: string } | null | undefined) {
  if (!error) return false
  const haystack = `${String(error.code || '')} ${String(error.message || '')} ${String(error.details || '')}`.toLowerCase()
  return haystack.includes('42p10') || haystack.includes('no unique or exclusion constraint matching')
}

function normalizeTextForDiff(value: unknown) {
  return String(value || '').trim()
}

function normalizeStringArrayForDiff(values: unknown) {
  if (!Array.isArray(values)) return []
  return values
    .map(item => normalizeTextForDiff(item))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

function areStringArraysEqualForDiff(left: unknown, right: unknown) {
  const leftNormalized = normalizeStringArrayForDiff(left)
  const rightNormalized = normalizeStringArrayForDiff(right)
  if (leftNormalized.length !== rightNormalized.length) return false
  return leftNormalized.every((value, index) => value === rightNormalized[index])
}

function normalizeQualificationPayloadForDiff(values: unknown) {
  if (!Array.isArray(values)) return []
  return values
    .map(item => {
      const record = item as Record<string, unknown>
      return {
        name: normalizeTextForDiff(record.name),
        requires_registration: Boolean(record.requires_registration),
        course_name: normalizeTextForDiff(record.course_name),
        registration_number: normalizeTextForDiff(record.registration_number),
        issuer: normalizeTextForDiff(record.issuer),
        country: normalizeTextForDiff(record.country),
        evidence_file_names: normalizeStringArrayForDiff(
          Array.isArray(record.evidence_files)
            ? (record.evidence_files as Array<Record<string, unknown>>).map(file => file.file_name)
            : record.evidence_file_names,
        ),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function qualificationsChangedForDiff(previous: unknown, next: unknown) {
  const previousNormalized = normalizeQualificationPayloadForDiff(previous)
  const nextNormalized = normalizeQualificationPayloadForDiff(next)
  return JSON.stringify(previousNormalized) !== JSON.stringify(nextNormalized)
}

function normalizeAvailabilityRowsForDiff(rows: unknown) {
  if (!Array.isArray(rows)) return []
  return rows
    .map(item => {
      const row = item as Record<string, unknown>
      return {
        day_of_week: Number(row.day_of_week),
        start_time: String(row.start_time || '').slice(0, 5),
        end_time: String(row.end_time || '').slice(0, 5),
        is_active: Boolean(row.is_active),
      }
    })
    .sort((a, b) => a.day_of_week - b.day_of_week)
}

function normalizeAvailabilityMapForDiff(value: Record<string, z.infer<typeof availabilityDaySchema>>) {
  return Object.entries(value)
    .map(([day, row]) => ({
      day_of_week: Number(day),
      start_time: String(row.start_time || '').slice(0, 5),
      end_time: String(row.end_time || '').slice(0, 5),
      is_active: Boolean(row.is_available),
    }))
    .sort((a, b) => a.day_of_week - b.day_of_week)
}

function availabilityRowsChangedForDiff(previousRows: unknown, nextMap: Record<string, z.infer<typeof availabilityDaySchema>>) {
  const previousNormalized = normalizeAvailabilityRowsForDiff(previousRows)
  const nextNormalized = normalizeAvailabilityMapForDiff(nextMap)
  return JSON.stringify(previousNormalized) !== JSON.stringify(nextNormalized)
}

async function upsertProfessionalApplicationWithFallback(
  db: Awaited<ReturnType<typeof createClient>>,
  payload: Record<string, unknown>,
) {
  let attemptPayload: Record<string, unknown> = { ...payload }
  let lastError: { message?: string; details?: string; code?: string } | null = null

  for (let attempt = 0; attempt < 6; attempt++) {
    const { error } = await db.from('professional_applications').upsert(attemptPayload, { onConflict: 'user_id' })
    if (!error) {
      return { error: null }
    }

    lastError = error
    const missingColumn = extractMissingColumnName(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(attemptPayload, missingColumn)) {
      const { [missingColumn]: _drop, ...nextPayload } = attemptPayload
      attemptPayload = nextPayload
      continue
    }

    if (isMissingOnConflictConstraint(error)) {
      const { error: updateError } = await db
        .from('professional_applications')
        .update(attemptPayload)
        .eq('user_id', String(payload.user_id || ''))
      if (!updateError) {
        return { error: null }
      }

      const { error: insertError } = await db.from('professional_applications').insert(attemptPayload)
      if (!insertError) {
        return { error: null }
      }

      return { error: insertError }
    }

    return { error }
  }

  return { error: lastError }
}

async function upsertProfessionalSettingsWithFallback(
  db: Awaited<ReturnType<typeof createClient>>,
  payload: {
    professional_id: string
    timezone: string
    minimum_notice_hours: number
    max_booking_window_days: number
    buffer_minutes: number
    buffer_time_minutes: number
    confirmation_mode: 'auto_accept' | 'manual'
    enable_recurring: boolean
    allow_multi_session: boolean
    require_session_purpose: boolean
    updated_at: string
  },
) {
  const withAllowMultiSession = await db
    .from('professional_settings')
    .upsert(payload, { onConflict: 'professional_id' })

  if (!withAllowMultiSession.error) {
    return withAllowMultiSession
  }

  if (!isMissingAllowMultiSessionColumnError(withAllowMultiSession.error)) {
    return withAllowMultiSession
  }

  const { allow_multi_session: _ignored, ...fallbackPayload } = payload
  return db.from('professional_settings').upsert(fallbackPayload, { onConflict: 'professional_id' })
}

function getQualificationValidationMessage(item: z.infer<typeof qualificationSchema>) {
  const label = item.name.trim() || 'qualificacao'
  if (!item.name.trim()) return 'Informe o nome da qualificacao.'
  if (item.requires_registration) {
    if (!item.registration_number.trim()) return `Informe o numero de registro em "${label}".`
    if (!item.issuer.trim()) return `Informe o orgao emissor em "${label}".`
    if (!item.country.trim()) return `Informe o pais do registro em "${label}".`
  } else if (!item.course_name.trim()) {
    return `Informe o nome do curso ou formacao em "${label}".`
  }
  if (item.evidence_files.length === 0) return `Envie ao menos um comprovante para "${label}".`
  return ''
}

export async function POST(request: Request) {
  try {
    const rl = await rateLimit('onboardingSave', `onboarding-save:${getClientIp(request as never)}`)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
    }

    const payload = payloadSchema.safeParse(await request.json().catch(() => null))
    if (!payload.success) {
      const firstIssue = payload.error.issues[0]
      const issuePath = firstIssue?.path?.length ? firstIssue.path.join('.') : ''
      const fieldPart = issuePath ? ` Campo: ${issuePath}.` : ''
      return NextResponse.json(
        { error: `Dados invalidos para salvar esta etapa.${fieldPart}` },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role,full_name,country,timezone,avatar_url')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile || profile.role !== 'profissional') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const { data: primaryProfessional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id,user_id,tier')
    if (!primaryProfessional?.id) {
      return NextResponse.json({ error: 'Perfil profissional nao encontrado.' }, { status: 404 })
    }
    let professional = primaryProfessional
    const requestedProfessionalId = String(payload.data.professionalId || '').trim()
    if (requestedProfessionalId && requestedProfessionalId !== String(primaryProfessional.id)) {
      const { data: requestedProfessional } = await supabase
        .from('professionals')
        .select('id,user_id,tier')
        .eq('id', requestedProfessionalId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (requestedProfessional?.id) {
        professional = requestedProfessional
      }
    }

    const db = supabase
    const adjustmentsClient = supabase
    const professionalId = String(professional.id)
    const userId = String(professional.user_id || user.id)
    const normalizedTier = String(professional.tier || '').toLowerCase()
    const planConfigMap = await loadPlanConfigMap()
    const tierConfig = getPlanConfigForTier(planConfigMap, normalizedTier)
    const tierLimits = tierConfig.limits
    const minNoticeRange = tierConfig.minNoticeRange
    const maxBufferForTier = tierConfig.bufferConfig.maxMinutes

    const savedSection = payload.data.section
    const resolvedAdjustmentFieldKeys = new Set<string>()
    let mutatedService: { id: string; name: string; description: string | null; price_brl: number; duration_minutes: number } | null = null
    let deletedServiceId: string | null = null
    const { data: previousPublicProfileRow } = await db
      .from('professionals')
      .select('bio,cover_photo_url')
      .eq('id', professionalId)
      .maybeSingle()

    if (savedSection === 'identity') {
      if (!String(profile?.country || '').trim() || !String(profile?.timezone || '').trim()) {
        return NextResponse.json(
          {
            error:
              'Pais e fuso horario da conta sao obrigatorios antes de salvar a identidade. Atualize em /perfil e tente novamente.',
          },
          { status: 400 },
        )
      }

      const effectiveDisplayName = String(payload.data.displayName || profile?.full_name || '').trim()
      if (!effectiveDisplayName) {
        return NextResponse.json({ error: 'Informe o nome publico profissional para continuar.' }, { status: 400 })
      }

      if (payload.data.focusAreas.length > tierLimits.tags) {
        return NextResponse.json(
          { error: `Seu plano permite até ${tierLimits.tags} tag(s) de foco.` },
          { status: 400 },
        )
      }

      const invalidQualification = payload.data.qualifications.find(item => getQualificationValidationMessage(item))

      if (invalidQualification) {
        return NextResponse.json({ error: getQualificationValidationMessage(invalidQualification) }, { status: 400 })
      }

      const { data: previousProfessionalRow, error: previousProfessionalError } = await db
        .from('professionals')
        .select('years_experience,focus_areas,languages,category,subcategories')
        .eq('id', professionalId)
        .maybeSingle()
      if (previousProfessionalError) {
        // Backup row is best-effort. We should not block save when this read fails.
        console.error('[onboarding-save] could not read previous professionals row', {
          professionalId,
          message: previousProfessionalError.message,
          code: previousProfessionalError.code,
        })
      }

      const { data: existingApplication } = await db
        .from('professional_applications')
        .select(
          'category,specialty_name,taxonomy_suggestions,display_name,primary_language,secondary_languages,target_audiences,focus_areas,years_experience,qualifications_structured',
        )
        .eq('user_id', userId)
        .maybeSingle()

      const applicationCategory = String(existingApplication?.category || previousProfessionalRow?.category || '').trim()
      if (!applicationCategory) {
        return NextResponse.json(
          { error: 'Nao foi possivel identificar a categoria profissional. Atualize seu cadastro inicial e tente novamente.' },
          { status: 400 },
        )
      }

      const previousSubcategories = Array.isArray(previousProfessionalRow?.subcategories)
        ? previousProfessionalRow.subcategories
            .map(item => String(item || '').trim())
            .filter(Boolean)
        : []
      const taxonomySuggestions =
        existingApplication?.taxonomy_suggestions && typeof existingApplication.taxonomy_suggestions === 'object'
          ? (existingApplication.taxonomy_suggestions as Record<string, unknown>)
          : null
      const inferredSubcategory = String(
        taxonomySuggestions?.subcategory_slug ||
          taxonomySuggestions?.subcategory ||
          existingApplication?.specialty_name ||
          '',
      ).trim()
      const mirrorSubcategories =
        previousSubcategories.length > 0
          ? previousSubcategories
          : inferredSubcategory
            ? [inferredSubcategory]
            : []
      const previousDisplayName = String(existingApplication?.display_name || profile?.full_name || '').trim()
      if (previousDisplayName !== effectiveDisplayName) {
        resolvedAdjustmentFieldKeys.add('display_name')
      }

      const previousYearsExperience = Number(existingApplication?.years_experience ?? previousProfessionalRow?.years_experience ?? 0)
      if (previousYearsExperience !== payload.data.yearsExperience) {
        resolvedAdjustmentFieldKeys.add('experience')
      }

      const previousPrimaryLanguage = String(
        existingApplication?.primary_language ||
          (Array.isArray(previousProfessionalRow?.languages) ? previousProfessionalRow.languages[0] : '') ||
          '',
      ).trim()
      if (previousPrimaryLanguage !== payload.data.primaryLanguage.trim()) {
        resolvedAdjustmentFieldKeys.add('languages')
      }

      if (!areStringArraysEqualForDiff(existingApplication?.secondary_languages, payload.data.secondaryLanguages)) {
        resolvedAdjustmentFieldKeys.add('languages')
      }

      if (!areStringArraysEqualForDiff(existingApplication?.target_audiences, payload.data.targetAudiences)) {
        resolvedAdjustmentFieldKeys.add('audience')
      }

      const previousFocusAreas = Array.isArray(previousProfessionalRow?.focus_areas)
        ? previousProfessionalRow.focus_areas
        : existingApplication?.focus_areas
      if (!areStringArraysEqualForDiff(previousFocusAreas, payload.data.focusAreas)) {
        resolvedAdjustmentFieldKeys.add('focus_tags')
      }

      if (qualificationsChangedForDiff(existingApplication?.qualifications_structured, payload.data.qualifications)) {
        resolvedAdjustmentFieldKeys.add('qualifications')
      }

      const professionalMirrorUpdate: Record<string, unknown> = {
        years_experience: payload.data.yearsExperience,
        focus_areas: payload.data.focusAreas,
        languages: normalizeLanguages(payload.data.primaryLanguage, payload.data.secondaryLanguages),
        category: applicationCategory,
        updated_at: new Date().toISOString(),
      }
      if (mirrorSubcategories.length > 0) {
        professionalMirrorUpdate.subcategories = mirrorSubcategories
      }

      const { error: professionalError } = await db
        .from('professionals')
        .update(professionalMirrorUpdate)
        .eq('id', professionalId)

      if (professionalError) {
        console.error('[onboarding/save][identity] professionals mirror update failed', {
          professionalId,
          message: professionalError.message,
          code: professionalError.code,
        })
      }

      const appPayload = {
        user_id: userId,
        professional_id: professionalId,
        category: applicationCategory,
        title: payload.data.title || null,
        display_name: effectiveDisplayName,
        years_experience: payload.data.yearsExperience,
        primary_language: payload.data.primaryLanguage || null,
        secondary_languages: payload.data.secondaryLanguages,
        target_audiences: payload.data.targetAudiences,
        focus_areas: payload.data.focusAreas,
        qualifications_structured: payload.data.qualifications.map(item => ({
          id: item.id,
          name: item.name,
          requires_registration: item.requires_registration,
          course_name: item.course_name,
          registration_number: item.registration_number,
          issuer: item.issuer,
          country: item.country,
          evidence_file_names: item.evidence_files.map(file => file.file_name),
        })),
        updated_at: new Date().toISOString(),
      }

      const { error: appError } = await upsertProfessionalApplicationWithFallback(db, appPayload)

      if (appError) {
        console.error('[onboarding/save][identity] professional_applications upsert failed', {
          professionalId,
          userId,
          code: appError.code,
          message: appError.message,
          details: appError.details,
        })

        if (previousProfessionalRow && !previousProfessionalError) {
          await db
            .from('professionals')
            .update({
              years_experience: previousProfessionalRow.years_experience,
              focus_areas: previousProfessionalRow.focus_areas,
              languages: previousProfessionalRow.languages,
              category: previousProfessionalRow.category,
              subcategories: previousProfessionalRow.subcategories,
              updated_at: new Date().toISOString(),
            })
            .eq('id', professionalId)
        }

        if (isPermissionError(appError)) {
          return NextResponse.json(
            {
              error:
                'Nao foi possivel salvar identidade profissional porque a aplicacao do profissional nao pode ser atualizada. Verifique a policy de UPDATE de professional_applications ou a service role do ambiente.',
            },
            { status: 500 },
          )
        }

        return NextResponse.json(
          { error: 'Nao foi possivel salvar dados profissionais. Nenhuma alteracao foi aplicada por completo.' },
          { status: 500 },
        )
      }
    }

    if (savedSection === 'public_profile') {
      const previousBio = String(previousPublicProfileRow?.bio || '').trim()
      const nextBio = String(payload.data.bio || '').trim()
      const previousCoverPhotoPath = String(previousPublicProfileRow?.cover_photo_url || '').trim()
      const nextCoverPhotoPath = String(payload.data.avatarPath || '').trim()
      const previousAvatarUrl = String(profile?.avatar_url || '').trim()
      const nextAvatarUrl = String(payload.data.avatarUrl || '').trim()

      if (
        previousBio !== nextBio ||
        previousCoverPhotoPath !== nextCoverPhotoPath ||
        previousAvatarUrl !== nextAvatarUrl
      ) {
        resolvedAdjustmentFieldKeys.add('photo')
      }

      const { error: professionalError } = await db
        .from('professionals')
        .update({
          bio: payload.data.bio,
          cover_photo_url: payload.data.avatarPath || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', professionalId)

      if (professionalError) {
        return NextResponse.json({ error: 'Nao foi possivel salvar o perfil publico.' }, { status: 500 })
      }

      const { error: profileError } = await db
        .from('profiles')
        .update({
          avatar_url: payload.data.avatarUrl || null,
        })
        .eq('id', userId)

      if (profileError) {
        return NextResponse.json({ error: 'Nao foi possivel salvar a foto do perfil.' }, { status: 500 })
      }
    }

    if (savedSection === 'service') {
      const operation = payload.data.operation || 'create'

      if (operation === 'delete') {
        if (!payload.data.serviceId) {
          return NextResponse.json({ error: 'Servico invalido para exclusao.' }, { status: 400 })
        }

        const { data: existingService, error: existingServiceError } = await db
          .from('professional_services')
          .select('id')
          .eq('id', payload.data.serviceId)
          .eq('professional_id', professionalId)
          .eq('is_active', true)
          .maybeSingle()

        if (existingServiceError) {
          return NextResponse.json({ error: 'Nao foi possivel validar o servico para exclusao.' }, { status: 500 })
        }
        if (!existingService?.id) {
          return NextResponse.json({ error: 'Servico nao encontrado ou ja removido.' }, { status: 404 })
        }

        const { error: deactivateError } = await db
          .from('professional_services')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.data.serviceId)
          .eq('professional_id', professionalId)
          .eq('is_active', true)

        if (deactivateError) {
          return NextResponse.json({ error: 'Nao foi possivel remover o servico.' }, { status: 500 })
        }

        deletedServiceId = payload.data.serviceId
        resolvedAdjustmentFieldKeys.add('service_title')
        resolvedAdjustmentFieldKeys.add('service_description')
        resolvedAdjustmentFieldKeys.add('service_price')
      } else {
        const serviceName = String(payload.data.name || '').trim()
        const serviceDescription = String(payload.data.description || '').trim()
        const servicePriceBrl = Number(payload.data.priceBrl)
        const serviceDurationMinutes = Number(payload.data.durationMinutes)

        if (!serviceName) {
          return NextResponse.json({ error: 'Informe um titulo para o servico.' }, { status: 400 })
        }
        if (!serviceDescription) {
          return NextResponse.json({ error: 'Informe uma descricao para o servico.' }, { status: 400 })
        }
        if (!Number.isFinite(servicePriceBrl) || servicePriceBrl <= 0) {
          return NextResponse.json({ error: 'Informe um preco valido para o servico.' }, { status: 400 })
        }
        if (!Number.isFinite(serviceDurationMinutes) || serviceDurationMinutes < 15 || serviceDurationMinutes > 240) {
          return NextResponse.json({ error: 'Duracao invalida. Use entre 15 e 240 minutos.' }, { status: 400 })
        }

        if (operation === 'update') {
          if (!payload.data.serviceId) {
            return NextResponse.json({ error: 'Servico invalido para edicao.' }, { status: 400 })
          }

          const { data: existingService, error: existingServiceError } = await db
            .from('professional_services')
            .select('id,name,description,price_brl,duration_minutes')
            .eq('id', payload.data.serviceId)
            .eq('professional_id', professionalId)
            .eq('is_active', true)
            .maybeSingle()

          if (existingServiceError) {
            return NextResponse.json({ error: 'Nao foi possivel validar o servico para edicao.' }, { status: 500 })
          }
          if (!existingService?.id) {
            return NextResponse.json({ error: 'Servico nao encontrado para edicao.' }, { status: 404 })
          }

          const { data: updated, error: updateError } = await db
            .from('professional_services')
            .update({
              name: serviceName,
              description: serviceDescription,
              price_brl: servicePriceBrl,
              duration_minutes: serviceDurationMinutes,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payload.data.serviceId)
            .eq('professional_id', professionalId)
            .eq('is_active', true)
            .select('id,name,description,price_brl,duration_minutes')
            .single()

          if (updateError || !updated) {
            return NextResponse.json({ error: 'Nao foi possivel atualizar o servico.' }, { status: 500 })
          }

          mutatedService = updated
          if (String(existingService.name || '').trim() !== serviceName) {
            resolvedAdjustmentFieldKeys.add('service_title')
          }
          if (String(existingService.description || '').trim() !== serviceDescription) {
            resolvedAdjustmentFieldKeys.add('service_description')
          }
          if (
            Number(existingService.price_brl || 0) !== servicePriceBrl ||
            Number(existingService.duration_minutes || 0) !== serviceDurationMinutes
          ) {
            resolvedAdjustmentFieldKeys.add('service_price')
          }
        } else {
          const { count: activeServicesCount } = await db
            .from('professional_services')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', professionalId)
            .eq('is_active', true)

          if ((activeServicesCount || 0) >= tierLimits.services) {
            const currentActiveServices = Number(activeServicesCount || 0)
            return NextResponse.json(
              {
                error: `Seu plano permite até ${tierLimits.services} serviço(s). Você já tem ${currentActiveServices} ativo(s). Edite um existente ou exclua antes de criar outro.`,
              },
              { status: 400 },
            )
          }

          const { data: inserted, error } = await db
            .from('professional_services')
            .insert({
              professional_id: professionalId,
              name: serviceName,
              service_type: 'one_off',
              description: serviceDescription,
              duration_minutes: serviceDurationMinutes,
              price_brl: servicePriceBrl,
              enable_recurring: false,
              enable_monthly: false,
              is_active: true,
              is_draft: false,
              updated_at: new Date().toISOString(),
            })
            .select('id,name,description,price_brl,duration_minutes')
            .single()

          if (error || !inserted) {
            return NextResponse.json({ error: 'Nao foi possivel criar o servico.' }, { status: 500 })
          }
          mutatedService = inserted
          resolvedAdjustmentFieldKeys.add('service_title')
          resolvedAdjustmentFieldKeys.add('service_description')
          resolvedAdjustmentFieldKeys.add('service_price')
        }
      }
    }

    if (savedSection === 'availability') {
      const availabilityPayload = payload.data as z.infer<typeof availabilitySchema>
      const invalidRange = Object.values(availabilityPayload.availabilityMap).some(
        day => day.is_available && day.start_time >= day.end_time,
      )
      if (invalidRange) {
        return NextResponse.json({ error: 'Horarios invalidos: inicio deve ser menor que fim.' }, { status: 400 })
      }

      const nowIso = new Date().toISOString()
      const safeMinimumNoticeHours = Math.min(
        Number(minNoticeRange.max),
        Math.max(Number(minNoticeRange.min), Number(availabilityPayload.minimumNoticeHours || minNoticeRange.min)),
      )
      const safeBufferMinutes = Math.min(maxBufferForTier, Math.max(0, availabilityPayload.bufferMinutes))
      const canUseManualConfirmation = tierConfig.features.includes('manual_accept')
      const safeConfirmationMode =
        canUseManualConfirmation && availabilityPayload.confirmationMode === 'manual'
          ? 'manual'
          : 'auto_accept'
      const safeBookingWindowDays = Math.max(
        1,
        Math.min(Number(tierLimits.bookingWindowDays), Number(availabilityPayload.maxBookingWindowDays || tierLimits.bookingWindowDays)),
      )
      const safeRows = Object.entries(availabilityPayload.availabilityMap).map(([day, value]) => ({
        professional_id: professionalId,
        day_of_week: Number(day),
        start_time: `${value.start_time}:00`,
        end_time: `${value.end_time}:00`,
        is_active: value.is_available,
      }))

      const safeRulesRows = Object.entries(availabilityPayload.availabilityMap).map(([day, value]) => ({
        professional_id: professionalId,
        weekday: Number(day),
        start_time_local: `${value.start_time}:00`,
        end_time_local: `${value.end_time}:00`,
        timezone: availabilityPayload.profileTimezone,
        is_active: value.is_available,
      }))

      const { data: previousAvailabilityRows, error: previousAvailabilityError } = await db
        .from('availability')
        .select('day_of_week,start_time,end_time,is_active')
        .eq('professional_id', professionalId)
      if (previousAvailabilityError) {
        // Backup rows are best-effort. We should not block save when this read fails.
        console.error('[onboarding-save] could not read previous availability rows', {
          professionalId,
          message: previousAvailabilityError.message,
          code: previousAvailabilityError.code,
        })
      }

      const { data: previousAvailabilityRulesRows, error: previousAvailabilityRulesError } = await db
        .from('availability_rules')
        .select('weekday,start_time_local,end_time_local,is_active')
        .eq('professional_id', professionalId)
      if (previousAvailabilityRulesError) {
        // Backup rows are best-effort. We should not block save when this read fails.
        console.error('[onboarding-save] could not read previous availability_rules rows', {
          professionalId,
          message: previousAvailabilityRulesError.message,
          code: previousAvailabilityRulesError.code,
        })
      }

      const { data: previousSettingsRow, error: previousSettingsError } = await db
        .from('professional_settings')
        .select(
          'timezone,minimum_notice_hours,max_booking_window_days,buffer_minutes,buffer_time_minutes,confirmation_mode,enable_recurring,allow_multi_session,require_session_purpose',
        )
        .eq('professional_id', professionalId)
        .maybeSingle()
      if (previousSettingsError) {
        // Backup row is best-effort. We should not block save when this read fails.
        console.error('[onboarding-save] could not read previous professional settings row', {
          professionalId,
          message: previousSettingsError.message,
          code: previousSettingsError.code,
        })
      }

      if (availabilityRowsChangedForDiff(previousAvailabilityRows, availabilityPayload.availabilityMap)) {
        resolvedAdjustmentFieldKeys.add('weekly_schedule')
      }

      const previousMinimumNoticeHours = Number(previousSettingsRow?.minimum_notice_hours ?? minNoticeRange.min)
      const previousMaxBookingWindowDays = Number(
        previousSettingsRow?.max_booking_window_days ?? tierLimits.bookingWindowDays,
      )
      const previousBufferMinutes = Number(
        previousSettingsRow?.buffer_minutes ?? previousSettingsRow?.buffer_time_minutes ?? 0,
      )
      const previousConfirmationMode = String(previousSettingsRow?.confirmation_mode || 'auto_accept')
      const previousEnableRecurring = Boolean(previousSettingsRow?.enable_recurring)
      const previousAllowMultiSession = Boolean(previousSettingsRow?.allow_multi_session)
      const previousRequireSessionPurpose = Boolean(previousSettingsRow?.require_session_purpose)
      const bookingRulesChanged =
        previousMinimumNoticeHours !== safeMinimumNoticeHours ||
        previousMaxBookingWindowDays !== safeBookingWindowDays ||
        previousBufferMinutes !== safeBufferMinutes ||
        previousConfirmationMode !== safeConfirmationMode ||
        previousEnableRecurring !== availabilityPayload.enableRecurring ||
        previousAllowMultiSession !== availabilityPayload.allowMultiSession ||
        previousRequireSessionPurpose !== availabilityPayload.requireSessionPurpose
      if (bookingRulesChanged) {
        resolvedAdjustmentFieldKeys.add('booking_rules')
      }

      const { error: deleteError } = await db.from('availability').delete().eq('professional_id', professionalId)
      if (deleteError) {
        return NextResponse.json({ error: 'Nao foi possivel atualizar a disponibilidade.' }, { status: 500 })
      }

      const { error: deleteRulesError } = await db.from('availability_rules').delete().eq('professional_id', professionalId)
      if (deleteRulesError) {
        return NextResponse.json({ error: 'Nao foi possivel atualizar as regras de disponibilidade.' }, { status: 500 })
      }

      const { error: insertError } = await db.from('availability').insert(safeRows)
      if (insertError) {
        return NextResponse.json({ error: 'Nao foi possivel salvar os horarios.' }, { status: 500 })
      }

      const { error: insertRulesError } = await db.from('availability_rules').insert(safeRulesRows)
      if (insertRulesError) {
        // Rollback legacy availability on rules failure to keep both tables in sync.
        await db.from('availability').delete().eq('professional_id', professionalId)
        if (!previousAvailabilityError && Array.isArray(previousAvailabilityRows) && previousAvailabilityRows.length > 0) {
          const restoreRows = previousAvailabilityRows.map(row => ({
            professional_id: professionalId,
            day_of_week: Number(row.day_of_week),
            start_time: String(row.start_time),
            end_time: String(row.end_time),
            is_active: Boolean(row.is_active),
          }))
          await db.from('availability').insert(restoreRows)
        }
        return NextResponse.json({ error: 'Nao foi possivel salvar as regras de disponibilidade.' }, { status: 500 })
      }

      const { error: settingsError } = await upsertProfessionalSettingsWithFallback(db, {
        professional_id: professionalId,
        timezone: availabilityPayload.profileTimezone,
        minimum_notice_hours: safeMinimumNoticeHours,
        max_booking_window_days: safeBookingWindowDays,
        buffer_minutes: safeBufferMinutes,
        buffer_time_minutes: safeBufferMinutes,
        confirmation_mode: safeConfirmationMode,
        enable_recurring: availabilityPayload.enableRecurring,
        allow_multi_session: availabilityPayload.allowMultiSession,
        require_session_purpose: availabilityPayload.requireSessionPurpose,
        updated_at: nowIso,
      })

      if (settingsError) {
        // Best-effort rollback for availability rows when settings save fails.
        await db.from('availability').delete().eq('professional_id', professionalId)
        await db.from('availability_rules').delete().eq('professional_id', professionalId)
        if (!previousAvailabilityError && Array.isArray(previousAvailabilityRows) && previousAvailabilityRows.length > 0) {
          const restoreRows = previousAvailabilityRows.map(row => ({
            professional_id: professionalId,
            day_of_week: Number(row.day_of_week),
            start_time: String(row.start_time),
            end_time: String(row.end_time),
            is_active: Boolean(row.is_active),
          }))
          await db.from('availability').insert(restoreRows)
        }
        if (!previousAvailabilityRulesError && Array.isArray(previousAvailabilityRulesRows) && previousAvailabilityRulesRows.length > 0) {
          const restoreRulesRows = previousAvailabilityRulesRows.map(row => ({
            professional_id: professionalId,
            weekday: Number(row.weekday),
            start_time_local: String(row.start_time_local),
            end_time_local: String(row.end_time_local),
            timezone: availabilityPayload.profileTimezone,
            is_active: Boolean(row.is_active),
          }))
          await db.from('availability_rules').insert(restoreRulesRows)
        }

        if (previousSettingsRow && !previousSettingsError) {
          await upsertProfessionalSettingsWithFallback(db, {
            professional_id: professionalId,
            timezone: previousSettingsRow.timezone,
            minimum_notice_hours: previousSettingsRow.minimum_notice_hours,
            max_booking_window_days: previousSettingsRow.max_booking_window_days,
            buffer_minutes: previousSettingsRow.buffer_minutes,
            buffer_time_minutes: previousSettingsRow.buffer_time_minutes,
            confirmation_mode: previousSettingsRow.confirmation_mode,
            enable_recurring: previousSettingsRow.enable_recurring,
            allow_multi_session: previousAllowMultiSession,
            require_session_purpose: previousSettingsRow.require_session_purpose,
            updated_at: nowIso,
          })
        }

        if (isMissingAllowMultiSessionColumnError(settingsError)) {
          return NextResponse.json(
            {
              error:
                'Nao foi possivel salvar regras de agendamento porque a base ainda nao suporta allow_multi_session. Execute a migration 042.',
            },
            { status: 500 },
          )
        }

        return NextResponse.json(
          { error: 'Nao foi possivel salvar regras de agendamento. Tente novamente.' },
          { status: 500 },
        )
      }
    }

    const stageIdsForSection = SECTION_TO_REVIEW_STAGES[savedSection] || []
    const allowedFieldKeysForSection = new Set(SECTION_TO_REVIEW_FIELD_KEYS[savedSection] || [])
    const changedFieldKeysForSection = Array.from(resolvedAdjustmentFieldKeys).filter(fieldKey =>
      allowedFieldKeysForSection.has(fieldKey),
    )

    if (stageIdsForSection.length > 0 && changedFieldKeysForSection.length > 0) {
      const { data: candidateRows, error: candidateRowsError } = await adjustmentsClient
        .from('professional_review_adjustments')
        .select('id,field_key')
        .eq('professional_id', professionalId)
        .in('stage_id', stageIdsForSection)
        .in('status', ['open', 'reopened'])

      if (candidateRowsError) {
        return NextResponse.json(
          { error: 'Dados salvos, mas nao foi possivel carregar os ajustes para atualizar o tracker.' },
          { status: 500 },
        )
      }

      const changedFieldSet = new Set(changedFieldKeysForSection)
      const eligibleAdjustmentIds = (candidateRows || [])
        .filter(row => changedFieldSet.has(String(row.field_key || '')))
        .map(row => String(row.id || '').trim())
        .filter(Boolean)

      if (eligibleAdjustmentIds.length > 0) {
        const { error: resolveError } = await adjustmentsClient
          .from('professional_review_adjustments')
          .update({
            status: 'resolved_by_professional',
            resolved_at: new Date().toISOString(),
            resolved_by: user.id,
            resolution_note: `resolved_by_ids:${savedSection}`,
          })
          .eq('professional_id', professionalId)
          .in('id', eligibleAdjustmentIds)
          .in('status', ['open', 'reopened'])

        if (resolveError) {
          return NextResponse.json(
            { error: 'Dados salvos, mas nao foi possivel concluir os ajustes solicitados desta etapa.' },
            { status: 500 },
          )
        }
      }
    }

    await recomputeProfessionalVisibility(db, professionalId)
    const onboardingState = await loadProfessionalOnboardingState(db, professionalId, {
      resolveSignedMediaUrls: false,
    })
    if (!onboardingState) {
      return NextResponse.json({ error: 'Alteracoes salvas, mas o tracker nao pode ser atualizado.' }, { status: 500 })
    }

    const { data: reviewAdjustments } = await db
      .from('professional_review_adjustments')
      .select('id,stage_id,field_key,message,severity,status,created_at,resolved_at')
      .eq('professional_id', professionalId)
      .in('status', ['open', 'reopened'])
      .order('created_at', { ascending: false })

    return NextResponse.json({
      ok: true,
      evaluation: onboardingState.evaluation,
      professionalStatus: String(onboardingState.snapshot.professional.status || ''),
      reviewAdjustments: (reviewAdjustments || []).map(row => ({
        id: String(row.id || ''),
        stageId: String(row.stage_id || ''),
        fieldKey: String(row.field_key || ''),
        message: String(row.message || ''),
        severity: String(row.severity || 'medium'),
        status: String(row.status || 'open'),
        createdAt: String(row.created_at || ''),
        resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
      })),
      service: mutatedService,
      deletedServiceId,
    })
  } catch {
    return NextResponse.json({ error: 'Erro inesperado ao salvar esta etapa.' }, { status: 500 })
  }
}

