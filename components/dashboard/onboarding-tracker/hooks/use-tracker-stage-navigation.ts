'use client'

import { useEffect } from 'react'
import {
  UI_STAGE_ORDER,
  UI_STAGE_BACKEND_STAGE_IDS,
  ACTIONABLE_ADJUSTMENT_STAGE_IDS,
} from '../constants'
import { resolveTrackerViewMode, normalizeStageIdForLookup } from '../helpers'
import type { Stage, TrackerViewMode } from '../types'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'

export function useTrackerStageNavigation(
  open: boolean,
  currentProfessionalStatus: string,
  currentEvaluation: ProfessionalOnboardingEvaluation,
  reviewAdjustments: ReviewAdjustmentItem[],
  setActiveStageId: React.Dispatch<React.SetStateAction<string>>,
) {
  useEffect(() => {
    if (!open) return
    const trackerViewMode = resolveTrackerViewMode(currentProfessionalStatus)
    const trackerIsReadOnly = trackerViewMode === 'submitted_waiting' || trackerViewMode === 'approved'
    const trackerNeedsAdjustments = trackerViewMode === 'needs_changes' || trackerViewMode === 'rejected'
    const openAdj = reviewAdjustments.filter(
      item =>
        (item.status === 'open' || item.status === 'reopened') &&
        ACTIONABLE_ADJUSTMENT_STAGE_IDS.has(String(item.stageId || '')),
    )
    const trackerAdjustmentMode = trackerNeedsAdjustments && openAdj.length > 0
    const editableIds = new Set<string>()
    openAdj.forEach(item => editableIds.add(String(item.stageId || '')))
    editableIds.add('c8_submit_review')

    if (trackerIsReadOnly) {
      setActiveStageId('c8_submit_review')
      return
    }
    if (trackerAdjustmentMode) {
      const firstAdjustmentStage = UI_STAGE_ORDER.find(stageId => editableIds.has(stageId))
      setActiveStageId(firstAdjustmentStage || 'c8_submit_review')
      return
    }

    const stagesById = new Map<string, Stage>()
    currentEvaluation.stages.forEach(stage => stagesById.set(stage.id, stage as Stage))
    const firstPending = UI_STAGE_ORDER.find(id => {
      const backendStageIds = UI_STAGE_BACKEND_STAGE_IDS[id]
      return backendStageIds.some(stageId => {
        const stage = stagesById.get(normalizeStageIdForLookup(stageId))
        return stage ? !stage.complete : false
      })
    })
    setActiveStageId(firstPending || 'c2_professional_identity')
  }, [open, currentProfessionalStatus, currentEvaluation.stages, reviewAdjustments, setActiveStageId])
}
