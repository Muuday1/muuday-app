'use client'

import { ArrowRight } from 'lucide-react'
import { getPlanFeatureHighlights } from '../helpers'

type PlanPricing = {
  currency: string
  monthlyAmount: number
  annualAmount: number
  provider: string
  fallback?: boolean
  mode?: string
} | null

type PlanFeatureBannerProps = {
  activeStageId: string
  currentPlanLabel: string
  planPricing: PlanPricing
  pricingError: string
  onViewPlans: () => void
}

export function PlanFeatureBanner({
  activeStageId,
  currentPlanLabel,
  planPricing,
  pricingError,
  onViewPlans,
}: PlanFeatureBannerProps) {
  const highlights = getPlanFeatureHighlights(activeStageId)
  if (highlights.length === 0) return null

  return (
    <div className="mb-4 rounded-md border border-[#9FE870]/20 bg-[#9FE870]/8/50 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Planos nesta etapa</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {highlights.map(item => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-[#9FE870]/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2d5016]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          <p>
            Plano atual: <strong>{currentPlanLabel}</strong>
          </p>
          {planPricing ? (
            <p>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: planPricing.currency }).format(
                planPricing.monthlyAmount / 100,
              )}{' '}
              / mês
            </p>
          ) : (
            <p>{pricingError || 'Preço indisponível no momento.'}</p>
          )}
          <button
            type="button"
            onClick={onViewPlans}
            className="inline-flex items-center gap-1 font-semibold text-[#3d6b1f] hover:text-[#2d5016]"
          >
            Ver planos desta etapa
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
