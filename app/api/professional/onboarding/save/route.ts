import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { loadProfessionalOnboardingState } from '@/lib/professional/onboarding-state'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'

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
  bio: z.string().trim().min(1).max(500),
  avatarUrl: z.string().url().or(z.literal('')),
})

const serviceSchema = z.object({
  section: z.literal('service'),
  name: z.string().trim().min(1).max(30),
  description: z.string().trim().min(1).max(120),
  priceBrl: z.coerce.number().positive().max(50000),
  durationMinutes: z.coerce.number().int().min(15).max(240),
})

const availabilityDaySchema = z.object({
  is_available: z.boolean(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
})

const availabilitySchema = z.object({
  section: z.literal('availability'),
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

async function upsertProfessionalSettingsWithFallback(
  db: ReturnType<typeof createClient> | NonNullable<ReturnType<typeof createAdminClient>>,
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

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle()
    if (!profile || profile.role !== 'profissional') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id,user_id,tier')
    if (!professional?.id) {
      return NextResponse.json({ error: 'Perfil profissional nao encontrado.' }, { status: 404 })
    }

    const admin = createAdminClient()
    const db = admin ?? supabase
    const professionalId = String(professional.id)
    const userId = String(professional.user_id || user.id)

    if (payload.data.section === 'identity') {
      const effectiveDisplayName = String(payload.data.displayName || profile?.full_name || '').trim()
      if (!effectiveDisplayName) {
        return NextResponse.json({ error: 'Informe o nome publico profissional para continuar.' }, { status: 400 })
      }

      const invalidQualification = payload.data.qualifications.find(item => getQualificationValidationMessage(item))

      if (invalidQualification) {
        return NextResponse.json({ error: getQualificationValidationMessage(invalidQualification) }, { status: 400 })
      }

      const { data: previousProfessionalRow, error: previousProfessionalError } = await db
        .from('professionals')
        .select('years_experience,focus_areas,languages')
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

      const { error: professionalError } = await db
        .from('professionals')
        .update({
          years_experience: payload.data.yearsExperience,
          focus_areas: payload.data.focusAreas,
          languages: normalizeLanguages(payload.data.primaryLanguage, payload.data.secondaryLanguages),
          updated_at: new Date().toISOString(),
        })
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

      const { error: appError } = await db
        .from('professional_applications')
        .upsert(appPayload, { onConflict: 'user_id' })

      if (appError) {
        if (isPermissionError(appError)) {
          // In environments without service-role key, RLS may block application upsert.
          // Keep identity save successful and rely on professional/profile fallbacks.
          console.error('[onboarding/save][identity] professional_applications upsert permission error', {
            professionalId,
            userId,
            code: appError.code,
            message: appError.message,
          })
        } else {
          if (previousProfessionalRow && !previousProfessionalError) {
            await db
              .from('professionals')
              .update({
                years_experience: previousProfessionalRow.years_experience,
                focus_areas: previousProfessionalRow.focus_areas,
                languages: previousProfessionalRow.languages,
                updated_at: new Date().toISOString(),
              })
              .eq('id', professionalId)
          }

          return NextResponse.json(
            { error: 'Nao foi possivel salvar dados profissionais. Nenhuma alteracao foi aplicada por completo.' },
            { status: 500 },
          )
        }
      }
    }

    if (payload.data.section === 'public_profile') {
      const { error: professionalError } = await db
        .from('professionals')
        .update({
          bio: payload.data.bio,
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

    if (payload.data.section === 'service') {
      const { data: inserted, error } = await db
        .from('professional_services')
        .insert({
          professional_id: professionalId,
          name: payload.data.name,
          service_type: 'one_off',
          description: payload.data.description,
          duration_minutes: payload.data.durationMinutes,
          price_brl: payload.data.priceBrl,
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

      await recomputeProfessionalVisibility(db, professionalId)
      const onboardingState = await loadProfessionalOnboardingState(db, professionalId)
      if (!onboardingState) {
        return NextResponse.json({ error: 'Servico salvo, mas o tracker nao pode ser atualizado.' }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        service: inserted,
        evaluation: onboardingState.evaluation,
      })
    }

    if (payload.data.section === 'availability') {
      const invalidRange = Object.values(payload.data.availabilityMap).some(
        day => day.is_available && day.start_time >= day.end_time,
      )
      if (invalidRange) {
        return NextResponse.json({ error: 'Horarios invalidos: inicio deve ser menor que fim.' }, { status: 400 })
      }

      const nowIso = new Date().toISOString()
      const normalizedTier = String(professional.tier || '').toLowerCase()
      const maxBufferForTier = normalizedTier === 'basic' ? 15 : 120
      const safeMinimumNoticeHours = Math.max(1, Math.min(168, Number(payload.data.minimumNoticeHours || 1)))
      const safeBufferMinutes = Math.min(maxBufferForTier, Math.max(0, payload.data.bufferMinutes))
      const safeConfirmationMode = normalizedTier === 'basic' ? 'manual' : payload.data.confirmationMode
      const safeBookingWindowDays = Math.max(1, Math.min(365, Number(payload.data.maxBookingWindowDays || 30)))
      const safeRows = Object.entries(payload.data.availabilityMap).map(([day, value]) => ({
        professional_id: professionalId,
        day_of_week: Number(day),
        start_time: `${value.start_time}:00`,
        end_time: `${value.end_time}:00`,
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

      const { data: previousSettingsRow, error: previousSettingsError } = await db
        .from('professional_settings')
        .select(
          'timezone,minimum_notice_hours,max_booking_window_days,buffer_minutes,buffer_time_minutes,confirmation_mode,enable_recurring,require_session_purpose',
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

      const { error: deleteError } = await db.from('availability').delete().eq('professional_id', professionalId)
      if (deleteError) {
        return NextResponse.json({ error: 'Nao foi possivel atualizar a disponibilidade.' }, { status: 500 })
      }

      const { error: insertError } = await db.from('availability').insert(safeRows)
      if (insertError) {
        return NextResponse.json({ error: 'Nao foi possivel salvar os horarios.' }, { status: 500 })
      }

      const { error: settingsError } = await upsertProfessionalSettingsWithFallback(db, {
        professional_id: professionalId,
        timezone: payload.data.profileTimezone,
        minimum_notice_hours: safeMinimumNoticeHours,
        max_booking_window_days: safeBookingWindowDays,
        buffer_minutes: safeBufferMinutes,
        buffer_time_minutes: safeBufferMinutes,
        confirmation_mode: safeConfirmationMode,
        enable_recurring: payload.data.enableRecurring,
        allow_multi_session: payload.data.allowMultiSession,
        require_session_purpose: payload.data.requireSessionPurpose,
        updated_at: nowIso,
      })

      if (settingsError) {
        // Best-effort rollback for availability rows when settings save fails.
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
            allow_multi_session: payload.data.allowMultiSession,
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

    await recomputeProfessionalVisibility(db, professionalId)
    const onboardingState = await loadProfessionalOnboardingState(db, professionalId)
    if (!onboardingState) {
      return NextResponse.json({ error: 'Alteracoes salvas, mas o tracker nao pode ser atualizado.' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      evaluation: onboardingState.evaluation,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao salvar esta etapa.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

