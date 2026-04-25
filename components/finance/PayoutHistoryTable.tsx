'use client'

import { ArrowDownLeft, ArrowUpRight, Minus } from 'lucide-react'
import { formatMinorUnits, formatPayoutStatus } from '@/lib/payments/format-utils'
import type { PayoutPeriodicity } from '@/lib/payments/fees/calculator'

interface PayoutItem {
  id: string
  amount: number
  net_amount: number
  debt_deducted: number
  status: string
  created_at: string
}

interface PayoutHistoryTableProps {
  payouts: PayoutItem[]
  periodicity?: PayoutPeriodicity
}

const PERIODICITY_LABELS: Record<PayoutPeriodicity, string> = {
  weekly: 'semanal',
  biweekly: 'quinzenal',
  monthly: 'mensal',
}

export function PayoutHistoryTable({ payouts, periodicity = 'weekly' }: PayoutHistoryTableProps) {
  const periodLabel = PERIODICITY_LABELS[periodicity]

  if (payouts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 mb-3">
          <Minus className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm text-slate-600">Nenhum payout registrado ainda.</p>
        <p className="text-xs text-slate-400 mt-1">
          Os payouts aparecem aqui após o processamento {periodLabel}.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Histórico de Payouts</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Data</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Bruto</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Dívida</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Líquido</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {payouts.map((payout) => {
              const status = formatPayoutStatus(payout.status)
              const date = new Date(payout.created_at).toLocaleDateString('pt-BR')

              return (
                <tr key={payout.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-700">{date}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {formatMinorUnits(payout.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payout.debt_deducted > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs">
                        <ArrowDownLeft className="w-3 h-3" />
                        {formatMinorUnits(payout.debt_deducted)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    <span className="inline-flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {formatMinorUnits(payout.net_amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
