'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'
import { getDefaultPlanConfigMap, getPlanConfigForTier, type PlanConfigMap } from '@/lib/plan-config'
import { getDefaultExchangeRates, type ExchangeRateMap } from '@/lib/exchange-rates'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'

import {
  type OnboardingTrackerModalProps,
  type SaveState,
  type PlanTier,
} from './onboarding-tracker/types'

import { TERMS_KEYS } from './onboarding-tracker/constants'
import { toggleMultiValue } from './onboarding-tracker/helpers'

import { TrackerModalBody } from './onboarding-tracker/components/TrackerModalBody'
import { usePhotoState } from './onboarding-tracker/hooks/use-photo-state'
import { useTermsState } from './onboarding-tracker/hooks/use-terms-state'
import { useModalContext } from './onboarding-tracker/hooks/use-modal-context'
import { useIdentityState } from './onboarding-tracker/hooks/use-identity-state'
import { useServiceState } from './onboarding-tracker/hooks/use-service-state'
import { usePlanState } from './onboarding-tracker/hooks/use-plan-state'
import { useSaveSection } from './onboarding-tracker/hooks/use-save-section'
import { usePublicProfile } from './onboarding-tracker/hooks/use-public-profile'
import { useSubmitForReview } from './onboarding-tracker/hooks/use-submit-for-review'
import { useRefreshTrackerEvaluation } from './onboarding-tracker/hooks/use-refresh-tracker-evaluation'
import { useTrackerStageNavigation } from './onboarding-tracker/hooks/use-tracker-stage-navigation'
import { useTrackerDerivedState } from './onboarding-tracker/hooks/use-tracker-derived-state'
import { usePlanCheckoutParams } from './onboarding-tracker/hooks/use-plan-checkout-params'

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
  const onTrackerStateChangeRef = useRef(onTrackerStateChange)
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
  const [planConfigs, setPlanConfigs] = useState<PlanConfigMap>(getDefaultPlanConfigMap())
  const [isFinanceBypassEnabled, setIsFinanceBypassEnabled] = useState(false)
  const [manualCompletedStageIds, setManualCompletedStageIds] = useState<string[]>([])
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateMap>(getDefaultExchangeRates())
  const [activeTier, setActiveTier] = useState<PlanTier>(initialTier)
  const termsModalContentRef = useRef<HTMLDivElement | null>(null)

  const normalizedTier = useMemo(() => String(activeTier || 'basic').toLowerCase(), [activeTier])
  const tierConfig = useMemo(() => getPlanConfigForTier(planConfigs, normalizedTier), [normalizedTier, planConfigs])
  const tierLimits = tierConfig.limits

  const saveSection = useSaveSection(
    professionalId,
    currentProfessionalStatus,
    onTrackerStateChange,
    setCurrentEvaluation,
    setReviewAdjustments,
    setCurrentProfessionalStatus,
    setTrackerRefreshState,
    setActiveStageId,
  )

  const photoState = usePhotoState(initialCoverPhotoUrl)
  const termsState = useTermsState(initialTermsAcceptanceByKey)
  const identityState = useIdentityState(tierLimits, saveSection)
  const serviceState = useServiceState(tierLimits, exchangeRates, saveSection)
  const planState = usePlanState(activeTier, supabase)

  const publicProfile = usePublicProfile({
    initialBio,
    saveSection,
    coverPhotoUrl: photoState.coverPhotoUrl,
    coverPhotoPath: photoState.coverPhotoPath,
    pendingPhoto: photoState.pendingPhoto,
    photoUploadState: photoState.photoUploadState,
    setPhotoUploadState: photoState.setPhotoUploadState,
    setPhotoUploadError: photoState.setPhotoUploadError,
    uploadPreparedProfessionalPhoto: photoState.uploadPreparedProfessionalPhoto,
    setActiveStageId,
  })

  const submitReview = useSubmitForReview({
    termsHydrated: termsState.termsHydrated,
    allRequiredTermsAccepted: termsState.allRequiredTermsAccepted,
    openReviewAdjustments: reviewAdjustments,
    setCurrentEvaluation,
    setCurrentProfessionalStatus,
    setReviewAdjustments,
    onTrackerStateChangeRef,
    setSubmitTermsError: termsState.setSubmitTermsError,
  })

  const servicesLoadFailed = servicesLoadState === 'failed'
  const serviceActionsDisabled =
    serviceState.serviceSaveState === 'saving' || servicesLoadState === 'idle' || servicesLoadFailed
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
      setTermsHydrated: termsState.setTermsHydrated,
      setHasAcceptedTerms: termsState.setHasAcceptedTerms,
      setCurrentEvaluation,
      setCurrentProfessionalStatus,
      setReviewAdjustments,
      setServicesLoadState,
      setServicesLoadedSuccessfully,
      setServicesLoadError,
      setServices: serviceState.setServices,
      setPlanConfigs,
      setExchangeRates,
      setPlanPricing: planState.setPlanPricing,
      setPricingError: planState.setPricingError,
      setActiveTier,
      setSelectedPlanTier: planState.setSelectedPlanTier,
      setCategoryNameBySlug,
      setSubcategoryNameBySlug,
      setIsFinanceBypassEnabled,
      setServiceCurrency: serviceState.setServiceCurrency,
      setCoverPhotoUrl: photoState.setCoverPhotoUrl,
      setCoverPhotoPath: photoState.setCoverPhotoPath,
      setIdentityDisplayName: identityState.setIdentityDisplayName,
      setIdentityDisplayNameLocked: identityState.setIdentityDisplayNameLocked,
      setIdentityCategory: identityState.setIdentityCategory,
      setIdentitySubcategory: identityState.setIdentitySubcategory,
      setIdentityFocusAreas: identityState.setIdentityFocusAreas,
      setIdentityTitle: identityState.setIdentityTitle,
      setIdentityYearsExperience: identityState.setIdentityYearsExperience,
      setIdentityPrimaryLanguage: identityState.setIdentityPrimaryLanguage,
      setIdentitySecondaryLanguages: identityState.setIdentitySecondaryLanguages,
      setIdentityTargetAudiences: identityState.setIdentityTargetAudiences,
      setIdentityQualifications: identityState.setIdentityQualifications,
    },
  })

  const { refreshTrackerEvaluation, reloadTrackerContext } = useRefreshTrackerEvaluation({
    currentProfessionalStatus,
    setCurrentEvaluation,
    setReviewAdjustments,
    setHasAcceptedTerms: termsState.setHasAcceptedTerms,
    setTermsHydrated: termsState.setTermsHydrated,
    setCurrentProfessionalStatus,
    setContextReloadNonce,
    onTrackerStateChangeRef,
  })

  useTrackerStageNavigation(open, currentProfessionalStatus, currentEvaluation, reviewAdjustments, setActiveStageId)

  // Prop sync effects
  useEffect(() => { onTrackerStateChangeRef.current = onTrackerStateChange }, [onTrackerStateChange])
  useEffect(() => { currentProfessionalStatusRef.current = String(currentProfessionalStatus || '') }, [currentProfessionalStatus])
  useEffect(() => { setCurrentEvaluation(onboardingEvaluation) }, [onboardingEvaluation])
  useEffect(() => { setReviewAdjustments(Array.isArray(initialReviewAdjustments) ? initialReviewAdjustments : []) }, [initialReviewAdjustments])
  useEffect(() => {
    const nextBootstrap = TERMS_KEYS.reduce((acc, key) => {
      acc[key] = Boolean(initialTermsAcceptanceByKey?.[key])
      return acc
    }, {} as Record<string, boolean>)
    termsState.setHasAcceptedTerms(nextBootstrap)
    termsState.setTermsHydrated(TERMS_KEYS.every(key => typeof initialTermsAcceptanceByKey?.[key] === 'boolean'))
  }, [initialTermsAcceptanceByKey, termsState])
  useEffect(() => { setCurrentProfessionalStatus(String(professionalStatus || '')) }, [professionalStatus])
  useEffect(() => {
    setActiveTier(initialTier)
    planState.setSelectedPlanTier(initialTier)
  }, [initialTier, planState])
  useEffect(() => { if (autoOpen) setOpen(true) }, [autoOpen])
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])
  useEffect(() => {
    return () => {
      if (photoState.pendingPhoto?.previewUrl) {
        URL.revokeObjectURL(photoState.pendingPhoto.previewUrl)
      }
    }
  }, [photoState.pendingPhoto])
  useEffect(() => {
    if (!termsState.activeTerm || !termsModalContentRef.current) return
    const element = termsModalContentRef.current
    if (element.scrollHeight <= element.clientHeight + 8) {
      termsState.setTermsModalScrolledToEnd(true)
    }
  }, [termsState.activeTerm, termsState.setTermsModalScrolledToEnd])

  usePlanCheckoutParams({
    open,
    professionalId,
    supabase,
    refreshTrackerEvaluation,
    setPlanActionState: planState.setPlanActionState,
    setManualCompletedStageIds,
    setPlanActionError: planState.setPlanActionError,
    setActiveTier,
    setSelectedPlanTier: planState.setSelectedPlanTier,
  })

  const derived = useTrackerDerivedState(
    currentProfessionalStatus,
    currentEvaluation,
    reviewAdjustments,
    manualCompletedStageIds,
    activeStageId,
    activeTier,
    planState.planPricing,
    serviceState.serviceCurrency,
  )

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

      {open && (
        <TrackerModalBody
          stageItems={derived.stageItems}
          activeStageId={activeStageId}
          stageCompletionSummary={derived.stageCompletionSummary}
          trackerRefreshState={trackerRefreshState}
          trackerIsReadOnly={derived.trackerIsReadOnly}
          trackerAdjustmentMode={derived.trackerAdjustmentMode}
          editableStageIds={derived.editableStageIds}
          onSelectStage={setActiveStageId}
          onClose={() => setOpen(false)}
          trackerViewMode={derived.trackerViewMode}
          activeStage={derived.activeStage}
          trackerNeedsAdjustments={derived.trackerNeedsAdjustments}
          openReviewAdjustments={derived.openReviewAdjustments}
          loadingContext={loadingContext}
          stageIsEditable={derived.stageIsEditable}
          currentPlanLabel={derived.currentPlanLabel}
          planPricing={planState.planPricing}
          pricingError={planState.pricingError}
          onViewPlans={() => setActiveStageId('c6_plan_billing_setup_post')}
          identityProps={{
            pendingPhoto: photoState.pendingPhoto,
            coverPhotoUrl: photoState.coverPhotoUrl,
            photoZoom: photoState.photoZoom,
            setPhotoZoom: photoState.setPhotoZoom,
            photoFocusX: photoState.photoFocusX,
            photoFocusY: photoState.photoFocusY,
            photoValidationChecks: photoState.photoValidationChecks,
            photoUploadState: photoState.photoUploadState,
            photoUploadError: photoState.photoUploadError,
            prepareProfessionalPhoto: photoState.prepareProfessionalPhoto,
            setPhotoUploadState: photoState.setPhotoUploadState,
            setPhotoUploadError: photoState.setPhotoUploadError,
            dragStateRef: photoState.dragStateRef,
            handlePhotoDragMove: photoState.handlePhotoDragMove,
            handlePhotoDragEnd: photoState.handlePhotoDragEnd,
            handlePhotoDragStart: photoState.handlePhotoDragStart,
            identityTitle: identityState.identityTitle,
            setIdentityTitle: identityState.setIdentityTitle,
            identityDisplayName: identityState.identityDisplayName,
            setIdentityDisplayName: identityState.setIdentityDisplayName,
            identityDisplayNameLocked: identityState.identityDisplayNameLocked,
            identityCategory: identityState.identityCategory,
            identitySubcategory: identityState.identitySubcategory,
            categoryNameBySlug,
            subcategoryNameBySlug,
            identityFocusAreas: identityState.identityFocusAreas,
            focusAreaInput: identityState.focusAreaInput,
            setFocusAreaInput: identityState.setFocusAreaInput,
            removeFocusArea: identityState.removeFocusArea,
            addFocusArea: identityState.addFocusArea,
            tierLimits,
            bio: publicProfile.bio,
            setBio: publicProfile.setBio,
            identityYearsExperience: identityState.identityYearsExperience,
            setIdentityYearsExperience: identityState.setIdentityYearsExperience,
            identityPrimaryLanguage: identityState.identityPrimaryLanguage,
            setIdentityPrimaryLanguage: identityState.setIdentityPrimaryLanguage,
            identitySecondaryLanguages: identityState.identitySecondaryLanguages,
            setIdentitySecondaryLanguages: identityState.setIdentitySecondaryLanguages,
            toggleMultiValue,
            secondaryLanguagesOpen: identityState.secondaryLanguagesOpen,
            setSecondaryLanguagesOpen: identityState.setSecondaryLanguagesOpen,
            identityTargetAudiences: identityState.identityTargetAudiences,
            setIdentityTargetAudiences: identityState.setIdentityTargetAudiences,
            targetAudiencesOpen: identityState.targetAudiencesOpen,
            setTargetAudiencesOpen: identityState.setTargetAudiencesOpen,
            identityQualificationSelection: identityState.identityQualificationSelection,
            setIdentityQualificationSelection: identityState.setIdentityQualificationSelection,
            identityQualificationCustomEnabled: identityState.identityQualificationCustomEnabled,
            setIdentityQualificationCustomEnabled: identityState.setIdentityQualificationCustomEnabled,
            identityQualificationCustomName: identityState.identityQualificationCustomName,
            setIdentityQualificationCustomName: identityState.setIdentityQualificationCustomName,
            identityQualifications: identityState.identityQualifications,
            setIdentityQualifications: identityState.setIdentityQualifications,
            addIdentityQualification: identityState.addIdentityQualification,
            uploadQualificationDocument: identityState.uploadQualificationDocument,
            removeQualificationDocument: identityState.removeQualificationDocument,
            identityError: identityState.identityError,
            bioError: publicProfile.bioError,
            identitySaveState: identityState.identitySaveState,
            bioSaveState: publicProfile.bioSaveState,
            saveIdentityAndPublicProfile: () => publicProfile.saveIdentityAndPublicProfile(identityState.saveIdentity),
          }}
          servicesProps={{
            tierLimits,
            services: serviceState.services,
            servicesLoadedSuccessfully,
            servicesLoadState,
            servicesLoadError,
            servicesLoadFailed,
            serviceCurrency: serviceState.serviceCurrency,
            serviceName: serviceState.serviceName,
            setServiceName: serviceState.setServiceName,
            serviceDescription: serviceState.serviceDescription,
            setServiceDescription: serviceState.setServiceDescription,
            servicePrice: serviceState.servicePrice,
            setServicePrice: serviceState.setServicePrice,
            serviceDuration: serviceState.serviceDuration,
            setServiceDuration: serviceState.setServiceDuration,
            editingServiceId: serviceState.editingServiceId,
            serviceActionsDisabled,
            serviceError: serviceState.serviceError,
            serviceSaveState: serviceState.serviceSaveState,
            saveService: () => serviceState.saveService(servicesLoadFailed),
            resetServiceForm: serviceState.resetServiceForm,
            beginServiceEdit: service => serviceState.beginServiceEdit(service, servicesLoadFailed),
            deleteService: id => serviceState.deleteService(id, servicesLoadFailed),
            reloadTrackerContext,
            loadingContext,
            exchangeRates,
          }}
          planSelectionProps={{
            selectedPlanCycle: planState.selectedPlanCycle,
            setSelectedPlanCycle: planState.setSelectedPlanCycle,
            selectedPlanTier: planState.selectedPlanTier,
            setSelectedPlanTier: planState.setSelectedPlanTier,
            activeTier,
            displayPlanCurrency: derived.displayPlanCurrency,
            exchangeRates,
            planActionState: planState.planActionState,
            savePlanSelection: planState.savePlanSelection,
            pricingError: planState.pricingError,
            planPricing: planState.planPricing,
            planActionError: planState.planActionError,
          }}
          payoutReceiptProps={{
            payoutReceiptBlockers: currentEvaluation.gates.payout_receipt.blockers,
            activeStageBlockers: derived.activeStage?.blockers || [],
            onCloseModal: () => setOpen(false),
            onContinue: () => setActiveStageId('c8_submit_review'),
          }}
          submitReviewProps={{
            stageItems: derived.stageItems,
            termsHydrated: termsState.termsHydrated,
            hasAcceptedTerms: termsState.hasAcceptedTerms,
            activeStageBlockers: derived.activeStage?.blockers || [],
            submitReviewState: submitReview.submitReviewState,
            submitReviewMessage: submitReview.submitReviewMessage,
            submitTermsError: termsState.submitTermsError,
            canSubmitForReview: currentEvaluation.summary.canSubmitForReview,
            onOpenTerm: (key: string) => { void termsState.openTerm(key as Parameters<typeof termsState.openTerm>[0]); },
            onSubmitForReview: submitReview.submitForReview,
          }}
          activeTermsModalKey={termsState.activeTermsModalKey}
          termsModalScrolledToEnd={termsState.termsModalScrolledToEnd}
          termsModalContentRef={termsModalContentRef}
          onTermsScroll={event => {
            const element = event.currentTarget
            if (element.scrollTop + element.clientHeight >= element.scrollHeight - 8) {
              termsState.setTermsModalScrolledToEnd(true)
            }
          }}
          onTermsClose={() => {
            termsState.setActiveTermsModalKey(null)
            termsState.setTermsModalScrolledToEnd(false)
          }}
          onTermsAccept={termsState.acceptActiveTerm}
        />
      )}
    </>
  )
}
