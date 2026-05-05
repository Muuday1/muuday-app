'use client'

interface AvailabilityWorkspaceStatsProps {
  bufferMinutes: number
  maxWindowDays: number
  calendarConnected: boolean
}

export function AvailabilityWorkspaceStats({
  bufferMinutes,
  maxWindowDays,
  calendarConnected,
}: AvailabilityWorkspaceStatsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-md border border-slate-200/80 bg-white px-4 py-3">
        <p className="text-xs text-slate-500">Buffer ativo</p>
        <p className="text-sm font-semibold text-slate-900">{bufferMinutes} min</p>
      </div>
      <div className="rounded-md border border-slate-200/80 bg-white px-4 py-3">
        <p className="text-xs text-slate-500">Janela máxima</p>
        <p className="text-sm font-semibold text-slate-900">{maxWindowDays} dias</p>
      </div>
      <div className="rounded-md border border-slate-200/80 bg-white px-4 py-3">
        <p className="text-xs text-slate-500">Status de sync</p>
        <p className="text-sm font-semibold text-slate-900">
          {calendarConnected ? 'Conectado' : 'Não conectado'}
        </p>
      </div>
    </div>
  )
}
