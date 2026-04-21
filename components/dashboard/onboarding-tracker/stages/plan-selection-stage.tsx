'use client'

import {
  PLAN_PRICE_BASE_BRL,
  PLAN_COMPARISON_ROWS,
  PLAN_TIER_LABELS,
} from '../constants'
import { formatCurrencyFromBrl } from '../helpers'
import type { BillingCycle, PlanTier, SaveState } from '../types'
import type { ExchangeRateMap } from '@/lib/exchange-rates'
import { AppTable, AppTableHeader, AppTableBody, AppTableRow, AppTableHeadCell, AppTableCell } from '@/components/ui/AppTable'

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
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Escolha o plano da operação</h3>
        <p className="mt-1 text-sm text-slate-700">
          Você começa com 90 dias sem cobrança após aprovação e go-live. Escolha o plano que melhor acompanha a evolução do seu perfil, da agenda e da operação financeira.
        </p>
        <div className="mt-4 inline-flex items-center rounded-md border border-slate-200 bg-slate-50/70 p-1 text-sm">
          <button
            type="button"
            onClick={() => setSelectedPlanCycle('monthly')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              selectedPlanCycle === 'monthly' ? 'bg-[#9FE870] text-white' : 'text-slate-600'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlanCycle('annual')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              selectedPlanCycle === 'annual' ? 'bg-[#9FE870] text-white' : 'text-slate-600'
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
              className={`rounded-lg border p-4 transition ${
                isSelected
                  ? 'border-[#9FE870] bg-[#9FE870]/8/40'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {PLAN_TIER_LABELS[planTier]}
                  </p>
                  {isCurrent ? (
                    <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      Plano atual
                    </span>
                  ) : null}
                </div>
                {isSelected ? (
                  <span className="rounded-full bg-[#9FE870] px-2.5 py-1 text-[11px] font-semibold text-white">
                    Selecionado
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <p className="text-3xl font-bold text-slate-900">
                  {selectedPlanCycle === 'monthly' ? monthlyPrice : annualPrice}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedPlanCycle === 'monthly' ? 'por mês' : 'por ano'}
                </p>
                <p className="mt-2 text-xs text-emerald-700">90 dias sem cobrança após aprovação.</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlanTier(planTier)}
                className={`mt-4 inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${
                  isSelected
                    ? 'border border-[#9FE870] bg-white text-[#3d6b1f]'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {isCurrent ? 'Manter este plano' : `Selecionar ${PLAN_TIER_LABELS[planTier]}`}
              </button>
            </div>
          )
        })}
      </div>

      <AppTable>
        <AppTableHeader>
          <AppTableRow>
            <AppTableHeadCell>Recurso</AppTableHeadCell>
            <AppTableHeadCell>Básico</AppTableHeadCell>
            <AppTableHeadCell>Profissional</AppTableHeadCell>
            <AppTableHeadCell>Premium</AppTableHeadCell>
          </AppTableRow>
        </AppTableHeader>
        <AppTableBody>
          {PLAN_COMPARISON_ROWS.map(row => (
            <AppTableRow key={row.label}>
              <AppTableCell className="font-medium text-slate-800">{row.label}</AppTableCell>
              <AppTableCell className="text-slate-600">{row.basic}</AppTableCell>
              <AppTableCell className="text-slate-600">{row.professional}</AppTableCell>
              <AppTableCell className="text-slate-600">{row.premium}</AppTableCell>
            </AppTableRow>
          ))}
        </AppTableBody>
      </AppTable>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-700">
            <p>
              Plano selecionado: <strong>{PLAN_TIER_LABELS[selectedPlanTier]}</strong>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {selectedPlanCycle === 'monthly'
                ? `${formatCurrencyFromBrl(PLAN_PRICE_BASE_BRL[selectedPlanTier], displayPlanCurrency, exchangeRates)} por mês`
                : `${formatCurrencyFromBrl(PLAN_PRICE_BASE_BRL[selectedPlanTier] * 10, displayPlanCurrency, exchangeRates)} por ano`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void savePlanSelection()}
            disabled={planActionState === 'saving'}
            className="rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8ed85f] disabled:opacity-60"
          >
            {planActionState === 'saving' ? 'Salvando...' : 'Salvar plano'}
          </button>
        </div>
        {pricingError ? <p className="mt-3 text-xs text-slate-500">{pricingError}</p> : null}
        {planPricing?.fallback || planPricing?.provider === 'fallback-test' ? (
          <p className="mt-2 text-xs text-amber-700">Modo de teste ativo para preço/plano neste ambiente.</p>
        ) : null}
        {planActionError ? <p className="mt-3 text-sm text-red-700">{planActionError}</p> : null}
      </div>
    </div>
  )
}
