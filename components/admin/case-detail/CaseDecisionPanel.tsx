'use client'

import Link from 'next/link'
import { CheckCircle, User, UserCheck } from 'lucide-react'
import type { CaseDetailClientProps } from '../CaseDetailClient'

interface CaseDecisionPanelProps {
  localCase: CaseDetailClientProps['caseData']
  adminId: string
  resolutionText: string
  refundAmount: string
  actionLoading: string | null
  evidence: CaseDetailClientProps['evidence']
  onResolutionChange: (value: string) => void
  onRefundChange: (value: string) => void
  onResolve: () => void
}

export function CaseDecisionPanel({
  localCase,
  adminId,
  resolutionText,
  refundAmount,
  actionLoading,
  evidence,
  onResolutionChange,
  onRefundChange,
  onResolve,
}: CaseDecisionPanelProps) {
  return (
    <div className="space-y-6">
      {/* Assignment info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Responsável</h3>
        {localCase.assigned_to === adminId ? (
          <div className="flex items-center gap-2 text-sm text-[#3d6b1f]">
            <UserCheck className="w-4 h-4" />
            <span className="font-medium">Você</span>
          </div>
        ) : localCase.assigned_to ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <UserCheck className="w-4 h-4" />
            <span>Outro administrador</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <User className="w-4 h-4" />
            <span>Não atribuído</span>
          </div>
        )}
      </div>

      {/* Decision form */}
      {localCase.status !== 'resolved' && localCase.status !== 'closed' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-slate-400" />
            Resolver caso
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Resolução</label>
              <textarea
                value={resolutionText}
                onChange={e => onResolutionChange(e.target.value)}
                placeholder="Descreva a decisão e os motivos..."
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870]/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Reembolso (R$)</label>
              <input
                type="number"
                value={refundAmount}
                onChange={e => onRefundChange(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870]/50"
              />
              <p className="text-xs text-slate-400 mt-1">Deixe em branco se não houver reembolso.</p>
            </div>
            <button
              onClick={onResolve}
              disabled={actionLoading === 'resolve'}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {actionLoading === 'resolve' ? 'Processando...' : 'Resolver caso'}
            </button>
          </div>
        </div>
      )}

      {/* Resolution display */}
      {localCase.status === 'resolved' && localCase.resolution && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Resolução
          </h3>
          <p className="text-sm text-green-800 mb-3">{localCase.resolution}</p>
          {localCase.refund_amount ? (
            <p className="text-sm font-medium text-green-900">
              Reembolso: R$ {localCase.refund_amount.toFixed(2)}
            </p>
          ) : (
            <p className="text-sm text-green-700">Sem reembolso.</p>
          )}
          {localCase.resolved_at && (
            <p className="text-xs text-green-600 mt-2">
              Resolvido em {new Date(localCase.resolved_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Links rápidos</h3>
        <div className="space-y-2">
          {evidence?.booking && (
            <Link
              href={`/agenda?booking=${evidence.booking.id}`}
              target="_blank"
              className="block text-sm text-[#3d6b1f] hover:underline"
            >
              Ver agendamento →
            </Link>
          )}
          <Link
            href="/admin/finance/disputes"
            target="_blank"
            className="block text-sm text-[#3d6b1f] hover:underline"
          >
            Ver disputas financeiras →
          </Link>
        </div>
      </div>
    </div>
  )
}
