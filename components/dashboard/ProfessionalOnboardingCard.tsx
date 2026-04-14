'use client'

import { useMemo, useState } from 'react'
import type { ProfessionalOnboardingEvaluation } from '@/lib/professional/onboarding-gates'
import { OnboardingTrackerModal } from '@/components/dashboard/OnboardingTrackerModal'

type ProfessionalOnboardingCardProps = {
  professionalId: string
  tier: string
  initialEvaluation: ProfessionalOnboardingEvaluation
  initialBio: string
  initialCoverPhotoUrl: string
  autoOpen?: boolean
  result?: string
}

const STAGE_LABELS: Record<string, string> = {
  c2_basic_identity: 'Identidade',
  c3_public_profile: 'Perfil público',
  c4_service_setup: 'Serviços',
  c5_availability_calendar: 'Disponibilidade',
  c6_plan_billing_setup: 'Plano',
  c7_payout_payments: 'Financeiro',
  c8_submit_review: 'Enviar para análise',
}

function normalizeStageId(stageId: string) {
  const normalized = String(stageId || '')
  if (normalized === 'c1_create_account' || normalized === 'c1_account_creation') return 'c1_account_creation'
  if (normalized === 'c2_professional_identity' || normalized === 'c2_basic_identity') return 'c2_basic_identity'
  if (normalized === 'c3_public_profile') return 'c3_public_profile'
  if (normalized === 'c4_services' || normalized === 'c4_service_setup') return 'c4_service_setup'
  if (normalized === 'c5_availability_calendar') return 'c5_availability_calendar'
  if (normalized === 'c6_plan_billing_setup_post' || normalized === 'c6_plan_billing_setup_pre' || normalized === 'c6_plan_billing_setup') {
    return 'c6_plan_billing_setup'
  }
  if (normalized === 'c7_payout_receipt' || normalized === 'c7_payout_payments') return 'c7_payout_payments'
  if (normalized === 'c8_submit_review') return 'c8_submit_review'
  if (normalized === 'c9_go_live') return 'c9_go_live'
  return normalized
}

export function ProfessionalOnboardingCard({
  professionalId,
  tier,
  initialEvaluation,
  initialBio,
  initialCoverPhotoUrl,
  autoOpen = false,
  result,
}: ProfessionalOnboardingCardProps) {
  const [evaluation, setEvaluation] = useState(initialEvaluation)

  const pendingStages = useMemo(
    () =>
      evaluation.stages
        .filter(stage => !['c1_account_creation', 'c9_go_live'].includes(normalizeStageId(stage.id)) && !stage.complete)
        .slice(0, 4)
        .map(stage => ({
          id: stage.id,
          title: STAGE_LABELS[normalizeStageId(stage.id)] || stage.title,
          description: stage.blockers[0]?.description || 'Ainda há itens para concluir nesta etapa.',
        })),
    [evaluation],
  )

  const completedCount = useMemo(
    () => evaluation.stages.filter(stage => !['c1_account_creation', 'c9_go_live'].includes(normalizeStageId(stage.id)) && stage.complete).length,
    [evaluation],
  )

  const totalCount = useMemo(
    () => evaluation.stages.filter(stage => !['c1_account_creation', 'c9_go_live'].includes(normalizeStageId(stage.id))).length,
    [evaluation],
  )

  const feedbackMessage =
    result === 'submitted'
      ? 'Perfil enviado para análise com sucesso.'
      : result === 'blocked'
        ? 'Ainda existem pendências obrigatórias antes do envio.'
        : result === 'error'
          ? 'Não foi possível concluir a ação agora. Tente novamente.'
          : ''

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      {feedbackMessage ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-amber-900">
          {feedbackMessage}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-lg font-bold text-amber-900">Complete o onboarding para liberar o perfil</h2>
          <p className="mt-1 text-sm text-amber-800">
            Falta concluir as etapas do onboarding antes da publicação. Continue de onde parou e envie o perfil para análise no fim do fluxo.
          </p>
        </div>
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
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {pendingStages.map(stage => (
          <div key={stage.id} className="rounded-xl border border-amber-200 bg-white/75 px-3 py-3">
            <p className="text-sm font-semibold text-amber-950">{stage.title}</p>
            <p className="mt-1 text-xs text-amber-800">{stage.description}</p>
          </div>
        ))}
      </div>

      <OnboardingTrackerModal
        professionalId={professionalId}
        tier={tier}
        onboardingEvaluation={evaluation}
        initialBio={initialBio}
        initialCoverPhotoUrl={initialCoverPhotoUrl}
        autoOpen={autoOpen}
        onEvaluationChange={setEvaluation}
      />
    </section>
  )
}
