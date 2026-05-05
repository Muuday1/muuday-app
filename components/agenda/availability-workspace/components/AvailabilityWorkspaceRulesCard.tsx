'use client'

import Link from 'next/link'

interface AvailabilityWorkspaceRulesCardProps {
  variant: 'standalone' | 'embedded'
}

export function AvailabilityWorkspaceRulesCard({ variant }: AvailabilityWorkspaceRulesCardProps) {
  return (
    <div className="mb-6">
      <div className="rounded-lg border border-slate-200/80 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">
          {variant === 'standalone' ? 'Regras de agendamento' : 'Contexto operacional'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {variant === 'standalone'
            ? 'Ajuste buffer, confirmação, janela máxima e outras regras fora do editor semanal.'
            : 'As regras detalhadas ficam logo abaixo, mas estes números já resumem o impacto operacional atual.'}
        </p>
        <Link
          href="/configuracoes-agendamento"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:text-slate-900"
        >
          Ajustar regras de agendamento
        </Link>
      </div>
    </div>
  )
}
