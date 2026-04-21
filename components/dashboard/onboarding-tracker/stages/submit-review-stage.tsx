'use client'

import { ArrowRight } from 'lucide-react'
import { PROFESSIONAL_TERMS, type ProfessionalTermKey } from '@/lib/legal/professional-terms'
import { TERMS_KEYS } from '../constants'
import type { Blocker } from '../types'

interface StageItem {
  id: string
  label: string
  complete: boolean
  blocker: { title: string; description: string } | null
}

interface SubmitReviewStageProps {
  stageItems: StageItem[]
  termsHydrated: boolean
  hasAcceptedTerms: Record<string, boolean>
  activeStageBlockers: Blocker[]
  submitReviewState: 'idle' | 'saving' | 'saved' | 'error'
  submitReviewMessage: string
  submitTermsError: string
  canSubmitForReview: boolean
  onOpenTerm: (termKey: ProfessionalTermKey) => void
  onSubmitForReview: () => void
}

export function SubmitReviewStage({
  stageItems,
  termsHydrated,
  hasAcceptedTerms,
  activeStageBlockers,
  submitReviewState,
  submitReviewMessage,
  submitTermsError,
  canSubmitForReview,
  onOpenTerm,
  onSubmitForReview,
}: SubmitReviewStageProps) {
  const pendingTerms = termsHydrated
    ? PROFESSIONAL_TERMS.filter(term => !hasAcceptedTerms[term.key])
    : []

  const acceptedCount = Object.values(hasAcceptedTerms).filter(Boolean).length

  return (
    <div className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Pronto para enviar seu perfil?</h3>
        <p className="mt-1 text-sm text-slate-700">
          Revise as pendências abaixo, aceite os termos obrigatórios e envie o perfil para análise sem sair do tracker.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {stageItems
          .filter(item => item.id !== 'c8_submit_review' && !item.complete)
          .map(item => (
            <div
              key={item.id}
              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900"
            >
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-xs">{item.blocker?.title || 'Ainda pendente.'}</p>
            </div>
          ))}
      </div>

      {stageItems.filter(item => item.id !== 'c8_submit_review' && !item.complete).length === 0 ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          Não há pendências técnicas nas etapas anteriores.
        </p>
      ) : null}

      <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Termos obrigatórios</h4>
            <p className="mt-1 text-xs text-slate-600">
              {!termsHydrated
                ? 'Carregando o estado de aceite dos termos...'
                : pendingTerms.length > 0
                  ? 'Leia até o final e aceite cada termo pendente antes de enviar.'
                  : 'Todos os termos obrigatórios desta versão já foram aceitos.'}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {termsHydrated ? `${acceptedCount}/${TERMS_KEYS.length} aceitos` : '...'}
          </span>
        </div>

        {!termsHydrated ? (
          <p className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            Validando aceites existentes...
          </p>
        ) : pendingTerms.length > 0 ? (
          <div className="mt-3 space-y-2">
            {pendingTerms.map(term => (
              <div key={term.key} className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{term.shortLabel}</p>
                  <p className="mt-1 text-xs text-slate-600">{term.acceptanceLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void onOpenTerm(term.key)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#3d6b1f] hover:text-[#2d5016]"
                  >
                    Ler e aceitar
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            Termos em dia para esta versão.
          </p>
        )}
      </div>

      {activeStageBlockers.length > 0 ? (
        <ul className="space-y-2">
          {activeStageBlockers.map(blocker => (
            <li key={blocker.code} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="font-semibold">{blocker.title}</p>
              <p className="mt-1 text-xs">{blocker.description}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {submitReviewMessage ? (
        <p className={`text-sm ${submitReviewState === 'error' ? 'text-red-700' : 'text-green-700'}`}>
          {submitReviewMessage}
        </p>
      ) : null}

      {submitTermsError ? <p className="text-sm text-red-700">{submitTermsError}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void onSubmitForReview()}
          disabled={submitReviewState === 'saving'}
          className="rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitReviewState === 'saving' ? 'Enviando...' : 'Enviar para análise'}
        </button>
        {!canSubmitForReview ? (
          <span className="text-xs text-amber-700">Se ainda houver pendências, o tracker vai indicar o que precisa ser ajustado.</span>
        ) : null}
      </div>
    </div>
  )
}
