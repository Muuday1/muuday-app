'use client'

import { useEffect, useRef } from 'react'
import type { MutableRefObject, Dispatch, SetStateAction } from 'react'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'
import { PROFESSIONAL_TERMS_VERSION } from '@/lib/legal/professional-terms'
import { getDefaultExchangeRates } from '@/lib/exchange-rates'
import { TERMS_KEYS } from '../constants'
import {
  withTimeout,
  parseProfileMediaPath,
  normalizeOption,
  isRegistrationQualification,
  sanitizePricingErrorMessage,
} from '../helpers'
import type {
  PlanTier,
  ProfessionalServiceItem,
  QualificationStructured,
  ModalContextPayload,
  ModalContextResponse,
  ModalOptionalContextPayload,
  ProfileSummary,
} from '../types'
import type { ExchangeRateMap } from '@/lib/exchange-rates'
import type { PlanConfigMap } from '@/lib/plan-config'

type Setter<T> = Dispatch<SetStateAction<T>>

export type ModalContextCallbacks = {
  setLoadingContext: Setter<boolean>
  setTermsHydrated: Setter<boolean>
  setHasAcceptedTerms: Setter<Record<string, boolean>>
  setCurrentEvaluation: Setter<ProfessionalOnboardingEvaluation>
  setCurrentProfessionalStatus: Setter<string>
  setReviewAdjustments: Setter<ReviewAdjustmentItem[]>
  setServicesLoadState: Setter<'idle' | 'loaded' | 'degraded' | 'failed'>
  setServicesLoadedSuccessfully: Setter<boolean>
  setServicesLoadError: Setter<string>
  setServices: Setter<ProfessionalServiceItem[]>
  setPlanConfigs: Setter<PlanConfigMap>
  setExchangeRates: Setter<ExchangeRateMap>
  setPlanPricing: Setter<{
    currency: string
    monthlyAmount: number
    annualAmount: number
    provider: string
    fallback?: boolean
    mode?: string
  } | null>
  setPricingError: Setter<string>
  setActiveTier: Setter<PlanTier>
  setSelectedPlanTier: Setter<PlanTier>
  setCategoryNameBySlug: Setter<Record<string, string>>
  setSubcategoryNameBySlug: Setter<Record<string, string>>
  setIsFinanceBypassEnabled: Setter<boolean>
  setServiceCurrency: Setter<string>
  setCoverPhotoUrl: Setter<string>
  setCoverPhotoPath: Setter<string>
  setIdentityDisplayName: Setter<string>
  setIdentityDisplayNameLocked: Setter<boolean>
  setIdentityCategory: Setter<string>
  setIdentitySubcategory: Setter<string>
  setIdentityFocusAreas: Setter<string[]>
  setIdentityTitle: Setter<string>
  setIdentityYearsExperience: Setter<string>
  setIdentityPrimaryLanguage: Setter<string>
  setIdentitySecondaryLanguages: Setter<string[]>
  setIdentityTargetAudiences: Setter<string[]>
  setIdentityQualifications: Setter<QualificationStructured[]>
}

