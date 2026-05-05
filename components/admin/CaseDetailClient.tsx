'use client'

import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useCaseDetail } from './case-detail/use-case-detail'
import { CaseHeader } from './case-detail/CaseHeader'
import { CaseEvidence } from './case-detail/CaseEvidence'
import { CaseTimeline } from './case-detail/CaseTimeline'
import { CaseMessageThread } from './case-detail/CaseMessageThread'
import { CaseDecisionPanel } from './case-detail/CaseDecisionPanel'

export interface CaseDetailClientProps {
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
  const {
    localCase,
    localMessages,
    actionLoading,
    messageText,
    resolutionText,
    refundAmount,
    errorMsg,
    successMsg,
    slaRemaining,
    isOverdue,
    setMessageText,
    setResolutionText,
    setRefundAmount,
    handleAssign,
    handleStatusChange,
    handleResolve,
    handleSendMessage,
  } = useCaseDetail({ caseData, messages, labels, adminId })

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <CaseHeader
        caseId={localCase.id}
        caseType={localCase.type}
        caseTypeLabel={labels.caseTypeLabels[localCase.type]}
        status={localCase.status}
        statusLabel={labels.statusLabels[localCase.status]}
        priority={localCase.priority}
        priorityClass={labels.priorityColors[localCase.priority] || labels.priorityColors.P1}
        createdAt={localCase.created_at}
        assignedTo={localCase.assigned_to}
        adminId={adminId}
        isOverdue={isOverdue}
        slaRemaining={slaRemaining}
        actionLoading={actionLoading}
        onAssign={handleAssign}
        onStatusChange={handleStatusChange}
      />

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

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary + Evidence */}
        <div className="lg:col-span-2 space-y-6">
          <CaseEvidence reason={localCase.reason} evidence={evidence} />
          <CaseTimeline timeline={timeline} />
          <CaseMessageThread
            messages={localMessages}
            messageText={messageText}
            actionLoading={actionLoading}
            onMessageTextChange={setMessageText}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Right: Decision */}
        <CaseDecisionPanel
          localCase={localCase}
          adminId={adminId}
          resolutionText={resolutionText}
          refundAmount={refundAmount}
          actionLoading={actionLoading}
          evidence={evidence}
          onResolutionChange={setResolutionText}
          onRefundChange={setRefundAmount}
          onResolve={handleResolve}
        />
      </div>
    </div>
  )
}
