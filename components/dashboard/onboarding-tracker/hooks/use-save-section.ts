'use client'

import { useCallback, useRef } from 'react'
import { UI_STAGE_ORDER, UI_STAGE_BACKEND_STAGE_IDS } from '../constants'
import { normalizeStageIdForLookup } from '../helpers'
import type { SaveState, ProfessionalServiceItem } from '../types'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'

type OnTrackerStateChange = (state: {
  evaluation: ProfessionalOnboardingEvaluation
  professionalStatus: string
  reviewAdjustments?: ReviewAdjustmentItem[]
}) => void

export function useSaveSection(
  professionalId: string,
  currentProfessionalStatus: string,
  onTrackerStateChange: OnTrackerStateChange | undefined,
  setCurrentEvaluation: (evaluation: ProfessionalOnboardingEvaluation) => void,
  setReviewAdjustments: (adjustments: ReviewAdjustmentItem[]) => void,
  setCurrentProfessionalStatus: (status: string) => void,
  setTrackerRefreshState: (state: SaveState) => void,
  setActiveStageId: (stageId: string) => void,
) {
  const onTrackerStateChangeRef = useRef(onTrackerStateChange)
  onTrackerStateChangeRef.current = onTrackerStateChange

  const saveSection = useCallback(
    async <TPayload extends object>(
      payload: TPayload,
      fallbackError: string,
      options?: { autoAdvance?: boolean },
    ) => {
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
            (stageItem: { id: string; complete: boolean }) =>
              normalizeStageIdForLookup(stageItem.id) === normalizeStageIdForLookup(stageId),
          )
          return stage ? !stage.complete : false
        }),
      )
      if (options?.autoAdvance !== false && nextPending) {
        setActiveStageId(nextPending)
      }

      return json
    },
    [
      professionalId,
      currentProfessionalStatus,
      setCurrentEvaluation,
      setReviewAdjustments,
      setCurrentProfessionalStatus,
      setTrackerRefreshState,
      setActiveStageId,
    ],
  )

  return saveSection
}
