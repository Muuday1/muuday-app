'use client'

interface AgendaStatsCardsProps {
  pendingConfirmationsCount: number
  activeRequestsCount: number
  upcomingCount: number
}

export function AgendaStatsCards({
  pendingConfirmationsCount,
  activeRequestsCount,
  upcomingCount,
}: AgendaStatsCardsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-slate-200/80 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Confirmações pendentes
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{pendingConfirmationsCount}</p>
      </div>
      <div className="rounded-lg border border-slate-200/80 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Solicitações em aberto
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{activeRequestsCount}</p>
      </div>
      <div className="rounded-lg border border-slate-200/80 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Próximas sessões
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{upcomingCount}</p>
      </div>
    </div>
  )
}
