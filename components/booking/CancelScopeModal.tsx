'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, Loader2, AlertCircle, Calendar, Trash2, CalendarX } from 'lucide-react'

export type CancelScope = 'this' | 'future' | 'series'

interface CancelScopeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (scope: CancelScope, reason: string) => void
  isPending: boolean
  professionalName: string
  scheduledAt?: string
  sessionCount?: number
}

export function CancelScopeModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  professionalName,
  scheduledAt,
  sessionCount,
}: CancelScopeModalProps) {
  const [scope, setScope] = useState<CancelScope>('this')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setScope('this')
      setReason('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const dateLabel = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Cancelar agendamento</h3>
            <p className="mt-1 text-sm text-slate-500">
              {professionalName}
              {dateLabel ? ` — ${dateLabel}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md border border-slate-200 p-2 text-slate-500 transition-all hover:border-slate-300 hover:text-slate-800 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">O que você deseja cancelar?</p>

          <button
            type="button"
            onClick={() => setScope('this')}
            className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
              scope === 'this'
                ? 'border-[#9FE870]/60 bg-[#9FE870]/8'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <CalendarX
              className={`mt-0.5 h-5 w-5 flex-shrink-0 ${scope === 'this' ? 'text-[#3d6b1f]' : 'text-slate-400'}`}
            />
            <div>
              <p className={`text-sm font-semibold ${scope === 'this' ? 'text-[#3d6b1f]' : 'text-slate-700'}`}>
                Apenas esta sessão
              </p>
              <p className="text-xs text-slate-500">Cancela somente o dia selecionado. As demais sessões continuam.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setScope('future')}
            className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
              scope === 'future'
                ? 'border-[#9FE870]/60 bg-[#9FE870]/8'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Calendar
              className={`mt-0.5 h-5 w-5 flex-shrink-0 ${scope === 'future' ? 'text-[#3d6b1f]' : 'text-slate-400'}`}
            />
            <div>
              <p className={`text-sm font-semibold ${scope === 'future' ? 'text-[#3d6b1f]' : 'text-slate-700'}`}>
                Todas as sessões futuras
              </p>
              <p className="text-xs text-slate-500">
                Cancela esta e todas as próximas sessões do pacote. Sessões anteriores não são afetadas.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setScope('series')}
            className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all ${
              scope === 'series'
                ? 'border-red-200 bg-red-50/60'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Trash2
              className={`mt-0.5 h-5 w-5 flex-shrink-0 ${scope === 'series' ? 'text-red-600' : 'text-slate-400'}`}
            />
            <div>
              <p className={`text-sm font-semibold ${scope === 'series' ? 'text-red-700' : 'text-slate-700'}`}>
                Pacote inteiro
              </p>
              <p className="text-xs text-slate-500">
                Cancela todas as sessões do pacote recorrente, incluindo as anteriores (se ainda não realizadas).
              </p>
            </div>
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Motivo (opcional)</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Motivo do cancelamento"
            maxLength={300}
            disabled={isPending}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40 disabled:opacity-50"
          />
        </div>

        <div className="mb-5 rounded-md border border-amber-100 bg-amber-50/70 p-3 text-sm text-amber-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              O reembolso segue a política de cancelamento: 100% se cancelado com mais de 24h de antecedência; 0% caso contrário.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onConfirm(scope, reason.trim())}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Confirmar cancelamento
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
