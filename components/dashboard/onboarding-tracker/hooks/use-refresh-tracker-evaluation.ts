'use client'

import { useMemo, useRef } from 'react'
import { TERMS_KEYS } from '../constants'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'
import type { SaveState, Stage } from '../types'

interface UseRefreshTrackerEvaluationOptions {
  currentProfessionalStatus: string
  setCurrentEvaluation: React.Dispatch<React.SetStateAction<ProfessionalOnboardingEvaluation>>
  setReviewAdjustments: React.Dispatch<React.SetStateAction<ReviewAdjustmentItem[]>>
  setHasAcceptedTerms: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setTermsHydrated: React.Dispatch<React.SetStateAction<boolean>>
  setCurrentProfessionalStatus: React.Dispatch<React.SetStateAction<string>>
  setContextReloadNonce: React.Dispatch<React.SetStateAction<number>>
  onTrackerStateChangeRef: React.MutableRefObject<
    | ((state: {
        evaluation: ProfessionalOnboardingEvaluation
        professionalStatus: string
        reviewAdjustments?: ReviewAdjustmentItem[]
      }) => void)
    | undefined
  >
}

export function useRefreshTrackerEvaluation(options: UseRefreshTrackerEvaluationOptions) {
  const {
    currentProfessionalStatus,
    setCurrentEvaluation,
    setReviewAdjustments,
    setHasAcceptedTerms,
    setTermsHydrated,
    setCurrentProfessionalStatus,
    setContextReloadNonce,
    onTrackerStateChangeRef,
  } = options

  const refreshTrackerEvaluation = useMemo(() => async () => {
    try {
      const response = await fetch('/api/professional/onboarding/state', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      const json = (await response.json().catch(() => ({}))) as {
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
  }, [currentProfessionalStatus, setCurrentEvaluation, setReviewAdjustments, setHasAcceptedTerms, setTermsHydrated, setCurrentProfessionalStatus, onTrackerStateChangeRef])

  const reloadTrackerContext = useMemo(() => async () => {
    await refreshTrackerEvaluation()
    setContextReloadNonce(previous => previous + 1)
  }, [refreshTrackerEvaluation, setContextReloadNonce])

  return { refreshTrackerEvaluation, reloadTrackerContext }
}
