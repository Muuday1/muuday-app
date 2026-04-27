'use client'

import { useMemo, useState } from 'react'
import { Search, Filter, ArrowUpDown } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

export type TransactionStatus = 'all' | 'captured' | 'pending' | 'refunded'

interface Transaction {
  id: string
  createdAt: string
  clientName: string
  bookingId: string
  amountTotal: number
  platformFee: number
  netAmount: number
  currency: string
  status: string
}

interface TransactionListProps {
  transactions: Transaction[]
  currency: string
}

const statusFilters: { key: TransactionStatus; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'captured', label: 'Capturados' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'refunded', label: 'Reembolsados' },
]

function statusLabel(status: string): { label: string; className: string } {
  switch (status) {
    case 'captured':
      return { label: 'Capturado', className: 'bg-green-50 text-green-700' }
    case 'pending':
    case 'requires_action':
      return { label: 'Pendente', className: 'bg-amber-50 text-amber-700' }
    case 'refunded':
    case 'partial_refunded':
      return { label: 'Reembolsado', className: 'bg-slate-100 text-slate-500' }
    case 'failed':
      return { label: 'Falhou', className: 'bg-red-50 text-red-700' }
    default:
      return { label: status, className: 'bg-slate-100 text-slate-500' }
  }
}

function formatBrl(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function TransactionList({ transactions, currency }: TransactionListProps) {
  const [filter, setFilter] = useState<TransactionStatus>('all')
  const [search, setSearch] = useState('')
  const [sortDesc, setSortDesc] = useState(true)

  const filtered = useMemo(() => {
    let rows = transactions
    if (filter !== 'all') {
      if (filter === 'captured') {
        rows = rows.filter(t => t.status === 'captured')
      } else if (filter === 'pending') {
        rows = rows.filter(t => ['pending', 'requires_action'].includes(t.status))
      } else if (filter === 'refunded') {
        rows = rows.filter(t => ['refunded', 'partial_refunded'].includes(t.status))
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        t =>
          t.clientName.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q) ||
          t.createdAt.includes(q),
      )
    }
    rows = [...rows].sort((a, b) => {
      const da = new Date(a.createdAt).getTime()
      const db = new Date(b.createdAt).getTime()
      return sortDesc ? db - da : da - db
    })
    return rows
  }, [transactions, filter, search, sortDesc])

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, t) => {
        acc.gross += t.amountTotal
        acc.fees += t.platformFee
        acc.net += t.netAmount
        return acc
      },
      { gross: 0, fees: 0, net: 0 },
    )
  }, [filtered])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-[#9FE870] text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-48 rounded-md border border-slate-200 py-1.5 pl-8 pr-3 text-xs transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
            />
          </div>
          <button
            onClick={() => setSortDesc(prev => !prev)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300"
            title={sortDesc ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Data
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Bruto</p>
          <p className="text-sm font-semibold text-slate-900">{formatBrl(totals.gross)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Taxas</p>
          <p className="text-sm font-semibold text-slate-900">{formatBrl(totals.fees)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Líquido</p>
          <p className="text-sm font-semibold text-green-700">{formatBrl(totals.net)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600">Data</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600">Cliente</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600">Bruto</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600">Taxa</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600">Líquido</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : (
              filtered.map(t => {
                const s = statusLabel(t.status)
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-700">
                      {formatInTimeZone(new Date(t.createdAt), 'America/Sao_Paulo', 'dd/MM/yy HH:mm', {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{t.clientName || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-700">{formatBrl(t.amountTotal)}</td>
                    <td className="px-4 py-2.5 text-slate-500">{formatBrl(t.platformFee)}</td>
                    <td className="px-4 py-2.5 font-medium text-green-700">{formatBrl(t.netAmount)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Mostrando {filtered.length} de {transactions.length} transações
      </p>
    </div>
  )
}
