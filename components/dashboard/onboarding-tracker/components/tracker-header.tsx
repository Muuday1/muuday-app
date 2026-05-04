'use client'

import type { Blocker } from '../types'
import { UI_STAGE_LABELS, UI_STAGE_ORDER } from '../constants'

type TrackerViewMode = 'editing' | 'submitted_waiting' | 'approved' | 'needs_changes' | 'rejected'

type TrackerHeaderProps = {
  trackerViewMode: TrackerViewMode
  activeStageId: string
  activeStage?: {
    complete: boolean
    blockers: Blocker[]
  } | null
}

export function TrackerHeader({ trackerViewMode, activeStageId, activeStage }: TrackerHeaderProps) {
  return (
    <div className="mb-4 border-b border-slate-200/80 pb-3">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">
        {trackerViewMode === 'submitted_waiting'
          ? 'Onboarding concluído'
          : trackerViewMode === 'approved'
            ? 'Perfil aprovado'
            : UI_STAGE_LABELS[activeStageId as (typeof UI_STAGE_ORDER)[number]]}
      </h2>
      {trackerViewMode === 'submitted_waiting' ? (
        <p className="mt-1 text-sm text-blue-700">
          Recebemos seu perfil e ele está em análise. Vamos entrar em contato por e-mail com o resultado.
        </p>
      ) : trackerViewMode === 'approved' ? (
        <p className="mt-1 text-sm text-green-700">
          Seu perfil já foi aprovado. As próximas alterações devem ser feitas pelas páginas de configuração.
        </p>
      ) : activeStage?.complete ? (
        <p className="mt-1 text-sm text-green-700">Etapa concluída.</p>
      ) : (
        <p className="mt-1 text-sm text-amber-700">
          {activeStage?.blockers[0]?.description || 'Existem pendências nesta etapa.'}
        </p>
      )}
    </div>
  )
}
