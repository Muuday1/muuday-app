'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CATEGORIES } from '@/types'
import {
  adminUpdateProfessionalStatus,
  adminUpdateFirstBookingGate,
  adminToggleReviewVisibility,
  adminDeleteReview,
  type AdminDashboardData,
} from '@/lib/actions/admin'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'
import { AdminProfessionalIdentityBadge } from '@/components/admin/AdminProfessionalIdentityBadge'
import { AppTable, AppTableHeader, AppTableBody, AppTableRow, AppTableHeadCell, AppTableCell } from '@/components/ui/AppTable'
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  Calendar,
  TrendingUp,
  MessageSquare,
  Ban,
  RotateCcw,
  FolderTree,
} from 'lucide-react'

type Tab = 'overview' | 'professionals' | 'reviews' | 'bookings'

export interface AdminDashboardProps {
  initialData: AdminDashboardData
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
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

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

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

  const getPrimarySpecialty = (professional: typeof professionals[0]) => {
    const specialty = professionalSpecialties[professional.id]?.[0]
    if (specialty) return specialty
    return CATEGORIES.find(category => category.slug === professional.category)?.name || professional.category
  }

  const getVisibleBasePrice = (professional: typeof professionals[0]) => {
    const byService = professionalMinServicePrice[professional.id]
    if (Number.isFinite(byService) && byService > 0) return byService
    const fallback = Number(professional.session_price_brl || 0)
    if (Number.isFinite(fallback) && fallback > 0) return fallback
    return 0
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Visão geral', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'professionals', label: 'Profissionais', icon: <Users className="w-4 h-4" />, badge: stats.pendingProfessionals },
    { id: 'reviews', label: 'Avaliações', icon: <MessageSquare className="w-4 h-4" />, badge: stats.pendingReviews },
    { id: 'bookings', label: 'Agendamentos', icon: <Calendar className="w-4 h-4" /> },
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
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-white rounded-md border border-slate-200/80 p-1 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#9FE870] text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/70'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge ? (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
              }`}>
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />} label="Usuários" value={stats.totalUsers} color="brand" />
            <StatCard icon={<Shield className="w-5 h-5" />} label="Profissionais" value={stats.totalProfessionals} color="brand" />
            <StatCard icon={<Calendar className="w-5 h-5" />} label="Agendamentos" value={stats.totalBookings} color="accent" />
            <StatCard icon={<Star className="w-5 h-5" />} label="Avaliações" value={stats.totalReviews} color="amber" />
          </div>

          {(stats.pendingProfessionals > 0 || stats.pendingReviews > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" />
                Ações pendentes
              </h3>
              <div className="space-y-2">
                {stats.pendingProfessionals > 0 && (
                  <button
                    onClick={() => { setActiveTab('professionals'); setStatusFilter('pending_review') }}
                    className="w-full text-left p-3 bg-white rounded-md transition-all flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-700">
                      <strong>{stats.pendingProfessionals}</strong> profissional(is) aguardando aprovação
                    </span>
                    <span className="text-xs text-[#3d6b1f] font-medium">Revisar →</span>
                  </button>
                )}
                {stats.pendingReviews > 0 && (
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="w-full text-left p-3 bg-white rounded-md transition-all flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-700">
                      <strong>{stats.pendingReviews}</strong> avaliação(ões) aguardando moderação
                    </span>
                    <span className="text-xs text-[#3d6b1f] font-medium">Moderar →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200/80 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Profissionais recentes</h3>
            {professionals.slice(0, 5).map(pro => (
              <div key={pro.id} className="flex items-center justify-between py-3 border-b border-slate-100/80 last:border-0">
                <AdminProfessionalIdentityBadge
                  fullName={pro.profiles?.full_name}
                  email={pro.profiles?.email}
                  avatarUrl={pro.profiles?.avatar_url}
                  subtitle={`${getPrimarySpecialty(pro)} · ${
                    getVisibleBasePrice(pro) > 0 ? `R$ ${getVisibleBasePrice(pro).toFixed(2)}` : 'Preço não definido'
                  }`}
                  size="sm"
                />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[pro.status]}`}>
                  {statusLabels[pro.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'professionals' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending_review', 'needs_changes', 'approved', 'rejected', 'suspended', 'draft'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-[#9FE870] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-[#9FE870]/40'
                }`}
              >
                {status === 'all' ? 'Todos' : statusLabels[status]}
                {status === 'pending_review' && stats?.pendingProfessionals ? (
                  <span className="ml-1.5 bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full text-xs">
                    {stats.pendingProfessionals}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {filteredProfessionals.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200/80 p-12 text-center">
              <p className="text-slate-500">Nenhum profissional encontrado com este filtro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProfessionals.map(pro => {
                const isExpanded = expandedId === pro.id
                const credentialCount = professionalCredentialCounts[pro.id] || 0

                return (
                  <div key={pro.id} className="bg-white rounded-lg border border-slate-200/80 overflow-hidden transition-all">
                    <div
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : pro.id)}
                    >
                      <AdminProfessionalIdentityBadge
                        fullName={pro.profiles?.full_name}
                        email={pro.profiles?.email}
                        avatarUrl={pro.profiles?.avatar_url}
                        subtitle={`${getPrimarySpecialty(pro)} • ${
                          getVisibleBasePrice(pro) > 0 ? `R$ ${getVisibleBasePrice(pro).toFixed(2)}` : 'Preço não definido'
                        } • ${pro.profiles?.email || ''}`}
                        size="sm"
                      />
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            credentialCount > 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {credentialCount > 0
                            ? `${credentialCount} credencial(is)`
                            : 'Sem credenciais'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[pro.status]}`}>
                          {statusLabels[pro.status]}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-100/80">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Biografia</p>
                              <p className="text-sm text-slate-700">{pro.bio || 'Sem bio'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Preço base</p>
                                <p className="text-sm font-semibold text-slate-900">
                                  {getVisibleBasePrice(pro) > 0 ? `R$ ${getVisibleBasePrice(pro).toFixed(2)}` : 'Não definido'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Duração</p>
                                <p className="text-sm text-slate-700">{pro.session_duration_minutes} min</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Experiência</p>
                                <p className="text-sm text-slate-700">{pro.years_experience} anos</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Avaliação</p>
                                <p className="text-sm text-slate-700">★ {pro.rating} ({pro.total_reviews})</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Idiomas</p>
                              <div className="flex flex-wrap gap-1">
                                {pro.languages?.map(lang => (
                                  <span key={lang} className="px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-600">{lang}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Especialidades</p>
                              <div className="flex flex-wrap gap-1">
                                {(professionalSpecialties[pro.id] || []).map(specialty => (
                                  <span key={specialty} className="px-2 py-0.5 bg-slate-100 rounded-full text-xs text-slate-700">
                                    {specialty}
                                  </span>
                                ))}
                                {(professionalSpecialties[pro.id] || []).length === 0 && (
                                  <span className="text-xs text-slate-500">Não informado</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Foco de atuação</p>
                              <div className="flex flex-wrap gap-1">
                                {pro.tags?.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-[#9FE870]/8 text-[#3d6b1f] rounded-full text-xs">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-medium text-slate-400 uppercase mb-1">País</p>
                                <p className="text-sm text-slate-700">{pro.profiles?.country || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Fuso horário</p>
                                <p className="text-sm text-slate-700">{pro.profiles?.timezone || '-'}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Credenciais</p>
                              <p className="text-sm text-slate-700">
                                {credentialCount > 0
                                  ? `${credentialCount} documento(s) enviado(s)`
                                  : 'Nenhum documento enviado'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Gate do 1o agendamento</p>
                              <p className={`text-sm font-medium ${pro.first_booking_enabled ? 'text-green-700' : 'text-amber-700'}`}>
                                {pro.first_booking_enabled ? 'Liberado' : 'Bloqueado'}
                              </p>
                              {pro.first_booking_gate_note && (
                                <p className="text-xs text-slate-500 mt-0.5">Motivo: {pro.first_booking_gate_note}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Registrado em</p>
                              <p className="text-sm text-slate-700">
                                {new Date(pro.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-xs font-medium text-slate-400 uppercase mb-2">Ações</p>

                            <Link
                              href={`/admin/revisao/${pro.id}`}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-[#9FE870]/40 text-slate-700 rounded-md text-sm font-medium transition-all"
                            >
                              <Clock className="w-4 h-4" />
                              Revisar detalhes
                            </Link>

                            {pro.status !== 'approved' && (
                              <button
                                onClick={() => updateProfessionalStatus(pro.id, 'approved')}
                                disabled={actionLoading === pro.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                {actionLoading === pro.id ? 'Processando...' : 'Aprovar'}
                              </button>
                            )}

                            {pro.status !== 'rejected' && pro.status !== 'approved' && (
                              <Link
                                href={`/admin/revisao/${pro.id}`}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-all"
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeitar com ajustes
                              </Link>
                            )}

                            {pro.status === 'approved' && (
                              <button
                                onClick={() => updateProfessionalStatus(pro.id, 'suspended')}
                                disabled={actionLoading === pro.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <Ban className="w-4 h-4" />
                                Suspender
                              </button>
                            )}

                            {pro.status === 'approved' && !pro.first_booking_enabled && (
                              <button
                                onClick={() => updateFirstBookingGate(pro.id, true)}
                                disabled={actionLoading === `${pro.id}:first-booking-gate`}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                {actionLoading === `${pro.id}:first-booking-gate` ? 'Processando...' : 'Liberar 1o agendamento'}
                              </button>
                            )}

                            {pro.status === 'approved' && pro.first_booking_enabled && (
                              <button
                                onClick={() => updateFirstBookingGate(pro.id, false)}
                                disabled={actionLoading === `${pro.id}:first-booking-gate`}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <Ban className="w-4 h-4" />
                                {actionLoading === `${pro.id}:first-booking-gate` ? 'Processando...' : 'Bloquear 1o agendamento'}
                              </button>
                            )}
                            {(pro.status === 'suspended' || pro.status === 'rejected') && (
                              <button
                                onClick={() => updateProfessionalStatus(pro.id, 'pending_review')}
                                disabled={actionLoading === pro.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Recolocar em revisão
                              </button>
                            )}

                            <a
                              href={buildProfessionalProfilePath({
                                id: pro.id,
                                fullName: pro.profiles?.full_name,
                                publicCode: pro.public_code,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-[#9FE870]/40 text-slate-700 rounded-md text-sm font-medium transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              Ver perfil público
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200/80 p-12 text-center">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma avaliação encontrada.</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-white rounded-lg border border-slate-200/80 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900">
                        {review.profiles?.full_name || 'Usuário'}
                      </p>
                      <span className="text-slate-300">→</span>
                      <p className="text-sm text-slate-600">
                        {(review.professionals as unknown as { profiles: { full_name: string } })?.profiles?.full_name || 'Profissional'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-1">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    review.is_visible ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {review.is_visible ? 'Publicada' : 'Pendente'}
                  </span>
                </div>

                {review.comment && (
                  <p className="text-sm text-slate-600 mb-4 bg-slate-50/70 rounded-md p-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                <div className="flex gap-2">
                  {!review.is_visible ? (
                    <>
                      <button
                        onClick={() => toggleReviewVisibility(review.id, true)}
                        disabled={actionLoading === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {actionLoading === review.id ? '...' : 'Aprovar'}
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={actionLoading === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {actionLoading === review.id ? '...' : 'Rejeitar'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleReviewVisibility(review.id, false)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {actionLoading === review.id ? '...' : 'Ocultar'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200/80 p-12 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhum agendamento encontrado.</p>
            </div>
          ) : (
            <AppTable>
              <AppTableHeader>
                <AppTableRow>
                  <AppTableHeadCell>Usuário</AppTableHeadCell>
                  <AppTableHeadCell>Profissional</AppTableHeadCell>
                  <AppTableHeadCell>Data</AppTableHeadCell>
                  <AppTableHeadCell>Status</AppTableHeadCell>
                  <AppTableHeadCell align="right">Preço</AppTableHeadCell>
                </AppTableRow>
              </AppTableHeader>
              <AppTableBody>
                {bookings.map(booking => {
                  const bookingStatusColors: Record<string, string> = {
                    pending: 'bg-amber-50 text-amber-700',
                    confirmed: 'bg-green-50 text-green-700',
                    completed: 'bg-green-50 text-green-700',
                    cancelled: 'bg-red-50 text-red-700',
                    no_show: 'bg-slate-100 text-slate-600',
                  }
                  const bookingStatusLabels: Record<string, string> = {
                    pending: 'Pendente',
                    confirmed: 'Confirmado',
                    completed: 'Concluído',
                    cancelled: 'Cancelado',
                    no_show: 'Não compareceu',
                  }
                  return (
                    <AppTableRow key={booking.id}>
                      <AppTableCell>
                        <p className="font-medium text-slate-900">{booking.user_profile?.full_name || '-'}</p>
                        <p className="text-xs text-slate-400">{booking.user_profile?.email || ''}</p>
                      </AppTableCell>
                      <AppTableCell className="text-slate-700">
                        {booking.professional_profile?.full_name || '-'}
                      </AppTableCell>
                      <AppTableCell className="text-slate-700 whitespace-nowrap">
                        {new Date(booking.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="text-slate-400 ml-1">
                          {new Date(booking.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </AppTableCell>
                      <AppTableCell>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bookingStatusColors[booking.status] || 'bg-slate-100 text-slate-600'}`}>
                          {bookingStatusLabels[booking.status] || booking.status}
                        </span>
                      </AppTableCell>
                      <AppTableCell align="right" className="font-medium text-slate-900 whitespace-nowrap">
                        R$ {booking.price_brl?.toFixed(2) || '0.00'}
                      </AppTableCell>
                    </AppTableRow>
                  )
                })}
              </AppTableBody>
            </AppTable>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    brand: 'bg-[#9FE870]/8 text-[#3d6b1f]',
    accent: 'bg-accent-50 text-accent-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200/80 p-5">
      <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}
