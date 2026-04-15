'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, CheckCircle2, Circle, Loader2, Upload, XCircle } from 'lucide-react'
import { getBufferConfig, getMinNoticeRange, getTierLimits, isFeatureAvailable } from '@/lib/tier-config'
import { getDefaultExchangeRates, type ExchangeRateMap } from '@/lib/exchange-rates'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import {
  PROFESSIONAL_TERMS,
  PROFESSIONAL_TERMS_VERSION,
  type ProfessionalTermKey,
} from '@/lib/legal/professional-terms'

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
type BillingCycle = 'monthly' | 'annual'
type PlanTier = 'basic' | 'professional' | 'premium'
type PendingPhoto = {
  file: File
  previewUrl: string
  width: number
  height: number
}

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

const UI_STAGE_ORDER = [
  'c2_professional_identity',
  'c4_services',
  'c5_availability_calendar',
  'c6_plan_billing_setup_post',
  'c7_payout_receipt',
  'c8_submit_review',
] as const

const UI_STAGE_LABELS: Record<(typeof UI_STAGE_ORDER)[number], string> = {
  c2_professional_identity: 'Identidade',
  c4_services: 'Serviços',
  c5_availability_calendar: 'Disponibilidade',
  c6_plan_billing_setup_post: 'Plano',
  c7_payout_receipt: 'Financeiro',
  c8_submit_review: 'Enviar',
}

const UI_STAGE_BACKEND_STAGE_IDS: Record<(typeof UI_STAGE_ORDER)[number], string[]> = {
  c2_professional_identity: ['c2_basic_identity', 'c3_public_profile'],
  c4_services: ['c4_service_setup'],
  c5_availability_calendar: ['c5_availability_calendar'],
  c6_plan_billing_setup_post: ['c6_plan_billing_setup'],
  c7_payout_receipt: ['c7_payout_payments'],
  c8_submit_review: ['c8_submit_review'],
}

const TERMS_KEYS = PROFESSIONAL_TERMS.map(item => item.key) as ProfessionalTermKey[]

const PLAN_PRICE_BASE_BRL: Record<PlanTier, number> = {
  basic: 49.99,
  professional: 99.99,
  premium: 149.99,
}

const PLAN_COMPARISON_ROWS: Array<{ label: string; basic: string; professional: string; premium: string }> = [
  { label: 'Período sem cobrança', basic: '90 dias', professional: '90 dias', premium: '90 dias' },
  { label: 'Serviços ativos', basic: '1', professional: '5', premium: '10' },
  { label: 'Especialidades no perfil', basic: '1', professional: '3', premium: '3' },
  { label: 'Tags de foco', basic: '3', professional: '5', premium: '10' },
  { label: 'Janela de agendamento', basic: '60 dias', professional: '90 dias', premium: '180 dias' },
  { label: 'Buffer configurável', basic: 'Até 15 min', professional: 'Até 180 min', premium: 'Até 180 min' },
  { label: 'Confirmação manual', basic: 'Não', professional: 'Sim', premium: 'Sim' },
  { label: 'Recorrência e pacotes', basic: 'Sim', professional: 'Sim', premium: 'Sim' },
  { label: 'Múltiplas datas por checkout', basic: 'Sim', professional: 'Sim', premium: 'Sim' },
  { label: 'Vídeo de apresentação', basic: 'Não', professional: 'Sim', premium: 'Sim' },
  { label: 'WhatsApp no perfil', basic: 'Não', professional: 'Sim', premium: 'Sim' },
  { label: 'Redes sociais no perfil', basic: 'Não', professional: 'Até 2', premium: 'Até 5' },
  { label: 'Integrações de calendário', basic: 'Google', professional: 'Google e Outlook', premium: 'Google, Outlook e Apple' },
  { label: 'Operação financeira', basic: 'Essencial', professional: 'Expandida', premium: 'Completa' },
  { label: 'Suporte operacional', basic: 'Base', professional: 'Prioritário', premium: 'Premium' },
]

const PLAN_TIER_LABELS: Record<string, string> = {
  basic: 'Básico',
  professional: 'Profissional',
  premium: 'Premium',
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
  'Português',
  'Inglês',
  'Espanhol',
  'Francês',
  'Italiano',
  'Alemão',
  'Holandês',
  'Árabe',
  'Mandarim',
  'Japonês',
  'Coreano',
  'Hindi',
  'Russo',
  'Ucraniano',
  'Hebraico',
]

const PROFESSIONAL_TITLES = ['Sr.', 'Sra.', 'Srta.', 'Dr.', 'Dra.', 'Prof.', 'Profa.', 'Prefiro não informar']
const TARGET_AUDIENCE_OPTIONS = ['Adultos', 'Crianças', 'Casais', 'Empresas', 'Estudantes', 'Imigrantes']
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function humanizeTaxonomyValue(value: string) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (!raw.includes('-')) return raw
  return raw
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getQualificationValidationMessage(item: QualificationStructured) {
  const label = item.name.trim() || 'qualificação'
  if (!item.name.trim()) return 'Informe o nome da qualificação.'
  if (item.requires_registration) {
    if (!item.registration_number.trim()) return `Informe o número de registro em "${label}".`
    if (!item.issuer.trim()) return `Informe o órgão emissor em "${label}".`
    if (!item.country.trim()) return `Informe o país do registro em "${label}".`
  } else if (!item.course_name.trim()) {
    return `Informe o nome do curso ou formação em "${label}".`
  }
  if (item.evidence_files.length === 0) return `Envie ao menos um comprovante para "${label}".`
  return ''
}

async function readImageDimensions(file: File) {
  const previewUrl = URL.createObjectURL(file)
  const result = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Nao foi possivel ler a imagem selecionada.'))
    image.src = previewUrl
  })

  return { previewUrl, ...result }
}

