'use client'

import Link from 'next/link'
import { CATEGORIES } from '@/types'
import { type AdminDashboardData } from '@/lib/actions/admin'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'
import {
  Shield,
  CheckCircle,
  Star,
  Users,
  Calendar,
  TrendingUp,
  MessageSquare,
  FolderTree,
} from 'lucide-react'
import { useAdminDashboard } from './admin-dashboard/hooks/use-admin-dashboard'
import { AdminOverviewTab } from './admin-dashboard/components/AdminOverviewTab'
import { AdminProfessionalsTab } from './admin-dashboard/components/AdminProfessionalsTab'
import { AdminReviewsTab } from './admin-dashboard/components/AdminReviewsTab'
import { AdminBookingsTab } from './admin-dashboard/components/AdminBookingsTab'

export interface AdminDashboardProps {
  initialData: AdminDashboardData
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const dash = useAdminDashboard(initialData)

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    pending_review: 'bg-amber-50 text-amber-700',
    needs_changes: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    suspended: 'bg-orange-50 text-orange-700',
  }

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    pending_review: 'Pendente',
    needs_changes: 'Ajustes solicitados',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    suspended: 'Suspenso',
  }

  const getPrimarySpecialty = (professional: typeof dash.professionals[0]) => {
    const specialty = dash.professionalSpecialties[professional.id]?.[0]
    if (specialty) return specialty
    return CATEGORIES.find(category => category.slug === professional.category)?.name || professional.category
  }

  const getVisibleBasePrice = (professional: typeof dash.professionals[0]) => {
    const byService = dash.professionalMinServicePrice[professional.id]
    if (Number.isFinite(byService) && byService > 0) return byService
    const fallback = Number(professional.session_price_brl || 0)
    if (Number.isFinite(fallback) && fallback > 0) return fallback
    return 0
  }

  const tabs = [
    { id: 'overview' as const, label: 'Visão geral', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'professionals' as const, label: 'Profissionais', icon: <Users className="w-4 h-4" />, badge: dash.stats.pendingProfessionals },
    { id: 'reviews' as const, label: 'Avaliações', icon: <MessageSquare className="w-4 h-4" />, badge: dash.stats.pendingReviews },
    { id: 'bookings' as const, label: 'Agendamentos', icon: <Calendar className="w-4 h-4" /> },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-[#9FE870]/8 rounded-md flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#3d6b1f]" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900">Painel Administrativo</h1>
            <p className="text-sm text-slate-500">Gerencie profissionais, avaliações e agendamentos</p>
          </div>
          <Link
            href="/admin/taxonomia"
            className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50/70 transition-all"
          >
            <FolderTree className="w-4 h-4" /> Taxonomia
          </Link>
          <Link
            href="/admin/planos"
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50/70 transition-all"
          >
            <Shield className="w-4 h-4" /> Planos
          </Link>
          <Link
            href="/admin/casos"
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50/70 transition-all"
          >
            <MessageSquare className="w-4 h-4" /> Casos
          </Link>
          <Link
            href="/admin/avaliacoes"
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50/70 transition-all"
          >
            <Star className="w-4 h-4" /> Avaliações
          </Link>
        </div>
      </div>

      {dash.successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          {dash.successMsg}
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-white rounded-md border border-slate-200/80 p-1 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => dash.setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              dash.activeTab === tab.id
                ? 'bg-[#9FE870] text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/70'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge ? (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                dash.activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
              }`}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {dash.activeTab === 'overview' && (
        <AdminOverviewTab
          stats={dash.stats}
          professionals={dash.professionals}
          statusColors={statusColors}
          statusLabels={statusLabels}
          getPrimarySpecialty={getPrimarySpecialty}
          getVisibleBasePrice={getVisibleBasePrice}
          onNavigateToProfessionals={(filter) => {
            dash.setStatusFilter(filter)
            dash.setActiveTab('professionals')
          }}
          onNavigateToReviews={() => dash.setActiveTab('reviews')}
        />
      )}

      {dash.activeTab === 'professionals' && (
        <AdminProfessionalsTab
          stats={dash.stats}
          professionals={dash.filteredProfessionals}
          professionalSpecialties={dash.professionalSpecialties}
          professionalCredentialCounts={dash.professionalCredentialCounts}
          professionalMinServicePrice={dash.professionalMinServicePrice}
          statusFilter={dash.statusFilter}
          setStatusFilter={dash.setStatusFilter}
          expandedId={dash.expandedId}
          setExpandedId={dash.setExpandedId}
          actionLoading={dash.actionLoading}
          statusColors={statusColors}
          statusLabels={statusLabels}
          getPrimarySpecialty={getPrimarySpecialty}
          getVisibleBasePrice={getVisibleBasePrice}
          updateProfessionalStatus={dash.updateProfessionalStatus}
          updateFirstBookingGate={dash.updateFirstBookingGate}
        />
      )}

      {dash.activeTab === 'reviews' && (
        <AdminReviewsTab
          reviews={dash.reviews}
          actionLoading={dash.actionLoading}
          toggleReviewVisibility={dash.toggleReviewVisibility}
          handleDeleteReview={dash.handleDeleteReview}
        />
      )}

      {dash.activeTab === 'bookings' && <AdminBookingsTab bookings={dash.bookings} />}
    </div>
  )
}
