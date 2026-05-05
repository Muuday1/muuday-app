'use client'

import { useMemo, useState } from 'react'
import {
  adminUpdateProfessionalStatus,
  adminUpdateFirstBookingGate,
  adminToggleReviewVisibility,
  adminDeleteReview,
  type AdminDashboardData,
} from '@/lib/actions/admin'

export type AdminTab = 'overview' | 'professionals' | 'reviews' | 'bookings'

export function useAdminDashboard(initialData: AdminDashboardData) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [stats, setStats] = useState(initialData.stats)
  const [professionals, setProfessionals] = useState(initialData.professionals)
  const [professionalSpecialties] = useState(initialData.professionalSpecialties)
  const [professionalCredentialCounts] = useState(initialData.professionalCredentialCounts)
  const [professionalMinServicePrice] = useState(initialData.professionalMinServicePrice)
  const [reviews, setReviews] = useState(initialData.reviews)
  const [bookings] = useState(initialData.bookings)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const filteredProfessionals = useMemo(() => {
    if (statusFilter === 'all') return professionals
    return professionals.filter(p => p.status === statusFilter)
  }, [professionals, statusFilter])

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  async function updateProfessionalStatus(id: string, newStatus: string) {
    setActionLoading(id)
    const result = await adminUpdateProfessionalStatus(id, newStatus)

    if (result.success) {
      setProfessionals(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
      showSuccess(`Profissional ${newStatus === 'approved' ? 'aprovado' : newStatus === 'rejected' ? 'rejeitado' : newStatus === 'suspended' ? 'suspenso' : 'atualizado'}!`)
    }
    setActionLoading(null)
  }

  async function updateFirstBookingGate(id: string, enabled: boolean) {
    const actionKey = `${id}:first-booking-gate`
    setActionLoading(actionKey)
    const result = await adminUpdateFirstBookingGate(id, enabled)

    if (result.success) {
      setProfessionals(prev =>
        prev.map(p =>
          p.id === id
            ? {
                ...p,
                first_booking_enabled: enabled,
                first_booking_gate_note: enabled ? 'admin_enabled' : 'admin_blocked',
                first_booking_gate_updated_at: new Date().toISOString(),
              }
            : p,
        ),
      )
      showSuccess(enabled ? 'Primeiro agendamento liberado.' : 'Primeiro agendamento bloqueado.')
    }

    setActionLoading(null)
  }

  async function toggleReviewVisibility(id: string, visible: boolean) {
    setActionLoading(id)
    const result = await adminToggleReviewVisibility(id, visible)

    if (result.success) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_visible: visible } : r))
      showSuccess(visible ? 'Avaliação publicada!' : 'Avaliação ocultada!')
    }
    setActionLoading(null)
  }

  async function handleDeleteReview(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) return
    setActionLoading(id)
    const result = await adminDeleteReview(id)

    if (result.success) {
      setReviews(prev => prev.filter(r => r.id !== id))
      setStats(prev => ({ ...prev, totalReviews: prev.totalReviews - 1, pendingReviews: Math.max(0, prev.pendingReviews - 1) }))
      showSuccess('Avaliação rejeitada e excluída!')
    }
    setActionLoading(null)
  }

  return {
    activeTab,
    setActiveTab,
    stats,
    professionals,
    professionalSpecialties,
    professionalCredentialCounts,
    professionalMinServicePrice,
    reviews,
    bookings,
    statusFilter,
    setStatusFilter,
    expandedId,
    setExpandedId,
    actionLoading,
    successMsg,
    filteredProfessionals,
    updateProfessionalStatus,
    updateFirstBookingGate,
    toggleReviewVisibility,
    handleDeleteReview,
  }
}
