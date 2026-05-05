'use client'

import type { ReviewForModeration } from '@/lib/admin/review-moderation-types'
import { REVIEW_REJECTION_REASONS } from '@/lib/admin/review-moderation-types'

interface RejectModalProps {
  review: ReviewForModeration | null
  rejectReason: string
  rejectNote: string
  loadingId: string | null
  onReasonChange: (reason: string) => void
  onNoteChange: (note: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function RejectModal({
  review,
  rejectReason,
  rejectNote,
  loadingId,
  onReasonChange,
  onNoteChange,
  onConfirm,
  onCancel,
}: RejectModalProps) {
  if (!review) return null

  const isBatch = review.id === 'batch'
  const isLoading = loadingId === review.id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="font-semibold text-slate-900 mb-1">
          {isBatch ? 'Rejeitar avaliações selecionadas' : 'Rejeitar avaliação'}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Selecione o motivo da rejeição. O usuário poderá editar e reenviar (exceto "Suspeita de falsa").
        </p>

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {REVIEW_REJECTION_REASONS.map(reason => (
            <label
              key={reason.key}
              className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                rejectReason === reason.key
                  ? 'border-[#9FE870] bg-[#9FE870]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="rejectReason"
                value={reason.key}
                checked={rejectReason === reason.key}
                onChange={e => onReasonChange(e.target.value)}
                className="mt-0.5 w-4 h-4 text-[#9FE870] focus:ring-[#9FE870]/30"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">{reason.label}</span>
                <span className="text-xs text-slate-400 block">
                  {reason.canEdit ? 'Usuário pode editar e reenviar' : 'Não permite reenvio'}
                </span>
              </div>
            </label>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Nota interna (opcional)</label>
          <textarea
            value={rejectNote}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="Observações para o time de moderação..."
            rows={3}
            className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!rejectReason || isLoading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-all disabled:opacity-50"
          >
            {isLoading ? 'Processando...' : 'Confirmar rejeição'}
          </button>
        </div>
      </div>
    </div>
  )
}
