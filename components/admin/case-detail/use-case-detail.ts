'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  assignCase,
  updateCaseStatus,
  resolveCase,
  addCaseMessage,
} from '@/lib/actions/disputes'
import type { CaseDetailClientProps } from '../CaseDetailClient'

export function useCaseDetail({
  caseData,
  messages,
  labels,
  adminId,
}: Pick<CaseDetailClientProps, 'caseData' | 'messages' | 'labels' | 'adminId'>) {
  const router = useRouter()
  const [localCase, setLocalCase] = useState(caseData)
  const [localMessages, setLocalMessages] = useState(messages)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [resolutionText, setResolutionText] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { statusLabels } = labels

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

  return {
    router,
    localCase,
    localMessages,
    actionLoading,
    messageText,
    resolutionText,
    refundAmount,
    errorMsg,
    successMsg,
    labels,
    adminId,
    slaRemaining,
    isOverdue,
    setMessageText,
    setResolutionText,
    setRefundAmount,
    handleAssign,
    handleStatusChange,
    handleResolve,
    handleSendMessage,
  }
}
