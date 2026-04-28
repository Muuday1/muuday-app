'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  assignCase,
  updateCaseStatus,
} from '@/lib/actions/disputes'
import {
  AlertTriangle,
  Clock,
  Filter,
  MessageSquare,
  Shield,
  UserCheck,
  UserX,
  ChevronRight,
} from 'lucide-react'

interface CaseItem {
  id: string
  booking_id: string
  reporter_id: string
  type: string
  status: string
  reason: string
  resolution: string | null
  refund_amount: number | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  assigned_to: string | null
  priority: string
  sla_deadline: string | null
  summary: string | null
  profiles?: { full_name: string | null; email: string | null }
}

interface CaseQueueClientProps {
  cases: CaseItem[]
  nextCursor: string | null
  stats: {
    total: number
    open: number
    underReview: number
    waitingInfo: number
    resolved: number
    overdue: number
  }
  filters: {
    status?: string
    type?: string
    priority?: string
    assignedTo?: string
  }
  labels: {
    caseTypeLabels: Record<string, string>
    statusLabels: Record<string, string>
    priorityColors: Record<string, string>
  }
  adminId: string
}

function buildQueryString(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v)
  })
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

function slaBadge(slaDeadline: string | null, status: string) {
  if (!slaDeadline || ['resolved', 'closed'].includes(status)) return null
  const remaining = new Date(slaDeadline).getTime() - Date.now()
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const isOverdue = remaining < 0

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertTriangle className="w-3 h-3" />
        Vencido
      </span>
    )
  }
  if (hours < 4) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <Clock className="w-3 h-3" />
        {hours}h restantes
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      <Clock className="w-3 h-3" />
      {hours}h restantes
    </span>
  )
}

export function CaseQueueClient({
  cases,
  nextCursor,
  stats,
  filters,
  labels,
  adminId,
}: CaseQueueClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [localCases, setLocalCases] = useState(cases)

  const { caseTypeLabels, statusLabels, priorityColors } = labels

  async function handleAssign(caseId: string, assigneeId: string | null) {
    setActionLoading(`assign-${caseId}`)
    const result = await assignCase(caseId, assigneeId)
    if (result.success) {
      setLocalCases(prev =>
        prev.map(c => (c.id === caseId ? { ...c, assigned_to: assigneeId } : c))
      )
    }
    setActionLoading(null)
  }

  async function handleStatusChange(caseId: string, newStatus: string) {
    setActionLoading(`status-${caseId}`)
    const result = await updateCaseStatus(caseId, newStatus)
    if (result.success) {
      setLocalCases(prev =>
        prev.map(c => (c.id === caseId ? { ...c, status: newStatus } : c))
      )
    }
    setActionLoading(null)
  }

  function filterLink(key: string, value: string | undefined) {
    const next = { ...filters, [key]: value }
    if (!value) delete (next as any)[key]
    return buildQueryString(next)
  }

  const statusFilters = [
    { key: undefined, label: 'Todos' },
    { key: 'open', label: 'Novo' },
    { key: 'under_review', label: 'Em análise' },
    { key: 'waiting_info', label: 'Aguardando info' },
    { key: 'resolved', label: 'Resolvido' },
    { key: 'closed', label: 'Fechado' },
  ]

  const typeFilters = [
    { key: undefined, label: 'Todos os tipos' },
    { key: 'cancelation_dispute', label: 'Disputa' },
    { key: 'no_show_claim', label: 'No-show' },
    { key: 'quality_issue', label: 'Qualidade' },
    { key: 'refund_request', label: 'Reembolso' },
  ]

  const priorityFilters = [
    { key: undefined, label: 'Todas' },
    { key: 'P0', label: 'P0' },
    { key: 'P1', label: 'P1' },
    { key: 'P2', label: 'P2' },
    { key: 'P3', label: 'P3' },
  ]

  const assignedFilters = [
    { key: undefined, label: 'Todos' },
    { key: 'me', label: 'Meus' },
    { key: 'unassigned', label: 'Não atribuídos' },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fila de casos</h1>
          <p className="text-slate-500">Gerencie disputas, reclamações e solicitações</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Painel
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="Novos" value={stats.open} color="amber" />
        <StatCard label="Em análise" value={stats.underReview} color="blue" />
        <StatCard label="Aguardando" value={stats.waitingInfo} color="purple" />
        <StatCard label="Resolvidos" value={stats.resolved} color="green" />
        <StatCard label="Vencidos" value={stats.overdue} color="red" />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Filter className="w-4 h-4 text-slate-400 mt-1.5" />
          {statusFilters.map(({ key, label }) => (
            <Link
              key={label}
              href={`/admin/casos${filterLink('status', key)}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filters.status === key || (!filters.status && !key)
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pl-6">
          {typeFilters.map(({ key, label }) => (
            <Link
              key={label}
              href={`/admin/casos${filterLink('type', key)}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filters.type === key || (!filters.type && !key)
                  ? 'bg-[#9FE870] text-[#3d6b1f]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pl-6">
          {priorityFilters.map(({ key, label }) => (
            <Link
              key={label}
              href={`/admin/casos${filterLink('priority', key)}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filters.priority === key || (!filters.priority && !key)
                  ? 'bg-[#9FE870] text-[#3d6b1f]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pl-6">
          {assignedFilters.map(({ key, label }) => (
            <Link
              key={label}
              href={`/admin/casos${filterLink('assigned', key)}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filters.assignedTo === key || (!filters.assignedTo && !key)
                  ? 'bg-[#9FE870] text-[#3d6b1f]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Case list */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Prioridade</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Responsável</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">SLA</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Relator</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Criado</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localCases.length > 0 ? (
                localCases.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${priorityColors[c.priority] || priorityColors.P1}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {caseTypeLabels[c.type] || c.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === 'open' ? 'bg-amber-50 text-amber-700' :
                        c.status === 'under_review' ? 'bg-blue-50 text-blue-700' :
                        c.status === 'waiting_info' ? 'bg-purple-50 text-purple-700' :
                        c.status === 'resolved' ? 'bg-green-50 text-green-700' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {statusLabels[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.assigned_to === adminId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#3d6b1f]">
                          <UserCheck className="w-3 h-3" /> Você
                        </span>
                      ) : c.assigned_to ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <UserCheck className="w-3 h-3" /> Atribuído
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <UserX className="w-3 h-3" /> Não atribuído
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{slaBadge(c.sla_deadline, c.status)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {c.profiles?.full_name || c.profiles?.email || c.reporter_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!c.assigned_to && (
                          <button
                            onClick={() => handleAssign(c.id, adminId)}
                            disabled={actionLoading === `assign-${c.id}`}
                            className="rounded-md bg-[#9FE870]/10 px-2 py-1 text-xs font-medium text-[#3d6b1f] hover:bg-[#9FE870]/20 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `assign-${c.id}` ? '...' : 'Atribuir'}
                          </button>
                        )}
                        {c.assigned_to === adminId && c.status === 'open' && (
                          <button
                            onClick={() => handleStatusChange(c.id, 'under_review')}
                            disabled={actionLoading === `status-${c.id}`}
                            className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `status-${c.id}` ? '...' : 'Analisar'}
                          </button>
                        )}
                        <Link
                          href={`/admin/casos/${c.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          Ver <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <Shield className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    Nenhum caso encontrado com estes filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {nextCursor && (
        <div className="flex justify-end">
          <Link
            href={`/admin/casos${filterLink('cursor', nextCursor)}`}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Carregar mais →
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className={`text-2xl font-bold ${colorMap[color]?.split(' ')[1] || 'text-slate-700'}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
