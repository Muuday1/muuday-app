'use client'

import {
  PLAN_PRICE_BASE_BRL,
  PLAN_COMPARISON_ROWS,
  PLAN_TIER_LABELS,
} from '../constants'
import { formatCurrencyFromBrl } from '../helpers'
import type { BillingCycle, PlanTier, SaveState } from '../types'
import type { ExchangeRateMap } from '@/lib/exchange-rates'

interface PlanSelectionStageProps {
  selectedPlanCycle: BillingCycle
  setSelectedPlanCycle: (cycle: BillingCycle) => void
  selectedPlanTier: PlanTier
  setSelectedPlanTier: (tier: PlanTier) => void
  activeTier: string | null
  displayPlanCurrency: string
  exchangeRates: ExchangeRateMap
  planActionState: SaveState
  savePlanSelection: () => Promise<void>
  pricingError: string | null
  planPricing: { fallback?: boolean; provider?: string } | null
  planActionError: string | null
}

export function PlanSelectionStage({
  selectedPlanCycle,
  setSelectedPlanCycle,
  selectedPlanTier,
  setSelectedPlanTier,
  activeTier,
  displayPlanCurrency,
  exchangeRates,
  planActionState,
  savePlanSelection,
  pricingError,
  planPricing,
  planActionError,
}: PlanSelectionStageProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="text-base font-semibold text-neutral-900">Escolha o plano da operação</h3>
        <p className="mt-1 text-sm text-neutral-700">
          Você começa com 90 dias sem cobrança após aprovação e go-live. Escolha o plano que melhor acompanha a evolução do seu perfil, da agenda e da operação financeira.
        </p>
        <div className="mt-4 inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setSelectedPlanCycle('monthly')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              selectedPlanCycle === 'monthly' ? 'bg-brand-500 text-white' : 'text-neutral-600'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlanCycle('annual')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              selectedPlanCycle === 'annual' ? 'bg-brand-500 text-white' : 'text-neutral-600'
            }`}
          >
            Anual (10x)
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {(['basic', 'professional', 'premium'] as PlanTier[]).map(planTier => {
          const monthlyPrice = formatCurrencyFromBrl(
            PLAN_PRICE_BASE_BRL[planTier],
            displayPlanCurrency,
            exchangeRates,
          )
          const annualPrice = formatCurrencyFromBrl(
            PLAN_PRICE_BASE_BRL[planTier] * 10,
            displayPlanCurrency,
            exchangeRates,
          )
          const isCurrent = planTier === String(activeTier || '').toLowerCase()
          const isSelected = selectedPlanTier === planTier

          return (
            <div
              key={planTier}
              className={`rounded-2xl border p-4 transition ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/40 shadow-sm'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {PLAN_TIER_LABELS[planTier]}
                  </p>
                  {isCurrent ? (
                    <span className="mt-2 inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                      Plano atual
                    </span>
                  ) : null}
                </div>
                {isSelected ? (
                  <span className="rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Selecionado
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <p className="text-3xl font-bold text-neutral-900">
                  {selectedPlanCycle === 'monthly' ? monthlyPrice : annualPrice}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {selectedPlanCycle === 'monthly' ? 'por mês' : 'por ano'}
                </p>
                <p className="mt-2 text-xs text-emerald-700">90 dias sem cobrança após aprovação.</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlanTier(planTier)}
                className={`mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? 'border border-brand-500 bg-white text-brand-700'
                    : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-neutral-900'
                }`}
              >
                {isCurrent ? 'Manter este plano' : `Selecionar ${PLAN_TIER_LABELS[planTier]}`}
              </button>
            </div>
          )
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-neutral-700">Recurso</th>
              <th className="px-4 py-3 text-neutral-700">Básico</th>
              <th className="px-4 py-3 text-neutral-700">Profissional</th>
              <th className="px-4 py-3 text-neutral-700">Premium</th>
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON_ROWS.map(row => (
              <tr key={row.label} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium text-neutral-800">{row.label}</td>
                <td className="px-4 py-3 text-neutral-600">{row.basic}</td>
                <td className="px-4 py-3 text-neutral-600">{row.professional}</td>
                <td className="px-4 py-3 text-neutral-600">{row.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-700">
            <p>
              Plano selecionado: <strong>{PLAN_TIER_LABELS[selectedPlanTier]}</strong>
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {selectedPlanCycle === 'monthly'
                ? `${formatCurrencyFromBrl(PLAN_PRICE_BASE_BRL[selectedPlanTier], displayPlanCurrency, exchangeRates)} por mês`
                : `${formatCurrencyFromBrl(PLAN_PRICE_BASE_BRL[selectedPlanTier] * 10, displayPlanCurrency, exchangeRates)} por ano`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void savePlanSelection()}
            disabled={planActionState === 'saving'}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {planActionState === 'saving' ? 'Salvando...' : 'Salvar plano'}
          </button>
        </div>
        {pricingError ? <p className="mt-3 text-xs text-neutral-500">{pricingError}</p> : null}
        {planPricing?.fallback || planPricing?.provider === 'fallback-test' ? (
          <p className="mt-2 text-xs text-amber-700">Modo de teste ativo para preço/plano neste ambiente.</p>
        ) : null}
        {planActionError ? <p className="mt-3 text-sm text-red-700">{planActionError}</p> : null}
      </div>
    </div>
  )
}
