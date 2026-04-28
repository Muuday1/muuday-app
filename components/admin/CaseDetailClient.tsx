'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  assignCase,
  updateCaseStatus,
  resolveCase,
  addCaseMessage,
} from '@/lib/actions/disputes'
import { formatMinorUnits } from '@/lib/payments/fees/calculator'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  MessageSquare,
  Send,
  Shield,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react'

interface CaseDetailClientProps {
  caseData: {
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
    assigned_to: string | null
    priority: string
    sla_deadline: string | null
    summary: string | null
    reporter_name: string | null
  }
  messages: Array<{
    id: string
    sender_id: string
    content: string
    created_at: string
    profiles?: { full_name: string | null }
  }>
  evidence: {
    booking: {
      id: string
      scheduled_at: string
      status: string
      price_brl: number
      session_type: string
      user_id: string
      professional_id: string
    } | null
    payment: {
      id: string
      status: string
      amount_brl: number
      stripe_payment_intent_id: string | null
    } | null
    reporter: { full_name: string | null; email: string | null } | null
    professional: { full_name: string | null; email: string | null } | null
    user: { full_name: string | null; email: string | null } | null
  } | null
  timeline: Array<{
    id: string
    event_type: 'action' | 'message'
    action_type?: string
    sender_id?: string
    content?: string
    performed_by?: string
    metadata?: Record<string, unknown>
    created_at: string
    profiles?: { full_name: string | null }
  }>
  labels: {
    caseTypeLabels: Record<string, string>
    statusLabels: Record<string, string>
    priorityColors: Record<string, string>
  }
  adminId: string
}

