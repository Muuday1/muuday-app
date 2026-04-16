'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import {
  REVIEW_ADJUSTMENT_STAGE_LABELS,
  type ReviewAdjustmentItem,
} from '@/lib/professional/review-adjustments'
import { OnboardingTrackerModal } from '@/components/dashboard/OnboardingTrackerModal'

type ProfessionalOnboardingCardProps = {
  professionalId: string
  tier: string
  professionalStatus: string
  initialEvaluation: ProfessionalOnboardingEvaluation
  initialBio: string
  initialCoverPhotoUrl: string
  autoOpen?: boolean
  result?: string
}

type TrackerViewMode = 'editing' | 'submitted_waiting' | 'approved' | 'needs_changes' | 'rejected'

const UI_STAGE_ORDER = [
  'c2_professional_identity',
  'c4_service_setup',
  'c5_availability_calendar',
  'c6_plan_billing_setup',
  'c7_payout_payments',
  'c8_submit_review',
] as const

const UI_STAGE_LABELS: Record<(typeof UI_STAGE_ORDER)[number], string> = {
  c2_professional_identity: 'Identidade',
  c4_service_setup: 'Serviços',
  c5_availability_calendar: 'Disponibilidade',
  c6_plan_billing_setup: 'Plano',
  c7_payout_payments: 'Financeiro',
  c8_submit_review: 'Enviar para análise',
}

const UI_STAGE_BACKEND_STAGE_IDS: Record<(typeof UI_STAGE_ORDER)[number], string[]> = {
  c2_professional_identity: ['c2_basic_identity', 'c3_public_profile'],
  c4_service_setup: ['c4_service_setup'],
  c5_availability_calendar: ['c5_availability_calendar'],
  c6_plan_billing_setup: ['c6_plan_billing_setup'],
  c7_payout_payments: ['c7_payout_payments'],
  c8_submit_review: ['c8_submit_review'],
}

function normalizeStageId(stageId: string) {
  const normalized = String(stageId || '')
  if (normalized === 'c1_create_account' || normalized === 'c1_account_creation') return 'c1_account_creation'
  if (normalized === 'c2_professional_identity' || normalized === 'c2_basic_identity') return 'c2_basic_identity'
  if (normalized === 'c3_public_profile') return 'c3_public_profile'
  if (normalized === 'c4_services' || normalized === 'c4_service_setup') return 'c4_service_setup'
  if (normalized === 'c5_availability_calendar') return 'c5_availability_calendar'
  if (
    normalized === 'c6_plan_billing_setup_post' ||
    normalized === 'c6_plan_billing_setup_pre' ||
    normalized === 'c6_plan_billing_setup'
  ) {
    return 'c6_plan_billing_setup'
  }
  if (normalized === 'c7_payout_receipt' || normalized === 'c7_payout_payments') return 'c7_payout_payments'
  if (normalized === 'c8_submit_review') return 'c8_submit_review'
  if (normalized === 'c9_go_live') return 'c9_go_live'
  return normalized
}

function resolveTrackerViewMode(status: string): TrackerViewMode {
  const normalized = String(status || '').toLowerCase().trim()
  if (normalized === 'pending_review') return 'submitted_waiting'
  if (normalized === 'approved') return 'approved'
  if (normalized === 'needs_changes') return 'needs_changes'
  if (normalized === 'rejected') return 'rejected'
  return 'editing'
}

function stageLabelFromAdjustment(stageId: string) {
  return REVIEW_ADJUSTMENT_STAGE_LABELS[stageId as keyof typeof REVIEW_ADJUSTMENT_STAGE_LABELS] || 'Etapa do onboarding'
}

