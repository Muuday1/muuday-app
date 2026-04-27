'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, CheckCircle2, Circle, Loader2, Upload, XCircle } from 'lucide-react'
import { getDefaultPlanConfigMap, getPlanConfigForTier, type PlanConfigMap } from '@/lib/plan-config'
import { getDefaultExchangeRates, type ExchangeRateMap } from '@/lib/exchange-rates'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import {
  REVIEW_ADJUSTMENT_STAGE_LABELS,
  type ReviewAdjustmentItem,
} from '@/lib/professional/review-adjustments'
import {
  PROFESSIONAL_TERMS,
  PROFESSIONAL_TERMS_VERSION,
  type ProfessionalTermKey,
} from '@/lib/legal/professional-terms'

import {
  type Blocker,
  type Stage,
  type QualificationStructured,
  type AvailabilityDayState,
  type OnboardingTrackerModalProps,
  type SaveState,
  type BillingCycle,
  type PlanTier,
  type TrackerViewMode,
  type PendingPhoto,
  type ProfileSummary,
  type ModalContextPayload,
  type ModalOptionalContextPayload,
  type ProfessionalServiceItem,
  type ModalContextResponse,
  type PhotoValidationChecks,
  type BlockerCta,
} from './onboarding-tracker/types'

import {
  WEEK_DAYS,
  TIME_OPTIONS,
  UI_STAGE_ORDER,
  UI_STAGE_LABELS,
  UI_STAGE_BACKEND_STAGE_IDS,
  ACTIONABLE_ADJUSTMENT_STAGE_IDS,
  TERMS_KEYS,
  PLAN_PRICE_BASE_BRL,
  PLAN_COMPARISON_ROWS,
  PLAN_ROW_BY_LABEL,
  PLAN_TIER_LABELS,
  LANGUAGE_OPTIONS,
  PROFESSIONAL_TITLES,
  TARGET_AUDIENCE_OPTIONS,
  QUALIFICATION_APPROVED_OPTIONS,
  QUALIFICATION_FILE_MAX_SIZE_BYTES,
  QUALIFICATION_ALLOWED_TYPES,
} from './onboarding-tracker/constants'

import {
  normalizeStageIdForLookup,
  isValidCoverPhotoUrl,
  parseProfileMediaPath,
  sanitizePricingErrorMessage,
  resolveTrackerViewMode,
  normalizeOption,
  isRegistrationQualification,
  inferCredentialType,
  toKeywords,
  formatCurrencyFromBrl,
  clamp,
  rgbToHsl,
  humanizeTaxonomyValue,
  resolveTaxonomyLabel,
  getQualificationValidationMessage,
  readImageDimensions,
  runPhotoAutoValidation,
  buildAvatarCropFile,
  getPlanFeatureHighlights,
  buildDefaultAvailabilityMap,
  getBlockerCta,
  withTimeout,
} from './onboarding-tracker/helpers'

import { PayoutReceiptStage } from './onboarding-tracker/stages/payout-receipt-stage'
import { SubmitReviewStage } from './onboarding-tracker/stages/submit-review-stage'
import { TermsModal } from './onboarding-tracker/stages/terms-modal'
import { PlanSelectionStage } from './onboarding-tracker/stages/plan-selection-stage'
import { ServicesStage } from './onboarding-tracker/stages/services-stage'
import { AvailabilityStage } from './onboarding-tracker/stages/availability-stage'
import { IdentityStage } from './onboarding-tracker/stages/identity-stage'

