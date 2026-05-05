'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  MessageSquare,
  Shield,
  UserCheck,
  XCircle,
} from 'lucide-react'

interface CaseHeaderProps {
  caseId: string
  caseType: string
  caseTypeLabel: string
  status: string
  statusLabel: string
  priority: string
  priorityClass: string
  createdAt: string
  assignedTo: string | null
  adminId: string
  isOverdue: boolean
  slaRemaining: number | null
  actionLoading: string | null
  onAssign: () => void
  onStatusChange: (status: string) => void
}

export function CaseHeader({
  caseId,
  caseType,
  caseTypeLabel,
  status,
  statusLabel,
  priority,
  priorityClass,
  createdAt,
  assignedTo,
  adminId,
  isOverdue,
  slaRemaining,
  actionLoading,
  onAssign,
  onStatusChange,
}: CaseHeaderProps) {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/casos" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Fila de casos
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Caso #{caseId.slice(0, 8)}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${priorityClass}`}>
              {priority}
            </span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              status === 'open' ? 'bg-amber-50 text-amber-700' :
              status === 'under_review' ? 'bg-blue-50 text-blue-700' :
              status === 'waiting_info' ? 'bg-purple-50 text-purple-700' :
              status === 'resolved' ? 'bg-green-50 text-green-700' :
              'bg-slate-50 text-slate-600'
            }`}>
              {statusLabel || status}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                <AlertTriangle className="w-3 h-3" /> SLA vencido
              </span>
            )}
            {slaRemaining !== null && !isOverdue && slaRemaining < 4 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Clock className="w-3 h-3" /> {slaRemaining}h restantes
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {caseTypeLabel || caseType}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Criado em {new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!assignedTo && (
            <button
              onClick={onAssign}
              disabled={actionLoading === 'assign'}
              className="flex items-center gap-2 rounded-lg bg-[#9FE870] px-4 py-2 text-sm font-medium text-[#3d6b1f] hover:bg-[#8dd560] transition-colors disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              {actionLoading === 'assign' ? '...' : 'Atribuir a mim'}
            </button>
          )}
          {assignedTo === adminId && status === 'open' && (
            <button
              onClick={() => onStatusChange('under_review')}
              disabled={actionLoading === 'status-under_review'}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              {actionLoading === 'status-under_review' ? '...' : 'Iniciar análise'}
            </button>
          )}
          {assignedTo === adminId && status === 'under_review' && (
            <button
              onClick={() => onStatusChange('waiting_info')}
              disabled={actionLoading === 'status-waiting_info'}
              className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              {actionLoading === 'status-waiting_info' ? '...' : 'Aguardar info'}
            </button>
          )}
          {assignedTo === adminId && ['under_review', 'waiting_info'].includes(status) && (
            <button
              onClick={() => onStatusChange('closed')}
              disabled={actionLoading === 'status-closed'}
              className="flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {actionLoading === 'status-closed' ? '...' : 'Fechar'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