export function CaseDetailClient({
  caseData,
  messages,
  evidence,
  timeline,
  labels,
  adminId,
}: CaseDetailClientProps) {
  const router = useRouter()
  const [localCase, setLocalCase] = useState(caseData)
  const [localMessages, setLocalMessages] = useState(messages)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [resolutionText, setResolutionText] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { caseTypeLabels, statusLabels, priorityColors } = labels

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  function showError(msg: string) {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(''), 6000)
  }

  async function handleAssign() {
    setActionLoading('assign')
    const result = await assignCase(localCase.id, adminId)
    if (result.success) {
      setLocalCase(prev => ({ ...prev, assigned_to: adminId }))
      showSuccess('Caso atribuído a você.')
    } else {
      showError(result.error)
    }
    setActionLoading(null)
  }

  async function handleStatusChange(newStatus: string) {
    setActionLoading(`status-${newStatus}`)
    const result = await updateCaseStatus(localCase.id, newStatus)
    if (result.success) {
      setLocalCase(prev => ({ ...prev, status: newStatus }))
      showSuccess(`Status atualizado para ${statusLabels[newStatus] || newStatus}.`)
    } else {
      showError(result.error)
    }
    setActionLoading(null)
  }

  async function handleResolve() {
    if (!resolutionText.trim()) {
      showError('Descreva a resolução.')
      return
    }
    setActionLoading('resolve')
    const refund = refundAmount ? parseFloat(refundAmount) : undefined
    const result = await resolveCase(localCase.id, resolutionText, refund)
    if (result.success) {
      setLocalCase(prev => ({
        ...prev,
        status: 'resolved',
        resolution: resolutionText,
        refund_amount: refund || null,
        resolved_at: result.data.resolvedAt,
      }))
      setResolutionText('')
      setRefundAmount('')
      showSuccess('Caso resolvido com sucesso.')
    } else {
      showError(result.error)
    }
    setActionLoading(null)
  }

  async function handleSendMessage() {
    if (!messageText.trim()) return
    setActionLoading('message')
    const result = await addCaseMessage(localCase.id, messageText)
    if (result.success) {
      setLocalMessages(prev => [
        ...prev,
        {
          id: result.data.messageId,
          sender_id: adminId,
          content: messageText,
          created_at: new Date().toISOString(),
          profiles: { full_name: 'Admin' },
        },
      ])
      setMessageText('')
    } else {
      showError(result.error)
    }
    setActionLoading(null)
  }

  const slaRemaining = localCase.sla_deadline
    ? Math.floor((new Date(localCase.sla_deadline).getTime() - Date.now()) / (1000 * 60 * 60))
    : null
  const isOverdue = slaRemaining !== null && slaRemaining < 0

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/casos" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Fila de casos
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Caso #{localCase.id.slice(0, 8)}</span>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${priorityColors[localCase.priority] || priorityColors.P1}`}>
              {localCase.priority}
            </span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              localCase.status === 'open' ? 'bg-amber-50 text-amber-700' :
              localCase.status === 'under_review' ? 'bg-blue-50 text-blue-700' :
              localCase.status === 'waiting_info' ? 'bg-purple-50 text-purple-700' :
              localCase.status === 'resolved' ? 'bg-green-50 text-green-700' :
              'bg-slate-50 text-slate-600'
            }`}>
              {statusLabels[localCase.status] || localCase.status}
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
            {caseTypeLabels[localCase.type] || localCase.type}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Criado em {new Date(localCase.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!localCase.assigned_to && (
            <button
              onClick={handleAssign}
              disabled={actionLoading === 'assign'}
              className="flex items-center gap-2 rounded-lg bg-[#9FE870] px-4 py-2 text-sm font-medium text-[#3d6b1f] hover:bg-[#8dd560] transition-colors disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              {actionLoading === 'assign' ? '...' : 'Atribuir a mim'}
            </button>
          )}
          {localCase.assigned_to === adminId && localCase.status === 'open' && (
            <button
              onClick={() => handleStatusChange('under_review')}
              disabled={actionLoading === 'status-under_review'}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              {actionLoading === 'status-under_review' ? '...' : 'Iniciar análise'}
            </button>
          )}
          {localCase.assigned_to === adminId && localCase.status === 'under_review' && (
            <button
              onClick={() => handleStatusChange('waiting_info')}
              disabled={actionLoading === 'status-waiting_info'}
              className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              {actionLoading === 'status-waiting_info' ? '...' : 'Aguardar info'}
            </button>
          )}
          {localCase.assigned_to === adminId && ['under_review', 'waiting_info'].includes(localCase.status) && (
            <button
              onClick={() => handleStatusChange('closed')}
              disabled={actionLoading === 'status-closed'}
              className="flex items-center gap-2 rounded-lg bg-slate-500 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {actionLoading === 'status-closed' ? '...' : 'Fechar'}
            </button>
          )}
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary + Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reason */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Motivo relatado
            </h3>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4">
              {localCase.reason}
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

          {/* Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Timeline
            </h3>
            <div className="space-y-4">
              {timeline.length > 0 ? (
                timeline.map(event => (
                  <div key={`${event.event_type}-${event.id}`} className="flex gap-3">
                    <div className="mt-0.5">
                      {event.event_type === 'message' ? (
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Shield className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-slate-700">
                          {event.event_type === 'message'
                            ? (event.profiles?.full_name || event.sender_id?.slice(0, 8) || 'Desconhecido')
                            : (event.profiles?.full_name || event.performed_by?.slice(0, 8) || 'Sistema')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(event.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {event.event_type === 'message' ? (
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{event.content}</p>
                      ) : (
                        <p className="text-sm text-slate-600">
                          {event.action_type === 'resolved' && 'Caso resolvido'}
                          {event.action_type === 'assigned' && 'Caso atribuído'}
                          {event.action_type === 'unassigned' && 'Atribuição removida'}
                          {event.action_type === 'status_changed' && `Status alterado: ${(event.metadata as any)?.from_status} → ${(event.metadata as any)?.to_status}`}
                          {event.action_type === 'message' && 'Mensagem enviada'}
                          {!['resolved', 'assigned', 'unassigned', 'status_changed', 'message'].includes(event.action_type || '') && event.action_type}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Mensagens
            </h3>
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {localMessages.length > 0 ? (
                localMessages.map(msg => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="mt-0.5">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-slate-700">
                          {msg.profiles?.full_name || msg.sender_id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(msg.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{msg.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhuma mensagem.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escreva uma mensagem..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870]/50"
              />
              <button
                onClick={handleSendMessage}
                disabled={actionLoading === 'message' || !messageText.trim()}
                className="flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {actionLoading === 'message' ? '...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Decision */}
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
                    onChange={e => setResolutionText(e.target.value)}
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
                    onChange={e => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    step={0.01}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9FE870]/50"
                  />
                  <p className="text-xs text-slate-400 mt-1">Deixe em branco se não houver reembolso.</p>
                </div>
                <button
                  onClick={handleResolve}
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
                href="/admin/finance/disputas"
                target="_blank"
                className="block text-sm text-[#3d6b1f] hover:underline"
              >
                Ver disputas financeiras →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