export function useModalContext(options: {
  open: boolean
  professionalId: string
  hasTrackerBootstrap: boolean
  contextReloadNonce: number
  currentProfessionalStatusRef: MutableRefObject<string>
  onTrackerStateChangeRef: MutableRefObject<
    | ((state: {
        evaluation: ProfessionalOnboardingEvaluation
        professionalStatus: string
        reviewAdjustments?: ReviewAdjustmentItem[]
      }) => void)
    | undefined
  >
  callbacks: ModalContextCallbacks
}) {
  const {
    open,
    professionalId,
    hasTrackerBootstrap,
    contextReloadNonce,
    currentProfessionalStatusRef,
    onTrackerStateChangeRef,
  } = options
  const callbacksRef = useRef(options.callbacks)
  callbacksRef.current = options.callbacks

  useEffect(() => {
    if (!open) return

    const callbacks = callbacksRef.current

    let mounted = true
    async function loadModalContext() {
      let criticalLoaded = false
      callbacks.setLoadingContext(true)
      if (!hasTrackerBootstrap) {
        callbacks.setTermsHydrated(false)
      }
      callbacks.setPlanPricing(null)
      callbacks.setPricingError('')
      callbacks.setServicesLoadState('idle')
      callbacks.setServicesLoadedSuccessfully(false)
      callbacks.setServicesLoadError('')
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
            callbacks.setServicesLoadState('failed')
            callbacks.setServicesLoadedSuccessfully(false)
            callbacks.setServicesLoadError(
              String(
                criticalPayload.error ||
                  'Não foi possível carregar seus serviços. Tente novamente em instantes.',
              ),
            )
            callbacks.setServices([])
          }
          throw new Error(
            criticalPayload.error || 'Não foi possível carregar os dados iniciais do tracker.',
          )
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
          callbacks.setCurrentEvaluation(criticalPayload.evaluation)
          const nextStatus =
            typeof criticalPayload.professionalStatus === 'string'
              ? criticalPayload.professionalStatus
              : currentProfessionalStatusRef.current
          if (typeof criticalPayload.professionalStatus === 'string') {
            callbacks.setCurrentProfessionalStatus(criticalPayload.professionalStatus)
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
          callbacks.setReviewAdjustments(criticalPayload.reviewAdjustments)
        }

        const critical = (criticalPayload.critical || {}) as ModalContextPayload
        const professional = (critical.professional || null) as Record<string, unknown> | null
        const existingServices = Array.isArray(critical.services) ? critical.services : []
        const settingsRow = (critical.settings || null) as Record<string, unknown> | null
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
            (normalizedServicesLoadState === 'failed'
              ? 'Não foi possível carregar seus serviços agora.'
              : ''),
        ).trim()

        if (normalizedServicesLoadState === 'failed') {
          callbacks.setServices([])
          callbacks.setServicesLoadedSuccessfully(false)
          callbacks.setServicesLoadError(
            nextServicesLoadError || 'Não foi possível carregar seus serviços agora.',
          )
        } else {
          callbacks.setServices(existingServices as ProfessionalServiceItem[])
          callbacks.setServicesLoadedSuccessfully(true)
          callbacks.setServicesLoadError(
            normalizedServicesLoadState === 'degraded' ? nextServicesLoadError : '',
          )
        }
        callbacks.setServicesLoadState(normalizedServicesLoadState)

        callbacks.setIsFinanceBypassEnabled(Boolean(settingsRow?.onboarding_finance_bypass))

        const resolvedCurrency = String(profileRow?.currency || 'BRL').toUpperCase()
        callbacks.setServiceCurrency(resolvedCurrency)

        const professionalTier = String(professional?.tier || '').toLowerCase()
        const normalizedProfessionalTier: PlanTier =
          professionalTier === 'professional' || professionalTier === 'premium'
            ? professionalTier
            : 'basic'
        callbacks.setActiveTier(normalizedProfessionalTier)
        callbacks.setSelectedPlanTier(normalizedProfessionalTier)

        const avatarUrlCandidate = String(profileRow?.avatar_url || '').trim()
        const profileMediaPath = parseProfileMediaPath(avatarUrlCandidate)
        const professionalMediaPath = parseProfileMediaPath(
          String(professional?.cover_photo_url || '').trim(),
        )
        callbacks.setCoverPhotoPath(profileMediaPath || professionalMediaPath || '')
        callbacks.setCoverPhotoUrl(avatarUrlCandidate)

        const resolvedDisplayName = String(appRow?.display_name || profileRow?.full_name || '')
        callbacks.setIdentityDisplayName(resolvedDisplayName)
        callbacks.setIdentityDisplayNameLocked(resolvedDisplayName.trim().length > 0)

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
        callbacks.setIdentityCategory(suggestedCategory)
        callbacks.setIdentitySubcategory(suggestedSubcategory)

        callbacks.setIdentityFocusAreas(
          Array.isArray(professional?.focus_areas) && professional.focus_areas.length > 0
            ? professional.focus_areas.map((item: unknown) => String(item))
            : Array.isArray(appRow?.focus_areas)
              ? appRow.focus_areas.map((item: unknown) => String(item))
              : [],
        )
        callbacks.setIdentityTitle(String(appRow?.title || ''))
        const yearsFromProfessional = Number(professional?.years_experience)
        const yearsFromApplication = Number(appRow?.years_experience)
        const resolvedYears = Number.isFinite(yearsFromProfessional)
          ? yearsFromProfessional
          : Number.isFinite(yearsFromApplication)
            ? yearsFromApplication
            : 0
        callbacks.setIdentityYearsExperience(String(resolvedYears))
        callbacks.setIdentityPrimaryLanguage(String(appRow?.primary_language || 'Português'))
        callbacks.setIdentitySecondaryLanguages(
          Array.isArray(appRow?.secondary_languages)
            ? appRow.secondary_languages.map((item: unknown) => String(item))
            : [],
        )
        callbacks.setIdentityTargetAudiences(
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
        callbacks.setIdentityQualifications(Array.from(qualificationMap.values()))

        const serverTerms = criticalPayload.termsAcceptanceByKey || {}
        const hasServerTerms = Object.keys(serverTerms).length > 0
        if (hasServerTerms) {
          const acceptedTermsMap = TERMS_KEYS.reduce((acc, key) => {
            acc[key] = Boolean(serverTerms[key])
            return acc
          }, {} as Record<string, boolean>)
          callbacks.setHasAcceptedTerms(acceptedTermsMap)
        } else if (!hasTrackerBootstrap) {
          const legacyTermsAccepted =
            Boolean(settingsRow?.terms_accepted_at) &&
            String(settingsRow?.terms_version || '').trim() === PROFESSIONAL_TERMS_VERSION
          callbacks.setHasAcceptedTerms(
            TERMS_KEYS.reduce(
              (acc, key) => ({ ...acc, [key]: legacyTermsAccepted }),
              {} as Record<string, boolean>,
            ),
          )
        }
        callbacks.setTermsHydrated(true)
        criticalLoaded = true
      } catch {
        if (!mounted) return
        callbacks.setServicesLoadState(previous =>
          previous === 'loaded' || previous === 'degraded' ? previous : 'failed',
        )
        callbacks.setServicesLoadError(previous =>
          previous || 'Não foi possível carregar seus serviços agora. Tente novamente em instantes.',
        )
      } finally {
        if (mounted) {
          callbacks.setLoadingContext(false)
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

        const optional = optionalPayload.optional as ModalOptionalContextPayload | null | undefined
        if (optional) {
          if (optional.planConfigs) {
            callbacks.setPlanConfigs(optional.planConfigs)
          }

          const normalizedRates: ExchangeRateMap = { ...getDefaultExchangeRates() }
          for (const [codeRaw, rateRaw] of Object.entries(optional.exchangeRates || {})) {
            const code = String(codeRaw || '').toUpperCase().trim()
            const rate = Number(rateRaw)
            if (!code || !Number.isFinite(rate) || rate <= 0) continue
            normalizedRates[code] = rate
          }
          callbacks.setExchangeRates(normalizedRates)

          const categoryRows = Array.isArray(optional.categories) ? optional.categories : []
          const subcategoryRows = Array.isArray(optional.subcategories) ? optional.subcategories : []

          const nextCategoryNames: Record<string, string> = {}
          for (const row of categoryRows) {
            const slug = String(row.slug || '').trim().toLowerCase()
            const name = String(row.name_pt || '').trim()
            if (slug && name) nextCategoryNames[slug] = name
          }
          callbacks.setCategoryNameBySlug(nextCategoryNames)

          const nextSubcategoryNames: Record<string, string> = {}
          for (const row of subcategoryRows) {
            const slug = String(row.slug || '').trim().toLowerCase()
            const name = String(row.name_pt || '').trim()
            if (slug && name) nextSubcategoryNames[slug] = name
          }
          callbacks.setSubcategoryNameBySlug(nextSubcategoryNames)

          if (optional.planPricing) {
            callbacks.setPlanPricing(optional.planPricing)
            callbacks.setPricingError('')
          } else if (optional.pricingError) {
            callbacks.setPlanPricing(null)
            callbacks.setPricingError(
              sanitizePricingErrorMessage(
                String(optional.pricingError || 'Preco indisponivel no momento.'),
              ),
            )
          }
        }
      } catch {
        // Dados opcionais não devem bloquear o tracker.
      }
    }

    void loadModalContext()

    return () => {
      mounted = false
    }
  }, [
    open,
    professionalId,
    hasTrackerBootstrap,
    contextReloadNonce,
    currentProfessionalStatusRef,
    onTrackerStateChangeRef,
  ])
}
