'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, CheckCircle2, Circle, Loader2, Upload, XCircle } from 'lucide-react'
import { getBufferConfig, getMinNoticeRange, getTierLimits, isFeatureAvailable } from '@/lib/tier-config'
import { getDefaultExchangeRates, type ExchangeRateMap } from '@/lib/exchange-rates'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'

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

type QualificationStructured = {
  id: string
  name: string
  requires_registration: boolean
  course_name: string
  registration_number: string
  issuer: string
  country: string
  evidence_files: Array<{
    id: string
    file_name: string
    file_url: string
    scan_status: string
    verified: boolean
    credential_type: string | null
  }>
}

type AvailabilityDayState = {
  is_available: boolean
  start_time: string
  end_time: string
}

type OnboardingTrackerModalProps = {
  professionalId: string
  tier: string
  onboardingEvaluation: ProfessionalOnboardingEvaluation
  initialBio: string
  initialCoverPhotoUrl: string
  autoOpen?: boolean
  onEvaluationChange?: (evaluation: ProfessionalOnboardingEvaluation) => void
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

const NAVIGABLE_STAGE_ORDER = BUSINESS_STAGE_ORDER.filter(id => id !== 'c1_create_account')

const BUSINESS_STAGE_LABELS: Record<string, string> = {
  c1_create_account: '1. Criação da conta',
  c2_professional_identity: 'Identidade',
  c3_public_profile: 'Perfil público',
  c4_services: 'Serviços',
  c5_availability_calendar: 'Disponibilidade',
  c6_plan_billing_setup_post: 'Plano',
  c7_payout_receipt: 'Recebimentos',
  c8_submit_review: 'Enviar',
  c9_go_live: 'Publicação',
}

const STAGE_PROGRESS_LABELS: Record<string, string> = {
  c1_create_account: 'Conta criada',
  c2_professional_identity: 'Identidade profissional',
  c3_public_profile: 'Perfil público',
  c4_services: 'Configurar serviços',
  c5_availability_calendar: 'Disponibilidade e agenda',
  c6_plan_billing_setup_post: 'Plano e cobrança',
  c7_payout_receipt: 'Recebimentos',
  c8_submit_review: 'Enviar para análise',
  c9_go_live: 'Publicar perfil',
}

const PLAN_STAGE_GUIDANCE: Record<string, string[]> = {
  c1_create_account: ['Criação de conta', 'Acesso básico à plataforma'],
  c2_professional_identity: ['Qualificações', 'Idiomas e público atendido'],
  c3_public_profile: ['Perfil público', 'Foto de perfil e bio'],
  c4_services: ['Serviços ativos', 'Limites por plano'],
  c5_availability_calendar: ['Horas de trabalho', 'Regras básicas de agenda', 'Calendário completo fora do tracker'],
  c6_plan_billing_setup_post: ['Cobrança mensal ou anual', 'Upgrade imediato'],
  c7_payout_receipt: ['Recebimento', 'Conciliação financeira'],
  c8_submit_review: ['Revisão administrativa', 'Publicação'],
  c9_go_live: ['Perfil publicado', 'Aceite de novos agendamentos'],
}

const HIGHLIGHT_MILESTONES = new Set(['c2_professional_identity', 'c3_public_profile', 'c4_services', 'c5_availability_calendar'])

const EXECUTIVE_GATE_LABELS: Record<string, string> = {
  review_submission: 'Revisão',
  go_live: 'Perfil',
  first_booking_acceptance: 'Agenda',
  payout_receipt: 'Recebimentos',
}

function normalizeStageIdForLookup(id: string) {
  const normalized = String(id || '')
  if (normalized === 'c1_create_account' || normalized === 'c1_account_creation') return 'c1_account_creation'
  if (normalized === 'c2_professional_identity' || normalized === 'c2_basic_identity') return 'c2_basic_identity'
  if (normalized === 'c3_public_profile') return 'c3_public_profile'
  if (normalized === 'c4_services' || normalized === 'c4_service_setup') return 'c4_service_setup'
  if (normalized === 'c5_availability_calendar') return 'c5_availability_calendar'
  if (
    normalized === 'c6_plan_billing_setup_pre' ||
    normalized === 'c6_plan_billing_setup_post' ||
    normalized === 'c6_plan_billing_setup'
  ) {
    return 'c6_plan_billing_setup'
  }
  if (normalized === 'c7_payout_receipt' || normalized === 'c7_payout_payments') return 'c7_payout_payments'
  if (normalized === 'c8_submit_review') return 'c8_submit_review'
  if (normalized === 'c9_go_live') return 'c9_go_live'
  return normalized
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

function sanitizePricingErrorMessage(error: string) {
  if (!error) return 'Preco indisponivel no momento.'
  if (error.includes('STRIPE_') || error.includes('AIRWALLEX_') || error.includes('PRICE_')) {
    return 'Preco indisponivel no momento.'
  }
  return error
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
const QUALIFICATION_APPROVED_OPTIONS = [
  'Diploma de graduação',
  'Registro profissional',
  'Certificação técnica',
  'Especialização',
  'Mestrado',
  'Doutorado',
]
const QUALIFICATION_FILE_MAX_SIZE_BYTES = 2 * 1024 * 1024
const QUALIFICATION_ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

function normalizeOption(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function isRegistrationQualification(name: string) {
  return normalizeOption(name) === normalizeOption('Registro profissional')
}

function inferCredentialType(name: string): 'diploma' | 'license' | 'certification' | 'other' {
  const normalized = normalizeOption(name)
  if (normalized.includes('registro')) return 'license'
  if (normalized.includes('diploma')) return 'diploma'
  if (
    normalized.includes('certificacao') ||
    normalized.includes('especializacao') ||
    normalized.includes('mestrado') ||
    normalized.includes('doutorado')
  ) {
    return 'certification'
  }
  return 'other'
}

function toKeywords(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function formatCurrencyFromBrl(amountBrl: number, currency: string, rates: ExchangeRateMap) {
  const safeCurrency = String(currency || 'BRL').toUpperCase()
  const rate = rates[safeCurrency] || 1
  const converted = safeCurrency === 'BRL' ? amountBrl : amountBrl * rate
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted)
  } catch {
    return `${safeCurrency} ${converted.toFixed(2)}`
  }
}

function buildDefaultAvailabilityMap() {
  return WEEK_DAYS.reduce<Record<number, AvailabilityDayState>>((acc, day) => {
    acc[day.value] = { is_available: false, start_time: '09:00', end_time: '18:00' }
    return acc
  }, {})
}

type BlockerCta =
  | { kind: 'internal'; label: string; stageId: string }
  | { kind: 'external'; label: string; href: string }

function getBlockerCta(blocker: Blocker): BlockerCta | null {
  if (blocker.code === 'missing_review_requirements') {
    return { kind: 'internal', label: 'Revisar pendências do tracker', stageId: 'c8_submit_review' }
  }

  if (blocker.code === 'missing_credentials') {
    return { kind: 'internal', label: 'Abrir identidade profissional', stageId: 'c2_professional_identity' }
  }

  if (blocker.actionHref === '/disponibilidade') {
    return { kind: 'internal', label: 'Abrir disponibilidade', stageId: 'c5_availability_calendar' }
  }

  if (blocker.actionHref === '/configuracoes-agendamento') {
    return { kind: 'external', label: 'Abrir regras de agendamento', href: '/configuracoes-agendamento' }
  }

  if (blocker.actionHref === '/planos') {
    return { kind: 'external', label: 'Abrir planos', href: '/planos' }
  }

  if (blocker.actionHref === '/configuracoes') {
    return { kind: 'external', label: 'Abrir configurações da conta', href: '/configuracoes' }
  }

  if (blocker.actionHref === '/editar-perfil' || blocker.actionHref === '/editar-perfil-profissional') {
    return { kind: 'internal', label: 'Abrir identidade profissional', stageId: 'c2_professional_identity' }
  }

  if (blocker.actionHref === '/completar-perfil') {
    return { kind: 'internal', label: 'Abrir serviços', stageId: 'c4_services' }
  }

  if (blocker.actionHref === '/onboarding-profissional') {
    return { kind: 'internal', label: 'Voltar ao tracker', stageId: 'c8_submit_review' }
  }

  return blocker.actionHref ? { kind: 'external', label: 'Abrir etapa relacionada', href: blocker.actionHref } : null
}

export function OnboardingTrackerModal({
  professionalId,
  tier,
  onboardingEvaluation,
  initialBio,
  initialCoverPhotoUrl,
  autoOpen = false,
  onEvaluationChange,
}: OnboardingTrackerModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [activeStageId, setActiveStageId] = useState<string>('c1_create_account')
  const [isSidebarCompact, setIsSidebarCompact] = useState(true)
  const [bio, setBio] = useState(initialBio || '')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initialCoverPhotoUrl || '')
  const [photoUploadState, setPhotoUploadState] = useState<SaveState>('idle')
  const [photoUploadError, setPhotoUploadError] = useState('')
  const [photoFocusX, setPhotoFocusX] = useState(50)
  const [photoFocusY, setPhotoFocusY] = useState(50)
  const [bioSaveState, setBioSaveState] = useState<SaveState>('idle')
  const [bioError, setBioError] = useState('')
  const [identityTitle, setIdentityTitle] = useState('')
  const [identityDisplayName, setIdentityDisplayName] = useState('')
  const [identityYearsExperience, setIdentityYearsExperience] = useState('0')
  const [identityPrimaryLanguage, setIdentityPrimaryLanguage] = useState('Portugues')
  const [identitySecondaryLanguages, setIdentitySecondaryLanguages] = useState<string[]>([])
  const [identityTargetAudiences, setIdentityTargetAudiences] = useState<string[]>([])
  const [identityQualifications, setIdentityQualifications] = useState<QualificationStructured[]>([])
  const [identityQualificationSelection, setIdentityQualificationSelection] = useState(
    QUALIFICATION_APPROVED_OPTIONS[0],
  )
  const [identityQualificationCustomName, setIdentityQualificationCustomName] = useState('')
  const [identityQualificationCustomEnabled, setIdentityQualificationCustomEnabled] = useState(false)
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
  const [profileTimezone, setProfileTimezone] = useState('America/Sao_Paulo')
  const [minimumNoticeHours, setMinimumNoticeHours] = useState(24)
  const [maxBookingWindowDays, setMaxBookingWindowDays] = useState(30)
  const [bufferMinutes, setBufferMinutes] = useState(15)
  const [confirmationMode, setConfirmationMode] = useState<'auto_accept' | 'manual'>('auto_accept')
  const [enableRecurring, setEnableRecurring] = useState(false)
  const [allowMultiSession, setAllowMultiSession] = useState(false)
  const [requireSessionPurpose, setRequireSessionPurpose] = useState(false)
  const [currentEvaluation, setCurrentEvaluation] = useState(onboardingEvaluation)
  const [trackerRefreshState, setTrackerRefreshState] = useState<SaveState>('idle')
  const [submitReviewState, setSubmitReviewState] = useState<SaveState>('idle')
  const [submitReviewMessage, setSubmitReviewMessage] = useState('')

  const stagesById = useMemo(() => {
    const map = new Map<string, Stage>()
    currentEvaluation.stages.forEach(stage => map.set(stage.id, stage as Stage))
    return map
  }, [currentEvaluation.stages])

  const firstPendingStageId = useMemo(() => {
    const firstPending = NAVIGABLE_STAGE_ORDER.find(id => {
      const stage = stagesById.get(normalizeStageIdForLookup(id))
      return stage ? !stage.complete : false
    })
    return firstPending || 'c2_professional_identity'
  }, [stagesById])

  const tierLimits = useMemo(() => getTierLimits(String(tier || 'basic').toLowerCase()), [tier])
  const minNoticeRange = useMemo(() => getMinNoticeRange(String(tier || 'basic').toLowerCase()), [tier])
  const bufferConfig = useMemo(() => getBufferConfig(String(tier || 'basic').toLowerCase()), [tier])
  const canUseManualConfirmation = useMemo(
    () => isFeatureAvailable(String(tier || 'basic').toLowerCase(), 'manual_accept'),
    [tier],
  )

  useEffect(() => {
    if (!open) return
    setActiveStageId(firstPendingStageId)
  }, [open, firstPendingStageId])

  useEffect(() => {
    setCurrentEvaluation(onboardingEvaluation)
  }, [onboardingEvaluation])

  useEffect(() => {
    if (!autoOpen) return
    setOpen(true)
  }, [autoOpen])

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

      const [
        { data: professional },
        { data: existingServices },
        { data: settingsRow },
        { data: availabilityRows },
        { data: appRow },
        { data: ratesRows },
        { data: credentialRows },
      ] = await Promise.all([
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
          .select(
            'timezone,minimum_notice_hours,max_booking_window_days,buffer_minutes,buffer_time_minutes,confirmation_mode,enable_recurring,allow_multi_session,require_session_purpose,calendar_sync_provider',
          )
          .eq('professional_id', professionalId)
          .maybeSingle(),
        supabase
          .from('availability')
          .select('day_of_week,start_time,end_time,is_active')
          .eq('professional_id', professionalId),
        supabase
          .from('professional_applications')
          .select(
            'title,display_name,primary_language,secondary_languages,target_audiences,qualifications_structured',
          )
          .eq('professional_id', professionalId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('exchange_rates')
          .select('code,rate_to_brl')
          .eq('is_active', true),
        supabase
          .from('professional_credentials')
          .select('id,file_name,file_url,scan_status,verified,credential_type')
          .eq('professional_id', professionalId)
          .order('uploaded_at', { ascending: false }),
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
        setMinimumNoticeHours(Number(settingsRow?.minimum_notice_hours || 24))
        setMaxBookingWindowDays(Number(settingsRow?.max_booking_window_days || 30))
        setBufferMinutes(Number(settingsRow?.buffer_time_minutes || settingsRow?.buffer_minutes || 15))
        setConfirmationMode(
          String(settingsRow?.confirmation_mode || 'auto_accept') === 'manual' ? 'manual' : 'auto_accept',
        )
        setEnableRecurring(Boolean(settingsRow?.enable_recurring))
        setAllowMultiSession(Boolean(settingsRow?.allow_multi_session))
        setRequireSessionPurpose(Boolean(settingsRow?.require_session_purpose))

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
          .select('currency,full_name,timezone')
          .eq('id', String(professional?.user_id || ''))
          .maybeSingle()

        const resolvedCurrency = String(profileCurrency.data?.currency || 'BRL').toUpperCase()
        const resolvedTimezone = String(
          profileCurrency.data?.timezone || settingsRow?.timezone || 'America/Sao_Paulo',
        )
        setServiceCurrency(resolvedCurrency)
        setProfileTimezone(resolvedTimezone)
        setIdentityDisplayName(String(appRow?.display_name || profileCurrency.data?.full_name || ''))
        setIdentityTitle(String(appRow?.title || ''))
        setIdentityYearsExperience(String(professional?.years_experience ?? 0))
        setIdentityPrimaryLanguage(String(appRow?.primary_language || 'Portugues'))
        setIdentitySecondaryLanguages(Array.isArray(appRow?.secondary_languages) ? appRow.secondary_languages.map(item => String(item)) : [])
        setIdentityTargetAudiences(Array.isArray(appRow?.target_audiences) ? appRow.target_audiences.map(item => String(item)) : [])
        const parsedQualifications = Array.isArray(appRow?.qualifications_structured)
          ? appRow.qualifications_structured.map((item: any) => ({
              id: String(item?.id || crypto.randomUUID()),
              name: String(item?.name || ''),
              requires_registration: Boolean(item?.requires_registration),
              course_name: String(item?.course_name || ''),
              registration_number: String(item?.registration_number || ''),
              issuer: String(item?.issuer || ''),
              country: String(item?.country || ''),
              evidence_files: [],
            }))
          : []

        const qualificationMap = new Map<string, QualificationStructured>()
        for (const item of parsedQualifications) {
          qualificationMap.set(normalizeOption(item.name), item)
        }

        for (const row of (credentialRows || []) as Array<Record<string, unknown>>) {
          const rawFileName = String(row.file_name || '')
          const [label, fileName] = rawFileName.includes('::')
            ? rawFileName.split('::', 2)
            : ['Comprovante adicional', rawFileName]
          const normalizedLabel = normalizeOption(label)
          if (!qualificationMap.has(normalizedLabel)) {
            qualificationMap.set(normalizedLabel, {
              id: crypto.randomUUID(),
              name: label,
              requires_registration: isRegistrationQualification(label),
              course_name: '',
              registration_number: '',
              issuer: '',
              country: '',
              evidence_files: [],
            })
          }
          qualificationMap.get(normalizedLabel)?.evidence_files.push({
            id: String(row.id || ''),
            file_name: fileName || rawFileName,
            file_url: String(row.file_url || ''),
            scan_status: String(row.scan_status || 'pending_scan'),
            verified: Boolean(row.verified),
            credential_type: row.credential_type ? String(row.credential_type) : null,
          })
        }

        setIdentityQualifications(Array.from(qualificationMap.values()))
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
          setPricingError(sanitizePricingErrorMessage(String(errorBody?.error || 'Não foi possível carregar preços agora.')))
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
    return NAVIGABLE_STAGE_ORDER.map(id => {
      const stage = stagesById.get(normalizeStageIdForLookup(id))
      const forceComplete = false
      return {
        id,
        label: BUSINESS_STAGE_LABELS[id],
        complete: forceComplete ? true : Boolean(stage?.complete),
        blocker: stage?.blockers[0] || null,
      }
    })
  }, [stagesById])

  const stageCompletionSummary = useMemo(() => {
    const rows = NAVIGABLE_STAGE_ORDER.map(id => {
      const stage = stagesById.get(normalizeStageIdForLookup(id))
      return Boolean(stage?.complete)
    })
    const completed = rows.filter(Boolean).length
    return {
      total: rows.length,
      completed,
    }
  }, [stagesById])

  const hasUrgentBlockers = useMemo(
    () => stageItems.some(item => !item.complete && (item.blocker?.code?.includes('warning') || item.blocker)),
    [stageItems],
  )

  const activeStage = stagesById.get(normalizeStageIdForLookup(activeStageId))
  const executiveGateSummary = useMemo(
    () =>
      Object.entries(currentEvaluation.gates).map(([gateId, gate]) => ({
        id: gateId,
        label: EXECUTIVE_GATE_LABELS[gateId] || gate.title,
        passed: gate.passed,
        description: gate.passed ? 'Ok' : gate.blockers[0]?.title || 'Pendente',
      })),
    [currentEvaluation.gates],
  )

  function toggleMultiValue(value: string, values: string[], setter: (next: string[]) => void) {
    if (values.includes(value)) {
      setter(values.filter(item => item !== value))
    } else {
      setter([...values, value])
    }
  }

  async function refreshOnboardingEvaluation(options?: { advanceToNextPending?: boolean }) {
    setTrackerRefreshState('saving')
    const response = await fetch('/api/professional/onboarding/state', {
      method: 'GET',
      credentials: 'include',
    })
    const payload = (await response.json().catch(() => ({}))) as {
      evaluation?: ProfessionalOnboardingEvaluation
      error?: string
    }

    if (!response.ok || !payload.evaluation) {
      setTrackerRefreshState('error')
      return null
    }

    setCurrentEvaluation(payload.evaluation)
    onEvaluationChange?.(payload.evaluation)
    setTrackerRefreshState('saved')
    setTimeout(() => setTrackerRefreshState('idle'), 1200)

    if (options?.advanceToNextPending) {
      const nextPending = NAVIGABLE_STAGE_ORDER.find(id => {
        const stage = payload.evaluation?.stages.find(
          stageItem => normalizeStageIdForLookup(stageItem.id) === normalizeStageIdForLookup(id),
        )
        return stage ? !stage.complete : false
      })
      if (nextPending) {
        setActiveStageId(nextPending)
      }
    }

    return payload.evaluation
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

    const form = new FormData()
    form.append('file', file)
    const response = await fetch('/api/professional/profile-media/upload', {
      method: 'POST',
      body: form,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      setPhotoUploadState('error')
      setPhotoUploadError(String(errorBody?.error || 'Falha no upload da foto. Tente novamente.'))
      return
    }

    const payload = (await response.json()) as { publicUrl?: string }
    setCoverPhotoUrl(String(payload.publicUrl || ''))
    setPhotoFocusX(50)
    setPhotoFocusY(50)
    setPhotoUploadState('saved')
    setTimeout(() => setPhotoUploadState('idle'), 2500)
  }

  function addIdentityQualification() {
    const name = identityQualificationCustomEnabled
      ? identityQualificationCustomName.trim()
      : identityQualificationSelection.trim()
    if (!name) return

    if (identityQualifications.some(item => normalizeOption(item.name) === normalizeOption(name))) {
      setIdentityError('Esta qualificação já foi adicionada.')
      return
    }

    setIdentityQualifications(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        requires_registration: isRegistrationQualification(name),
        course_name: '',
        registration_number: '',
        issuer: '',
        country: '',
        evidence_files: [],
      },
    ])
    setIdentityQualificationCustomName('')
    setIdentityError('')
  }

  async function uploadQualificationDocument(qualificationId: string, file: File | null) {
    if (!file) return
    if (!QUALIFICATION_ALLOWED_TYPES.includes(file.type)) {
      setIdentityError('Arquivo inválido. Envie apenas PDF, JPG ou PNG.')
      return
    }
    if (file.size > QUALIFICATION_FILE_MAX_SIZE_BYTES) {
      setIdentityError('Arquivo excede 2MB. Reduza o tamanho antes de enviar.')
      return
    }

    const qualification = identityQualifications.find(item => item.id === qualificationId)
    if (!qualification) return

    const form = new FormData()
    form.append('file', file)
    form.append('qualificationName', qualification.name)
    form.append('credentialType', inferCredentialType(qualification.name))

    const response = await fetch('/api/professional/credentials/upload', {
      method: 'POST',
      body: form,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      setIdentityError(String(errorBody?.error || 'Falha ao enviar comprovante.'))
      return
    }

    const payload = (await response.json()) as {
      credential?: {
        id: string
        file_name: string
        file_url: string
        scan_status: string
        verified: boolean
        credential_type: string | null
      }
    }

    if (!payload.credential) return

    setIdentityQualifications(prev =>
      prev.map(item =>
        item.id === qualificationId
          ? {
              ...item,
              evidence_files: [...item.evidence_files, payload.credential!],
            }
          : item,
      ),
    )
    setIdentityError('')
  }

  async function removeQualificationDocument(qualificationId: string, documentId: string) {
    const response = await fetch('/api/professional/credentials/upload', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId: documentId }),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      setIdentityError(String(errorBody?.error || 'Falha ao remover comprovante.'))
      return
    }

    setIdentityQualifications(prev =>
      prev.map(item =>
        item.id === qualificationId
          ? {
              ...item,
              evidence_files: item.evidence_files.filter(file => file.id !== documentId),
            }
          : item,
      ),
    )
    setIdentityError('')
  }

  async function saveIdentity() {
    setIdentitySaveState('saving')
    setIdentityError('')
    const years = Number(identityYearsExperience || 0)
    if (!Number.isFinite(years) || years < 0 || years > 60) {
      setIdentitySaveState('error')
      setIdentityError('Anos de experiência devem estar entre 0 e 60.')
      return
    }

    const invalidQualification = identityQualifications.find(
      item =>
        !item.name.trim() ||
        (item.requires_registration &&
          (!item.registration_number.trim() || !item.issuer.trim() || !item.country.trim())) ||
        (!item.requires_registration && !item.course_name.trim()) ||
        item.evidence_files.length === 0,
    )
    if (invalidQualification) {
      setIdentitySaveState('error')
      setIdentityError('Complete os campos obrigatórios das qualificações antes de salvar.')
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
      setIdentityError('Não foi possível salvar dados profissionais.')
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
      qualifications_structured: identityQualifications.map(item => ({
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
      setIdentityError('Não foi possível salvar identidade profissional.')
      return
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setIdentitySaveState('saved')
    await refreshOnboardingEvaluation({ advanceToNextPending: true })
    setTimeout(() => setIdentitySaveState('idle'), 2000)
  }

  async function savePublicProfile() {
    if (bio.trim().length === 0) {
      setBioError('O campo "Sobre você" não pode ficar vazio.')
      setBioSaveState('error')
      return
    }
    if (bio.length > 500) {
      setBioError('O campo "Sobre você" deve ter no máximo 500 caracteres.')
      setBioSaveState('error')
      return
    }
    if (!isValidCoverPhotoUrl(coverPhotoUrl.trim())) {
      setBioError('A URL da foto de capa é inválida.')
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
      setBioError('Não foi possível salvar o perfil público.')
      return
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setBioSaveState('saved')
    await refreshOnboardingEvaluation({ advanceToNextPending: true })
    setTimeout(() => setBioSaveState('idle'), 2000)
  }

  async function saveService() {
    const maxServices = tierLimits.services
    if (services.length >= maxServices) {
      setServiceSaveState('error')
      setServiceError(`Seu plano permite até ${maxServices} serviço(s) ativo(s).`)
      return
    }
    if (!serviceName.trim()) {
      setServiceSaveState('error')
      setServiceError('Informe um título para o serviço.')
      return
    }
    if (serviceName.trim().length > 30) {
      setServiceSaveState('error')
      setServiceError('Título do serviço deve ter no máximo 30 caracteres.')
      return
    }
    if (!serviceDescription.trim()) {
      setServiceSaveState('error')
      setServiceError('Informe uma descrição para o serviço.')
      return
    }
    if (serviceDescription.trim().length > 120) {
      setServiceSaveState('error')
      setServiceError('Descrição deve ter no máximo 120 caracteres.')
      return
    }
    const price = Number(servicePrice)
    const duration = Number(serviceDuration)
    if (!Number.isFinite(price) || price <= 0) {
      setServiceSaveState('error')
      setServiceError('Informe um preço válido.')
      return
    }
    if (!Number.isFinite(duration) || duration < 15 || duration > 240) {
      setServiceSaveState('error')
      setServiceError('Duração inválida. Use entre 15 e 240 minutos.')
      return
    }

    setServiceSaveState('saving')
    setServiceError('')

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
      updated_at: new Date().toISOString(),
    }

    const { data: inserted, error } = await supabase
      .from('professional_services')
      .insert(insertPayload)
      .select('id,name,description,price_brl,duration_minutes')
      .single()

    if (error) {
      setServiceSaveState('error')
      setServiceError(`Não foi possível criar o serviço: ${error.message}`)
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
    await refreshOnboardingEvaluation({ advanceToNextPending: true })
    setTimeout(() => setServiceSaveState('idle'), 2000)
  }

  async function saveAvailabilityCalendar() {
    if (Object.values(availabilityMap).some(day => day.is_available && day.start_time >= day.end_time)) {
      setAvailabilitySaveState('error')
      setAvailabilityError('Horários inválidos: início deve ser menor que fim.')
      return
    }

    setAvailabilitySaveState('saving')
    setAvailabilityError('')

    const nowIso = new Date().toISOString()
    const maxBufferForTier = String(tier || '').toLowerCase() === 'basic' ? 15 : 180
    const safeBufferMinutes = Math.min(maxBufferForTier, Math.max(0, bufferMinutes))
    const safeNoticeHours = Math.min(
      Number(minNoticeRange.max),
      Math.max(Number(minNoticeRange.min), Number(minimumNoticeHours || minNoticeRange.min)),
    )
    const safeBookingWindow = Math.min(
      Number(tierLimits.bookingWindowDays),
      Math.max(1, Number(maxBookingWindowDays || 1)),
    )
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
      setAvailabilityError('Não foi possível atualizar disponibilidade.')
      return
    }

    const { error: insertError } = await supabase.from('availability').insert(rows)
    if (insertError) {
      setAvailabilitySaveState('error')
      setAvailabilityError('Não foi possível salvar horários.')
      return
    }

    const { error: settingsError } = await supabase
      .from('professional_settings')
      .upsert(
        {
          professional_id: professionalId,
          timezone: profileTimezone,
          minimum_notice_hours: safeNoticeHours,
          max_booking_window_days: safeBookingWindow,
          buffer_minutes: safeBufferMinutes,
          buffer_time_minutes: safeBufferMinutes,
          confirmation_mode: canUseManualConfirmation ? confirmationMode : 'auto_accept',
          enable_recurring: enableRecurring,
          allow_multi_session: allowMultiSession,
          require_session_purpose: requireSessionPurpose,
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
    await refreshOnboardingEvaluation({ advanceToNextPending: true })
    setTimeout(() => setAvailabilitySaveState('idle'), 2000)
  }

  async function submitForReview() {
    setSubmitReviewState('saving')
    setSubmitReviewMessage('')

    const response = await fetch('/api/professional/onboarding/submit-review', {
      method: 'POST',
      credentials: 'include',
    })
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean
      evaluation?: ProfessionalOnboardingEvaluation
      error?: string
    }

    if (!response.ok || !payload.ok || !payload.evaluation) {
      setSubmitReviewState('error')
      setSubmitReviewMessage(payload.error || 'Não foi possível enviar o perfil para análise.')
      return
    }

    setCurrentEvaluation(payload.evaluation)
    onEvaluationChange?.(payload.evaluation)
    setSubmitReviewState('saved')
    setSubmitReviewMessage('Perfil enviado para análise. Agora vamos acompanhar a publicação.')
    setActiveStageId('c9_go_live')
    setTimeout(() => setSubmitReviewState('idle'), 2200)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
      >
        Abrir tracker de onboarding
        <ArrowRight className="h-4 w-4" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end bg-neutral-900/45 sm:items-center sm:justify-center sm:px-4 sm:py-5"
          role="dialog"
          aria-modal="true"
          aria-label="Tracker de onboarding profissional"
        >
          <div className="grid h-[100dvh] w-full max-w-full grid-cols-1 overflow-hidden bg-white sm:h-[92vh] sm:max-h-[940px] sm:max-w-[1120px] sm:rounded-2xl sm:border sm:border-neutral-200 md:grid-cols-[250px_minmax(0,1fr)] lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="border-b border-neutral-100 bg-neutral-50 p-3.5 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold tracking-tight text-neutral-900">Tracker de onboarding</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
                >
                  Fechar
                </button>
              </div>

              <div className="mb-3 rounded-xl border border-neutral-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Progresso</p>
                    <p className="mt-1 text-lg font-semibold text-neutral-900">
                      {stageCompletionSummary.completed} de {stageCompletionSummary.total} etapas concluídas
                    </p>
                  </div>
                  {trackerRefreshState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin text-neutral-500" /> : null}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.round((stageCompletionSummary.completed / Math.max(1, stageCompletionSummary.total)) * 100)}%` }}
                  />
                </div>
              </div>

              <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden">
                {stageItems.map(item => {
                  const isActive = item.id === activeStageId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveStageId(item.id)}
                      className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? 'border-brand-300 bg-brand-50 text-brand-800'
                          : item.complete
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </nav>

              <nav className="hidden space-y-1.5 md:block">
                {stageItems.map(item => {
                  const isActive = item.id === activeStageId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveStageId(item.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        isActive
                          ? 'border-brand-300 bg-brand-50 text-brand-800 shadow-sm'
                          : item.complete
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            item.complete
                              ? 'border-green-400 bg-green-100 text-green-700'
                              : item.blocker
                                ? 'border-amber-300 bg-amber-100 text-amber-700'
                                : 'border-neutral-300 bg-white text-neutral-500'
                          }`}
                        >
                          {item.complete ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : item.blocker ? (
                            <XCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold leading-4">{item.label}</p>
                          <p className="mt-1 text-[11px] text-neutral-500">
                            {item.complete ? 'Concluida' : item.blocker?.title || 'Pendente'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </aside>

            <section className="overflow-y-auto p-4 md:p-5">
              <div className="mb-4 border-b border-neutral-100 pb-3">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                  {BUSINESS_STAGE_LABELS[activeStageId]}
                </h2>
                {activeStage?.complete ? (
                  <p className="mt-1 text-sm text-green-700">Etapa concluída.</p>
                ) : (
                  <p className="mt-1 text-sm text-amber-700">
                    {activeStage?.blockers[0]?.description || 'Existem pendências nesta etapa.'}
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

              <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Resumo executivo</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {executiveGateSummary.map(item => (
                        <span
                          key={item.id}
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            item.passed
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-amber-200 bg-amber-50 text-amber-800'
                          }`}
                        >
                          {item.label}: {item.description}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700">
                    {planPricing ? (
                      <p>
                        Plano atual:{' '}
                        <strong>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: planPricing.currency }).format(
                            planPricing.monthlyAmount / 100,
                          )}
                        </strong>
                        {' '}/ mes
                      </p>
                    ) : (
                      <p>{pricingError || 'Preco indisponivel no momento.'}</p>
                    )}
                  </div>
                </div>
              </div>

              {(activeStageId === 'c2_professional_identity') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Título</label>
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
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Nome público profissional</label>
                      <input
                        type="text"
                        value={identityDisplayName}
                        onChange={event => setIdentityDisplayName(event.target.value)}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Anos de experiência</label>
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

                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <p className="mb-2 text-xs font-semibold text-neutral-700">Idiomas secundários (clique para selecionar)</p>
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

                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <p className="mb-2 text-xs font-semibold text-neutral-700">Público atendido</p>
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

                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <h3 className="mb-3 text-sm font-semibold text-neutral-900">Cursos e credenciamentos</h3>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <select
                        value={identityQualificationSelection}
                        onChange={event => setIdentityQualificationSelection(event.target.value)}
                        className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                      >
                        {QUALIFICATION_APPROVED_OPTIONS.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <label className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700">
                        <input
                          type="checkbox"
                          checked={identityQualificationCustomEnabled}
                          onChange={event => setIdentityQualificationCustomEnabled(event.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                        />
                        Informar qualificação fora da lista
                      </label>
                      <button
                        type="button"
                        onClick={addIdentityQualification}
                        className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600"
                      >
                        Adicionar
                      </button>
                    </div>
                    {identityQualificationCustomEnabled ? (
                      <input
                        type="text"
                        value={identityQualificationCustomName}
                        onChange={event => setIdentityQualificationCustomName(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                        placeholder="Digite o nome da qualificação"
                      />
                    ) : null}
                    <div className="mt-3 space-y-3">
                      {identityQualifications.map((item, index) => (
                        <div key={item.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                            <button
                              type="button"
                              onClick={() => setIdentityQualifications(prev => prev.filter(current => current.id !== item.id))}
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
                            Exige número de registro profissional
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
                                placeholder="Número do registro"
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
                                placeholder="Órgão emissor"
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
                                placeholder="País do registro"
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
                              placeholder="Nome do curso/formação"
                            />
                          )}

                          <div className="mt-3 rounded-lg border border-dashed border-neutral-300 bg-white p-2.5">
                            <p className="text-[11px] text-neutral-600">
                              Envie comprovantes (PDF/JPG/PNG até 2MB por arquivo).
                            </p>
                            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700">
                              <Upload className="h-3.5 w-3.5" />
                              Upload comprovante
                              <input
                                type="file"
                                accept="application/pdf,image/jpeg,image/png"
                                className="hidden"
                                onChange={event => {
                                  const file = event.target.files?.[0] || null
                                  void uploadQualificationDocument(item.id, file)
                                  event.currentTarget.value = ''
                                }}
                              />
                            </label>

                            {item.evidence_files.length > 0 ? (
                              <div className="mt-2 space-y-1.5">
                                {item.evidence_files.map(document => (
                                  <div
                                    key={document.id}
                                    className="flex items-center justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5"
                                  >
                                    <a
                                      href={`/api/professional/credentials/download/${document.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="truncate text-xs font-medium text-brand-700 hover:text-brand-800"
                                    >
                                      {document.file_name}
                                    </a>
                                    <div className="flex items-center gap-2">
                                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                                        {document.scan_status === 'clean'
                                          ? 'limpo'
                                          : document.scan_status === 'rejected'
                                            ? 'rejeitado'
                                            : 'pendente'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => void removeQualificationDocument(item.id, document.id)}
                                        className="text-[11px] font-semibold text-red-600"
                                      >
                                        Remover
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-[11px] text-amber-700">
                                Envie ao menos um arquivo para esta qualificação.
                              </p>
                            )}
                          </div>
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
                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-neutral-900">Sobre você</label>
                      <span className="text-xs text-neutral-500">{bio.length}/500</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={event => setBio(event.target.value.slice(0, 500))}
                      rows={6}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      placeholder="Descreva sua atuação profissional em linguagem clara e objetiva."
                    />
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <label className="mb-2 block text-sm font-semibold text-neutral-900">Foto de perfil/capa</label>
                    <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700 sm:w-auto">
                      <Upload className="h-3.5 w-3.5" />
                      Enviar foto
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={event => {
                          const file = event.target.files?.[0]
                          if (file) {
                            void uploadProfessionalPhoto(file)
                          } else {
                            setPhotoUploadState('error')
                            setPhotoUploadError('Não foi possível selecionar a foto. Tente novamente.')
                          }
                        }}
                      />
                    </label>
                    {coverPhotoUrl ? (
                      <div className="mt-3">
                        <div
                          className="mb-3 h-28 w-28 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50"
                        >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverPhotoUrl}
                            alt="Foto do perfil"
                            className="h-full w-full object-cover"
                            style={{ objectPosition: `${photoFocusX}% ${photoFocusY}%` }}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-neutral-700">Posição horizontal</label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={photoFocusX}
                              onChange={event => setPhotoFocusX(Number(event.target.value))}
                              className="h-2 w-full cursor-pointer rounded-lg bg-neutral-200 accent-brand-600"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-neutral-700">Posição vertical</label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={photoFocusY}
                              onChange={event => setPhotoFocusY(Number(event.target.value))}
                              className="h-2 w-full cursor-pointer rounded-lg bg-neutral-200 accent-brand-600"
                            />
                          </div>
                          <p className="text-xs text-neutral-500">
                            Ajuste o enquadramento para alinhar a foto como ela ficará no card.
                          </p>
                        </div>
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-neutral-500">
                      Regras: JPG/PNG/WEBP, máximo de 3MB. O recorte é ajustável e refletirá como a foto aparece no card.
                    </p>
                    {photoUploadState === 'saving' ? (
                      <p className="mt-2 text-xs text-brand-700">Enviando foto...</p>
                    ) : null}
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
                    {bioSaveState === 'saving' ? 'Salvando...' : bioSaveState === 'saved' ? 'Salvo' : 'Salvar perfil público'}
                  </button>
                </div>
              )}

              {(activeStageId === 'c4_services') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
                    <p className="text-sm text-neutral-700">
                      Limite do plano atual: <strong>{tierLimits.services} serviço(s)</strong> ativo(s).
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Serviços cadastrados: {services.length}/{tierLimits.services}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">Valores exibidos em {serviceCurrency}.</p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <h3 className="mb-3 text-sm font-semibold text-neutral-900">Adicionar serviço</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Título</label>
                        <input
                          type="text"
                          value={serviceName}
                          onChange={event => setServiceName(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                          maxLength={30}
                          placeholder="Ex.: Consultoria fiscal"
                        />
                        <p className="mt-1 text-[11px] text-neutral-500">{serviceName.length}/30</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Descrição</label>
                        <textarea
                          rows={4}
                          value={serviceDescription}
                          onChange={event => setServiceDescription(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                          maxLength={120}
                          placeholder="Explique o objetivo, formato e resultado esperado do serviço."
                        />
                        <p className="mt-1 text-[11px] text-neutral-500">{serviceDescription.length}/120</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Preço por sessão ({serviceCurrency})</label>
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
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Duração (minutos)</label>
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
                      {serviceSaveState === 'saving' ? 'Salvando...' : serviceSaveState === 'saved' ? 'Salvo' : 'Adicionar serviço'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <h3 className="mb-3 text-sm font-semibold text-neutral-900">Serviços ativos</h3>
                    {services.length === 0 ? (
                      <p className="text-sm text-neutral-500">Nenhum serviço ativo ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {services.map(service => (
                          <div key={service.id} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                            <p className="text-sm font-semibold text-neutral-900">{service.name}</p>
                            <p className="text-xs text-neutral-600">{service.description || 'Sem descrição'}</p>
                            <p className="mt-1 text-xs text-neutral-700">
                              {formatCurrencyFromBrl(Number(service.price_brl || 0), serviceCurrency, exchangeRates)} ·{' '}
                              {service.duration_minutes} min
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
                  <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="max-w-2xl">
                        <h3 className="text-sm font-semibold text-neutral-900">Defina aqui só os seus horários de trabalho</h3>
                        <p className="mt-1 text-sm text-neutral-700">
                          Nesta etapa você configura a disponibilidade recorrente da semana. Esses horários representam quando você aceita atender pela Muuday.
                        </p>
                        <p className="mt-2 text-xs text-neutral-600">
                          Bloqueios pontuais, compromissos fora da plataforma e integração com Google, Outlook ou Apple ficam no calendário completo.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/disponibilidade"
                          className="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 hover:border-brand-300 hover:text-brand-800"
                        >
                          Abrir calendário completo
                        </Link>
                        <Link
                          href="/configuracoes-agendamento"
                          className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
                        >
                          Ajustar regras avançadas
                        </Link>
                      </div>
                    </div>
                    <div className="mt-3 rounded-lg border border-neutral-200 bg-white/90 px-3 py-2 text-xs text-neutral-700">
                      Fuso do perfil: <strong>{profileTimezone}</strong>. A agenda usa esse fuso e acompanha horário de verão e inverno automaticamente.
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <h4 className="text-sm font-semibold text-neutral-900">Horas de trabalho por dia</h4>
                    <p className="mt-1 text-xs text-neutral-500">
                      Ative apenas os dias em que você costuma atender. Você poderá bloquear exceções e indisponibilidades no calendário completo.
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2.5">
                      {WEEK_DAYS.map(day => {
                        const dayState = availabilityMap[day.value]
                        const isActive = dayState?.is_available
                        return (
                          <div
                            key={day.value}
                            className={`rounded-xl border px-3 py-3 ${
                              isActive ? 'border-brand-200 bg-brand-50/30' : 'border-neutral-200 bg-neutral-50'
                            }`}
                          >
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,180px)_1fr] md:items-center">
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
                              <div className="grid grid-cols-2 gap-2">
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
                                  className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {TIME_OPTIONS.map(option => (
                                    <option key={`start-${day.value}-${option}`} value={option}>
                                      Início {option}
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
                                  className="w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {TIME_OPTIONS.map(option => (
                                    <option key={`end-${day.value}-${option}`} value={option}>
                                      Fim {option}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <details className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-neutral-900">
                      Regras básicas de agendamento
                    </summary>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-neutral-700">Antecedência mínima (horas)</label>
                            <input
                              type="number"
                              min={Number(minNoticeRange.min)}
                              max={Number(minNoticeRange.max)}
                              value={minimumNoticeHours}
                              onChange={event =>
                                setMinimumNoticeHours(
                                  Math.min(
                                    Number(minNoticeRange.max),
                                    Math.max(Number(minNoticeRange.min), Number(event.target.value || minNoticeRange.min)),
                                  ),
                                )
                              }
                              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                            />
                            <p className="mt-1 text-[11px] text-neutral-500">
                              Faixa do seu plano: {minNoticeRange.min}h a {minNoticeRange.max}h.
                            </p>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-neutral-700">Janela máxima (dias)</label>
                            <input
                              type="number"
                              min={1}
                              max={Number(tierLimits.bookingWindowDays)}
                              value={maxBookingWindowDays}
                              onChange={event =>
                                setMaxBookingWindowDays(
                                  Math.min(Number(tierLimits.bookingWindowDays), Math.max(1, Number(event.target.value || 1))),
                                )
                              }
                              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                            />
                            <p className="mt-1 text-[11px] text-neutral-500">
                              Limite do plano atual: ate {tierLimits.bookingWindowDays} dias.
                            </p>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-neutral-700">Buffer entre sessões (min)</label>
                            <input
                              type="number"
                              min={0}
                              max={String(tier || '').toLowerCase() === 'basic' ? 15 : 180}
                              value={bufferMinutes}
                              disabled={!bufferConfig.configurable}
                              onChange={event => {
                                const next = Math.max(0, Number(event.target.value || 0))
                                const maxBuffer = String(tier || '').toLowerCase() === 'basic' ? 15 : 180
                                setBufferMinutes(Math.min(maxBuffer, next))
                              }}
                              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
                            />
                            {!bufferConfig.configurable ? (
                              <p className="mt-1 text-[11px] text-amber-700">
                                No plano básico, o buffer fica travado em {bufferConfig.defaultMinutes} min.
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-neutral-700">Modo de confirmação</label>
                            <select
                              value={canUseManualConfirmation ? confirmationMode : 'auto_accept'}
                              disabled={!canUseManualConfirmation}
                              onChange={event => setConfirmationMode(event.target.value === 'manual' ? 'manual' : 'auto_accept')}
                              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
                            >
                              <option value="auto_accept">Auto-aceite</option>
                              <option value="manual">Confirmação manual</option>
                            </select>
                            {!canUseManualConfirmation ? (
                              <p className="mt-1 text-[11px] text-amber-700">
                                Confirmação manual disponível a partir do plano Profissional.
                              </p>
                            ) : null}
                          </div>

                          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                            <input
                              type="checkbox"
                              checked={enableRecurring}
                              onChange={event => setEnableRecurring(event.target.checked)}
                              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                            />
                            Permitir recorrência
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                            <input
                              type="checkbox"
                              checked={allowMultiSession}
                              onChange={event => setAllowMultiSession(event.target.checked)}
                              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                            />
                            Permitir múltiplas sessões
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                            <input
                              type="checkbox"
                              checked={requireSessionPurpose}
                              onChange={event => setRequireSessionPurpose(event.target.checked)}
                              className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                            />
                            Exigir objetivo da sessão
                          </label>
                        </div>
                      </details>

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
                        : 'Salvar horas de trabalho'}
                  </button>
                </div>
              )}

              {activeStageId === 'c8_submit_review' ? (
                <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Pronto para enviar seu perfil?</h3>
                    <p className="mt-1 text-sm text-neutral-700">
                      Revise as pendências abaixo. Quando tudo estiver em ordem, envie o perfil para a etapa de análise sem sair do tracker.
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {executiveGateSummary.map(item => (
                      <div
                        key={item.id}
                        className={`rounded-xl border px-3 py-3 text-sm ${
                          item.passed
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                      >
                        <p className="font-semibold">{item.label}</p>
                        <p className="mt-1 text-xs">{item.description}</p>
                      </div>
                    ))}
                  </div>
                  {(activeStage?.blockers || []).length > 0 ? (
                    <ul className="space-y-2">
                      {(activeStage?.blockers || []).map(blocker => (
                        <li key={blocker.code} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          <p className="font-semibold">{blocker.title}</p>
                          <p className="mt-1 text-xs">{blocker.description}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {submitReviewMessage ? (
                    <p className={`text-sm ${submitReviewState === 'error' ? 'text-red-700' : 'text-green-700'}`}>
                      {submitReviewMessage}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void submitForReview()}
                      disabled={submitReviewState === 'saving' || !currentEvaluation.summary.canSubmitForReview}
                      className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitReviewState === 'saving' ? 'Enviando...' : 'Enviar para análise'}
                    </button>
                    {!currentEvaluation.summary.canSubmitForReview ? (
                      <span className="text-xs text-amber-700">Conclua os itens pendentes antes do envio.</span>
                    ) : null}
                  </div>
                </div>
              ) : !['c2_professional_identity', 'c3_public_profile', 'c4_services', 'c5_availability_calendar'].includes(activeStageId) ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm text-neutral-700">
                    Esta etapa ainda depende de itens pendentes. Revise os pontos abaixo para continuar no tracker.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {(activeStage?.blockers || []).map(blocker => (
                      <li key={blocker.code} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                        <p className="font-semibold text-neutral-900">{blocker.title}</p>
                        <p className="mt-1">{blocker.description}</p>
                        {(() => {
                          const cta = getBlockerCta(blocker)
                          if (!cta) return null

                          if (cta.kind === 'internal') {
                            return (
                              <button
                                type="button"
                                onClick={() => setActiveStageId(cta.stageId)}
                                className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
                              >
                                {cta.label}
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )
                          }

                          return (
                            <Link
                              href={cta.href}
                              onClick={() => setOpen(false)}
                              className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
                            >
                              {cta.label}
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )
                        })()}
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

