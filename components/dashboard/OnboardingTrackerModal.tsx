'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Camera, CheckCircle2, Circle, Loader2, Upload, XCircle } from 'lucide-react'
import { getTierLimits } from '@/lib/tier-config'
import { ProfessionalAvailabilityCalendar } from '@/components/calendar/ProfessionalAvailabilityCalendar'
import { getDefaultExchangeRates, type ExchangeRateMap } from '@/lib/exchange-rates'

type Blocker = {
  code: string
  title: string
  description: string
  actionHref?: string
}

type Stage = {
  id: string
  title: string
  complete: boolean
  blockers: Blocker[]
}

type OnboardingEvaluation = {
  stages: Stage[]
}

type QualificationStructured = {
  name: string
  requires_registration: boolean
  course_name: string
  registration_number: string
  issuer: string
  country: string
}

type AvailabilityDayState = {
  is_available: boolean
  start_time: string
  end_time: string
}

type OnboardingTrackerModalProps = {
  professionalId: string
  tier: string
  onboardingEvaluation: OnboardingEvaluation
  initialBio: string
  initialCoverPhotoUrl: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const WEEK_DAYS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 23; h += 1) {
  for (const m of [0, 30]) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

const BUSINESS_STAGE_ORDER = [
  'c1_create_account',
  'c2_professional_identity',
  'c3_public_profile',
  'c4_services',
  'c5_availability_calendar',
  'c6_plan_billing_setup_post',
  'c7_payout_receipt',
  'c8_submit_review',
  'c9_go_live',
] as const

const BUSINESS_STAGE_LABELS: Record<string, string> = {
  c1_create_account: '1. Criacao da conta',
  c2_professional_identity: '2. Identidade profissional',
  c3_public_profile: '3. Perfil publico',
  c4_services: '4. Servicos',
  c5_availability_calendar: '5. Disponibilidade e calendario',
  c6_plan_billing_setup_post: '6. Plano, termos e cobranca',
  c7_payout_receipt: '7. Payout e recebimentos',
  c8_submit_review: '8. Envio para analise',
  c9_go_live: '9. Go-live',
}

function normalizeStageIdForLookup(id: string) {
  if (id === 'c6_plan_billing_setup_pre' || id === 'c6_plan_billing_setup_post') {
    return 'c6_plan_billing_setup'
  }
  return id
}

function isValidCoverPhotoUrl(value: string) {
  if (!value) return true
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

const LANGUAGE_OPTIONS = [
  'Portugues',
  'Ingles',
  'Espanhol',
  'Frances',
  'Italiano',
  'Alemao',
  'Holandes',
  'Arabe',
  'Mandarim',
  'Japones',
  'Coreano',
  'Hindi',
  'Russo',
  'Ucraniano',
  'Hebraico',
]

const PROFESSIONAL_TITLES = ['Sr.', 'Sra.', 'Srta.', 'Dr.', 'Dra.', 'Prof.', 'Profa.', 'Prefiro nao informar']
const TARGET_AUDIENCE_OPTIONS = ['Adultos', 'Criancas', 'Casais', 'Empresas', 'Estudantes', 'Imigrantes']

function toKeywords(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function buildDefaultAvailabilityMap() {
  return WEEK_DAYS.reduce<Record<number, AvailabilityDayState>>((acc, day) => {
    acc[day.value] = { is_available: false, start_time: '09:00', end_time: '18:00' }
    return acc
  }, {})
}

export function OnboardingTrackerModal({
  professionalId,
  tier,
  onboardingEvaluation,
  initialBio,
  initialCoverPhotoUrl,
}: OnboardingTrackerModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [activeStageId, setActiveStageId] = useState<string>('c1_create_account')
  const [bio, setBio] = useState(initialBio || '')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initialCoverPhotoUrl || '')
  const [photoUploadState, setPhotoUploadState] = useState<SaveState>('idle')
  const [photoUploadError, setPhotoUploadError] = useState('')
  const [bioSaveState, setBioSaveState] = useState<SaveState>('idle')
  const [bioError, setBioError] = useState('')
  const [identityTitle, setIdentityTitle] = useState('')
  const [identityDisplayName, setIdentityDisplayName] = useState('')
  const [identityYearsExperience, setIdentityYearsExperience] = useState('0')
  const [identityPrimaryLanguage, setIdentityPrimaryLanguage] = useState('Portugues')
  const [identitySecondaryLanguages, setIdentitySecondaryLanguages] = useState<string[]>([])
  const [identityTargetAudiences, setIdentityTargetAudiences] = useState<string[]>([])
  const [identityQualifications, setIdentityQualifications] = useState<QualificationStructured[]>([])
  const [identityQualificationInput, setIdentityQualificationInput] = useState('')
  const [identitySaveState, setIdentitySaveState] = useState<SaveState>('idle')
  const [identityError, setIdentityError] = useState('')
  const [professionalUserId, setProfessionalUserId] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceDuration, setServiceDuration] = useState('60')
  const [services, setServices] = useState<
    Array<{ id: string; name: string; description: string | null; price_brl: number; duration_minutes: number }>
  >([])
  const [serviceSaveState, setServiceSaveState] = useState<SaveState>('idle')
  const [serviceError, setServiceError] = useState('')
  const [serviceCurrency, setServiceCurrency] = useState('BRL')
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateMap>(getDefaultExchangeRates())
  const [planPricing, setPlanPricing] = useState<{
    currency: string
    monthlyAmount: number
    annualAmount: number
    provider: string
  } | null>(null)
  const [pricingError, setPricingError] = useState('')
  const [loadingContext, setLoadingContext] = useState(false)
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, AvailabilityDayState>>(
    buildDefaultAvailabilityMap(),
  )
  const [availabilitySaveState, setAvailabilitySaveState] = useState<SaveState>('idle')
  const [availabilityError, setAvailabilityError] = useState('')
  const [calendarTimezone, setCalendarTimezone] = useState('America/Sao_Paulo')
  const [minimumNoticeHours, setMinimumNoticeHours] = useState(24)
  const [maxBookingWindowDays, setMaxBookingWindowDays] = useState(30)
  const [bufferMinutes, setBufferMinutes] = useState(15)
  const [confirmationMode, setConfirmationMode] = useState<'auto_accept' | 'manual'>('auto_accept')
  const [enableRecurring, setEnableRecurring] = useState(false)
  const [allowMultiSession, setAllowMultiSession] = useState(false)
  const [requireSessionPurpose, setRequireSessionPurpose] = useState(false)
  const [calendarSyncProvider, setCalendarSyncProvider] = useState<'google' | 'outlook' | 'apple'>('google')
  const [calendarBookings, setCalendarBookings] = useState<
    Array<{ id: string; start_utc: string; end_utc: string; status: string }>
  >([])

  const stagesById = useMemo(() => {
    const map = new Map<string, Stage>()
    onboardingEvaluation.stages.forEach(stage => map.set(stage.id, stage))
    return map
  }, [onboardingEvaluation.stages])

  const firstPendingStageId = useMemo(() => {
    const firstPending = BUSINESS_STAGE_ORDER.find(id => {
      const stage = stagesById.get(normalizeStageIdForLookup(id))
      return stage ? !stage.complete : false
    })
    return firstPending || 'c1_create_account'
  }, [stagesById])

  const tierLimits = useMemo(() => getTierLimits(String(tier || 'basic').toLowerCase()), [tier])

  useEffect(() => {
    if (!open) return
    setActiveStageId(firstPendingStageId)
  }, [open, firstPendingStageId])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    let mounted = true
    async function loadModalContext() {
      setLoadingContext(true)

      const [{ data: professional }, { data: existingServices }, { data: settingsRow }, { data: availabilityRows }, { data: bookingRows }, { data: appRow }, { data: ratesRows }] = await Promise.all([
        supabase
          .from('professionals')
          .select('user_id,subcategories,years_experience')
          .eq('id', professionalId)
          .maybeSingle(),
        supabase
          .from('professional_services')
          .select('id,name,description,price_brl,duration_minutes')
          .eq('professional_id', professionalId)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('professional_settings')
          .select('timezone,minimum_notice_hours,max_booking_window_days,buffer_minutes,buffer_time_minutes,confirmation_mode,enable_recurring,allow_multi_session,require_session_purpose,calendar_sync_provider')
          .eq('professional_id', professionalId)
          .maybeSingle(),
        supabase
          .from('availability')
          .select('day_of_week,start_time,end_time,is_active')
          .eq('professional_id', professionalId),
        supabase
          .from('bookings')
          .select('id,start_time_utc,end_time_utc,scheduled_at,duration_minutes,status')
          .eq('professional_id', professionalId)
          .in('status', ['pending', 'pending_confirmation', 'confirmed'])
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(200),
        supabase
          .from('professional_applications')
          .select('title,display_name,primary_language,secondary_languages,target_audiences,qualifications_structured')
          .eq('professional_id', professionalId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('exchange_rates')
          .select('code,rate_to_brl')
          .eq('is_active', true),
      ])

      if (mounted) {
        setProfessionalUserId(String(professional?.user_id || ''))
        setServices((existingServices || []) as Array<{ id: string; name: string; description: string | null; price_brl: number; duration_minutes: number }>)

        const defaults = buildDefaultAvailabilityMap()
        for (const row of (availabilityRows || []) as Array<Record<string, unknown>>) {
          const day = Number(row.day_of_week)
          if (!(day in defaults)) continue
          defaults[day] = {
            is_available: Boolean(row.is_active),
            start_time: String(row.start_time || '09:00').slice(0, 5),
            end_time: String(row.end_time || '18:00').slice(0, 5),
          }
        }
        setAvailabilityMap(defaults)
        setCalendarTimezone(String(settingsRow?.timezone || 'America/Sao_Paulo'))
        setMinimumNoticeHours(Number(settingsRow?.minimum_notice_hours || 24))
        setMaxBookingWindowDays(Number(settingsRow?.max_booking_window_days || 30))
        setBufferMinutes(Number(settingsRow?.buffer_time_minutes || settingsRow?.buffer_minutes || 15))
        setConfirmationMode(
          String(settingsRow?.confirmation_mode || 'auto_accept') === 'manual' ? 'manual' : 'auto_accept',
        )
        setEnableRecurring(Boolean(settingsRow?.enable_recurring))
        setAllowMultiSession(Boolean(settingsRow?.allow_multi_session))
        setRequireSessionPurpose(Boolean(settingsRow?.require_session_purpose))
        const provider = String(settingsRow?.calendar_sync_provider || 'google')
        setCalendarSyncProvider(provider === 'outlook' || provider === 'apple' ? provider : 'google')

        setCalendarBookings(
          ((bookingRows || []) as Array<Record<string, unknown>>).map(row => {
            const scheduledAt = new Date(String(row.scheduled_at || ''))
            const durationMinutes = Number(row.duration_minutes || 60)
            const startUtcIso = String(row.start_time_utc || row.scheduled_at || '')
            const endUtcIso =
              String(row.end_time_utc || '') ||
              (Number.isNaN(scheduledAt.getTime())
                ? ''
                : new Date(scheduledAt.getTime() + durationMinutes * 60000).toISOString())
            return {
              id: String(row.id || ''),
              start_utc: startUtcIso,
              end_utc: endUtcIso,
              status: String(row.status || 'pending'),
            }
          }),
        )

        const normalizedRates: ExchangeRateMap = { ...getDefaultExchangeRates() }
        for (const row of (ratesRows || []) as Array<Record<string, unknown>>) {
          const code = String(row.code || '').toUpperCase().trim()
          const rate = Number(row.rate_to_brl)
          if (!code || !Number.isFinite(rate) || rate <= 0) continue
          normalizedRates[code] = rate
        }
        setExchangeRates(normalizedRates)

        const profileCurrency = await supabase
          .from('profiles')
          .select('currency,full_name')
          .eq('id', String(professional?.user_id || ''))
          .maybeSingle()

        const resolvedCurrency = String(profileCurrency.data?.currency || 'BRL').toUpperCase()
        setServiceCurrency(resolvedCurrency)
        setIdentityDisplayName(String(appRow?.display_name || profileCurrency.data?.full_name || ''))
        setIdentityTitle(String(appRow?.title || ''))
        setIdentityYearsExperience(String(professional?.years_experience ?? 0))
        setIdentityPrimaryLanguage(String(appRow?.primary_language || 'Portugues'))
        setIdentitySecondaryLanguages(Array.isArray(appRow?.secondary_languages) ? appRow.secondary_languages.map(item => String(item)) : [])
        setIdentityTargetAudiences(Array.isArray(appRow?.target_audiences) ? appRow.target_audiences.map(item => String(item)) : [])
        const parsedQualifications = Array.isArray(appRow?.qualifications_structured)
          ? appRow.qualifications_structured.map((item: any) => ({
              name: String(item?.name || ''),
              requires_registration: Boolean(item?.requires_registration),
              course_name: String(item?.course_name || ''),
              registration_number: String(item?.registration_number || ''),
              issuer: String(item?.issuer || ''),
              country: String(item?.country || ''),
            }))
          : []
        setIdentityQualifications(parsedQualifications)
      }

      const pricingResponse = await fetch('/api/professional/plan-pricing', {
        method: 'GET',
        credentials: 'include',
      })
      if (mounted) {
        if (pricingResponse.ok) {
          const pricingJson = (await pricingResponse.json()) as {
            currency: string
            monthlyAmount: number
            annualAmount: number
            provider: string
          }
          setPlanPricing(pricingJson)
          setPricingError('')
        } else {
          const errorBody = await pricingResponse.json().catch(() => ({}))
          setPlanPricing(null)
          setPricingError(String(errorBody?.error || 'NÃ£o foi possÃ­vel carregar preÃ§os agora.'))
        }
      }

      if (mounted) {
        setLoadingContext(false)
      }
    }

    void loadModalContext()

    return () => {
      mounted = false
    }
  }, [open, professionalId, supabase])

  const stageItems = useMemo(() => {
    return BUSINESS_STAGE_ORDER.map(id => {
      const stage = stagesById.get(normalizeStageIdForLookup(id))
      return {
        id,
        label: BUSINESS_STAGE_LABELS[id],
        complete: Boolean(stage?.complete),
        blocker: stage?.blockers[0] || null,
      }
    })
  }, [stagesById])

  const activeStage = stagesById.get(normalizeStageIdForLookup(activeStageId))

  function toggleMultiValue(value: string, values: string[], setter: (next: string[]) => void) {
    if (values.includes(value)) {
      setter(values.filter(item => item !== value))
    } else {
      setter([...values, value])
    }
  }

  async function uploadProfessionalPhoto(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setPhotoUploadState('error')
      setPhotoUploadError('Formato invalido. Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoUploadState('error')
      setPhotoUploadError('Arquivo acima de 3MB. Reduza antes de enviar.')
      return
    }

    setPhotoUploadState('saving')
    setPhotoUploadError('')
    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const filePath = `${professionalId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('professional-profile-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      setPhotoUploadState('error')
      setPhotoUploadError('Falha no upload da foto. Tente novamente.')
      return
    }

    const { data } = supabase.storage.from('professional-profile-media').getPublicUrl(filePath)
    setCoverPhotoUrl(String(data.publicUrl || ''))
    setPhotoUploadState('saved')
    setTimeout(() => setPhotoUploadState('idle'), 2500)
  }

  function addIdentityQualification() {
    const name = identityQualificationInput.trim()
    if (!name) return
    setIdentityQualifications(prev => [
      ...prev,
      {
        name,
        requires_registration: false,
        course_name: '',
        registration_number: '',
        issuer: '',
        country: '',
      },
    ])
    setIdentityQualificationInput('')
  }

  async function saveIdentity() {
    setIdentitySaveState('saving')
    setIdentityError('')
    const years = Number(identityYearsExperience || 0)
    if (!Number.isFinite(years) || years < 0 || years > 60) {
      setIdentitySaveState('error')
      setIdentityError('Anos de experiencia deve estar entre 0 e 60.')
      return
    }

    const invalidQualification = identityQualifications.find(
      item =>
        !item.name.trim() ||
        (item.requires_registration &&
          (!item.registration_number.trim() || !item.issuer.trim() || !item.country.trim())) ||
        (!item.requires_registration && !item.course_name.trim()),
    )
    if (invalidQualification) {
      setIdentitySaveState('error')
      setIdentityError('Complete os campos obrigatorios das qualificacoes antes de salvar.')
      return
    }

    const { error: professionalError } = await supabase
      .from('professionals')
      .update({
        years_experience: years,
        languages: Array.from(new Set([identityPrimaryLanguage, ...identitySecondaryLanguages].filter(Boolean))),
        updated_at: new Date().toISOString(),
      })
      .eq('id', professionalId)

    if (professionalError) {
      setIdentitySaveState('error')
      setIdentityError('Nao foi possivel salvar dados profissionais.')
      return
    }

    const appPayload = {
      user_id: professionalUserId || null,
      professional_id: professionalId,
      title: identityTitle || null,
      display_name: identityDisplayName || null,
      primary_language: identityPrimaryLanguage || null,
      secondary_languages: identitySecondaryLanguages,
      target_audiences: identityTargetAudiences,
      qualifications_structured: identityQualifications,
      updated_at: new Date().toISOString(),
    }

    let appError: { message?: string } | null = null
    if (professionalUserId) {
      const upsertResult = await supabase
        .from('professional_applications')
        .upsert(appPayload, { onConflict: 'user_id' })
      appError = upsertResult.error
    } else {
      const updateResult = await supabase
        .from('professional_applications')
        .update(appPayload)
        .eq('professional_id', professionalId)
      appError = updateResult.error
    }

    if (appError) {
      setIdentitySaveState('error')
      setIdentityError('Nao foi possivel salvar identidade profissional.')
      return
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setIdentitySaveState('saved')
    setTimeout(() => setIdentitySaveState('idle'), 2000)
  }

  async function savePublicProfile() {
    if (bio.trim().length === 0) {
      setBioError('O campo "Sobre vocÃª" nÃ£o pode ficar vazio.')
      setBioSaveState('error')
      return
    }
    if (bio.length > 500) {
      setBioError('O campo "Sobre vocÃª" deve ter no mÃ¡ximo 500 caracteres.')
      setBioSaveState('error')
      return
    }
    if (!isValidCoverPhotoUrl(coverPhotoUrl.trim())) {
      setBioError('A URL da foto de capa Ã© invÃ¡lida.')
      setBioSaveState('error')
      return
    }

    setBioSaveState('saving')
    setBioError('')
    const { error } = await supabase
      .from('professionals')
      .update({
        bio: bio.trim(),
        cover_photo_url: coverPhotoUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', professionalId)

    if (error) {
      setBioSaveState('error')
      setBioError('NÃ£o foi possÃ­vel salvar o perfil pÃºblico.')
      return
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setBioSaveState('saved')
    setTimeout(() => setBioSaveState('idle'), 2000)
  }

  async function saveService() {
    const maxServices = tierLimits.services
    if (services.length >= maxServices) {
      setServiceSaveState('error')
      setServiceError(`Seu plano permite atÃ© ${maxServices} serviÃ§o(s) ativo(s).`)
      return
    }
    if (!serviceName.trim()) {
      setServiceSaveState('error')
      setServiceError('Informe um tÃ­tulo para o serviÃ§o.')
      return
    }
    if (serviceName.trim().length > 20) {
      setServiceSaveState('error')
      setServiceError('Titulo do servico deve ter no maximo 20 caracteres.')
      return
    }
    if (!serviceDescription.trim()) {
      setServiceSaveState('error')
      setServiceError('Informe uma descriÃ§Ã£o para o serviÃ§o.')
      return
    }
    const price = Number(servicePrice)
    const duration = Number(serviceDuration)
    if (!Number.isFinite(price) || price <= 0) {
      setServiceSaveState('error')
      setServiceError('Informe um preco valido.')
      return
    }
    if (!Number.isFinite(duration) || duration < 15 || duration > 240) {
      setServiceSaveState('error')
      setServiceError('DuraÃ§Ã£o invÃ¡lida. Use entre 15 e 240 minutos.')
      return
    }

    setServiceSaveState('saving')
    setServiceError('')

    const keywords = toKeywords(serviceDescription)
    const selectedCurrency = serviceCurrency || 'BRL'
    const selectedRate = exchangeRates[selectedCurrency] || 1
    const priceBrl = selectedCurrency === 'BRL' ? price : price / selectedRate

    const insertPayload = {
      professional_id: professionalId,
      name: serviceName.trim(),
      service_type: 'one_off',
      description: serviceDescription.trim(),
      duration_minutes: duration,
      price_brl: Number(priceBrl.toFixed(2)),
      enable_recurring: false,
      enable_monthly: false,
      is_active: true,
      is_draft: false,
      category: null,
      tags: keywords.slice(0, tierLimits.serviceOptionsPerService),
      updated_at: new Date().toISOString(),
    }

    const { data: inserted, error } = await supabase
      .from('professional_services')
      .insert(insertPayload)
      .select('id,name,description,price_brl,duration_minutes')
      .single()

    if (error) {
      setServiceSaveState('error')
      setServiceError('NÃ£o foi possÃ­vel criar o serviÃ§o.')
      return
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setServices(prev => [...prev, inserted as { id: string; name: string; description: string | null; price_brl: number; duration_minutes: number }])
    setServiceName('')
    setServiceDescription('')
    setServicePrice('')
    setServiceDuration('60')
    setServiceSaveState('saved')
    setTimeout(() => setServiceSaveState('idle'), 2000)
  }

  async function saveAvailabilityCalendar() {
    if (Object.values(availabilityMap).some(day => day.is_available && day.start_time >= day.end_time)) {
      setAvailabilitySaveState('error')
      setAvailabilityError('Horarios invalidos: inicio deve ser menor que fim.')
      return
    }

    setAvailabilitySaveState('saving')
    setAvailabilityError('')

    const nowIso = new Date().toISOString()
    const maxBufferForTier = String(tier || '').toLowerCase() === 'basic' ? 15 : 180
    const safeBufferMinutes = Math.min(maxBufferForTier, Math.max(0, bufferMinutes))
    const rows = WEEK_DAYS.map(day => ({
      professional_id: professionalId,
      day_of_week: day.value,
      start_time: `${availabilityMap[day.value].start_time}:00`,
      end_time: `${availabilityMap[day.value].end_time}:00`,
      is_active: availabilityMap[day.value].is_available,
    }))

    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('professional_id', professionalId)

    if (deleteError) {
      setAvailabilitySaveState('error')
      setAvailabilityError('Nao foi possivel atualizar disponibilidade.')
      return
    }

    const { error: insertError } = await supabase.from('availability').insert(rows)
    if (insertError) {
      setAvailabilitySaveState('error')
      setAvailabilityError('Nao foi possivel salvar horarios.')
      return
    }

    const { error: settingsError } = await supabase
      .from('professional_settings')
      .upsert(
        {
          professional_id: professionalId,
          timezone: calendarTimezone,
          minimum_notice_hours: minimumNoticeHours,
          max_booking_window_days: maxBookingWindowDays,
          buffer_minutes: safeBufferMinutes,
          buffer_time_minutes: safeBufferMinutes,
          confirmation_mode: String(tier || '').toLowerCase() === 'basic' ? 'auto_accept' : confirmationMode,
          enable_recurring: enableRecurring,
          allow_multi_session: allowMultiSession,
          require_session_purpose: requireSessionPurpose,
          calendar_sync_provider: calendarSyncProvider,
          updated_at: nowIso,
        },
        { onConflict: 'professional_id' },
      )

    if (settingsError) {
      setAvailabilitySaveState('error')
      setAvailabilityError('Disponibilidade salva, mas falhou ao salvar regras.')
      return
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setAvailabilitySaveState('saved')
    setTimeout(() => setAvailabilitySaveState('idle'), 2000)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
      >
        Abrir tracker de onboarding
        <ArrowRight className="h-4 w-4" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-900/55 px-3 py-4"
          role="dialog"
          aria-modal="true"
          aria-label="Tracker de onboarding profissional"
        >
          <div className="grid h-[92vh] w-full max-w-7xl grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white md:grid-cols-[260px_1fr]">
            <aside className="border-b border-neutral-100 bg-neutral-50 p-3 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Tracker de onboarding</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
                >
                  Fechar
                </button>
              </div>
              <nav className="space-y-1">
                {stageItems.map(item => {
                  const isActive = item.id === activeStageId
                  const isLockedCompleted = item.complete && item.id === 'c1_create_account'
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveStageId(item.id)}
                      disabled={isLockedCompleted}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                        isActive
                          ? 'border-brand-300 bg-brand-50 text-brand-800'
                          : item.complete
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                      } ${isLockedCompleted ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {item.complete ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : item.blocker ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                        <span className="font-semibold">{item.label}</span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </aside>

            <section className="overflow-y-auto p-4 md:p-6">
              <div className="mb-4">
                <h2 className="font-display text-xl font-bold text-neutral-900">
                  {BUSINESS_STAGE_LABELS[activeStageId]}
                </h2>
                {activeStage?.complete ? (
                  <p className="mt-1 text-sm text-green-700">Etapa concluÃ­da.</p>
                ) : (
                  <p className="mt-1 text-sm text-amber-700">
                    {activeStage?.blockers[0]?.description || 'Existem pendÃªncias nesta etapa.'}
                  </p>
                )}
              </div>

              {loadingContext ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando dados do tracker...
                  </span>
                </div>
              ) : null}

              {(activeStageId === 'c2_professional_identity') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Titulo</label>
                      <select
                        value={identityTitle}
                        onChange={event => setIdentityTitle(event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      >
                        <option value="">Selecione...</option>
                        {PROFESSIONAL_TITLES.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Nome publico profissional</label>
                      <input
                        type="text"
                        value={identityDisplayName}
                        onChange={event => setIdentityDisplayName(event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Anos de experiencia</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={identityYearsExperience}
                        onChange={event => setIdentityYearsExperience(event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Idioma principal</label>
                      <select
                        value={identityPrimaryLanguage}
                        onChange={event => setIdentityPrimaryLanguage(event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      >
                        {LANGUAGE_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <p className="mb-2 text-xs font-semibold text-neutral-700">Idiomas secundarios (clique para selecionar)</p>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGE_OPTIONS.filter(item => item !== identityPrimaryLanguage).map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleMultiValue(option, identitySecondaryLanguages, setIdentitySecondaryLanguages)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            identitySecondaryLanguages.includes(option)
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-neutral-300 bg-white text-neutral-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <p className="mb-2 text-xs font-semibold text-neutral-700">Publico atendido</p>
                    <div className="flex flex-wrap gap-2">
                      {TARGET_AUDIENCE_OPTIONS.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleMultiValue(option, identityTargetAudiences, setIdentityTargetAudiences)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            identityTargetAudiences.includes(option)
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-neutral-300 bg-white text-neutral-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-neutral-900">Cursos e credenciamentos</h3>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        value={identityQualificationInput}
                        onChange={event => setIdentityQualificationInput(event.target.value)}
                        className="min-w-[240px] flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                        placeholder="Adicionar curso, certificado ou registro"
                      />
                      <button
                        type="button"
                        onClick={addIdentityQualification}
                        className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {identityQualifications.map((item, index) => (
                        <div key={`${item.name}-${index}`} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                            <button
                              type="button"
                              onClick={() => setIdentityQualifications(prev => prev.filter((_, i) => i !== index))}
                              className="text-xs font-semibold text-red-600"
                            >
                              Remover
                            </button>
                          </div>
                          <label className="mb-2 inline-flex items-center gap-2 text-xs text-neutral-700">
                            <input
                              type="checkbox"
                              checked={item.requires_registration}
                              onChange={event =>
                                setIdentityQualifications(prev =>
                                  prev.map((current, i) =>
                                    i === index
                                      ? { ...current, requires_registration: event.target.checked }
                                      : current,
                                  ),
                                )
                              }
                              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                            />
                            Exige numero de registro profissional
                          </label>
                          {item.requires_registration ? (
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              <input
                                type="text"
                                value={item.registration_number}
                                onChange={event =>
                                  setIdentityQualifications(prev =>
                                    prev.map((current, i) =>
                                      i === index ? { ...current, registration_number: event.target.value } : current,
                                    ),
                                  )
                                }
                                className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                                placeholder="Numero registro"
                              />
                              <input
                                type="text"
                                value={item.issuer}
                                onChange={event =>
                                  setIdentityQualifications(prev =>
                                    prev.map((current, i) =>
                                      i === index ? { ...current, issuer: event.target.value } : current,
                                    ),
                                  )
                                }
                                className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                                placeholder="Orgao emissor"
                              />
                              <input
                                type="text"
                                value={item.country}
                                onChange={event =>
                                  setIdentityQualifications(prev =>
                                    prev.map((current, i) =>
                                      i === index ? { ...current, country: event.target.value } : current,
                                    ),
                                  )
                                }
                                className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                                placeholder="Pais do registro"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={item.course_name}
                              onChange={event =>
                                setIdentityQualifications(prev =>
                                  prev.map((current, i) =>
                                    i === index ? { ...current, course_name: event.target.value } : current,
                                  ),
                                )
                              }
                              className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                              placeholder="Nome do curso/formacao"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {identityError ? <p className="text-sm font-medium text-red-700">{identityError}</p> : null}
                  <button
                    type="button"
                    onClick={() => void saveIdentity()}
                    disabled={identitySaveState === 'saving'}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {identitySaveState === 'saving'
                      ? 'Salvando...'
                      : identitySaveState === 'saved'
                        ? 'Salvo'
                        : 'Salvar identidade profissional'}
                  </button>
                </div>
              )}

              {(activeStageId === 'c3_public_profile') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-neutral-900">Sobre vocÃª</label>
                      <span className="text-xs text-neutral-500">{bio.length}/500</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={event => setBio(event.target.value.slice(0, 500))}
                      rows={6}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      placeholder="Descreva sua atuaÃ§Ã£o profissional em linguagem clara e objetiva."
                    />
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <label className="mb-2 block text-sm font-semibold text-neutral-900">Foto de perfil/capa</label>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700">
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={event => {
                            const file = event.target.files?.[0]
                            if (file) void uploadProfessionalPhoto(file)
                          }}
                        />
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700">
                        <Camera className="h-3.5 w-3.5" />
                        Tirar foto
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="user"
                          className="hidden"
                          onChange={event => {
                            const file = event.target.files?.[0]
                            if (file) void uploadProfessionalPhoto(file)
                          }}
                        />
                      </label>
                    </div>
                    {coverPhotoUrl ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverPhotoUrl} alt="Foto do perfil" className="h-44 w-full object-cover" />
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-neutral-500">
                      Regras: JPG/PNG/WEBP, maximo de 3MB, enquadramento retangular limpo.
                    </p>
                    {photoUploadError ? <p className="mt-2 text-xs font-medium text-red-600">{photoUploadError}</p> : null}
                  </div>

                  {bioError ? (
                    <p className="text-sm font-medium text-red-700">{bioError}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void savePublicProfile()}
                    disabled={bioSaveState === 'saving'}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {bioSaveState === 'saving' ? 'Salvando...' : bioSaveState === 'saved' ? 'Salvo' : 'Salvar perfil pÃºblico'}
                  </button>
                </div>
              )}

              {(activeStageId === 'c4_services') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-700">
                      Limite do plano atual: <strong>{tierLimits.services} serviÃ§o(s)</strong> ativo(s).
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      ServiÃ§os cadastrados: {services.length}/{tierLimits.services}
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-neutral-900">Adicionar serviÃ§o</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">TÃ­tulo</label>
                        <input
                          type="text"
                          value={serviceName}
                          onChange={event => setServiceName(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                          maxLength={20}
                          placeholder="Ex.: Consultoria fiscal"
                        />
                        <p className="mt-1 text-[11px] text-neutral-500">{serviceName.length}/20</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">DescriÃ§Ã£o</label>
                        <textarea
                          rows={4}
                          value={serviceDescription}
                          onChange={event => setServiceDescription(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                          placeholder="Explique o objetivo, formato e resultado esperado do serviÃ§o."
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Preco por sessao ({serviceCurrency})</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={servicePrice}
                          onChange={event => setServicePrice(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">DuraÃ§Ã£o (minutos)</label>
                        <select
                          value={serviceDuration}
                          onChange={event => setServiceDuration(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        >
                          {[30, 45, 50, 60, 75, 90, 120].map(option => (
                            <option key={option} value={option}>
                              {option} min
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {serviceError ? <p className="mt-3 text-sm font-medium text-red-700">{serviceError}</p> : null}

                    <button
                      type="button"
                      onClick={() => void saveService()}
                      disabled={serviceSaveState === 'saving'}
                      className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      {serviceSaveState === 'saving' ? 'Salvando...' : serviceSaveState === 'saved' ? 'Salvo' : 'Adicionar serviÃ§o'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-neutral-900">ServiÃ§os ativos</h3>
                    {services.length === 0 ? (
                      <p className="text-sm text-neutral-500">Nenhum serviÃ§o ativo ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {services.map(service => (
                          <div key={service.id} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                            <p className="text-sm font-semibold text-neutral-900">{service.name}</p>
                            <p className="text-xs text-neutral-600">{service.description || 'Sem descriÃ§Ã£o'}</p>
                            <p className="mt-1 text-xs text-neutral-700">
                              R$ {Number(service.price_brl || 0).toFixed(2)} Â· {service.duration_minutes} min
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

                            
              {(activeStageId === 'c5_availability_calendar') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-neutral-900">Agenda semanal</h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      Ative os dias e ajuste os horarios base. Os blocos ocupados aparecem no calendario abaixo.
                    </p>
                    <div className="mt-4 space-y-3">
                      {WEEK_DAYS.map(day => {
                        const dayState = availabilityMap[day.value]
                        const isActive = dayState?.is_available
                        return (
                          <div
                            key={day.value}
                            className={`rounded-xl border px-3 py-2 ${
                              isActive ? 'border-brand-200 bg-brand-50/30' : 'border-neutral-200 bg-neutral-50'
                            }`}
                          >
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[120px_1fr_1fr_1fr] sm:items-center">
                              <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-800">
                                <input
                                  type="checkbox"
                                  checked={Boolean(isActive)}
                                  onChange={event =>
                                    setAvailabilityMap(prev => ({
                                      ...prev,
                                      [day.value]: {
                                        ...prev[day.value],
                                        is_available: event.target.checked,
                                      },
                                    }))
                                  }
                                  className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                                />
                                {day.label}
                              </label>
                              <select
                                value={dayState?.start_time || '09:00'}
                                disabled={!isActive}
                                onChange={event =>
                                  setAvailabilityMap(prev => ({
                                    ...prev,
                                    [day.value]: {
                                      ...prev[day.value],
                                      start_time: event.target.value,
                                    },
                                  }))
                                }
                                className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {TIME_OPTIONS.map(option => (
                                  <option key={`start-${day.value}-${option}`} value={option}>
                                    Inicio {option}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={dayState?.end_time || '18:00'}
                                disabled={!isActive}
                                onChange={event =>
                                  setAvailabilityMap(prev => ({
                                    ...prev,
                                    [day.value]: {
                                      ...prev[day.value],
                                      end_time: event.target.value,
                                    },
                                  }))
                                }
                                className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {TIME_OPTIONS.map(option => (
                                  <option key={`end-${day.value}-${option}`} value={option}>
                                    Fim {option}
                                  </option>
                                ))}
                              </select>
                              <p className="text-xs text-neutral-500">
                                {isActive ? 'Dia ativo' : 'Indisponivel'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Fuso horario</label>
                      <input
                        type="text"
                        value={calendarTimezone}
                        onChange={event => setCalendarTimezone(event.target.value)}
                        placeholder="Ex.: America/Sao_Paulo"
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Sync de calendario</label>
                      <select
                        value={calendarSyncProvider}
                        onChange={event =>
                          setCalendarSyncProvider(
                            event.target.value === 'outlook' || event.target.value === 'apple' ? event.target.value : 'google',
                          )
                        }
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      >
                        <option value="google">Google</option>
                        <option value="outlook">Outlook</option>
                        <option value="apple">Apple</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Antecedencia minima (horas)</label>
                      <input
                        type="number"
                        min={1}
                        max={720}
                        value={minimumNoticeHours}
                        onChange={event => setMinimumNoticeHours(Math.max(1, Number(event.target.value || 1)))}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Janela maxima (dias)</label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={maxBookingWindowDays}
                        onChange={event => setMaxBookingWindowDays(Math.max(1, Number(event.target.value || 1)))}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Buffer entre sessoes (min)</label>
                      <input
                        type="number"
                        min={0}
                        max={String(tier || '').toLowerCase() === 'basic' ? 15 : 180}
                        value={bufferMinutes}
                        onChange={event => {
                          const next = Math.max(0, Number(event.target.value || 0))
                          const maxBuffer = String(tier || '').toLowerCase() === 'basic' ? 15 : 180
                          setBufferMinutes(Math.min(maxBuffer, next))
                        }}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Modo de confirmacao</label>
                      <select
                        value={String(tier || '').toLowerCase() === 'basic' ? 'auto_accept' : confirmationMode}
                        disabled={String(tier || '').toLowerCase() === 'basic'}
                        onChange={event => setConfirmationMode(event.target.value === 'manual' ? 'manual' : 'auto_accept')}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="auto_accept">Auto-aceite</option>
                        <option value="manual">Confirmacao manual</option>
                      </select>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={enableRecurring}
                        onChange={event => setEnableRecurring(event.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                      />
                      Permitir recorrencia
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={allowMultiSession}
                        onChange={event => setAllowMultiSession(event.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                      />
                      Permitir multiplas sessoes
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-neutral-700 md:col-span-2">
                      <input
                        type="checkbox"
                        checked={requireSessionPurpose}
                        onChange={event => setRequireSessionPurpose(event.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                      />
                      Exigir objetivo da sessao no agendamento
                    </label>
                  </div>

                  <ProfessionalAvailabilityCalendar
                    timezone={calendarTimezone}
                    availabilityRules={WEEK_DAYS.map(day => ({
                      day_of_week: day.value,
                      start_time: `${availabilityMap[day.value].start_time}:00`,
                      end_time: `${availabilityMap[day.value].end_time}:00`,
                      is_active: availabilityMap[day.value].is_available,
                    }))}
                    bookings={calendarBookings}
                  />

                  {availabilityError ? <p className="text-sm font-medium text-red-700">{availabilityError}</p> : null}

                  <button
                    type="button"
                    onClick={() => void saveAvailabilityCalendar()}
                    disabled={availabilitySaveState === 'saving'}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {availabilitySaveState === 'saving'
                      ? 'Salvando...'
                      : availabilitySaveState === 'saved'
                        ? 'Salvo'
                        : 'Salvar disponibilidade e calendario'}
                  </button>
                </div>
              )}

              {(activeStageId === 'c6_plan_billing_setup_post') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-neutral-900">Plano e cobranÃ§a</h3>
                    {planPricing ? (
                      <div className="mt-2 space-y-1 text-sm text-neutral-700">
                        <p>
                          Mensal: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: planPricing.currency }).format(planPricing.monthlyAmount / 100)}</strong>
                        </p>
                        <p>
                          Anual (10x): <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: planPricing.currency }).format(planPricing.annualAmount / 100)}</strong>
                        </p>
                        <p className="text-xs text-neutral-500">Fonte de preÃ§o: {planPricing.provider}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-neutral-600">{pricingError || 'PreÃ§o nÃ£o disponÃ­vel no momento.'}</p>
                    )}
                    <p className="mt-2 text-xs text-neutral-500">
                      Profissional nÃ£o possui plano grÃ¡tis. O trial e a assinatura dependem de cartÃ£o vÃ¡lido.
                    </p>
                    <Link href="/planos" className="mt-3 inline-flex rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600">
                      Abrir planos e cobranÃ§a
                    </Link>
                  </div>
                </div>
              )}

              {!['c2_professional_identity', 'c3_public_profile', 'c4_services', 'c5_availability_calendar', 'c6_plan_billing_setup_post'].includes(activeStageId) ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm text-neutral-700">
                    Esta etapa usa os mesmos gates do backend. VocÃª pode corrigir pendÃªncias pelos links abaixo.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {(activeStage?.blockers || []).map(blocker => (
                      <li key={blocker.code} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                        <p className="font-semibold text-neutral-900">{blocker.title}</p>
                        <p className="mt-1">{blocker.description}</p>
                        {blocker.actionHref ? (
                          <Link href={blocker.actionHref} className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800">
                            Corrigir
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </>
  )
}

