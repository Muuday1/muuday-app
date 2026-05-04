'use client'

import { Loader2 } from 'lucide-react'
import { StageSidebar } from './stage-sidebar'
import { TrackerHeader } from './tracker-header'
import { AdjustmentBanner } from './adjustment-banner'
import { PlanFeatureBanner } from './plan-feature-banner'
import { PayoutReceiptStage } from '../stages/payout-receipt-stage'
import { SubmitReviewStage } from '../stages/submit-review-stage'
import { PlanSelectionStage } from '../stages/plan-selection-stage'
import { ServicesStage } from '../stages/services-stage'
import { IdentityStage } from '../stages/identity-stage'
import { TermsModal } from '../stages/terms-modal'
import type { Stage, SaveState, TrackerViewMode } from '../types'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import type { ReviewAdjustmentItem } from '@/lib/professional/review-adjustments'
import type { ExchangeRateMap } from '@/lib/exchange-rates'

type PlanPricing = {
  currency: string
  monthlyAmount: number
  annualAmount: number
  provider: string
  fallback?: boolean
  mode?: string
} | null

interface TrackerModalBodyProps {
  // Core state
  stageItems: Array<{
    id: string
    label: string
    complete: boolean
    blocker: { code: string; title: string; description: string } | null
  }>
  activeStageId: string
  stageCompletionSummary: { total: number; completed: number }
  trackerRefreshState: SaveState
  trackerIsReadOnly: boolean
  trackerAdjustmentMode: boolean
  editableStageIds: Set<string>
  onSelectStage: (stageId: string) => void
  onClose: () => void

  // Header
  trackerViewMode: TrackerViewMode
  activeStage: Stage | undefined

  // Banner
  trackerNeedsAdjustments: boolean
  openReviewAdjustments: ReviewAdjustmentItem[]

  // Loading
  loadingContext: boolean

  // Stage editable
  stageIsEditable: boolean

  // Plan
  currentPlanLabel: string
  planPricing: PlanPricing | null
  pricingError: string
  onViewPlans: () => void

  // IdentityStage props
  identityProps: React.ComponentProps<typeof IdentityStage>

  // ServicesStage props
  servicesProps: React.ComponentProps<typeof ServicesStage>

  // PlanSelectionStage props
  planSelectionProps: React.ComponentProps<typeof PlanSelectionStage>

  // PayoutReceiptStage props
  payoutReceiptProps: {
    payoutReceiptBlockers: ProfessionalOnboardingEvaluation['gates']['payout_receipt']['blockers']
    activeStageBlockers: Array<{ code: string; title: string; description: string }>
    onCloseModal: () => void
    onContinue: () => void
  }

  // SubmitReviewStage props
  submitReviewProps: {
    stageItems: TrackerModalBodyProps['stageItems']
    termsHydrated: boolean
    hasAcceptedTerms: Record<string, boolean>
    activeStageBlockers: Array<{ code: string; title: string; description: string }>
    submitReviewState: SaveState
    submitReviewMessage: string
    submitTermsError: string
    canSubmitForReview: boolean
    onOpenTerm: (key: string) => void
    onSubmitForReview: () => Promise<void>
  }

  // Terms modal
  activeTermsModalKey: string | null
  termsModalScrolledToEnd: boolean
  termsModalContentRef: React.RefObject<HTMLDivElement | null>
  onTermsScroll: (event: React.UIEvent<HTMLDivElement>) => void
  onTermsClose: () => void
  onTermsAccept: () => void
}

export function TrackerModalBody({
  stageItems,
  activeStageId,
  stageCompletionSummary,
  trackerRefreshState,
  trackerIsReadOnly,
  trackerAdjustmentMode,
  editableStageIds,
  onSelectStage,
  onClose,
  trackerViewMode,
  activeStage,
  trackerNeedsAdjustments,
  openReviewAdjustments,
  loadingContext,
  stageIsEditable,
  currentPlanLabel,
  planPricing,
  pricingError,
  onViewPlans,
  identityProps,
  servicesProps,
  planSelectionProps,
  payoutReceiptProps,
  submitReviewProps,
  activeTermsModalKey,
  termsModalScrolledToEnd,
  termsModalContentRef,
  onTermsScroll,
  onTermsClose,
  onTermsAccept,
}: TrackerModalBodyProps) {
  return (
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
          onSelectStage={onSelectStage}
          onClose={onClose}
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
                onViewPlans={onViewPlans}
              />

              {activeStageId === 'c2_professional_identity' && <IdentityStage {...identityProps} />}

              {activeStageId === 'c4_services' && <ServicesStage {...servicesProps} />}

              {activeStageId === 'c6_plan_billing_setup_post' && <PlanSelectionStage {...planSelectionProps} />}

              {activeStageId === 'c7_payout_receipt' && (
                <PayoutReceiptStage
                  isFinanceBypassEnabled={false}
                  {...payoutReceiptProps}
                />
              )}

              {activeStageId === 'c8_submit_review' && <SubmitReviewStage {...submitReviewProps} />}
            </>
          )}
        </section>
      </div>

      <TermsModal
        activeTermKey={activeTermsModalKey}
        termsModalScrolledToEnd={termsModalScrolledToEnd}
        contentRef={termsModalContentRef}
        onScroll={onTermsScroll}
        onClose={onTermsClose}
        onAccept={onTermsAccept}
      />
    </div>
  )
}
