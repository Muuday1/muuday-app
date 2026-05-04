'use client'

import { REVIEW_ADJUSTMENT_STAGE_LABELS, type ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'

type TrackerViewMode = 'editing' | 'submitted_waiting' | 'approved' | 'needs_changes' | 'rejected'

type AdjustmentBannerProps = {
  trackerViewMode: TrackerViewMode
  trackerNeedsAdjustments: boolean
  openReviewAdjustments: ReviewAdjustmentItem[]
}

export function AdjustmentBanner({
  trackerViewMode,
  trackerNeedsAdjustments,
  openReviewAdjustments,
}: AdjustmentBannerProps) {
  if (!trackerNeedsAdjustments) return null

  return (
    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-semibold">
        {trackerViewMode === 'rejected'
          ? 'Perfil reprovado para esta rodada.'
          : 'Ajustes solicitados pelo time de revisão.'}
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
                  {REVIEW_ADJUSTMENT_STAGE_LABELS[item.stageId as keyof typeof REVIEW_ADJUSTMENT_STAGE_LABELS] ||
                    item.stageId}
                </span>{' '}
                • {item.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