export function ProfessionalOnboardingCard({
  professionalId,
  tier,
  professionalStatus,
  initialEvaluation,
  initialBio,
  initialCoverPhotoUrl,
  autoOpen = false,
  result,
}: ProfessionalOnboardingCardProps) {
  const [evaluation, setEvaluation] = useState(initialEvaluation)
  const [currentProfessionalStatus, setCurrentProfessionalStatus] = useState(
    String(professionalStatus || ''),
  )
  const [openAdjustments, setOpenAdjustments] = useState<ReviewAdjustmentItem[]>([])

  const trackerViewMode = useMemo(
    () => resolveTrackerViewMode(currentProfessionalStatus),
    [currentProfessionalStatus],
  )
  const trackerNeedsAdjustments = trackerViewMode === 'needs_changes' || trackerViewMode === 'rejected'

  useEffect(() => {
    if (!trackerNeedsAdjustments) {
      setOpenAdjustments([])
      return
    }

    let cancelled = false
    async function loadAdjustments() {
      try {
        const response = await fetch('/api/professional/onboarding/state', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })
        const payload = (await response.json().catch(() => ({}))) as {
          reviewAdjustments?: ReviewAdjustmentItem[]
        }
        if (!response.ok || cancelled) return
        const items = Array.isArray(payload.reviewAdjustments)
          ? payload.reviewAdjustments.filter(item => item.status === 'open' || item.status === 'reopened')
          : []
        setOpenAdjustments(items)
      } catch {
        if (!cancelled) setOpenAdjustments([])
      }
    }

    void loadAdjustments()
    return () => {
      cancelled = true
    }
  }, [trackerNeedsAdjustments, currentProfessionalStatus, evaluation])

  const normalizedStages = useMemo(() => {
    const map = new Map<string, ProfessionalOnboardingEvaluation['stages'][number]>()
    evaluation.stages.forEach(stage => map.set(normalizeStageId(stage.id), stage))
    return map
  }, [evaluation])

  const pendingStages = useMemo(() => {
    const rows: Array<{
      id: (typeof UI_STAGE_ORDER)[number]
      title: string
      description: string
    }> = []

    UI_STAGE_ORDER.forEach(stageId => {
      const backendStages = UI_STAGE_BACKEND_STAGE_IDS[stageId]
        .map(id => normalizedStages.get(id))
        .filter((stage): stage is ProfessionalOnboardingEvaluation['stages'][number] => Boolean(stage))
      const firstPending = backendStages.find(stage => !stage?.complete)
      if (firstPending) {
        rows.push({
          id: stageId,
          title: UI_STAGE_LABELS[stageId],
          description: firstPending.blockers[0]?.description || 'Ainda há itens para concluir nesta etapa.',
        })
      }
    })

    return rows.slice(0, 4)
  }, [normalizedStages])

  const completedCount = useMemo(
    () =>
      UI_STAGE_ORDER.filter(stageId =>
        UI_STAGE_BACKEND_STAGE_IDS[stageId].every(id => normalizedStages.get(id)?.complete),
      ).length,
    [normalizedStages],
  )

  const totalCount = UI_STAGE_ORDER.length
  const adjustmentCount = openAdjustments.length
  const adjustmentPreview = openAdjustments.slice(0, 4)

  const feedbackMessage =
    result === 'submitted'
      ? 'Perfil enviado para análise com sucesso.'
      : result === 'blocked'
        ? 'Ainda existem pendências obrigatórias antes do envio.'
        : result === 'error'
          ? 'Não foi possível concluir a ação agora. Tente novamente.'
          : ''

  const title =
    trackerViewMode === 'submitted_waiting'
      ? 'Perfil em análise'
      : trackerViewMode === 'approved'
        ? 'Perfil aprovado'
        : trackerNeedsAdjustments
          ? 'Ajustes solicitados no onboarding'
          : 'Complete o onboarding para liberar o perfil'

  const description =
    trackerViewMode === 'submitted_waiting'
      ? 'Recebemos seus dados e seu perfil está em revisão. Vamos avisar por e-mail quando a análise for concluída.'
      : trackerViewMode === 'approved'
        ? 'Seu onboarding foi aprovado. Se precisar ajustar dados, use as páginas de configuração do perfil.'
        : trackerViewMode === 'rejected'
          ? adjustmentCount > 0
            ? `Seu envio foi reprovado nesta rodada. Há ${adjustmentCount} ajuste(s) pendente(s) para reenviar.`
            : 'Seu envio foi reprovado nesta rodada. Abra o tracker e faça os ajustes solicitados para reenviar.'
          : trackerViewMode === 'needs_changes'
            ? adjustmentCount > 0
              ? `A equipe de revisão pediu ${adjustmentCount} ajuste(s). Corrija os itens abaixo e envie novamente pelo tracker.`
              : 'A equipe de revisão pediu ajustes. Abra o tracker para revisar os itens pendentes e reenviar.'
            : 'Falta concluir as etapas do onboarding antes da publicação. Continue de onde parou e envie o perfil para análise no fim do fluxo.'

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      {feedbackMessage ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-900">
          {feedbackMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-lg font-bold text-amber-900">{title}</h2>
          <p className="mt-1 text-sm text-amber-800">{description}</p>
        </div>
        {trackerViewMode === 'editing' ? (
          <div className="min-w-[210px] rounded-xl border border-amber-200 bg-white/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Progresso</p>
            <p className="mt-1 text-2xl font-bold text-amber-950">
              {completedCount}/{totalCount}
            </p>
            <p className="mt-1 text-xs text-amber-800">etapas concluídas</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.round((completedCount / Math.max(1, totalCount)) * 100)}%` }}
              />
            </div>
          </div>
        ) : trackerNeedsAdjustments ? (
          <div className="min-w-[210px] rounded-xl border border-amber-200 bg-white/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Ajustes pendentes</p>
            <p className="mt-1 text-2xl font-bold text-amber-950">{adjustmentCount}</p>
            <p className="mt-1 text-xs text-amber-800">
              {adjustmentCount === 1 ? 'item para corrigir' : 'itens para corrigir'}
            </p>
          </div>
        ) : null}
      </div>

      {trackerNeedsAdjustments && adjustmentPreview.length > 0 ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {adjustmentPreview.map(item => (
            <div key={item.id} className="rounded-xl border border-amber-200 bg-white/75 px-3 py-3">
              <p className="text-sm font-semibold text-amber-950">{stageLabelFromAdjustment(String(item.stageId || ''))}</p>
              <p className="mt-1 text-xs text-amber-800">{item.message || 'Revise esta etapa no tracker.'}</p>
            </div>
          ))}
        </div>
      ) : trackerViewMode === 'editing' || trackerNeedsAdjustments ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {pendingStages.map(stage => (
            <div key={stage.id} className="rounded-xl border border-amber-200 bg-white/75 px-3 py-3">
              <p className="text-sm font-semibold text-amber-950">{stage.title}</p>
              <p className="mt-1 text-xs text-amber-800">{stage.description}</p>
            </div>
          ))}
        </div>
      ) : null}

      <OnboardingTrackerModal
        professionalId={professionalId}
        tier={tier}
        professionalStatus={currentProfessionalStatus}
        onboardingEvaluation={evaluation}
        initialBio={initialBio}
        initialCoverPhotoUrl={initialCoverPhotoUrl}
        autoOpen={autoOpen}
        onTrackerStateChange={state => {
          setEvaluation(state.evaluation)
          setCurrentProfessionalStatus(state.professionalStatus)
        }}
      />
    </section>
  )
}
