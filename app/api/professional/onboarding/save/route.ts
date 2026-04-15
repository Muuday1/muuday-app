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
  displayName: z.string().trim().min(1).max(160),
  yearsExperience: z.number().int().min(0).max(60),
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
  priceBrl: z.number().positive().max(50000),
  durationMinutes: z.number().int().min(15).max(240),
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
  minimumNoticeHours: z.number().int().min(0).max(720),
  maxBookingWindowDays: z.number().int().min(1).max(365),
  bufferMinutes: z.number().int().min(0).max(180),
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

function getQualificationValidationMessage(item: z.infer<typeof qualificationSchema>) {
  const label = item.name.trim() || 'qualificaÃ§Ã£o'
  if (!item.name.trim()) return 'Informe o nome da qualificaÃ§Ã£o.'
  if (item.requires_registration) {
    if (!item.registration_number.trim()) return `Informe o nÃºmero de registro em "${label}".`
    if (!item.issuer.trim()) return `Informe o Ã³rgÃ£o emissor em "${label}".`
    if (!item.country.trim()) return `Informe o paÃ­s do registro em "${label}".`
  } else if (!item.course_name.trim()) {
    return `Informe o nome do curso ou formaÃ§Ã£o em "${label}".`
  }
  if (item.evidence_files.length === 0) return `Envie ao menos um comprovante para "${label}".`
  return ''
}

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.safeParse(await request.json().catch(() => null))
    if (!payload.success) {
      return NextResponse.json({ error: 'Dados invÃ¡lidos para salvar esta etapa.' }, { status: 400 })
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'SessÃ£o invÃ¡lida.' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (!profile || profile.role !== 'profissional') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id,user_id,tier')
    if (!professional?.id) {
      return NextResponse.json({ error: 'Perfil profissional nÃ£o encontrado.' }, { status: 404 })
    }

    const admin = createAdminClient()
    const db = admin ?? supabase
    const professionalId = String(professional.id)
    const userId = String(professional.user_id || user.id)

    if (payload.data.section === 'identity') {
      const invalidQualification = payload.data.qualifications.find(item => getQualificationValidationMessage(item))

      if (invalidQualification) {
        return NextResponse.json({ error: getQualificationValidationMessage(invalidQualification) }, { status: 400 })
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
        display_name: payload.data.displayName || null,
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
        return NextResponse.json({ error: 'NÃ£o foi possÃ­vel salvar identidade profissional.' }, { status: 500 })
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
        return NextResponse.json({ error: 'NÃ£o foi possÃ­vel salvar o perfil pÃºblico.' }, { status: 500 })
      }

      const { error: profileError } = await db
        .from('profiles')
        .update({
          avatar_url: payload.data.avatarUrl || null,
        })
        .eq('id', userId)

      if (profileError) {
        return NextResponse.json({ error: 'NÃ£o foi possÃ­vel salvar a foto do perfil.' }, { status: 500 })
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
        return NextResponse.json({ error: 'NÃ£o foi possÃ­vel criar o serviÃ§o.' }, { status: 500 })
      }

      await recomputeProfessionalVisibility(db, professionalId)
      const onboardingState = await loadProfessionalOnboardingState(db, professionalId)
      if (!onboardingState) {
        return NextResponse.json({ error: 'ServiÃ§o salvo, mas o tracker nÃ£o pÃ´de ser atualizado.' }, { status: 500 })
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
        return NextResponse.json({ error: 'HorÃ¡rios invÃ¡lidos: inÃ­cio deve ser menor que fim.' }, { status: 400 })
      }

      const nowIso = new Date().toISOString()
      const maxBufferForTier = String(professional.tier || '').toLowerCase() === 'basic' ? 15 : 180
      const safeBufferMinutes = Math.min(maxBufferForTier, Math.max(0, payload.data.bufferMinutes))
      const safeRows = Object.entries(payload.data.availabilityMap).map(([day, value]) => ({
        professional_id: professionalId,
        day_of_week: Number(day),
        start_time: `${value.start_time}:00`,
        end_time: `${value.end_time}:00`,
        is_active: value.is_available,
      }))

      const { error: deleteError } = await db.from('availability').delete().eq('professional_id', professionalId)
      if (deleteError) {
        return NextResponse.json({ error: 'NÃ£o foi possÃ­vel atualizar a disponibilidade.' }, { status: 500 })
      }

      const { error: insertError } = await db.from('availability').insert(safeRows)
      if (insertError) {
        return NextResponse.json({ error: 'NÃ£o foi possÃ­vel salvar os horÃ¡rios.' }, { status: 500 })
      }

      const { error: settingsError } = await db
        .from('professional_settings')
        .upsert(
          {
            professional_id: professionalId,
            timezone: payload.data.profileTimezone,
            minimum_notice_hours: payload.data.minimumNoticeHours,
            max_booking_window_days: payload.data.maxBookingWindowDays,
            buffer_minutes: safeBufferMinutes,
            buffer_time_minutes: safeBufferMinutes,
            confirmation_mode: payload.data.confirmationMode,
            enable_recurring: payload.data.enableRecurring,
            require_session_purpose: payload.data.requireSessionPurpose,
            updated_at: nowIso,
          },
          { onConflict: 'professional_id' },
        )

      if (settingsError) {
        return NextResponse.json({ error: 'Disponibilidade salva, mas falhou ao salvar regras.' }, { status: 500 })
      }
    }

    await recomputeProfessionalVisibility(db, professionalId)
    const onboardingState = await loadProfessionalOnboardingState(db, professionalId)
    if (!onboardingState) {
      return NextResponse.json({ error: 'AlteraÃ§Ãµes salvas, mas o tracker nÃ£o pÃ´de ser atualizado.' }, { status: 500 })
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

