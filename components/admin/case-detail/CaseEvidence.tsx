'use client'

import Link from 'next/link'
import { Calendar, CreditCard, Shield } from 'lucide-react'
import { formatMinorUnits } from '@/lib/payments/fees/calculator'
import type { CaseDetailClientProps } from '../CaseDetailClient'

interface CaseEvidenceProps {
  reason: string
  evidence: CaseDetailClientProps['evidence']
}

export function CaseEvidence({ reason, evidence }: CaseEvidenceProps) {
  return (
    <div className="space-y-6">
      {/* Reason */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span className="text-slate-400">💬</span>
          Motivo relatado
        </h3>
        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4">
          {reason}
        </p>
      </div>

      {/* Evidence */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-400" />
          Evidências
        </h3>
        {evidence?.booking ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase mb-1">Agendamento</p>
                <p className="text-sm font-medium text-slate-900">#{evidence.booking.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-500">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(evidence.booking.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase mb-1">Status do agendamento</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{evidence.booking.status}</p>
                <p className="text-xs text-slate-500">{evidence.booking.session_type}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase mb-1">Usuário</p>
                <p className="text-sm font-medium text-slate-900">{evidence.user?.full_name || '-'}</p>
                <p className="text-xs text-slate-500">{evidence.user?.email || ''}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase mb-1">Profissional</p>
                <p className="text-sm font-medium text-slate-900">{evidence.professional?.full_name || '-'}</p>
                <p className="text-xs text-slate-500">{evidence.professional?.email || ''}</p>
              </div>
            </div>
            {evidence.payment && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase mb-1">Pagamento</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      <CreditCard className="w-3 h-3 inline mr-1" />
                      {formatMinorUnits(BigInt(Math.round(evidence.payment.amount_brl * 100)), 'BRL')}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{evidence.payment.status}</p>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{evidence.payment.stripe_payment_intent_id?.slice(0, 20)}...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhuma evidência disponível.</p>
        )}
      </div>
    </div>
  )
}
