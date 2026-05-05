'use client'

import { CheckCircle, XCircle } from 'lucide-react'

interface ReviewModerationBatchActionsProps {
  selectedCount: number
  batchLoading: boolean
  onBatchApprove: () => void
  onBatchReject: () => void
  onClearSelection: () => void
}

export function ReviewModerationBatchActions({
  selectedCount,
  batchLoading,
  onBatchApprove,
  onBatchReject,
  onClearSelection,
}: ReviewModerationBatchActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="mb-4 p-3 bg-[#9FE870]/8 border border-[#9FE870]/30 rounded-md flex items-center justify-between">
      <span className="text-sm font-medium text-[#3d6b1f]">
        {selectedCount} avaliação(ões) selecionada(s)
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onBatchApprove}
          disabled={batchLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Aprovar selecionadas
        </button>
        <button
          onClick={onBatchReject}
          disabled={batchLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Rejeitar selecionadas
        </button>
        <button
          onClick={onClearSelection}
          className="text-xs text-slate-500 hover:text-slate-700 px-2"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}
