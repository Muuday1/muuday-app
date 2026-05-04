'use client'

import { useMemo } from 'react'
import {
  UI_STAGE_ORDER,
  UI_STAGE_BACKEND_STAGE_IDS,
  UI_STAGE_LABELS,
  ACTIONABLE_ADJUSTMENT_STAGE_IDS,
  PLAN_TIER_LABELS,
} from '../constants'
import { normalizeStageIdForLookup, resolveTrackerViewMode } from '../helpers'
import type { Stage, TrackerViewMode } from '../types'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'

interface TrackerDerivedState {
  stagesById: Map<string, Stage>
  firstPendingStageId: string
  trackerViewMode: TrackerViewMode
  trackerIsReadOnly: boolean
  trackerNeedsAdjustments: boolean
  openReviewAdjustments: ReviewAdjustmentItem[]
  trackerAdjustmentMode: boolean
  editableStageIds: Set<string>
  stageIsEditable: boolean
  stageItems: Array<{
    id: string
    label: string
    complete: boolean
    blocker: { code: string; title: string; description: string } | null
  }>
  stageCompletionSummary: { total: number; completed: number }
  activeStage: Stage | undefined
  currentPlanLabel: string
  displayPlanCurrency: string
}

export function useTrackerDerivedState(
  currentProfessionalStatus: string,
  currentEvaluation: ProfessionalOnboardingEvaluation,
  reviewAdjustments: ReviewAdjustmentItem[],
  manualCompletedStageIds: string[],
  activeStageId: string,
  activeTier: string,
  planPricing: { currency: string } | null,
  serviceCurrency: string,
): TrackerDerivedState {
  const stagesById = useMemo(() => {
    const map = new Map<string, Stage>()
    currentEvaluation.stages.forEach(stage => map.set(stage.id, stage as Stage))
    return map
  }, [currentEvaluation.stages])

  const firstPendingStageId = useMemo(() => {
    const firstPending = UI_STAGE_ORDER.find(id => {
      const backendStageIds = UI_STAGE_BACKEND_STAGE_IDS[id]
      return backendStageIds.some(stageId => {
        const stage = stagesById.get(normalizeStageIdForLookup(stageId))
        return stage ? !stage.complete : false
      })
    })
    return firstPending || 'c2_professional_identity'
  }, [stagesById])

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

  return {
    stagesById,
    firstPendingStageId,
    trackerViewMode,
    trackerIsReadOnly,
    trackerNeedsAdjustments,
    openReviewAdjustments,
    trackerAdjustmentMode,
    editableStageIds,
    stageIsEditable,
    stageItems,
    stageCompletionSummary,
    activeStage,
    currentPlanLabel,
    displayPlanCurrency,
  }
}