export function OnboardingTrackerModal({
  professionalId,
  tier,
  professionalStatus,
  onboardingEvaluation,
  initialReviewAdjustments,
  initialTermsAcceptanceByKey,
  initialBio,
  initialCoverPhotoUrl,
  autoOpen = false,
  onTrackerStateChange,
}: OnboardingTrackerModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const initialTier = useMemo<PlanTier>(() => {
    const normalized = String(tier || 'basic').toLowerCase()
    if (normalized === 'professional' || normalized === 'premium') return normalized
    return 'basic'
  }, [tier])
  const [open, setOpen] = useState(false)
  const [activeStageId, setActiveStageId] = useState<string>('c1_create_account')
  const [bio, setBio] = useState(initialBio || '')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initialCoverPhotoUrl || '')
  const [coverPhotoPath, setCoverPhotoPath] = useState('')
  const [photoUploadState, setPhotoUploadState] = useState<SaveState>('idle')
  const [photoUploadError, setPhotoUploadError] = useState('')
  const [photoValidationChecks, setPhotoValidationChecks] = useState<PhotoValidationChecks>({
    format: 'unknown',
    size: 'unknown',
    minResolution: 'unknown',
    faceCentered: 'unknown',
    neutralBackground: 'unknown',
  })
  const [photoFocusX, setPhotoFocusX] = useState(50)
  const [photoFocusY, setPhotoFocusY] = useState(50)
  const [photoZoom, setPhotoZoom] = useState(1)
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null)
  const bootstrapTermsAcceptance = useMemo(
    () =>
      TERMS_KEYS.reduce((acc, key) => {
        acc[key] = Boolean(initialTermsAcceptanceByKey?.[key])
        return acc
      }, {} as Record<ProfessionalTermKey, boolean>),
    [initialTermsAcceptanceByKey],
  )
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<Record<ProfessionalTermKey, boolean>>(() =>
    TERMS_KEYS.reduce((acc, key) => ({ ...acc, [key]: Boolean(initialTermsAcceptanceByKey?.[key]) }), {} as Record<ProfessionalTermKey, boolean>),
  )
  const [termsHydrated, setTermsHydrated] = useState(
    TERMS_KEYS.every(key => typeof initialTermsAcceptanceByKey?.[key] === 'boolean'),
  )
  const [activeTermsModalKey, setActiveTermsModalKey] = useState<ProfessionalTermKey | null>(null)
  const [termViewTokensByKey, setTermViewTokensByKey] = useState<
    Partial<Record<ProfessionalTermKey, string>>
  >({})
  const [termsModalScrolledToEnd, setTermsModalScrolledToEnd] = useState(false)
  const [submitTermsError, setSubmitTermsError] = useState('')
  const dragStateRef = useRef<{ startX: number; startY: number; startFocusX: number; startFocusY: number } | null>(null)
  const termsModalContentRef = useRef<HTMLDivElement | null>(null)
  const onTrackerStateChangeRef = useRef(onTrackerStateChange)
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
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [services, setServices] = useState<ProfessionalServiceItem[]>([])
  const [serviceSaveState, setServiceSaveState] = useState<SaveState>('idle')
  const [serviceError, setServiceError] = useState('')
  const [serviceCurrency, setServiceCurrency] = useState('BRL')
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateMap>(getDefaultExchangeRates())
  const [planPricing, setPlanPricing] = useState<{
    currency: string
    monthlyAmount: number
    annualAmount: number
    provider: string
    fallback?: boolean
    mode?: string
  } | null>(null)
  const [pricingError, setPricingError] = useState('')
  const [activeTier, setActiveTier] = useState<PlanTier>(initialTier)
  const [selectedPlanTier, setSelectedPlanTier] = useState<PlanTier>(initialTier)
  const [selectedPlanCycle, setSelectedPlanCycle] = useState<BillingCycle>('monthly')
  const [planActionState, setPlanActionState] = useState<SaveState>('idle')
  const [planActionError, setPlanActionError] = useState('')
  const [isFinanceBypassEnabled, setIsFinanceBypassEnabled] = useState(false)
  const [manualCompletedStageIds, setManualCompletedStageIds] = useState<string[]>([])
  const [loadingContext, setLoadingContext] = useState(false)
  const [contextReloadNonce, setContextReloadNonce] = useState(0)
  const [servicesLoadState, setServicesLoadState] = useState<'idle' | 'loaded' | 'degraded' | 'failed'>('idle')
  const [servicesLoadedSuccessfully, setServicesLoadedSuccessfully] = useState(true)
  const [servicesLoadError, setServicesLoadError] = useState('')
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, AvailabilityDayState>>(
    buildDefaultAvailabilityMap(),
  )
  const [availabilitySaveState, setAvailabilitySaveState] = useState<SaveState>('idle')
  const [availabilityError, setAvailabilityError] = useState('')
  const [profileTimezone, setProfileTimezone] = useState('America/Sao_Paulo')
  const [categoryNameBySlug, setCategoryNameBySlug] = useState<Record<string, string>>({})
  const [subcategoryNameBySlug, setSubcategoryNameBySlug] = useState<Record<string, string>>({})
  const [minimumNoticeHours, setMinimumNoticeHours] = useState(24)
  const [maxBookingWindowDays, setMaxBookingWindowDays] = useState(30)
  const [bufferMinutes, setBufferMinutes] = useState(15)
  const [confirmationMode, setConfirmationMode] = useState<'auto_accept' | 'manual'>('auto_accept')
  const [enableRecurring, setEnableRecurring] = useState(true)
  const [allowMultiSession, setAllowMultiSession] = useState(true)
  const [requireSessionPurpose, setRequireSessionPurpose] = useState(false)
  const [currentEvaluation, setCurrentEvaluation] = useState(onboardingEvaluation)
  const [reviewAdjustments, setReviewAdjustments] = useState<ReviewAdjustmentItem[]>(
    Array.isArray(initialReviewAdjustments) ? initialReviewAdjustments : [],
  )
  const [currentProfessionalStatus, setCurrentProfessionalStatus] = useState(
    String(professionalStatus || ''),
  )
  const currentProfessionalStatusRef = useRef(String(professionalStatus || ''))
  const [trackerRefreshState, setTrackerRefreshState] = useState<SaveState>('idle')
  const [submitReviewState, setSubmitReviewState] = useState<SaveState>('idle')
  const [submitReviewMessage, setSubmitReviewMessage] = useState('')
  const [planConfigs, setPlanConfigs] = useState<PlanConfigMap>(getDefaultPlanConfigMap())
  const photoHealthCheckedRef = useRef(false)

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

  const normalizedTier = useMemo(() => String(activeTier || 'basic').toLowerCase(), [activeTier])
  const trackerViewMode = useMemo(
    () => resolveTrackerViewMode(currentProfessionalStatus),
    [currentProfessionalStatus],
  )
  const trackerIsReadOnly = trackerViewMode === 'submitted_waiting' || trackerViewMode === 'approved'
  const trackerNeedsAdjustments = trackerViewMode === 'needs_changes' || trackerViewMode === 'rejected'
  const openReviewAdjustments = useMemo(
    () =>
      reviewAdjustments.filter(
        item =>
          (item.status === 'open' || item.status === 'reopened') &&
          ACTIONABLE_ADJUSTMENT_STAGE_IDS.has(String(item.stageId || '')),
      ),
    [reviewAdjustments],
  )
  const trackerAdjustmentMode = trackerNeedsAdjustments && openReviewAdjustments.length > 0
  const editableStageIds = useMemo(() => {
    const set = new Set<string>()
    openReviewAdjustments.forEach(item => set.add(String(item.stageId || '')))
    set.add('c8_submit_review')
    return set
  }, [openReviewAdjustments])
  const stageIsEditable = !trackerAdjustmentMode || editableStageIds.has(activeStageId)
  const tierConfig = useMemo(() => getPlanConfigForTier(planConfigs, normalizedTier), [normalizedTier, planConfigs])
  const tierLimits = tierConfig.limits
  const minNoticeRange = tierConfig.minNoticeRange
  const maxBufferMinutes = tierConfig.bufferConfig.maxMinutes
  const isBasicTier = normalizedTier === 'basic'
  const servicesLoadFailed = servicesLoadState === 'failed'
  const serviceActionsDisabled =
    serviceSaveState === 'saving' || servicesLoadState === 'idle' || servicesLoadFailed
  const hasTrackerBootstrap = useMemo(
    () => TERMS_KEYS.every(key => typeof initialTermsAcceptanceByKey?.[key] === 'boolean'),
    [initialTermsAcceptanceByKey],
  )

  useEffect(() => {
    onTrackerStateChangeRef.current = onTrackerStateChange
  }, [onTrackerStateChange])

  useEffect(() => {
    currentProfessionalStatusRef.current = String(currentProfessionalStatus || '')
  }, [currentProfessionalStatus])
  const refreshTrackerEvaluation = useCallback(async () => {
    try {
      const response = await withTimeout(
        fetch('/api/professional/onboarding/state', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }),
        9000,
      )
      const json = (await withTimeout(
        response.json().catch(() => ({})),
        4000,
      )) as {
        evaluation?: ProfessionalOnboardingEvaluation
        professionalStatus?: string
        reviewAdjustments?: ReviewAdjustmentItem[]
        termsAcceptanceByKey?: Record<string, boolean>
      }
      if (!response.ok || !json.evaluation) {
        return { ok: false, termsLoaded: false }
      }

      setCurrentEvaluation(json.evaluation)
      if (Array.isArray(json.reviewAdjustments)) {
        setReviewAdjustments(json.reviewAdjustments)
      }

      let termsLoaded = false
      if (json.termsAcceptanceByKey && typeof json.termsAcceptanceByKey === 'object') {
        setHasAcceptedTerms(
          TERMS_KEYS.reduce(
            (acc, key) => ({ ...acc, [key]: Boolean(json.termsAcceptanceByKey?.[key]) }),
            {} as Record<ProfessionalTermKey, boolean>,
          ),
        )
        setTermsHydrated(true)
        termsLoaded = true
      } else {
        setTermsHydrated(false)
      }

      if (typeof json.professionalStatus === 'string') {
        setCurrentProfessionalStatus(json.professionalStatus)
        onTrackerStateChangeRef.current?.({
          evaluation: json.evaluation,
          professionalStatus: json.professionalStatus,
          reviewAdjustments: Array.isArray(json.reviewAdjustments) ? json.reviewAdjustments : undefined,
        })
        return { ok: true, termsLoaded }
      }
      onTrackerStateChangeRef.current?.({
        evaluation: json.evaluation,
        professionalStatus: currentProfessionalStatus,
        reviewAdjustments: Array.isArray(json.reviewAdjustments) ? json.reviewAdjustments : undefined,
      })
      return { ok: true, termsLoaded }
    } catch {
      return { ok: false, termsLoaded: false }
    }
  }, [currentProfessionalStatus])

  const reloadTrackerContext = useCallback(async () => {
    await refreshTrackerEvaluation()
    setContextReloadNonce(previous => previous + 1)
  }, [refreshTrackerEvaluation])

  const applyOptionalContext = useCallback(
    (optional: ModalOptionalContextPayload | null | undefined) => {
      if (!optional) return

      if (optional.planConfigs) {
        setPlanConfigs(optional.planConfigs)
      }

      const normalizedRates: ExchangeRateMap = { ...getDefaultExchangeRates() }
      for (const [codeRaw, rateRaw] of Object.entries(optional.exchangeRates || {})) {
        const code = String(codeRaw || '').toUpperCase().trim()
        const rate = Number(rateRaw)
        if (!code || !Number.isFinite(rate) || rate <= 0) continue
        normalizedRates[code] = rate
      }
      setExchangeRates(normalizedRates)

      const categoryRows = Array.isArray(optional.categories) ? optional.categories : []
      const subcategoryRows = Array.isArray(optional.subcategories) ? optional.subcategories : []

      const nextCategoryNames: Record<string, string> = {}
      for (const row of categoryRows) {
        const slug = String(row.slug || '').trim().toLowerCase()
        const name = String(row.name_pt || '').trim()
        if (slug && name) nextCategoryNames[slug] = name
      }
      setCategoryNameBySlug(nextCategoryNames)

      const nextSubcategoryNames: Record<string, string> = {}
      for (const row of subcategoryRows) {
        const slug = String(row.slug || '').trim().toLowerCase()
        const name = String(row.name_pt || '').trim()
        if (slug && name) nextSubcategoryNames[slug] = name
      }
      setSubcategoryNameBySlug(nextSubcategoryNames)

      if (optional.planPricing) {
        setPlanPricing(optional.planPricing)
        setPricingError('')
      } else if (optional.pricingError) {
        setPlanPricing(null)
        setPricingError(
          sanitizePricingErrorMessage(String(optional.pricingError || 'Preco indisponivel no momento.')),
        )
      }
    },
    [],
  )

  useEffect(() => {
    if (!open) return
    if (trackerIsReadOnly) {
      setActiveStageId('c8_submit_review')
      return
    }
    if (trackerAdjustmentMode) {
      const firstAdjustmentStage = UI_STAGE_ORDER.find(stageId => editableStageIds.has(stageId))
      setActiveStageId(firstAdjustmentStage || 'c8_submit_review')
      return
    }
    setActiveStageId(firstPendingStageId)
  }, [open, firstPendingStageId, trackerIsReadOnly, trackerAdjustmentMode, editableStageIds])

  useEffect(() => {
    setCurrentEvaluation(onboardingEvaluation)
  }, [onboardingEvaluation])

  useEffect(() => {
    setReviewAdjustments(Array.isArray(initialReviewAdjustments) ? initialReviewAdjustments : [])
  }, [initialReviewAdjustments])

  useEffect(() => {
    setHasAcceptedTerms(bootstrapTermsAcceptance)
    setTermsHydrated(TERMS_KEYS.every(key => typeof initialTermsAcceptanceByKey?.[key] === 'boolean'))
  }, [bootstrapTermsAcceptance, initialTermsAcceptanceByKey])

  useEffect(() => {
    setCurrentProfessionalStatus(String(professionalStatus || ''))
  }, [professionalStatus])

  useEffect(() => {
    setActiveTier(initialTier)
    setSelectedPlanTier(initialTier)
  }, [initialTier])

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
      let criticalLoaded = false
      setLoadingContext(true)
      if (!hasTrackerBootstrap) {
        setTermsHydrated(false)
      }
      setAvailabilityError('')
      setPlanPricing(null)
      setPricingError('')
      setServicesLoadState('idle')
      setServicesLoadedSuccessfully(false)
      setServicesLoadError('')
      try {
        const criticalParams = new URLSearchParams({ scope: 'critical' })
        if (hasTrackerBootstrap) criticalParams.set('skipTracker', '1')
        if (professionalId) criticalParams.set('professionalId', professionalId)
        const criticalUrl = `/api/professional/onboarding/modal-context?${criticalParams.toString()}`
        const fetchCriticalContext = async () => {
          const response = await withTimeout(
            fetch(criticalUrl, {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            }),
            5000,
          )
          const payload = (await response.json().catch(() => ({}))) as ModalContextResponse
          return { response, payload }
        }

        let { response: criticalResponse, payload: criticalPayload } = await fetchCriticalContext()

        if (!criticalResponse.ok) {
          if (criticalPayload.servicesLoadFailed) {
            setServicesLoadState('failed')
            setServicesLoadedSuccessfully(false)
            setServicesLoadError(
              String(criticalPayload.error || 'Não foi possível carregar seus serviços. Tente novamente em instantes.'),
            )
            setServices([])
          }
          throw new Error(criticalPayload.error || 'Não foi possível carregar os dados iniciais do tracker.')
        }

        const isServicesLoadFailed = (payload: ModalContextResponse) =>
          payload.servicesLoadState === 'failed' || Boolean(payload.servicesLoadFailed)

        for (let attempt = 0; attempt < 2 && isServicesLoadFailed(criticalPayload); attempt += 1) {
          const waitMs = attempt === 0 ? 450 : 900
          await new Promise(resolve => setTimeout(resolve, waitMs))
          try {
            const retryResult = await fetchCriticalContext()
            if (!retryResult.response.ok) break
            criticalResponse = retryResult.response
            criticalPayload = retryResult.payload
          } catch {
            break
          }
        }

        if (!mounted) return

        if (criticalPayload.evaluation) {
          setCurrentEvaluation(criticalPayload.evaluation)
          const nextStatus =
            typeof criticalPayload.professionalStatus === 'string'
              ? criticalPayload.professionalStatus
              : currentProfessionalStatusRef.current
          if (typeof criticalPayload.professionalStatus === 'string') {
            setCurrentProfessionalStatus(criticalPayload.professionalStatus)
          }
          onTrackerStateChangeRef.current?.({
            evaluation: criticalPayload.evaluation,
            professionalStatus: nextStatus,
            reviewAdjustments: Array.isArray(criticalPayload.reviewAdjustments)
              ? criticalPayload.reviewAdjustments
              : undefined,
          })
        }

        if (Array.isArray(criticalPayload.reviewAdjustments)) {
          setReviewAdjustments(criticalPayload.reviewAdjustments)
        }

        const critical = (criticalPayload.critical || {}) as ModalContextPayload
        const professional = (critical.professional || null) as Record<string, unknown> | null
        const existingServices = Array.isArray(critical.services) ? critical.services : []
        const settingsRow = (critical.settings || null) as Record<string, unknown> | null
        const availabilityRows = Array.isArray(critical.availability) ? critical.availability : []
        const appRow = (critical.application || null) as Record<string, unknown> | null
        const credentialRows = Array.isArray(critical.credentials) ? critical.credentials : []
        const profileRow = (critical.profile || null) as ProfileSummary | null

        const normalizedServicesLoadState =
          criticalPayload.servicesLoadState === 'failed'
            ? 'failed'
            : criticalPayload.servicesLoadState === 'degraded'
              ? 'degraded'
              : criticalPayload.servicesLoadState === 'loaded'
                ? 'loaded'
                : criticalPayload.servicesLoadFailed
                  ? 'failed'
                  : 'loaded'
        const nextServicesLoadError = String(
          criticalPayload.servicesLoadError ||
            (normalizedServicesLoadState === 'failed' ? 'Não foi possível carregar seus serviços agora.' : ''),
        ).trim()

        if (normalizedServicesLoadState === 'failed') {
          setServices([])
          setServicesLoadedSuccessfully(false)
          setServicesLoadError(nextServicesLoadError || 'Não foi possível carregar seus serviços agora.')
        } else {
          setServices(existingServices as ProfessionalServiceItem[])
          setServicesLoadedSuccessfully(true)
          setServicesLoadError(normalizedServicesLoadState === 'degraded' ? nextServicesLoadError : '')
        }
        setServicesLoadState(normalizedServicesLoadState)

        const defaults = buildDefaultAvailabilityMap()
        for (const row of availabilityRows) {
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
        setEnableRecurring(
          typeof settingsRow?.enable_recurring === 'boolean' ? Boolean(settingsRow.enable_recurring) : true,
        )
        setAllowMultiSession(
          typeof settingsRow?.allow_multi_session === 'boolean' ? Boolean(settingsRow.allow_multi_session) : true,
        )
        setRequireSessionPurpose(Boolean(settingsRow?.require_session_purpose))
        setIsFinanceBypassEnabled(Boolean(settingsRow?.onboarding_finance_bypass))

        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
        const resolvedCurrency = String(profileRow?.currency || 'BRL').toUpperCase()
        const resolvedTimezone = String(settingsRow?.timezone || profileRow?.timezone || browserTimezone)
        setServiceCurrency(resolvedCurrency)
        setProfileTimezone(resolvedTimezone)

        const professionalTier = String(professional?.tier || '').toLowerCase()
        const normalizedProfessionalTier: PlanTier =
          professionalTier === 'professional' || professionalTier === 'premium'
            ? professionalTier
            : 'basic'
        setActiveTier(normalizedProfessionalTier)
        setSelectedPlanTier(normalizedProfessionalTier)

        const avatarUrlCandidate = String(profileRow?.avatar_url || '').trim()
        const profileMediaPath = parseProfileMediaPath(avatarUrlCandidate)
        const professionalMediaPath = parseProfileMediaPath(String(professional?.cover_photo_url || '').trim())
        setCoverPhotoPath(profileMediaPath || professionalMediaPath || '')
        setCoverPhotoUrl(avatarUrlCandidate)

        const resolvedDisplayName = String(appRow?.display_name || profileRow?.full_name || '')
        setIdentityDisplayName(resolvedDisplayName)
        setIdentityDisplayNameLocked(resolvedDisplayName.trim().length > 0)

        const taxonomySuggestions =
          appRow?.taxonomy_suggestions && typeof appRow.taxonomy_suggestions === 'object'
            ? (appRow.taxonomy_suggestions as Record<string, unknown>)
            : null
        const suggestedCategory = String(
          taxonomySuggestions?.category_slug ||
            taxonomySuggestions?.category ||
            appRow?.category ||
            professional?.category ||
            '',
        ).trim()
        const suggestedSubcategory = String(
          (Array.isArray(professional?.subcategories) && professional.subcategories.length > 0
            ? professional.subcategories[0]
            : '') ||
            taxonomySuggestions?.subcategory_slug ||
            taxonomySuggestions?.subcategory ||
            appRow?.specialty_name ||
            '',
        ).trim()
        setIdentityCategory(suggestedCategory)
        setIdentitySubcategory(suggestedSubcategory)

        setIdentityFocusAreas(
          Array.isArray(professional?.focus_areas) && professional.focus_areas.length > 0
            ? professional.focus_areas.map((item: unknown) => String(item))
            : Array.isArray(appRow?.focus_areas)
              ? appRow.focus_areas.map((item: unknown) => String(item))
              : [],
        )
        setIdentityTitle(String(appRow?.title || ''))
        const yearsFromProfessional = Number(professional?.years_experience)
        const yearsFromApplication = Number(appRow?.years_experience)
        const resolvedYears = Number.isFinite(yearsFromProfessional)
          ? yearsFromProfessional
          : Number.isFinite(yearsFromApplication)
            ? yearsFromApplication
            : 0
        setIdentityYearsExperience(String(resolvedYears))
        setIdentityPrimaryLanguage(String(appRow?.primary_language || 'Português'))
        setIdentitySecondaryLanguages(
          Array.isArray(appRow?.secondary_languages)
            ? appRow.secondary_languages.map((item: unknown) => String(item))
            : [],
        )
        setIdentityTargetAudiences(
          Array.isArray(appRow?.target_audiences)
            ? appRow.target_audiences.map((item: unknown) => String(item))
            : [],
        )

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

        for (const row of credentialRows) {
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

        const serverTerms = criticalPayload.termsAcceptanceByKey || {}
        const hasServerTerms = Object.keys(serverTerms).length > 0
        if (hasServerTerms) {
          const acceptedTermsMap = TERMS_KEYS.reduce((acc, key) => {
            acc[key] = Boolean(serverTerms[key])
            return acc
          }, {} as Record<ProfessionalTermKey, boolean>)
          setHasAcceptedTerms(acceptedTermsMap)
        } else if (!hasTrackerBootstrap) {
          const legacyTermsAccepted =
            Boolean(settingsRow?.terms_accepted_at) &&
            String(settingsRow?.terms_version || '').trim() === PROFESSIONAL_TERMS_VERSION
          setHasAcceptedTerms(
            TERMS_KEYS.reduce(
              (acc, key) => ({ ...acc, [key]: legacyTermsAccepted }),
              {} as Record<ProfessionalTermKey, boolean>,
            ),
          )
        }
        setTermsHydrated(true)
        criticalLoaded = true
      } catch (error) {
        if (!mounted) return
        setServicesLoadState(previous =>
          previous === 'loaded' || previous === 'degraded' ? previous : 'failed',
        )
        setServicesLoadError(previous =>
          previous || 'Não foi possível carregar seus serviços agora. Tente novamente em instantes.',
        )
        setAvailabilityError(
          error instanceof Error ? error.message : 'Não foi possível carregar os dados iniciais do tracker.',
        )
      } finally {
        if (mounted) {
          setLoadingContext(false)
        }
      }

      if (!criticalLoaded || !mounted) {
        return
      }

      try {
        const optionalParams = new URLSearchParams({ scope: 'optional' })
        if (professionalId) optionalParams.set('professionalId', professionalId)
        const optionalResponse = await withTimeout(
          fetch(`/api/professional/onboarding/modal-context?${optionalParams.toString()}`, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }),
          3500,
        )
        if (!mounted || !optionalResponse.ok) return
        const optionalPayload = (await optionalResponse.json().catch(() => ({}))) as ModalContextResponse
        if (!mounted) return
        applyOptionalContext(optionalPayload.optional)
      } catch {
        // Dados opcionais não devem bloquear o tracker.
      }
    }

    void loadModalContext()

    return () => {
      mounted = false
    }
  }, [open, professionalId, applyOptionalContext, hasTrackerBootstrap, contextReloadNonce])

  useEffect(() => {
    if (!open || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const checkoutState = params.get('planCheckout')
    if (!checkoutState) return

    if (checkoutState === 'success') {
      setPlanActionState('saved')
      setManualCompletedStageIds(previous =>
        previous.includes('c6_plan_billing_setup_post') ? previous : [...previous, 'c6_plan_billing_setup_post'],
      )
      void refreshTrackerEvaluation()
      void (async () => {
        const { data: freshProfessional } = await supabase
          .from('professionals')
          .select('tier')
          .eq('id', professionalId)
          .maybeSingle()
        const freshTier = String(freshProfessional?.tier || '').toLowerCase()
        const normalizedFreshTier: PlanTier =
          freshTier === 'professional' || freshTier === 'premium' ? freshTier : 'basic'
        setActiveTier(normalizedFreshTier)
        setSelectedPlanTier(normalizedFreshTier)
      })()
      setTimeout(() => setPlanActionState('idle'), 2200)
    } else if (checkoutState === 'cancelled') {
      setPlanActionState('error')
      setPlanActionError('Selecao de plano cancelada. Voce pode tentar novamente.')
    }

    params.delete('planCheckout')
    const nextQuery = params.toString()
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`
    window.history.replaceState({}, '', nextUrl)
  }, [open, professionalId, refreshTrackerEvaluation, supabase])

  const stageItems = useMemo(() => {
    return UI_STAGE_ORDER.map(id => {
      const backendStages = UI_STAGE_BACKEND_STAGE_IDS[id]
        .map(stageId => stagesById.get(normalizeStageIdForLookup(stageId)))
        .filter(Boolean) as Stage[]

      const completeFromBackend = backendStages.length > 0 && backendStages.every(stage => stage.complete)
      const hasOpenAdjustment = openReviewAdjustments.some(adjustment => adjustment.stageId === id)
      const complete = (completeFromBackend || manualCompletedStageIds.includes(id)) && !hasOpenAdjustment
      const firstBlockedStage = backendStages.find(stage => !stage.complete)
      const firstAdjustment = openReviewAdjustments.find(adjustment => adjustment.stageId === id)

      return {
        id,
        label: UI_STAGE_LABELS[id],
        complete,
        blocker: complete
          ? null
          : hasOpenAdjustment
            ? {
                code: `adjustment:${firstAdjustment?.fieldKey || 'item'}`,
                title: 'Ajuste solicitado',
                description: firstAdjustment?.message || 'Existe um ajuste pendente nesta etapa.',
              }
            : firstBlockedStage?.blockers[0] || null,
      }
    })
  }, [stagesById, manualCompletedStageIds, openReviewAdjustments])

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
  const currentPlanLabel = PLAN_TIER_LABELS[String(activeTier || '').toLowerCase()] || 'Básico'
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
      setPhotoValidationChecks({
        format: 'fail',
        size: 'unknown',
        minResolution: 'unknown',
        faceCentered: 'unknown',
        neutralBackground: 'unknown',
      })
      setPhotoUploadState('error')
      setPhotoUploadError('Formato inválido. Use JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoValidationChecks({
        format: 'pass',
        size: 'fail',
        minResolution: 'unknown',
        faceCentered: 'unknown',
        neutralBackground: 'unknown',
      })
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

      const checks = await runPhotoAutoValidation(file, imageMeta.width, imageMeta.height)
      setPhotoValidationChecks(checks)
      if (checks.faceCentered === 'fail') {
        URL.revokeObjectURL(imageMeta.previewUrl)
        setPhotoUploadState('error')
        setPhotoUploadError('Nao foi possivel validar o rosto centralizado. Escolha outra foto com o rosto bem enquadrado.')
        return
      }
      if (checks.neutralBackground === 'fail') {
        URL.revokeObjectURL(imageMeta.previewUrl)
        setPhotoUploadState('error')
        setPhotoUploadError('Fundo da foto fora do padrao. Use fundo claro ou neutro para continuar.')
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
    if (!pendingPhoto) {
      return {
        avatarUrl: coverPhotoUrl,
        avatarPath: coverPhotoPath,
      }
    }

    if (!photoHealthCheckedRef.current) {
      const healthResponse = await fetch('/api/professional/profile-media/health', {
        method: 'GET',
        credentials: 'include',
      })
      const healthPayload = (await healthResponse.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!healthResponse.ok || !healthPayload.ok) {
        throw new Error(healthPayload.error || 'Storage de fotos indisponivel no momento.')
      }
      photoHealthCheckedRef.current = true
    }

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

    const payload = (await response.json()) as { signedUrl?: string; path?: string }
    const nextUrl = String(payload.signedUrl || '').trim()
    const nextPath = String(payload.path || '').trim()
    if (!nextUrl) {
      throw new Error('A foto foi enviada, mas a URL final nao foi retornada.')
    }
    if (!nextPath) {
      throw new Error('A foto foi enviada, mas o caminho interno nao foi retornado.')
    }

    setCoverPhotoUrl(nextUrl)
    setCoverPhotoPath(nextPath)
    setPendingPhoto(previous => {
      if (previous?.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl)
      }
      return null
    })
    return {
      avatarUrl: nextUrl,
      avatarPath: nextPath,
    }
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
      body: JSON.stringify({
        ...payload,
        professionalId,
      }),
    })
    const json = (await response.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      evaluation?: ProfessionalOnboardingEvaluation
      professionalStatus?: string
      reviewAdjustments?: ReviewAdjustmentItem[]
      service?: ProfessionalServiceItem
      deletedServiceId?: string | null
    }

    if (!response.ok || !json.ok || !json.evaluation) {
      setTrackerRefreshState('error')
      throw new Error(json.error || fallbackError)
    }

    setCurrentEvaluation(json.evaluation)
    if (Array.isArray(json.reviewAdjustments)) {
      setReviewAdjustments(json.reviewAdjustments)
    }
    const nextProfessionalStatus =
      typeof json.professionalStatus === 'string' ? json.professionalStatus : currentProfessionalStatus
    if (typeof json.professionalStatus === 'string') {
      setCurrentProfessionalStatus(json.professionalStatus)
    }
    onTrackerStateChangeRef.current?.({
      evaluation: json.evaluation,
      professionalStatus: nextProfessionalStatus,
      reviewAdjustments: Array.isArray(json.reviewAdjustments) ? json.reviewAdjustments : undefined,
    })
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

  async function openTerm(termKey: ProfessionalTermKey) {
    setSubmitTermsError('')
    try {
      const response = await fetch('/api/professional/onboarding/open-term', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termKey }),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        token?: string
        error?: string
      }
      if (!response.ok || !payload.ok || !payload.token) {
        setSubmitTermsError(payload.error || 'Não foi possível abrir este termo agora.')
        return
      }

      setTermViewTokensByKey(previous => ({ ...previous, [termKey]: payload.token }))
      setActiveTermsModalKey(termKey)
      setTermsModalScrolledToEnd(false)
    } catch (error) {
      setSubmitTermsError(error instanceof Error ? error.message : 'Não foi possível abrir este termo agora.')
    }
  }

  async function acceptActiveTerm() {
    if (!activeTerm || !termsModalScrolledToEnd) return
    const termViewToken = termViewTokensByKey[activeTerm.key]
    if (!termViewToken) {
      setSubmitTermsError('Abra novamente o termo antes de aceitar.')
      return
    }
    setSubmitTermsError('')
    try {
      const response = await fetch('/api/professional/onboarding/accept-term', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termKey: activeTerm.key, termViewToken }),
      })
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !payload.ok) {
        setSubmitTermsError(payload.error || 'Não foi possível registrar o aceite deste termo.')
        return
      }
      setHasAcceptedTerms(previous => ({ ...previous, [activeTerm.key]: true }))
      setTermViewTokensByKey(previous => ({ ...previous, [activeTerm.key]: '' }))
      setActiveTermsModalKey(null)
      setTermsModalScrolledToEnd(false)
    } catch (error) {
      setSubmitTermsError(
        error instanceof Error ? error.message : 'Não foi possível registrar o aceite deste termo.',
      )
    }
  }

  function allRequiredTermsAccepted() {
    if (!termsHydrated) return false
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
        'Nao foi possivel salvar identidade profissional.',
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
      const nextPhoto = pendingPhoto
        ? await uploadPreparedProfessionalPhoto()
        : { avatarUrl: coverPhotoUrl.trim(), avatarPath: coverPhotoPath.trim() }
      if (!isValidCoverPhotoUrl(nextPhoto.avatarUrl.trim())) {
        throw new Error('A URL final da foto do perfil e invalida.')
      }

      await saveSection(
        {
          section: 'public_profile',
          bio: bio.trim(),
          avatarUrl: nextPhoto.avatarUrl.trim(),
          avatarPath: nextPhoto.avatarPath.trim(),
        },
        'Nao foi possivel salvar o perfil publico.',
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
      setBioError(error instanceof Error ? error.message : 'Nao foi possivel salvar o perfil publico.')
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

  function resetServiceForm() {
    setEditingServiceId(null)
    setServiceName('')
    setServiceDescription('')
    setServicePrice('')
    setServiceDuration('60')
  }

  function beginServiceEdit(service: ProfessionalServiceItem) {
    if (servicesLoadFailed) {
      setServiceError('Não foi possível carregar seus serviços. Tente novamente antes de editar.')
      setServiceSaveState('error')
      return
    }
    const selectedCurrency = serviceCurrency || 'BRL'
    const selectedRate = exchangeRates[selectedCurrency] || 1
    const priceInSelectedCurrency =
      selectedCurrency === 'BRL'
        ? Number(service.price_brl || 0)
        : Number(service.price_brl || 0) * selectedRate

    setEditingServiceId(service.id)
    setServiceName(service.name || '')
    setServiceDescription(service.description || '')
    setServicePrice(priceInSelectedCurrency > 0 ? priceInSelectedCurrency.toFixed(2) : '')
    setServiceDuration(String(service.duration_minutes || 60))
    setServiceError('')
    setServiceSaveState('idle')
  }

  async function deleteService(serviceId: string) {
    if (servicesLoadFailed) {
      setServiceSaveState('error')
      setServiceError('Não foi possível carregar seus serviços. Tente novamente antes de excluir.')
      return
    }
    if (!serviceId || serviceSaveState === 'saving') return

    setServiceSaveState('saving')
    setServiceError('')

    try {
      const result = await saveSection(
        {
          section: 'service',
          operation: 'delete',
          serviceId,
        },
        'Nao foi possivel remover o servico.',
        { autoAdvance: false },
      )
      const removedId = String(result.deletedServiceId || serviceId)
      setServices(prev => prev.filter(item => item.id !== removedId))
      if (editingServiceId === removedId) {
        resetServiceForm()
      }
      setServiceSaveState('saved')
      setTimeout(() => setServiceSaveState('idle'), 1500)
    } catch (error) {
      setServiceSaveState('error')
      setServiceError(error instanceof Error ? error.message : 'Não foi possível remover o serviço.')
    }
  }

  async function saveService() {
    const isEditing = Boolean(editingServiceId)
    if (servicesLoadFailed) {
      setServiceSaveState('error')
      setServiceError('Não foi possível carregar seus serviços. Tente novamente antes de salvar alterações.')
      return
    }
    const maxServices = tierLimits.services
    if (!isEditing && services.length >= maxServices) {
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
          operation: isEditing ? 'update' : 'create',
          serviceId: isEditing ? editingServiceId : undefined,
          name: serviceName.trim(),
          description: serviceDescription.trim(),
          priceBrl: Number(priceBrl.toFixed(2)),
          durationMinutes: duration,
        },
        isEditing ? 'Nao foi possivel atualizar o servico.' : 'Nao foi possivel criar o servico.',
        { autoAdvance: false },
      )

      if (result.service) {
        if (isEditing) {
          setServices(prev =>
            prev.map(item => (item.id === result.service!.id ? result.service! : item)),
          )
        } else {
          setServices(prev => [...prev, result.service!])
        }
      }
      resetServiceForm()
      setServiceSaveState('saved')
      setTimeout(() => setServiceSaveState('idle'), 2000)
    } catch (error) {
      setServiceSaveState('error')
      setServiceError(
        error instanceof Error
          ? error.message
          : isEditing
            ? 'Não foi possível atualizar o serviço.'
            : 'Não foi possível criar o serviço.',
      )
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
          confirmationMode: isBasicTier ? 'auto_accept' : confirmationMode,
          enableRecurring,
          allowMultiSession,
          requireSessionPurpose,
        },
        'Nao foi possivel salvar disponibilidade e regras.',
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
      if (selectedPlanTier === String(activeTier || '').toLowerCase()) {
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

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          tier: selectedPlanTier,
          billingCycle: selectedPlanCycle,
          source: 'onboarding_modal',
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

    if (!termsHydrated) {
      setSubmitReviewState('error')
      setSubmitTermsError('Aguarde o carregamento dos termos obrigatórios para enviar.')
      return
    }

    if (!allRequiredTermsAccepted()) {
      setSubmitReviewState('error')
      setSubmitTermsError('Aceite todos os termos obrigatórios antes de enviar.')
      return
    }

    if (openReviewAdjustments.length > 0) {
      setSubmitReviewState('error')
      setSubmitReviewMessage('Resolva todos os ajustes solicitados antes de reenviar para análise.')
      return
    }

    const response = await fetch('/api/professional/onboarding/submit-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        acceptedTerms: true,
        termsVersion: PROFESSIONAL_TERMS_VERSION,
      }),
    })
    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean
      evaluation?: ProfessionalOnboardingEvaluation
      professionalStatus?: string
      error?: string
    }

    if (!response.ok || !payload.ok || !payload.evaluation) {
      setSubmitReviewState('error')
      setSubmitReviewMessage(payload.error || 'Não foi possível enviar o perfil para análise.')
      return
    }

    setCurrentEvaluation(payload.evaluation)
    const nextStatus = String(payload.professionalStatus || 'pending_review')
    setCurrentProfessionalStatus(nextStatus)
    setReviewAdjustments([])
    onTrackerStateChangeRef.current?.({
      evaluation: payload.evaluation,
      professionalStatus: nextStatus,
      reviewAdjustments: [],
    })
    setSubmitReviewState('saved')
    setSubmitReviewMessage(
      'Onboarding concluído. Recebemos seu perfil e ele está em análise. Vamos avisar por e-mail quando houver atualização.',
    )
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
          className="fixed inset-0 z-[80] flex items-end bg-slate-900/45 sm:items-center sm:justify-center sm:px-4 sm:py-5"
          role="dialog"
          aria-modal="true"
          aria-label="Tracker de onboarding profissional"
        >
          <div className="grid h-[100dvh] w-full max-w-full grid-cols-1 overflow-hidden bg-white sm:h-[92vh] sm:max-h-[940px] sm:max-w-[1120px] sm:rounded-lg sm:border sm:border-slate-200 md:grid-cols-[250px_minmax(0,1fr)] lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200/80 bg-slate-50/70 p-3.5 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold tracking-tight text-slate-900">Tracker de onboarding</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Fechar
                </button>
              </div>

              <div className="mb-3 rounded-md border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Progresso</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {stageCompletionSummary.completed} de {stageCompletionSummary.total} etapas concluídas
                    </p>
                  </div>
                  {trackerRefreshState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : null}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.round((stageCompletionSummary.completed / Math.max(1, stageCompletionSummary.total)) * 100)}%` }}
                  />
                </div>
              </div>

              <nav className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 md:hidden">
                {stageItems.map(item => {
                  const isActive = item.id === activeStageId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (trackerIsReadOnly) return
                        if (trackerAdjustmentMode && !editableStageIds.has(item.id)) return
                        setActiveStageId(item.id)
                      }}
                      disabled={trackerIsReadOnly || (trackerAdjustmentMode && !editableStageIds.has(item.id))}
                      className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? 'border-[#9FE870]/40 bg-[#9FE870]/8 text-[#2d5016]'
                          : item.complete
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                      } ${trackerIsReadOnly || (trackerAdjustmentMode && !editableStageIds.has(item.id)) ? 'cursor-not-allowed opacity-70' : ''}`}
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
                      onClick={() => {
                        if (trackerIsReadOnly) return
                        if (trackerAdjustmentMode && !editableStageIds.has(item.id)) return
                        setActiveStageId(item.id)
                      }}
                      disabled={trackerIsReadOnly || (trackerAdjustmentMode && !editableStageIds.has(item.id))}
                      className={`w-full rounded-md border px-3 py-3 text-left transition ${
                        isActive
                          ? 'border-[#9FE870]/40 bg-[#9FE870]/8 text-[#2d5016]'
                          : item.complete
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/60'
                      } ${trackerIsReadOnly || (trackerAdjustmentMode && !editableStageIds.has(item.id)) ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            item.complete
                              ? 'border-green-400 bg-green-100 text-green-700'
                              : item.blocker
                                ? 'border-amber-300 bg-amber-100 text-amber-700'
                                : 'border-slate-300 bg-white text-slate-500'
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
                          <p className="mt-1 text-[11px] text-slate-500">
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
              <div className="mb-4 border-b border-slate-200/80 pb-3">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  {trackerViewMode === 'submitted_waiting'
                    ? 'Onboarding concluído'
                    : trackerViewMode === 'approved'
                      ? 'Perfil aprovado'
                      : UI_STAGE_LABELS[activeStageId as (typeof UI_STAGE_ORDER)[number]]}
                </h2>
                {trackerViewMode === 'submitted_waiting' ? (
                  <p className="mt-1 text-sm text-blue-700">
                    Recebemos seu perfil e ele está em análise. Vamos entrar em contato por e-mail com o resultado.
                  </p>
                ) : trackerViewMode === 'approved' ? (
                  <p className="mt-1 text-sm text-green-700">
                    Seu perfil já foi aprovado. As próximas alterações devem ser feitas pelas páginas de configuração.
                  </p>
                ) : activeStage?.complete ? (
                  <p className="mt-1 text-sm text-green-700">Etapa concluída.</p>
                ) : (
                  <p className="mt-1 text-sm text-amber-700">
                    {activeStage?.blockers[0]?.description || 'Existem pendências nesta etapa.'}
                  </p>
                )}
              </div>

              {trackerNeedsAdjustments ? (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">
                    {trackerViewMode === 'rejected' ? 'Perfil reprovado para esta rodada.' : 'Ajustes solicitados pelo time de revisão.'}
                  </p>
                  <p className="mt-1 text-xs">
                    {openReviewAdjustments.length > 0
                      ? 'Revise os campos pendentes, salve as etapas e envie novamente para análise no final do tracker.'
                      : trackerViewMode === 'rejected'
                        ? 'Não há itens estruturados ativos nesta rodada. Se você já concluiu as correções, pode reenviar; se não souber o que ajustar, o time de revisão precisa publicar uma nova lista.'
                        : 'Não há itens estruturados ativos no momento. Se você já concluiu as correções, pode reenviar; se não souber o que ajustar, o time de revisão precisa publicar uma nova lista.'}
                  </p>
                  {openReviewAdjustments.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-xs">
                      {openReviewAdjustments.map(item => (
                        <li key={item.id} className="rounded-md bg-white/70 px-2 py-1">
                          <span>
                            <span className="font-semibold">
                              {REVIEW_ADJUSTMENT_STAGE_LABELS[item.stageId as keyof typeof REVIEW_ADJUSTMENT_STAGE_LABELS] || item.stageId}
                            </span>{' '}
                            • {item.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              {loadingContext ? (
                <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando dados do tracker...
                  </span>
                </div>
              ) : null}

              {trackerIsReadOnly ? (
                <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-900">
                    <p className="text-sm font-semibold">
                      {trackerViewMode === 'approved' ? 'Perfil aprovado e ativo.' : 'Perfil enviado para análise.'}
                    </p>
                    <p className="mt-1 text-sm">
                      {trackerViewMode === 'approved'
                        ? 'Tudo certo por aqui. Se precisar alterar dados, use as páginas de configuração.'
                        : 'Nossa equipe está revisando suas informações. Verifique também spam e promoções para não perder o e-mail de atualização.'}
                    </p>
                  </div>
                </div>
              ) : !stageIsEditable ? (
                <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
                  Esta etapa não possui ajustes pendentes nesta rodada. Foque apenas nas etapas destacadas e depois envie novamente.
                </div>
              ) : (
                <>
              {getPlanFeatureHighlights(activeStageId).length > 0 ? (
                <div className="mb-4 rounded-md border border-[#9FE870]/20 bg-[#9FE870]/8/50 p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Planos nesta etapa</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {getPlanFeatureHighlights(activeStageId).map(item => (
                          <span
                            key={item}
                            className="inline-flex items-center rounded-full border border-[#9FE870]/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2d5016]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
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
                        className="inline-flex items-center gap-1 font-semibold text-[#3d6b1f] hover:text-[#2d5016]"
                      >
                        Ver planos desta etapa
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {(activeStageId === 'c2_professional_identity') && (
                <IdentityStage
                  pendingPhoto={pendingPhoto}
                  coverPhotoUrl={coverPhotoUrl}
                  photoZoom={photoZoom}
                  setPhotoZoom={setPhotoZoom}
                  photoFocusX={photoFocusX}
                  photoFocusY={photoFocusY}
                  photoValidationChecks={photoValidationChecks}
                  photoUploadState={photoUploadState}
                  photoUploadError={photoUploadError}
                  prepareProfessionalPhoto={prepareProfessionalPhoto}
                  setPhotoUploadState={setPhotoUploadState}
                  setPhotoUploadError={setPhotoUploadError}
                  dragStateRef={dragStateRef}
                  handlePhotoDragMove={handlePhotoDragMove}
                  handlePhotoDragEnd={handlePhotoDragEnd}
                  handlePhotoDragStart={handlePhotoDragStart}
                  identityTitle={identityTitle}
                  setIdentityTitle={setIdentityTitle}
                  identityDisplayName={identityDisplayName}
                  setIdentityDisplayName={setIdentityDisplayName}
                  identityDisplayNameLocked={identityDisplayNameLocked}
                  identityCategory={identityCategory}
                  identitySubcategory={identitySubcategory}
                  categoryNameBySlug={categoryNameBySlug}
                  subcategoryNameBySlug={subcategoryNameBySlug}
                  identityFocusAreas={identityFocusAreas}
                  focusAreaInput={focusAreaInput}
                  setFocusAreaInput={setFocusAreaInput}
                  removeFocusArea={removeFocusArea}
                  addFocusArea={addFocusArea}
                  tierLimits={tierLimits}
                  bio={bio}
                  setBio={setBio}
                  identityYearsExperience={identityYearsExperience}
                  setIdentityYearsExperience={setIdentityYearsExperience}
                  identityPrimaryLanguage={identityPrimaryLanguage}
                  setIdentityPrimaryLanguage={setIdentityPrimaryLanguage}
                  identitySecondaryLanguages={identitySecondaryLanguages}
                  setIdentitySecondaryLanguages={setIdentitySecondaryLanguages}
                  toggleMultiValue={toggleMultiValue}
                  secondaryLanguagesOpen={secondaryLanguagesOpen}
                  setSecondaryLanguagesOpen={setSecondaryLanguagesOpen}
                  identityTargetAudiences={identityTargetAudiences}
                  setIdentityTargetAudiences={setIdentityTargetAudiences}
                  targetAudiencesOpen={targetAudiencesOpen}
                  setTargetAudiencesOpen={setTargetAudiencesOpen}
                  identityQualificationSelection={identityQualificationSelection}
                  setIdentityQualificationSelection={setIdentityQualificationSelection}
                  identityQualificationCustomEnabled={identityQualificationCustomEnabled}
                  setIdentityQualificationCustomEnabled={setIdentityQualificationCustomEnabled}
                  identityQualificationCustomName={identityQualificationCustomName}
                  setIdentityQualificationCustomName={setIdentityQualificationCustomName}
                  identityQualifications={identityQualifications}
                  setIdentityQualifications={setIdentityQualifications}
                  addIdentityQualification={addIdentityQualification}
                  uploadQualificationDocument={uploadQualificationDocument}
                  removeQualificationDocument={removeQualificationDocument}
                  identityError={identityError}
                  bioError={bioError}
                  identitySaveState={identitySaveState}
                  bioSaveState={bioSaveState}
                  saveIdentityAndPublicProfile={saveIdentityAndPublicProfile}
                />
              )}

              {(activeStageId === 'c4_services') && (
                <ServicesStage
                  tierLimits={tierLimits}
                  services={services}
                  servicesLoadedSuccessfully={servicesLoadedSuccessfully}
                  servicesLoadState={servicesLoadState}
                  servicesLoadError={servicesLoadError}
                  servicesLoadFailed={servicesLoadFailed}
                  serviceCurrency={serviceCurrency}
                  serviceName={serviceName}
                  setServiceName={setServiceName}
                  serviceDescription={serviceDescription}
                  setServiceDescription={setServiceDescription}
                  servicePrice={servicePrice}
                  setServicePrice={setServicePrice}
                  serviceDuration={serviceDuration}
                  setServiceDuration={setServiceDuration}
                  editingServiceId={editingServiceId}
                  serviceActionsDisabled={serviceActionsDisabled}
                  serviceError={serviceError}
                  serviceSaveState={serviceSaveState}
                  saveService={saveService}
                  resetServiceForm={resetServiceForm}
                  beginServiceEdit={beginServiceEdit}
                  deleteService={deleteService}
                  reloadTrackerContext={reloadTrackerContext}
                  loadingContext={loadingContext}
                  exchangeRates={exchangeRates}
                />
              )}

                            
              {(activeStageId === 'c5_availability_calendar') && (
                <AvailabilityStage
                  profileTimezone={profileTimezone}
                  availabilityMap={availabilityMap}
                  setAvailabilityMap={setAvailabilityMap}
                  minimumNoticeHours={minimumNoticeHours}
                  setMinimumNoticeHours={setMinimumNoticeHours}
                  minNoticeRange={minNoticeRange}
                  maxBookingWindowDays={maxBookingWindowDays}
                  setMaxBookingWindowDays={setMaxBookingWindowDays}
                  tierLimits={tierLimits}
                  bufferMinutes={bufferMinutes}
                  setBufferMinutes={setBufferMinutes}
                  maxBufferMinutes={maxBufferMinutes}
                  isBasicTier={isBasicTier}
                  confirmationMode={confirmationMode}
                  setConfirmationMode={setConfirmationMode}
                  enableRecurring={enableRecurring}
                  setEnableRecurring={setEnableRecurring}
                  allowMultiSession={allowMultiSession}
                  setAllowMultiSession={setAllowMultiSession}
                  requireSessionPurpose={requireSessionPurpose}
                  setRequireSessionPurpose={setRequireSessionPurpose}
                  availabilityError={availabilityError}
                  availabilitySaveState={availabilitySaveState}
                  saveAvailabilityCalendar={saveAvailabilityCalendar}
                />
              )}

              {activeStageId === 'c6_plan_billing_setup_post' ? (
                <PlanSelectionStage
                  selectedPlanCycle={selectedPlanCycle}
                  setSelectedPlanCycle={setSelectedPlanCycle}
                  selectedPlanTier={selectedPlanTier}
                  setSelectedPlanTier={setSelectedPlanTier}
                  activeTier={activeTier}
                  displayPlanCurrency={displayPlanCurrency}
                  exchangeRates={exchangeRates}
                  planActionState={planActionState}
                  savePlanSelection={savePlanSelection}
                  pricingError={pricingError}
                  planPricing={planPricing}
                  planActionError={planActionError}
                />
              ) : null}

              {activeStageId === 'c7_payout_receipt' ? (
                <PayoutReceiptStage
                  isFinanceBypassEnabled={isFinanceBypassEnabled}
                  payoutReceiptBlockers={currentEvaluation.gates.payout_receipt.blockers}
                  activeStageBlockers={activeStage?.blockers || []}
                  onCloseModal={() => setOpen(false)}
                  onContinue={() => setActiveStageId('c8_submit_review')}
                />
              ) : null}

              {activeStageId === 'c8_submit_review' ? (
                <SubmitReviewStage
                  stageItems={stageItems}
                  termsHydrated={termsHydrated}
                  hasAcceptedTerms={hasAcceptedTerms}
                  activeStageBlockers={activeStage?.blockers || []}
                  submitReviewState={submitReviewState}
                  submitReviewMessage={submitReviewMessage}
                  submitTermsError={submitTermsError}
                  canSubmitForReview={currentEvaluation.summary.canSubmitForReview}
                  onOpenTerm={openTerm}
                  onSubmitForReview={submitForReview}
                />
              ) : null}
                </>
              )}
            </section>
          </div>

          <TermsModal
            activeTermKey={activeTermsModalKey}
            termsModalScrolledToEnd={termsModalScrolledToEnd}
            contentRef={termsModalContentRef}
            onScroll={event => {
              const element = event.currentTarget
              if (element.scrollTop + element.clientHeight >= element.scrollHeight - 8) {
                setTermsModalScrolledToEnd(true)
              }
            }}
            onClose={() => {
              setActiveTermsModalKey(null)
              setTermsModalScrolledToEnd(false)
            }}
            onAccept={acceptActiveTerm}
          />
        </div>
      ) : null}
    </>
  )
}