async function buildAvatarCropFile(file: File, focusX: number, focusY: number, zoom: number) {
  const dimensions = await readImageDimensions(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const next = new Image()
      next.onload = () => resolve(next)
      next.onerror = () => reject(new Error('Nao foi possivel preparar a imagem para recorte.'))
      next.src = dimensions.previewUrl
    })

    const outputSize = 800
    const normalizedZoom = clamp(zoom, 1, 2.5)
    const scale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight) * normalizedZoom
    const displayedWidth = image.naturalWidth * scale
    const displayedHeight = image.naturalHeight * scale
    const overflowX = Math.max(0, displayedWidth - outputSize)
    const overflowY = Math.max(0, displayedHeight - outputSize)
    const sourceSize = outputSize / scale
    const sourceX = overflowX > 0 ? clamp((overflowX * (focusX / 100)) / scale, 0, image.naturalWidth - sourceSize) : 0
    const sourceY = overflowY > 0 ? clamp((overflowY * (focusY / 100)) / scale, 0, image.naturalHeight - sourceSize) : 0

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Nao foi possivel preparar a foto agora.')
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, outputSize, outputSize)
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize,
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        nextBlob => {
          if (nextBlob) {
            resolve(nextBlob)
            return
          }
          reject(new Error('Nao foi possivel exportar a foto recortada.'))
        },
        'image/jpeg',
        0.92,
      )
    })

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'avatar'
    return new File([blob], `${baseName}-avatar.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(dimensions.previewUrl)
  }
}

function getPlanFeatureHighlights(stageId: string) {
  if (stageId === 'c2_professional_identity') {
    return [
      `Básico: até ${PLAN_COMPARISON_ROWS[0].basic} tags de foco`,
      `Profissional: até ${PLAN_COMPARISON_ROWS[0].professional} tags de foco`,
      `Premium: até ${PLAN_COMPARISON_ROWS[0].premium} tags de foco`,
    ]
  }

  if (stageId === 'c4_services') {
    return [
      `Básico: ${PLAN_COMPARISON_ROWS[1].basic} serviço ativo`,
      `Profissional: ${PLAN_COMPARISON_ROWS[1].professional} serviços ativos`,
      `Premium: ${PLAN_COMPARISON_ROWS[1].premium} serviços ativos`,
    ]
  }

  if (stageId === 'c5_availability_calendar') {
    return [
      `Básico: ${PLAN_COMPARISON_ROWS[2].basic} de janela e Google`,
      `Profissional: ${PLAN_COMPARISON_ROWS[2].professional} e Outlook`,
      `Premium: ${PLAN_COMPARISON_ROWS[2].premium} e Apple`,
    ]
  }

  if (stageId === 'c7_payout_receipt') {
    return [
      `Básico: ${PLAN_COMPARISON_ROWS[5].basic}`,
      `Profissional: ${PLAN_COMPARISON_ROWS[5].professional}`,
      `Premium: ${PLAN_COMPARISON_ROWS[5].premium}`,
    ]
  }

  return []
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
    return { kind: 'internal', label: 'Abrir plano', stageId: 'c6_plan_billing_setup_post' }
  }

  if (blocker.actionHref === '/financeiro') {
    return { kind: 'internal', label: 'Abrir financeiro', stageId: 'c7_payout_receipt' }
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
  const [bio, setBio] = useState(initialBio || '')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initialCoverPhotoUrl || '')
  const [photoUploadState, setPhotoUploadState] = useState<SaveState>('idle')
  const [photoUploadError, setPhotoUploadError] = useState('')
  const [photoFocusX, setPhotoFocusX] = useState(50)
  const [photoFocusY, setPhotoFocusY] = useState(50)
  const [photoZoom, setPhotoZoom] = useState(1)
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null)
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<Record<ProfessionalTermKey, boolean>>(() =>
    TERMS_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: false }),
      {} as Record<ProfessionalTermKey, boolean>,
    ),
  )
  const [activeTermsModalKey, setActiveTermsModalKey] = useState<ProfessionalTermKey | null>(null)
  const [termsModalScrolledToEnd, setTermsModalScrolledToEnd] = useState(false)
  const [submitTermsError, setSubmitTermsError] = useState('')
  const dragStateRef = useRef<{ startX: number; startY: number; startFocusX: number; startFocusY: number } | null>(null)
  const termsModalContentRef = useRef<HTMLDivElement | null>(null)
  const [bioSaveState, setBioSaveState] = useState<SaveState>('idle')
  const [bioError, setBioError] = useState('')
  const [identityTitle, setIdentityTitle] = useState('')
  const [identityDisplayName, setIdentityDisplayName] = useState('')
  const [identityDisplayNameLocked, setIdentityDisplayNameLocked] = useState(false)
  const [identityCategory, setIdentityCategory] = useState('')
  const [identitySubcategory, setIdentitySubcategory] = useState('')
  const [identityFocusAreas, setIdentityFocusAreas] = useState<string[]>([])
  const [identityYearsExperience, setIdentityYearsExperience] = useState('0')
  const [identityPrimaryLanguage, setIdentityPrimaryLanguage] = useState('Português')
  const [identitySecondaryLanguages, setIdentitySecondaryLanguages] = useState<string[]>([])
  const [secondaryLanguagesOpen, setSecondaryLanguagesOpen] = useState(false)
  const [identityTargetAudiences, setIdentityTargetAudiences] = useState<string[]>([])
  const [targetAudiencesOpen, setTargetAudiencesOpen] = useState(false)
  const [focusAreaInput, setFocusAreaInput] = useState('')
  const [identityQualifications, setIdentityQualifications] = useState<QualificationStructured[]>([])
  const [identityQualificationSelection, setIdentityQualificationSelection] = useState(
    QUALIFICATION_APPROVED_OPTIONS[0],
  )
  const [identityQualificationCustomName, setIdentityQualificationCustomName] = useState('')
  const [identityQualificationCustomEnabled, setIdentityQualificationCustomEnabled] = useState(false)
  const [identitySaveState, setIdentitySaveState] = useState<SaveState>('idle')
  const [identityError, setIdentityError] = useState('')
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
  const [selectedPlanTier, setSelectedPlanTier] = useState<PlanTier>(
    (String(tier || '').toLowerCase() as PlanTier) || 'basic',
  )
  const [selectedPlanCycle, setSelectedPlanCycle] = useState<BillingCycle>('monthly')
  const [planActionState, setPlanActionState] = useState<SaveState>('idle')
  const [planActionError, setPlanActionError] = useState('')
  const [isFinanceBypassEnabled, setIsFinanceBypassEnabled] = useState(false)
  const [manualCompletedStageIds, setManualCompletedStageIds] = useState<string[]>([])
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
    const firstPending = UI_STAGE_ORDER.find(id => {
      const stageIds = UI_STAGE_BACKEND_STAGE_IDS[id]
      return stageIds.some(stageId => {
        const stage = stagesById.get(normalizeStageIdForLookup(stageId))
        return stage ? !stage.complete : false
      })
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
    return () => {
      if (pendingPhoto?.previewUrl) {
        URL.revokeObjectURL(pendingPhoto.previewUrl)
      }
    }
  }, [pendingPhoto])

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
          .select('user_id,category,subcategories,focus_areas,years_experience')
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
            'timezone,minimum_notice_hours,max_booking_window_days,buffer_minutes,buffer_time_minutes,confirmation_mode,enable_recurring,allow_multi_session,require_session_purpose,calendar_sync_provider,terms_accepted_at,terms_version,onboarding_finance_bypass',
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
            'title,display_name,category,specialty_name,focus_areas,primary_language,secondary_languages,target_audiences,qualifications_structured',
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
        setIsFinanceBypassEnabled(Boolean(settingsRow?.onboarding_finance_bypass))

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
          .select('currency,full_name,timezone,avatar_url')
          .eq('id', String(professional?.user_id || ''))
          .maybeSingle()

        const resolvedCurrency = String(profileCurrency.data?.currency || 'BRL').toUpperCase()
        const resolvedTimezone = String(
          profileCurrency.data?.timezone || settingsRow?.timezone || 'America/Sao_Paulo',
        )
        setServiceCurrency(resolvedCurrency)
        setProfileTimezone(resolvedTimezone)
        setCoverPhotoUrl(String(profileCurrency.data?.avatar_url || ''))
        const resolvedDisplayName = String(appRow?.display_name || profileCurrency.data?.full_name || '')
        setIdentityDisplayName(resolvedDisplayName)
        setIdentityDisplayNameLocked(resolvedDisplayName.trim().length > 0)
        setIdentityCategory(String(professional?.category || appRow?.category || ''))
        setIdentitySubcategory(
          Array.isArray(professional?.subcategories) && professional.subcategories.length > 0
            ? String(professional.subcategories[0] || '')
            : String(appRow?.specialty_name || ''),
        )
        setIdentityFocusAreas(
          Array.isArray(professional?.focus_areas) && professional.focus_areas.length > 0
            ? professional.focus_areas.map(item => String(item))
            : Array.isArray(appRow?.focus_areas)
              ? appRow.focus_areas.map((item: unknown) => String(item))
              : [],
        )
        setIdentityTitle(String(appRow?.title || ''))
        setIdentityYearsExperience(String(professional?.years_experience ?? 0))
        setIdentityPrimaryLanguage(String(appRow?.primary_language || 'Português'))
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
        const existingTermsAccepted = Boolean(
          settingsRow && (settingsRow as Record<string, unknown>).terms_accepted_at && (settingsRow as Record<string, unknown>).terms_version,
        )
        setHasAcceptedTerms(
          TERMS_KEYS.reduce(
            (acc, key) => ({ ...acc, [key]: existingTermsAccepted }),
            {} as Record<ProfessionalTermKey, boolean>,
          ),
        )
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
    return UI_STAGE_ORDER.map(id => {
      const backendStages = UI_STAGE_BACKEND_STAGE_IDS[id]
        .map(stageId => stagesById.get(normalizeStageIdForLookup(stageId)))
        .filter(Boolean) as Stage[]

      const completeFromBackend = backendStages.length > 0 && backendStages.every(stage => stage.complete)
      const complete = completeFromBackend || manualCompletedStageIds.includes(id)
      const firstBlockedStage = backendStages.find(stage => !stage.complete)

      return {
        id,
        label: UI_STAGE_LABELS[id],
        complete,
        blocker: complete ? null : firstBlockedStage?.blockers[0] || null,
      }
    })
  }, [stagesById, manualCompletedStageIds])

  const stageCompletionSummary = useMemo(() => {
    const rows = stageItems.map(item => item.complete)
    const completed = rows.filter(Boolean).length
    return {
      total: rows.length,
      completed,
    }
  }, [stageItems])

  const activeStage = stagesById.get(normalizeStageIdForLookup(activeStageId))
  const activeTerm = useMemo(
    () => PROFESSIONAL_TERMS.find(item => item.key === activeTermsModalKey) || null,
    [activeTermsModalKey],
  )
  const currentPlanLabel = PLAN_TIER_LABELS[String(tier || '').toLowerCase()] || 'Básico'
  const displayPlanCurrency = planPricing?.currency || serviceCurrency || 'BRL'

  useEffect(() => {
    if (!activeTerm || !termsModalContentRef.current) return
    const element = termsModalContentRef.current
    const fitsWithoutScroll = element.scrollHeight <= element.clientHeight + 8
    if (fitsWithoutScroll) {
      setTermsModalScrolledToEnd(true)
    }
  }, [activeTerm])

  function toggleMultiValue(value: string, values: string[], setter: (next: string[]) => void) {
    if (values.includes(value)) {
      setter(values.filter(item => item !== value))
    } else {
      setter([...values, value])
    }
  }

  function addFocusArea(rawValue: string) {
    const nextValue = rawValue.trim().replace(/,$/, '')
    if (!nextValue) return
    if (identityFocusAreas.some(item => normalizeOption(item) === normalizeOption(nextValue))) {
      setFocusAreaInput('')
      return
    }
    if (identityFocusAreas.length >= tierLimits.tags) {
      setIdentityError(`Seu plano permite até ${tierLimits.tags} tag(s) de foco.`)
      return
    }
    setIdentityFocusAreas(previous => [...previous, nextValue])
    setFocusAreaInput('')
    setIdentityError('')
  }

  function removeFocusArea(tag: string) {
    setIdentityFocusAreas(previous => previous.filter(item => item !== tag))
  }

  async function prepareProfessionalPhoto(file: File) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setPhotoUploadState('error')
      setPhotoUploadError('Formato inválido. Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoUploadState('error')
      setPhotoUploadError('Arquivo acima de 3MB. Reduza antes de enviar.')
      return
    }

    setPhotoUploadError('')
    setPhotoUploadState('saving')
    try {
      const imageMeta = await readImageDimensions(file)
      if (imageMeta.width < 320 || imageMeta.height < 320) {
        URL.revokeObjectURL(imageMeta.previewUrl)
        setPhotoUploadState('error')
        setPhotoUploadError('Use uma foto com pelo menos 320x320 pixels.')
        return
      }

      setPendingPhoto(previous => {
        if (previous?.previewUrl) {
          URL.revokeObjectURL(previous.previewUrl)
        }
        return {
          file,
          previewUrl: imageMeta.previewUrl,
          width: imageMeta.width,
          height: imageMeta.height,
        }
      })
      setPhotoFocusX(50)
      setPhotoFocusY(50)
      setPhotoZoom(1)
      setPhotoUploadState('idle')
    } catch (error) {
      setPhotoUploadState('error')
      setPhotoUploadError(error instanceof Error ? error.message : 'Não foi possível preparar a foto.')
    }
  }

  async function uploadPreparedProfessionalPhoto() {
    if (!pendingPhoto) return coverPhotoUrl

    const croppedFile = await buildAvatarCropFile(pendingPhoto.file, photoFocusX, photoFocusY, photoZoom)
    const form = new FormData()
    form.append('file', croppedFile)
    const response = await fetch('/api/professional/profile-media/upload', {
      method: 'POST',
      body: form,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw new Error(String(errorBody?.error || 'Falha no upload da foto. Tente novamente.'))
    }

    const payload = (await response.json()) as { publicUrl?: string }
    const nextUrl = String(payload.publicUrl || '')
    if (!nextUrl) {
      throw new Error('A foto foi enviada, mas a URL final não foi retornada.')
    }

    setCoverPhotoUrl(nextUrl)
    setPendingPhoto(previous => {
      if (previous?.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl)
      }
      return null
    })
    return nextUrl
  }

  async function saveSection<TPayload extends object>(
    payload: TPayload,
    fallbackError: string,
    options?: { autoAdvance?: boolean },
  ) {
    setTrackerRefreshState('saving')
    const response = await fetch('/api/professional/onboarding/save', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = (await response.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      evaluation?: ProfessionalOnboardingEvaluation
      service?: { id: string; name: string; description: string | null; price_brl: number; duration_minutes: number }
    }

    if (!response.ok || !json.ok || !json.evaluation) {
      setTrackerRefreshState('error')
      throw new Error(json.error || fallbackError)
    }

    setCurrentEvaluation(json.evaluation)
    onEvaluationChange?.(json.evaluation)
    setTrackerRefreshState('saved')
    setTimeout(() => setTrackerRefreshState('idle'), 1200)
    const nextPending = UI_STAGE_ORDER.find(id =>
      UI_STAGE_BACKEND_STAGE_IDS[id].some(stageId => {
        const stage = json.evaluation?.stages.find(
          stageItem => normalizeStageIdForLookup(stageItem.id) === normalizeStageIdForLookup(stageId),
        )
        return stage ? !stage.complete : false
      }),
    )
    if (options?.autoAdvance !== false && nextPending) {
      setActiveStageId(nextPending)
    }

    return json
  }

  function handlePhotoDragStart(clientX: number, clientY: number) {
    if (!pendingPhoto) return
    dragStateRef.current = {
      startX: clientX,
      startY: clientY,
      startFocusX: photoFocusX,
      startFocusY: photoFocusY,
    }
  }

  function handlePhotoDragMove(clientX: number, clientY: number) {
    if (!pendingPhoto || !dragStateRef.current) return
    const previewSize = 192
    const scale = Math.max(previewSize / pendingPhoto.width, previewSize / pendingPhoto.height) * photoZoom
    const displayedWidth = pendingPhoto.width * scale
    const displayedHeight = pendingPhoto.height * scale
    const overflowX = Math.max(1, displayedWidth - previewSize)
    const overflowY = Math.max(1, displayedHeight - previewSize)
    const deltaX = clientX - dragStateRef.current.startX
    const deltaY = clientY - dragStateRef.current.startY
    setPhotoFocusX(clamp(dragStateRef.current.startFocusX - (deltaX / overflowX) * 100, 0, 100))
    setPhotoFocusY(clamp(dragStateRef.current.startFocusY - (deltaY / overflowY) * 100, 0, 100))
  }

  function handlePhotoDragEnd() {
    dragStateRef.current = null
  }

  function openTerm(termKey: ProfessionalTermKey) {
    setActiveTermsModalKey(termKey)
    setTermsModalScrolledToEnd(false)
  }

  function acceptActiveTerm() {
    if (!activeTerm || !termsModalScrolledToEnd) return
    setHasAcceptedTerms(previous => ({ ...previous, [activeTerm.key]: true }))
    setActiveTermsModalKey(null)
    setTermsModalScrolledToEnd(false)
  }

  function allRequiredTermsAccepted() {
    return TERMS_KEYS.every(key => hasAcceptedTerms[key])
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
      return false
    }

    const invalidQualification = identityQualifications.find(item => getQualificationValidationMessage(item))
    if (invalidQualification) {
      setIdentitySaveState('error')
      setIdentityError(getQualificationValidationMessage(invalidQualification))
      return false
    }

    try {
      await saveSection(
        {
          section: 'identity',
          title: identityTitle,
          displayName: identityDisplayName,
          yearsExperience: years,
          primaryLanguage: identityPrimaryLanguage,
          secondaryLanguages: identitySecondaryLanguages,
          targetAudiences: identityTargetAudiences,
          focusAreas: identityFocusAreas,
          qualifications: identityQualifications,
        },
        'Não foi possível salvar identidade profissional.',
        { autoAdvance: false },
      )
      setIdentitySaveState('saved')
      setTimeout(() => setIdentitySaveState('idle'), 2000)
      return true
    } catch (error) {
      setIdentitySaveState('error')
      setIdentityError(error instanceof Error ? error.message : 'Não foi possível salvar identidade profissional.')
      return false
    }
  }

  async function savePublicProfile() {
    if (bio.trim().length === 0) {
      setBioError('O campo "Sobre você" não pode ficar vazio.')
      setBioSaveState('error')
      return false
    }
    if (bio.length > 500) {
      setBioError('O campo "Sobre você" deve ter no máximo 500 caracteres.')
      setBioSaveState('error')
      return false
    }
    setBioSaveState('saving')
    setBioError('')
    try {
      setPhotoUploadState(pendingPhoto ? 'saving' : photoUploadState)
      const nextAvatarUrl = pendingPhoto ? await uploadPreparedProfessionalPhoto() : coverPhotoUrl.trim()
      if (!isValidCoverPhotoUrl(nextAvatarUrl.trim())) {
        throw new Error('A URL final da foto do perfil é inválida.')
      }

      await saveSection(
        {
          section: 'public_profile',
          bio: bio.trim(),
          avatarUrl: nextAvatarUrl.trim(),
        },
        'Não foi possível salvar o perfil público.',
        { autoAdvance: false },
      )
      setPhotoUploadState('saved')
      setBioSaveState('saved')
      setTimeout(() => {
        setPhotoUploadState('idle')
        setBioSaveState('idle')
      }, 2000)
      return true
    } catch (error) {
      setPhotoUploadState('error')
      setBioSaveState('error')
      setBioError(error instanceof Error ? error.message : 'Não foi possível salvar o perfil público.')
      return false
    }
  }

  async function saveIdentityAndPublicProfile() {
    const identityOk = await saveIdentity()
    if (!identityOk) return
    const profileOk = await savePublicProfile()
    if (!profileOk) return
    setActiveStageId('c4_services')
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

    try {
      const result = await saveSection(
        {
          section: 'service',
          name: serviceName.trim(),
          description: serviceDescription.trim(),
          priceBrl: Number(priceBrl.toFixed(2)),
          durationMinutes: duration,
        },
        'Não foi possível criar o serviço.',
      )
      if (result.service) {
        setServices(prev => [...prev, result.service!])
      }
      setServiceName('')
      setServiceDescription('')
      setServicePrice('')
      setServiceDuration('60')
      setServiceSaveState('saved')
      setTimeout(() => setServiceSaveState('idle'), 2000)
    } catch (error) {
      setServiceSaveState('error')
      setServiceError(error instanceof Error ? error.message : 'Não foi possível criar o serviço.')
    }
  }

  async function saveAvailabilityCalendar() {
    if (Object.values(availabilityMap).some(day => day.is_available && day.start_time >= day.end_time)) {
      setAvailabilitySaveState('error')
      setAvailabilityError('Horários inválidos: início deve ser menor que fim.')
      return
    }

    setAvailabilitySaveState('saving')
    setAvailabilityError('')

    const safeNoticeHours = Math.min(
      Number(minNoticeRange.max),
      Math.max(Number(minNoticeRange.min), Number(minimumNoticeHours || minNoticeRange.min)),
    )
    const safeBookingWindow = Math.min(
      Number(tierLimits.bookingWindowDays),
      Math.max(1, Number(maxBookingWindowDays || 1)),
    )

    try {
      await saveSection(
        {
          section: 'availability',
          profileTimezone,
          availabilityMap,
          minimumNoticeHours: safeNoticeHours,
          maxBookingWindowDays: safeBookingWindow,
          bufferMinutes,
          confirmationMode: canUseManualConfirmation ? confirmationMode : 'auto_accept',
          enableRecurring,
          allowMultiSession,
          requireSessionPurpose,
        },
        'Não foi possível salvar disponibilidade e regras.',
      )
      setAvailabilitySaveState('saved')
      setTimeout(() => setAvailabilitySaveState('idle'), 2000)
    } catch (error) {
      setAvailabilitySaveState('error')
      setAvailabilityError(
        error instanceof Error ? error.message : 'Não foi possível salvar disponibilidade e regras.',
      )
    }
  }

  async function savePlanSelection() {
    setPlanActionState('saving')
    setPlanActionError('')

    try {
      if (selectedPlanTier === String(tier || '').toLowerCase()) {
        setPlanActionState('saved')
        setManualCompletedStageIds(previous =>
          previous.includes('c6_plan_billing_setup_post')
            ? previous
            : [...previous, 'c6_plan_billing_setup_post'],
        )
        setActiveStageId('c7_payout_receipt')
        setTimeout(() => setPlanActionState('idle'), 1800)
        return
      }

      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedPlanTier,
          billingCycle: selectedPlanCycle,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || 'Não foi possível iniciar a seleção do plano agora.')
      }

      window.location.href = payload.url
    } catch (error) {
      setPlanActionState('error')
      setPlanActionError(error instanceof Error ? error.message : 'Não foi possível iniciar a seleção do plano agora.')
    }
  }

  async function submitForReview() {
    setSubmitReviewState('saving')
    setSubmitReviewMessage('')
    setSubmitTermsError('')

    if (!allRequiredTermsAccepted()) {
      setSubmitReviewState('error')
      setSubmitTermsError('Aceite todos os termos obrigatórios antes de enviar.')
      return
    }

    const response = await fetch('/api/professional/onboarding/submit-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ acceptedTerms: true, termsVersion: PROFESSIONAL_TERMS_VERSION }),
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
    setSubmitReviewMessage('Perfil enviado para análise. A equipe vai revisar e liberar a publicação.')
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
                  {UI_STAGE_LABELS[activeStageId as (typeof UI_STAGE_ORDER)[number]]}
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

              {getPlanFeatureHighlights(activeStageId).length > 0 ? (
                <div className="mb-4 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Planos nesta etapa</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {getPlanFeatureHighlights(activeStageId).map(item => (
                          <span
                            key={item}
                            className="inline-flex items-center rounded-full border border-brand-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-800"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700">
                      <p>
                        Plano atual: <strong>{currentPlanLabel}</strong>
                      </p>
                      {planPricing ? (
                        <p>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: planPricing.currency }).format(
                            planPricing.monthlyAmount / 100,
                          )}{' '}
                          / mês
                        </p>
                      ) : (
                        <p>{pricingError || 'Preço indisponível no momento.'}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveStageId('c6_plan_billing_setup_post')}
                        className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
                      >
                        Ver planos desta etapa
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {(activeStageId === 'c2_professional_identity') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <label className="mb-2 block text-sm font-semibold text-neutral-900">Foto de perfil</label>
                    <p className="mb-3 text-xs text-neutral-600">
                      Use uma foto nítida, com boa iluminação, rosto centralizado e fundo simples. Validamos formato, peso e resolução automaticamente.
                    </p>
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
                            void prepareProfessionalPhoto(file)
                          } else {
                            setPhotoUploadState('error')
                            setPhotoUploadError('Não foi possível selecionar a foto. Tente novamente.')
                          }
                          event.currentTarget.value = ''
                        }}
                      />
                    </label>
                    {(pendingPhoto || coverPhotoUrl) ? (
                      <div className="mt-3">
                        <div className="grid gap-4 lg:grid-cols-[208px_minmax(0,1fr)] lg:items-start">
                          <div className="space-y-3">
                            <div
                              className="relative h-48 w-48 overflow-hidden rounded-full border border-neutral-200 bg-white"
                              onMouseMove={event => {
                                if (dragStateRef.current) handlePhotoDragMove(event.clientX, event.clientY)
                              }}
                              onMouseUp={handlePhotoDragEnd}
                              onMouseLeave={handlePhotoDragEnd}
                              onTouchMove={event => {
                                const touch = event.touches[0]
                                if (touch) handlePhotoDragMove(touch.clientX, touch.clientY)
                              }}
                              onTouchEnd={handlePhotoDragEnd}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={pendingPhoto?.previewUrl || coverPhotoUrl}
                                alt="Prévia da foto do perfil"
                                className="absolute select-none object-cover"
                                draggable={false}
                                onMouseDown={event => handlePhotoDragStart(event.clientX, event.clientY)}
                                onTouchStart={event => {
                                  const touch = event.touches[0]
                                  if (touch) handlePhotoDragStart(touch.clientX, touch.clientY)
                                }}
                                style={
                                  pendingPhoto
                                    ? (() => {
                                        const previewSize = 192
                                        const scale =
                                          Math.max(previewSize / pendingPhoto.width, previewSize / pendingPhoto.height) *
                                          photoZoom
                                        const displayedWidth = pendingPhoto.width * scale
                                        const displayedHeight = pendingPhoto.height * scale
                                        const overflowX = Math.max(0, displayedWidth - previewSize)
                                        const overflowY = Math.max(0, displayedHeight - previewSize)
                                        return {
                                          width: `${displayedWidth}px`,
                                          height: `${displayedHeight}px`,
                                          left: `${-(overflowX * (photoFocusX / 100))}px`,
                                          top: `${-(overflowY * (photoFocusY / 100))}px`,
                                        }
                                      })()
                                    : { inset: 0, width: '100%', height: '100%', objectPosition: 'center' }
                                }
                              />
                            </div>
                            <p className="text-[11px] text-neutral-500">
                              Arraste a imagem para reposicionar o centro. Use o zoom se quiser ajustar também para os lados.
                            </p>
                          </div>
                          <div className="space-y-3">
                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                              <p className="text-xs font-semibold text-neutral-800">Pré-validação automática</p>
                              <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                                <li>JPG, PNG ou WEBP</li>
                                <li>Até 3MB</li>
                                <li>Mínimo de 320x320 px</li>
                                <li>Rosto centralizado, sem óculos escuros e com fundo claro ou neutro</li>
                                <li>O recorte final será quadrado e exibido em formato circular</li>
                              </ul>
                            </div>
                            {pendingPhoto ? (
                              <label className="block">
                                <span className="mb-1 block text-xs font-semibold text-neutral-700">Zoom</span>
                                <input
                                  type="range"
                                  min="1"
                                  max="2.5"
                                  step="0.05"
                                  value={photoZoom}
                                  onChange={event => setPhotoZoom(Number(event.target.value))}
                                  className="w-full accent-brand-600"
                                />
                              </label>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-neutral-500">
                      Regras: JPG/PNG/WEBP, máximo de 3MB. O avatar final será o mesmo exibido no card público.
                    </p>
                    {photoUploadState === 'saving' ? (
                      <p className="mt-2 text-xs text-brand-700">Preparando foto...</p>
                    ) : null}
                    {photoUploadError ? <p className="mt-2 text-xs font-medium text-red-600">{photoUploadError}</p> : null}
                  </div>

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
                        disabled={identityDisplayNameLocked}
                        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
                      />
                      {identityDisplayNameLocked ? (
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Esse nome foi definido no cadastro inicial e não pode ser alterado aqui.
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Categoria principal</label>
                      <input
                        type="text"
                        value={humanizeTaxonomyValue(identityCategory)}
                        readOnly
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Área de atuação específica</label>
                      <input
                        type="text"
                        value={humanizeTaxonomyValue(identitySubcategory)}
                        readOnly
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-600"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-neutral-700">Tags de foco</label>
                      <div className="flex min-h-11 flex-wrap gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                        {identityFocusAreas.length > 0 ? (
                          identityFocusAreas.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => removeFocusArea(tag)}
                              className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-800"
                            >
                              {tag} ×
                            </button>
                          ))
                        ) : (
                          <span className="text-xs text-neutral-500">Nenhuma tag registrada ainda.</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          value={focusAreaInput}
                          onChange={event => {
                            const nextValue = event.target.value
                            if (nextValue.endsWith(',')) {
                              addFocusArea(nextValue)
                              return
                            }
                            setFocusAreaInput(nextValue)
                          }}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ',') {
                              event.preventDefault()
                              addFocusArea(focusAreaInput)
                            }
                            if (event.key === 'Backspace' && !focusAreaInput && identityFocusAreas.length > 0) {
                              removeFocusArea(identityFocusAreas[identityFocusAreas.length - 1]!)
                            }
                          }}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                          placeholder={`Adicione tags de foco (${identityFocusAreas.length}/${tierLimits.tags})`}
                        />
                        <button
                          type="button"
                          onClick={() => addFocusArea(focusAreaInput)}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700"
                        >
                          Adicionar tag
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Pressione vírgula ou Enter para adicionar. Clique na tag para remover.
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-neutral-900">Sobre você</label>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Resumo público exibido no perfil</span>
                        <span className="text-xs text-neutral-500">{bio.length}/500</span>
                      </div>
                      <textarea
                        value={bio}
                        onChange={event => setBio(event.target.value.slice(0, 500))}
                        rows={5}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                        placeholder="Descreva sua atuação profissional em linguagem clara e objetiva."
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
                    <p className="mb-2 text-xs font-semibold text-neutral-700">Idiomas secundários</p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSecondaryLanguagesOpen(previous => !previous)}
                        className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm text-neutral-700"
                      >
                        <span className="truncate">
                          {identitySecondaryLanguages.length > 0
                            ? identitySecondaryLanguages.join(', ')
                            : 'Selecione idiomas secundários'}
                        </span>
                        <span className="text-xs text-neutral-400">{secondaryLanguagesOpen ? 'Fechar' : 'Selecionar'}</span>
                      </button>
                      {secondaryLanguagesOpen ? (
                        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
                          <div className="grid gap-1">
                            {LANGUAGE_OPTIONS.filter(item => item !== identityPrimaryLanguage).map(option => (
                              <button
                                key={option}
                                type="button"
                                onClick={() =>
                                  toggleMultiValue(option, identitySecondaryLanguages, setIdentitySecondaryLanguages)
                                }
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                                  identitySecondaryLanguages.includes(option)
                                    ? 'bg-brand-50 text-brand-800'
                                    : 'text-neutral-700 hover:bg-neutral-50'
                                }`}
                              >
                                <span>{option}</span>
                                <span className="text-xs font-semibold">
                                  {identitySecondaryLanguages.includes(option) ? 'Selecionado' : 'Selecionar'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                    <p className="mb-2 text-xs font-semibold text-neutral-700">Público atendido</p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setTargetAudiencesOpen(previous => !previous)}
                        className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm text-neutral-700"
                      >
                        <span className="truncate">
                          {identityTargetAudiences.length > 0
                            ? identityTargetAudiences.join(', ')
                            : 'Selecione os públicos atendidos'}
                        </span>
                        <span className="text-xs text-neutral-400">{targetAudiencesOpen ? 'Fechar' : 'Selecionar'}</span>
                      </button>
                      {targetAudiencesOpen ? (
                        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
                          <div className="grid gap-1">
                            {TARGET_AUDIENCE_OPTIONS.map(option => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => toggleMultiValue(option, identityTargetAudiences, setIdentityTargetAudiences)}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                                  identityTargetAudiences.includes(option)
                                    ? 'bg-brand-50 text-brand-800'
                                    : 'text-neutral-700 hover:bg-neutral-50'
                                }`}
                              >
                                <span>{option}</span>
                                <span className="text-xs font-semibold">
                                  {identityTargetAudiences.includes(option) ? 'Selecionado' : 'Selecionar'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
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
                  {bioError ? <p className="text-sm font-medium text-red-700">{bioError}</p> : null}
                  <button
                    type="button"
                    onClick={() => void saveIdentityAndPublicProfile()}
                    disabled={identitySaveState === 'saving' || bioSaveState === 'saving'}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {identitySaveState === 'saving' || bioSaveState === 'saving'
                      ? 'Salvando...'
                      : identitySaveState === 'saved' && bioSaveState === 'saved'
                        ? 'Salvo'
                        : 'Salvar identidade e perfil'}
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

              {activeStageId === 'c6_plan_billing_setup_post' ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="text-base font-semibold text-neutral-900">Escolha o plano da operação</h3>
                    <p className="mt-1 text-sm text-neutral-700">
                      Você começa com 90 dias sem cobrança após aprovação e go-live. Escolha o plano que melhor acompanha a evolução do seu perfil, da agenda e da operação financeira.
                    </p>
                    <div className="mt-4 inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-1 text-sm">
                      <button
                        type="button"
                        onClick={() => setSelectedPlanCycle('monthly')}
                        className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                          selectedPlanCycle === 'monthly' ? 'bg-brand-500 text-white' : 'text-neutral-600'
                        }`}
                      >
                        Mensal
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlanCycle('annual')}
                        className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                          selectedPlanCycle === 'annual' ? 'bg-brand-500 text-white' : 'text-neutral-600'
                        }`}
                      >
                        Anual (10x)
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-3">
                    {(['basic', 'professional', 'premium'] as PlanTier[]).map(planTier => {
                      const monthlyPrice = formatCurrencyFromBrl(
                        PLAN_PRICE_BASE_BRL[planTier],
                        displayPlanCurrency,
                        exchangeRates,
                      )
                      const annualPrice = formatCurrencyFromBrl(
                        PLAN_PRICE_BASE_BRL[planTier] * 10,
                        displayPlanCurrency,
                        exchangeRates,
                      )
                      const isCurrent = planTier === String(tier || '').toLowerCase()
                      const isSelected = selectedPlanTier === planTier

                      return (
                        <div
                          key={planTier}
                          className={`rounded-2xl border p-4 transition ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50/40 shadow-sm'
                              : 'border-neutral-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                {PLAN_TIER_LABELS[planTier]}
                              </p>
                              {isCurrent ? (
                                <span className="mt-2 inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                                  Plano atual
                                </span>
                              ) : null}
                            </div>
                            {isSelected ? (
                              <span className="rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                                Selecionado
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4">
                            <p className="text-3xl font-bold text-neutral-900">
                              {selectedPlanCycle === 'monthly' ? monthlyPrice : annualPrice}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {selectedPlanCycle === 'monthly' ? 'por mês' : 'por ano'}
                            </p>
                            <p className="mt-2 text-xs text-emerald-700">90 dias sem cobrança após aprovação.</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedPlanTier(planTier)}
                            className={`mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                              isSelected
                                ? 'border border-brand-500 bg-white text-brand-700'
                                : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-neutral-900'
                            }`}
                          >
                            {isCurrent ? 'Manter este plano' : `Selecionar ${PLAN_TIER_LABELS[planTier]}`}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-neutral-50">
                        <tr>
                          <th className="px-4 py-3 text-neutral-700">Recurso</th>
                          <th className="px-4 py-3 text-neutral-700">Básico</th>
                          <th className="px-4 py-3 text-neutral-700">Profissional</th>
                          <th className="px-4 py-3 text-neutral-700">Premium</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PLAN_COMPARISON_ROWS.map(row => (
                          <tr key={row.label} className="border-t border-neutral-100">
                            <td className="px-4 py-3 font-medium text-neutral-800">{row.label}</td>
                            <td className="px-4 py-3 text-neutral-600">{row.basic}</td>
                            <td className="px-4 py-3 text-neutral-600">{row.professional}</td>
                            <td className="px-4 py-3 text-neutral-600">{row.premium}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-neutral-700">
                        <p>
                          Plano selecionado: <strong>{PLAN_TIER_LABELS[selectedPlanTier]}</strong>
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {selectedPlanCycle === 'monthly'
                            ? `${formatCurrencyFromBrl(PLAN_PRICE_BASE_BRL[selectedPlanTier], displayPlanCurrency, exchangeRates)} por mês`
                            : `${formatCurrencyFromBrl(PLAN_PRICE_BASE_BRL[selectedPlanTier] * 10, displayPlanCurrency, exchangeRates)} por ano`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void savePlanSelection()}
                        disabled={planActionState === 'saving'}
                        className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                      >
                        {planActionState === 'saving'
                          ? 'Salvando...'
                          : selectedPlanTier === String(tier || '').toLowerCase()
                            ? 'Salvar plano'
                            : 'Salvar plano'}
                      </button>
                    </div>
                    {pricingError ? <p className="mt-3 text-xs text-neutral-500">{pricingError}</p> : null}
                    {planActionError ? <p className="mt-3 text-sm text-red-700">{planActionError}</p> : null}
                  </div>
                </div>
              ) : null}

              {activeStageId === 'c7_payout_receipt' ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">Financeiro</h3>
                      {isFinanceBypassEnabled ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                          Modo de teste ativo
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-neutral-700">
                      {isFinanceBypassEnabled
                        ? 'Esta etapa ficará para a ativação final. Para perfis de teste, você pode concluir o onboarding sem configurar recebimentos agora.'
                        : 'Aqui você acompanha o cartão da assinatura e a prontidão de recebimentos. O checkout do plano e os detalhes financeiros continuam nas telas completas.'}
                    </p>
                    {isFinanceBypassEnabled ? (
                      <p className="mt-2 text-xs text-amber-700">
                        Financeiro será concluído depois. Seu acesso atual está em modo de teste.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className={`rounded-xl border p-3 ${currentEvaluation.gates.payout_receipt.blockers.some(item => item.code === 'missing_billing_card') ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                      <p className="text-sm font-semibold text-neutral-900">Cartão da assinatura</p>
                      <p className="mt-1 text-xs text-neutral-700">
                        {currentEvaluation.gates.payout_receipt.blockers.some(item => item.code === 'missing_billing_card')
                          ? 'Ainda falta adicionar o cartão usado para cobrar o plano.'
                          : 'Cartão configurado para a cobrança do plano.'}
                      </p>
                    </div>
                    <div className={`rounded-xl border p-3 ${currentEvaluation.gates.payout_receipt.blockers.some(item => item.code === 'missing_payout_onboarding') ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                      <p className="text-sm font-semibold text-neutral-900">Recebimentos</p>
                      <p className="mt-1 text-xs text-neutral-700">
                        {currentEvaluation.gates.payout_receipt.blockers.some(item => item.code === 'missing_payout_onboarding')
                          ? 'Conecte a conta financeira para receber pela plataforma.'
                          : 'Conta de recebimentos conectada.'}
                      </p>
                    </div>
                    <div className={`rounded-xl border p-3 ${currentEvaluation.gates.payout_receipt.blockers.some(item => item.code === 'missing_payout_kyc') ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                      <p className="text-sm font-semibold text-neutral-900">Validação operacional</p>
                      <p className="mt-1 text-xs text-neutral-700">
                        {currentEvaluation.gates.payout_receipt.blockers.some(item => item.code === 'missing_payout_kyc')
                          ? 'Ainda faltam dados de validação financeira.'
                          : 'Validação financeira concluída.'}
                      </p>
                    </div>
                  </div>

                  {(activeStage?.blockers || []).length > 0 && !isFinanceBypassEnabled ? (
                    <ul className="space-y-2">
                      {(activeStage?.blockers || []).map(blocker => (
                        <li key={blocker.code} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          <p className="font-semibold">{blocker.title}</p>
                          <p className="mt-1 text-xs">{blocker.description}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/planos"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
                    >
                      Abrir cobrança do plano
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/financeiro"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
                    >
                      Abrir área financeira
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setActiveStageId('c8_submit_review')}
                      className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
                    >
                      Continuar para envio
                    </button>
                  </div>
                </div>
              ) : null}

              {activeStageId === 'c8_submit_review' ? (
                <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Pronto para enviar seu perfil?</h3>
                    <p className="mt-1 text-sm text-neutral-700">
                      Revise as pendências abaixo, aceite os termos obrigatórios e envie o perfil para análise sem sair do tracker.
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {stageItems.map(item => (
                      <div
                        key={item.id}
                        className={`rounded-xl border px-3 py-3 text-sm ${
                          item.complete
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                      >
                        <p className="font-semibold">{item.label}</p>
                        <p className="mt-1 text-xs">{item.complete ? 'Etapa concluída.' : item.blocker?.title || 'Ainda pendente.'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900">Termos obrigatórios</h4>
                        <p className="mt-1 text-xs text-neutral-600">
                          Leia até o final e aceite cada termo antes de enviar.
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700">
                        {Object.values(hasAcceptedTerms).filter(Boolean).length}/{TERMS_KEYS.length} aceitos
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {PROFESSIONAL_TERMS.map(term => (
                        <div key={term.key} className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{term.shortLabel}</p>
                            <p className="mt-1 text-xs text-neutral-500">{term.version}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${hasAcceptedTerms[term.key] ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>
                              {hasAcceptedTerms[term.key] ? 'Aceito' : 'Pendente'}
                            </span>
                            <button
                              type="button"
                              onClick={() => openTerm(term.key)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                            >
                              {hasAcceptedTerms[term.key] ? 'Revisar termo' : 'Ler e aceitar'}
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                  {submitTermsError ? <p className="text-sm text-red-700">{submitTermsError}</p> : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void submitForReview()}
                      disabled={submitReviewState === 'saving'}
                      className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitReviewState === 'saving' ? 'Enviando...' : 'Enviar para análise'}
                    </button>
                    {!currentEvaluation.summary.canSubmitForReview ? (
                      <span className="text-xs text-amber-700">Se ainda houver pendências, o tracker vai indicar o que precisa ser ajustado.</span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          {activeTerm ? (
            <div
              className="fixed inset-0 z-[90] flex items-center justify-center bg-neutral-900/55 p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Leitura de termo"
            >
              <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
                <div className="border-b border-neutral-200 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{activeTerm.version}</p>
                  <h3 className="mt-1 text-lg font-semibold text-neutral-900">{activeTerm.title}</h3>
                </div>
                <div
                  ref={termsModalContentRef}
                  className="max-h-[55vh] overflow-y-auto px-5 py-4"
                  onScroll={event => {
                    const element = event.currentTarget
                    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 8) {
                      setTermsModalScrolledToEnd(true)
                    }
                  }}
                >
                  {activeTerm.sections.map(section => (
                    <section key={section.heading} className="mb-4">
                      <h4 className="text-sm font-semibold text-neutral-800">{section.heading}</h4>
                      <p className="mt-1 text-sm leading-6 text-neutral-700">{section.body}</p>
                    </section>
                  ))}
                </div>
                <div className="flex flex-col gap-2 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTermsModalKey(null)
                      setTermsModalScrolledToEnd(false)
                    }}
                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-300"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={acceptActiveTerm}
                    disabled={!termsModalScrolledToEnd}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {termsModalScrolledToEnd ? 'Aceitar termo' : 'Role até o fim para aceitar'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

