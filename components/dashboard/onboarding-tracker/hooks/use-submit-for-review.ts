'use client'

import { useState, useCallback } from 'react'
import { PROFESSIONAL_TERMS_VERSION } from '@/lib/legal/professional-terms'
import type { SaveState } from '../types'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'

interface UseSubmitForReviewOptions {
  termsHydrated: boolean
  allRequiredTermsAccepted: () => boolean
  openReviewAdjustments: ReviewAdjustmentItem[]
  setCurrentEvaluation: (evaluation: ProfessionalOnboardingEvaluation) => void
  setCurrentProfessionalStatus: (status: string) => void
  setReviewAdjustments: (adjustments: ReviewAdjustmentItem[]) => void
  onTrackerStateChangeRef: React.MutableRefObject<
    | ((state: {
        evaluation: ProfessionalOnboardingEvaluation
        professionalStatus: string
        reviewAdjustments?: ReviewAdjustmentItem[]
      }) => void)
    | undefined
  >
  setSubmitTermsError: (error: string) => void
}

export function useSubmitForReview({
  termsHydrated,
  allRequiredTermsAccepted,
  openReviewAdjustments,
  setCurrentEvaluation,
  setCurrentProfessionalStatus,
  setReviewAdjustments,
  onTrackerStateChangeRef,
  setSubmitTermsError,
}: UseSubmitForReviewOptions) {
  const [submitReviewState, setSubmitReviewState] = useState<SaveState>('idle')
  const [submitReviewMessage, setSubmitReviewMessage] = useState('')

  const submitForReview = useCallback(async () => {
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
  }, [
    termsHydrated,
    allRequiredTermsAccepted,
    openReviewAdjustments,
    setCurrentEvaluation,
    setCurrentProfessionalStatus,
    setReviewAdjustments,
    onTrackerStateChangeRef,
    setSubmitTermsError,
  ])

  return {
    submitReviewState,
    setSubmitReviewState,
    submitReviewMessage,
    setSubmitReviewMessage,
    submitForReview,
  }
}
