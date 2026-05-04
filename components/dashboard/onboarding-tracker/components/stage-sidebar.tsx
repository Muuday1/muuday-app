'use client'

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'

type StageItem = {
  id: string
  label: string
  complete: boolean
  blocker: { code: string; title: string; description: string } | null
}

type StageSidebarProps = {
  stageItems: StageItem[]
  activeStageId: string
  stageCompletionSummary: { completed: number; total: number }
  trackerRefreshState: 'idle' | 'saving' | 'saved' | 'error'
  trackerIsReadOnly: boolean
  trackerAdjustmentMode: boolean
  editableStageIds: Set<string>
  onSelectStage: (stageId: string) => void
  onClose: () => void
}

export function StageSidebar({
  stageItems,
  activeStageId,
  stageCompletionSummary,
  trackerRefreshState,
  trackerIsReadOnly,
  trackerAdjustmentMode,
  editableStageIds,
  onSelectStage,
  onClose,
}: StageSidebarProps) {
  const handleSelect = (stageId: string) => {
    if (trackerIsReadOnly) return
    if (trackerAdjustmentMode && !editableStageIds.has(stageId)) return
    onSelectStage(stageId)
  }

  const isDisabled = (stageId: string) =>
    trackerIsReadOnly || (trackerAdjustmentMode && !editableStageIds.has(stageId))

  const navItemClasses = (isActive: boolean, complete: boolean) => {
    const base = 'rounded-md border px-3 py-3 text-left transition'
    if (isActive) {
      return `${base} border-[#9FE870]/40 bg-[#9FE870]/8 text-[#2d5016]`
    }
    if (complete) {
      return `${base} border-green-200 bg-green-50 text-green-800`
    }
    return `${base} border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/60`
  }

  const mobileButtonClasses = (isActive: boolean, complete: boolean) => {
    const base = 'shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition'
    if (isActive) {
      return `${base} border-[#9FE870]/40 bg-[#9FE870]/8 text-[#2d5016]`
    }
    if (complete) {
      return `${base} border-green-200 bg-green-50 text-green-800`
    }
    return `${base} border-amber-200 bg-amber-50 text-amber-900`
  }

  return (
    <aside className="border-b border-slate-200/80 bg-slate-50/70 p-3.5 md:border-b-0 md:border-r">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold tracking-tight text-slate-900">Tracker de onboarding</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
        >
          Fechar
        </button>
      </div>

      <div className="mb-3 rounded-md border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Progresso</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {stageCompletionSummary.completed} de {stageCompletionSummary.total} etapas concluídas
            </p>
          </div>
          {trackerRefreshState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : null}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{
              width: `${Math.round(
                (stageCompletionSummary.completed / Math.max(1, stageCompletionSummary.total)) * 100,
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Mobile horizontal nav */}
      <nav className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 md:hidden">
        {stageItems.map(item => {
          const isActive = item.id === activeStageId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              disabled={isDisabled(item.id)}
              className={`${mobileButtonClasses(isActive, item.complete)} ${
                isDisabled(item.id) ? 'cursor-not-allowed opacity-70' : ''
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Desktop vertical nav */}
      <nav className="hidden space-y-1.5 md:block">
        {stageItems.map(item => {
          const isActive = item.id === activeStageId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              disabled={isDisabled(item.id)}
              className={`w-full ${navItemClasses(isActive, item.complete)} ${
                isDisabled(item.id) ? 'cursor-not-allowed opacity-80' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    item.complete
                      ? 'border-green-400 bg-green-100 text-green-700'
                      : item.blocker
                        ? 'border-amber-300 bg-amber-100 text-amber-700'
                        : 'border-slate-300 bg-white text-slate-500'
                  }`}
                >
                  {item.complete ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : item.blocker ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-4">{item.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {item.complete ? 'Concluida' : item.blocker?.title || 'Pendente'}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
