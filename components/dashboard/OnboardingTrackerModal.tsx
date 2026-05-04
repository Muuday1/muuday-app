'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Loader2 } from 'lucide-react'
import { getDefaultPlanConfigMap, getPlanConfigForTier, type PlanConfigMap } from '@/lib/plan-config'
import { getDefaultExchangeRates, type ExchangeRateMap } from '@/lib/exchange-rates'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'
import {
  PROFESSIONAL_TERMS_VERSION,
} from '@/lib/legal/professional-terms'

import {
  type Stage,
  type QualificationStructured,
  type OnboardingTrackerModalProps,
  type SaveState,
  type BillingCycle,
  type PlanTier,
  type ProfessionalServiceItem,
} from './onboarding-tracker/types'

import {
  UI_STAGE_ORDER,
  UI_STAGE_LABELS,
  UI_STAGE_BACKEND_STAGE_IDS,
  ACTIONABLE_ADJUSTMENT_STAGE_IDS,
  TERMS_KEYS,
  PLAN_TIER_LABELS,
  QUALIFICATION_APPROVED_OPTIONS,
  QUALIFICATION_FILE_MAX_SIZE_BYTES,
  QUALIFICATION_ALLOWED_TYPES,
} from './onboarding-tracker/constants'

import {
  normalizeStageIdForLookup,
  isValidCoverPhotoUrl,
  resolveTrackerViewMode,
  normalizeOption,
  isRegistrationQualification,
  inferCredentialType,
  getQualificationValidationMessage,
  withTimeout,
  toggleMultiValue,
} from './onboarding-tracker/helpers'

