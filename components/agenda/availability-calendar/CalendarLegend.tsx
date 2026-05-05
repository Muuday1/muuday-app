'use client'

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 px-3 py-2 text-[11px] text-slate-600 md:px-4">
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[#9FE870]" /> Disponível
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-amber-500" /> Ocupado
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-red-400" /> Bloqueado
      </span>
    </div>
  )
}