import { PayoutReceiptStage } from './onboarding-tracker/stages/payout-receipt-stage'
import { SubmitReviewStage } from './onboarding-tracker/stages/submit-review-stage'
import { TermsModal } from './onboarding-tracker/stages/terms-modal'
import { PlanSelectionStage } from './onboarding-tracker/stages/plan-selection-stage'
import { ServicesStage } from './onboarding-tracker/stages/services-stage'
import { IdentityStage } from './onboarding-tracker/stages/identity-stage'
import { StageSidebar } from './onboarding-tracker/components/stage-sidebar'
import { TrackerHeader } from './onboarding-tracker/components/tracker-header'
import { AdjustmentBanner } from './onboarding-tracker/components/adjustment-banner'
import { PlanFeatureBanner } from './onboarding-tracker/components/plan-feature-banner'
import { usePhotoState } from './onboarding-tracker/hooks/use-photo-state'
import { useTermsState } from './onboarding-tracker/hooks/use-terms-state'
import { useModalContext } from './onboarding-tracker/hooks/use-modal-context'
import { useIdentityState } from './onboarding-tracker/hooks/use-identity-state'
import { useServiceState } from './onboarding-tracker/hooks/use-service-state'
import { usePlanState } from './onboarding-tracker/hooks/use-plan-state'
import { useSaveSection } from './onboarding-tracker/hooks/use-save-section'

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
  const {
    coverPhotoUrl,
    setCoverPhotoUrl,
    coverPhotoPath,
    setCoverPhotoPath,
    photoUploadState,
    setPhotoUploadState,
    photoUploadError,
    setPhotoUploadError,
    photoValidationChecks,
    setPhotoValidationChecks,
    photoFocusX,
    setPhotoFocusX,
    photoFocusY,
    setPhotoFocusY,
    photoZoom,
    setPhotoZoom,
    pendingPhoto,
    setPendingPhoto,
    photoHealthCheckedRef,
    dragStateRef,
    prepareProfessionalPhoto,
    uploadPreparedProfessionalPhoto,
    handlePhotoDragStart,
    handlePhotoDragMove,
    handlePhotoDragEnd,
  } = usePhotoState(initialCoverPhotoUrl)
  const {
    hasAcceptedTerms,
    setHasAcceptedTerms,
    termsHydrated,
    setTermsHydrated,
    activeTermsModalKey,
    setActiveTermsModalKey,
    termViewTokensByKey,
    setTermViewTokensByKey,
    termsModalScrolledToEnd,
    setTermsModalScrolledToEnd,
    submitTermsError,
    setSubmitTermsError,
    activeTerm,
    openTerm,
    acceptActiveTerm,
    allRequiredTermsAccepted,
  } = useTermsState(initialTermsAcceptanceByKey)
  const termsModalContentRef = useRef<HTMLDivElement | null>(null)
  const onTrackerStateChangeRef = useRef(onTrackerStateChange)
  const [bioSaveState, setBioSaveState] = useState<SaveState>('idle')
  const [bioError, setBioError] = useState('')
  const {
    serviceName,
    setServiceName,
    serviceDescription,
    setServiceDescription,
    servicePrice,
    setServicePrice,
    serviceDuration,
    setServiceDuration,
    editingServiceId,
    setEditingServiceId,
    services,
    setServices,
    serviceSaveState,
    setServiceSaveState,
    serviceError,
    setServiceError,
    serviceCurrency,
    setServiceCurrency,
  } = useServiceState()
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateMap>(getDefaultExchangeRates())
  const [activeTier, setActiveTier] = useState<PlanTier>(initialTier)
  const {
    planPricing,
    setPlanPricing,
    pricingError,
    setPricingError,
    selectedPlanTier,
    setSelectedPlanTier,
    selectedPlanCycle,
    setSelectedPlanCycle,
    planActionState,
    setPlanActionState,
    planActionError,
    setPlanActionError,
  } = usePlanState(initialTier)
  const [isFinanceBypassEnabled, setIsFinanceBypassEnabled] = useState(false)
  const [manualCompletedStageIds, setManualCompletedStageIds] = useState<string[]>([])
  const [loadingContext, setLoadingContext] = useState(false)
  const [contextReloadNonce, setContextReloadNonce] = useState(0)
  const [servicesLoadState, setServicesLoadState] = useState<'idle' | 'loaded' | 'degraded' | 'failed'>('idle')
  const [servicesLoadedSuccessfully, setServicesLoadedSuccessfully] = useState(true)
  const [servicesLoadError, setServicesLoadError] = useState('')
  const [categoryNameBySlug, setCategoryNameBySlug] = useState<Record<string, string>>({})
  const [subcategoryNameBySlug, setSubcategoryNameBySlug] = useState<Record<string, string>>({})
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
  const {
    identityTitle,
    setIdentityTitle,
    identityDisplayName,
    setIdentityDisplayName,
    identityDisplayNameLocked,
    setIdentityDisplayNameLocked,
    identityCategory,
    setIdentityCategory,
    identitySubcategory,
    setIdentitySubcategory,
    identityFocusAreas,
    setIdentityFocusAreas,
    identityYearsExperience,
    setIdentityYearsExperience,
    identityPrimaryLanguage,
    setIdentityPrimaryLanguage,
    identitySecondaryLanguages,
    setIdentitySecondaryLanguages,
    secondaryLanguagesOpen,
    setSecondaryLanguagesOpen,
    identityTargetAudiences,
    setIdentityTargetAudiences,
    targetAudiencesOpen,
    setTargetAudiencesOpen,
    focusAreaInput,
    setFocusAreaInput,
    identityQualifications,
    setIdentityQualifications,
    identityQualificationSelection,
    setIdentityQualificationSelection,
    identityQualificationCustomName,
    setIdentityQualificationCustomName,
    identityQualificationCustomEnabled,
    setIdentityQualificationCustomEnabled,
    identitySaveState,
    setIdentitySaveState,
    identityError,
    setIdentityError,
    addFocusArea,
    removeFocusArea,
    addIdentityQualification,
    uploadQualificationDocument,
    removeQualificationDocument,
  } = useIdentityState(tierLimits)
  const servicesLoadFailed = servicesLoadState === 'failed'
  const serviceActionsDisabled =
    serviceSaveState === 'saving' || servicesLoadState === 'idle' || servicesLoadFailed
  const hasTrackerBootstrap = useMemo(
    () => TERMS_KEYS.every(key => typeof initialTermsAcceptanceByKey?.[key] === 'boolean'),
    [initialTermsAcceptanceByKey],
  )

  useModalContext({
    open,
    professionalId,
    hasTrackerBootstrap,
    contextReloadNonce,
    currentProfessionalStatusRef,
    onTrackerStateChangeRef,
    callbacks: {
      setLoadingContext,
      setTermsHydrated,
      setHasAcceptedTerms,
      setCurrentEvaluation,
      setCurrentProfessionalStatus,
      setReviewAdjustments,
      setServicesLoadState,
      setServicesLoadedSuccessfully,
      setServicesLoadError,
      setServices,
      setPlanConfigs,
      setExchangeRates,
      setPlanPricing,
      setPricingError,
      setActiveTier,
      setSelectedPlanTier,
      setCategoryNameBySlug,
      setSubcategoryNameBySlug,
      setIsFinanceBypassEnabled,
      setServiceCurrency,
      setCoverPhotoUrl,
      setCoverPhotoPath,
      setIdentityDisplayName,
      setIdentityDisplayNameLocked,
      setIdentityCategory,
      setIdentitySubcategory,
      setIdentityFocusAreas,
      setIdentityTitle,
      setIdentityYearsExperience,
      setIdentityPrimaryLanguage,
      setIdentitySecondaryLanguages,
      setIdentityTargetAudiences,
      setIdentityQualifications,
    },
  })

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
            {} as Record<string, boolean>,
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
    const nextBootstrap = TERMS_KEYS.reduce((acc, key) => {
      acc[key] = Boolean(initialTermsAcceptanceByKey?.[key])
      return acc
    }, {} as Record<string, boolean>)
    setHasAcceptedTerms(nextBootstrap)
    setTermsHydrated(TERMS_KEYS.every(key => typeof initialTermsAcceptanceByKey?.[key] === 'boolean'))
  }, [initialTermsAcceptanceByKey, setHasAcceptedTerms, setTermsHydrated])

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
      setPlanActionError('Seleção de plano cancelada. Você pode tentar novamente.')
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
        'Não foi possível remover o serviço.',
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
        isEditing ? 'Não foi possível atualizar o serviço.' : 'Não foi possível criar o serviço.',
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
            <StageSidebar
              stageItems={stageItems}
              activeStageId={activeStageId}
              stageCompletionSummary={stageCompletionSummary}
              trackerRefreshState={trackerRefreshState}
              trackerIsReadOnly={trackerIsReadOnly}
              trackerAdjustmentMode={trackerAdjustmentMode}
              editableStageIds={editableStageIds}
              onSelectStage={(stageId) => setActiveStageId(stageId)}
              onClose={() => setOpen(false)}
            />

            <section className="overflow-y-auto p-4 md:p-5">
              <TrackerHeader
                trackerViewMode={trackerViewMode}
                activeStageId={activeStageId}
                activeStage={activeStage}
              />

              <AdjustmentBanner
                trackerViewMode={trackerViewMode}
                trackerNeedsAdjustments={trackerNeedsAdjustments}
                openReviewAdjustments={openReviewAdjustments}
              />

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
              <PlanFeatureBanner
                activeStageId={activeStageId}
                currentPlanLabel={currentPlanLabel}
                planPricing={planPricing}
                pricingError={pricingError}
                onViewPlans={() => setActiveStageId('c6_plan_billing_setup_post')}
              />

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

