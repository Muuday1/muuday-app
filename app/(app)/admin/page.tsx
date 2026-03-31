'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import Link from 'next/link'
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
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'

type AdminProfessional = {
  id: string
  public_code?: number | null
  user_id: string
  status: string
  first_booking_enabled: boolean
  first_booking_gate_note?: string | null
  first_booking_gate_updated_at?: string | null
  bio: string
  category: string
  tags: string[]
  languages: string[]
  years_experience: number
  session_price_brl: number
  session_duration_minutes: number
  rating: number
  total_reviews: number
  total_bookings: number
  created_at: string
  profiles: {
    full_name: string
    email: string
    country: string
    timezone: string
  }
}

type AdminReview = {
  id: string
  rating: number
  comment: string
  is_visible: boolean
  created_at: string
  profiles: { full_name: string }
  professionals: { id: string; profiles: { full_name: string } }
}

type AdminBooking = {
  id: string
  scheduled_at: string
  status: string
  price_brl: number
  duration_minutes: number
  user_profile: { full_name: string; email: string }
  professional_profile: { full_name: string }
}

type Stats = {
  totalUsers: number
  totalProfessionals: number
  totalBookings: number
  totalReviews: number
  pendingProfessionals: number
  pendingReviews: number
}

type Tab = 'overview' | 'professionals' | 'reviews' | 'bookings'

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const supabase = useMemo(() => createClient(), [])

  // Check admin access
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsAdmin(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.role === 'admin')
    }
    checkAdmin()
  }, [supabase])

  const loadData = useCallback(async () => {
    setLoading(true)

    // Always load stats
    const [usersRes, prosRes, bookingsRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('professionals').select('id, status', { count: 'exact' }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id, is_visible', { count: 'exact' }),
    ])

    const allPros = prosRes.data || []
    const allRevs = reviewsRes.data || []

    setStats({
      totalUsers: usersRes.count || 0,
      totalProfessionals: allPros.length,
      totalBookings: bookingsRes.count || 0,
      totalReviews: allRevs.length,
      pendingProfessionals: allPros.filter(p => p.status === 'pending_review').length,
      pendingReviews: allRevs.filter(r => !r.is_visible).length,
    })

    // Load tab-specific data
    if (activeTab === 'professionals' || activeTab === 'overview') {
      let query = supabase
        .from('professionals')
        .select('*, profiles!professionals_user_id_fkey(*)')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      setProfessionals((data as unknown as AdminProfessional[]) || [])
    }

    if (activeTab === 'reviews') {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles!reviews_user_id_fkey(full_name), professionals!reviews_professional_id_fkey(id, profiles!professionals_user_id_fkey(full_name))')
        .order('created_at', { ascending: false })

      setReviews((data as unknown as AdminReview[]) || [])
    }

    if (activeTab === 'bookings') {
      const { data } = await supabase
        .from('bookings')
        .select('id, scheduled_at, status, price_brl, duration_minutes, profiles!bookings_user_id_fkey(full_name, email), professionals!bookings_professional_id_fkey(profiles!professionals_user_id_fkey(full_name))')
        .order('scheduled_at', { ascending: false })
        .limit(50)

      const mapped = (data || []).map((b: Record<string, unknown>) => {
        const pro = b.professionals as Record<string, unknown> | null
        return {
          id: b.id as string,
          scheduled_at: b.scheduled_at as string,
          status: b.status as string,
          price_brl: b.price_brl as number,
          duration_minutes: b.duration_minutes as number,
          user_profile: (b.profiles as { full_name: string; email: string }) || { full_name: '—', email: '' },
          professional_profile: (pro?.profiles as { full_name: string }) || { full_name: '—' },
        }
      }) as AdminBooking[]

      setBookings(mapped)
    }

    setLoading(false)
  }, [activeTab, statusFilter, supabase])

  // Load data when admin confirmed
  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin, loadData])

  async function updateProfessionalStatus(id: string, newStatus: string) {
    setActionLoading(id)
    const { error } = await supabase
      .from('professionals')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setProfessionals(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
      showSuccess(`Profissional ${newStatus === 'approved' ? 'aprovado' : newStatus === 'rejected' ? 'rejeitado' : newStatus === 'suspended' ? 'suspenso' : 'atualizado'}!`)
    }
    setActionLoading(null)
  }

  async function updateFirstBookingGate(id: string, enabled: boolean) {
    const actionKey = `${id}:first-booking-gate`
    setActionLoading(actionKey)
    const { error } = await supabase
      .from('professionals')
      .update({
        first_booking_enabled: enabled,
        first_booking_gate_note: enabled ? 'admin_enabled' : 'admin_blocked',
        first_booking_gate_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
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
    const { error } = await supabase
      .from('reviews')
      .update({ is_visible: visible })
      .eq('id', id)

    if (!error) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_visible: visible } : r))
      showSuccess(visible ? 'Avaliação publicada!' : 'Avaliação ocultada!')
    }
    setActionLoading(null)
  }

  async function deleteReview(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')) return
    setActionLoading(id)
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (!error) {
      setReviews(prev => prev.filter(r => r.id !== id))
      if (stats) {
        setStats(prev => prev ? { ...prev, totalReviews: prev.totalReviews - 1, pendingReviews: Math.max(0, prev.pendingReviews - 1) } : prev)
      }
      showSuccess('Avaliação rejeitada e excluída!')
    }
    setActionLoading(null)
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  // Access denied state
  if (isAdmin === false) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-red-200 p-12 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="font-display font-bold text-2xl text-neutral-900 mb-2">Acesso restrito</h1>
          <p className="text-neutral-500">Esta página é acessível apenas para administradores.</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (isAdmin === null) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-48" />
          <div className="h-32 bg-neutral-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-600',
    pending_review: 'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    suspended: 'bg-orange-50 text-orange-700',
  }

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    pending_review: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    suspended: 'Suspenso',
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Visão geral', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'professionals', label: 'Profissionais', icon: <Users className="w-4 h-4" />, badge: stats?.pendingProfessionals },
    { id: 'reviews', label: 'Avaliações', icon: <MessageSquare className="w-4 h-4" />, badge: stats?.pendingReviews },
    { id: 'bookings', label: 'Agendamentos', icon: <Calendar className="w-4 h-4" /> },
  ]

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-neutral-900">Painel Administrativo</h1>
            <p className="text-sm text-neutral-500">Gerencie profissionais, avaliações e agendamentos</p>
          </div>
          <Link
            href="/admin/taxonomia"
            className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all"
          >
            <FolderTree className="w-4 h-4" /> Taxonomia
          </Link>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-neutral-100 p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
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

      {/* Tab Content */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5" />} label="Utilizadores" value={stats.totalUsers} color="brand" />
            <StatCard icon={<Shield className="w-5 h-5" />} label="Profissionais" value={stats.totalProfessionals} color="brand" />
            <StatCard icon={<Calendar className="w-5 h-5" />} label="Agendamentos" value={stats.totalBookings} color="accent" />
            <StatCard icon={<Star className="w-5 h-5" />} label="Avaliações" value={stats.totalReviews} color="amber" />
          </div>

          {/* Pending Actions */}
          {(stats.pendingProfessionals > 0 || stats.pendingReviews > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" />
                Ações pendentes
              </h3>
              <div className="space-y-2">
                {stats.pendingProfessionals > 0 && (
                  <button
                    onClick={() => { setActiveTab('professionals'); setStatusFilter('pending_review') }}
                    className="w-full text-left p-3 bg-white rounded-xl hover:shadow-sm transition-all flex items-center justify-between"
                  >
                    <span className="text-sm text-neutral-700">
                      <strong>{stats.pendingProfessionals}</strong> profissional(is) aguardando aprovação
                    </span>
                    <span className="text-xs text-brand-600 font-medium">Revisar →</span>
                  </button>
                )}
                {stats.pendingReviews > 0 && (
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="w-full text-left p-3 bg-white rounded-xl hover:shadow-sm transition-all flex items-center justify-between"
                  >
                    <span className="text-sm text-neutral-700">
                      <strong>{stats.pendingReviews}</strong> avaliação(ões) aguardando moderação
                    </span>
                    <span className="text-xs text-brand-600 font-medium">Moderar →</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Professionals */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h3 className="font-semibold text-neutral-900 mb-4">Profissionais recentes</h3>
            {professionals.slice(0, 5).map(pro => (
              <div key={pro.id} className="flex items-center justify-between py-3 border-b border-neutral-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm">
                    {pro.profiles?.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{pro.profiles?.full_name}</p>
                    <p className="text-xs text-neutral-400">{CATEGORIES.find(c => c.slug === pro.category)?.name}</p>
                  </div>
                </div>
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
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'pending_review', 'approved', 'rejected', 'suspended', 'draft'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-brand-500 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:border-brand-300'
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

          {/* Professional Cards */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-200" />
                    <div className="space-y-2">
                      <div className="h-4 bg-neutral-200 rounded w-32" />
                      <div className="h-3 bg-neutral-100 rounded w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : professionals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
              <p className="text-neutral-500">Nenhum profissional encontrado com este filtro.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {professionals.map(pro => {
                const category = CATEGORIES.find(c => c.slug === pro.category)
                const isExpanded = expandedId === pro.id

                return (
                  <div key={pro.id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden transition-all">
                    {/* Header row */}
                    <div
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : pro.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                          {pro.profiles?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{pro.profiles?.full_name}</p>
                          <p className="text-sm text-neutral-500">
                            {category?.icon} {category?.name} · {pro.profiles?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[pro.status]}`}>
                          {statusLabels[pro.status]}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-neutral-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {/* Info */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Bio</p>
                              <p className="text-sm text-neutral-700">{pro.bio || 'Sem bio'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Preço</p>
                                <p className="text-sm font-semibold text-neutral-900">R$ {pro.session_price_brl}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Duração</p>
                                <p className="text-sm text-neutral-700">{pro.session_duration_minutes} min</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Experiência</p>
                                <p className="text-sm text-neutral-700">{pro.years_experience} anos</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Rating</p>
                                <p className="text-sm text-neutral-700">⭐ {pro.rating} ({pro.total_reviews})</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Idiomas</p>
                              <div className="flex flex-wrap gap-1">
                                {pro.languages?.map(lang => (
                                  <span key={lang} className="px-2 py-0.5 bg-neutral-100 rounded-full text-xs text-neutral-600">{lang}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Tags</p>
                              <div className="flex flex-wrap gap-1">
                                {pro.tags?.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs">{tag}</span>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-medium text-neutral-400 uppercase mb-1">País</p>
                                <p className="text-sm text-neutral-700">{pro.profiles?.country || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Fuso horário</p>
                                <p className="text-sm text-neutral-700">{pro.profiles?.timezone || '—'}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Gate do 1o agendamento</p>
                              <p className={`text-sm font-medium ${pro.first_booking_enabled ? 'text-green-700' : 'text-amber-700'}`}>
                                {pro.first_booking_enabled ? 'Liberado' : 'Bloqueado'}
                              </p>
                              {pro.first_booking_gate_note && (
                                <p className="text-xs text-neutral-500 mt-0.5">Motivo: {pro.first_booking_gate_note}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-neutral-400 uppercase mb-1">Registrado em</p>
                              <p className="text-sm text-neutral-700">
                                {new Date(pro.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-3">
                            <p className="text-xs font-medium text-neutral-400 uppercase mb-2">Ações</p>

                            {pro.status !== 'approved' && (
                              <button
                                onClick={() => updateProfessionalStatus(pro.id, 'approved')}
                                disabled={actionLoading === pro.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                {actionLoading === pro.id ? 'Processando...' : 'Aprovar'}
                              </button>
                            )}

                            {pro.status !== 'rejected' && pro.status !== 'approved' && (
                              <button
                                onClick={() => updateProfessionalStatus(pro.id, 'rejected')}
                                disabled={actionLoading === pro.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Rejeitar
                              </button>
                            )}

                            {pro.status === 'approved' && (
                              <button
                                onClick={() => updateProfessionalStatus(pro.id, 'suspended')}
                                disabled={actionLoading === pro.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <Ban className="w-4 h-4" />
                                Suspender
                              </button>
                            )}

                            {pro.status === 'approved' && !pro.first_booking_enabled && (
                              <button
                                onClick={() => updateFirstBookingGate(pro.id, true)}
                                disabled={actionLoading === `${pro.id}:first-booking-gate`}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                {actionLoading === `${pro.id}:first-booking-gate` ? 'Processando...' : 'Liberar 1o agendamento'}
                              </button>
                            )}

                            {pro.status === 'approved' && pro.first_booking_enabled && (
                              <button
                                onClick={() => updateFirstBookingGate(pro.id, false)}
                                disabled={actionLoading === `${pro.id}:first-booking-gate`}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                              >
                                <Ban className="w-4 h-4" />
                                {actionLoading === `${pro.id}:first-booking-gate` ? 'Processando...' : 'Bloquear 1o agendamento'}
                              </button>
                            )}
                            {(pro.status === 'suspended' || pro.status === 'rejected') && (
                              <button
                                onClick={() => updateProfessionalStatus(pro.id, 'pending_review')}
                                disabled={actionLoading === pro.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-600 hover:bg-neutral-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
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
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 hover:border-brand-300 text-neutral-700 rounded-xl text-sm font-medium transition-all"
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
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-5 animate-pulse">
                  <div className="h-4 bg-neutral-200 rounded w-48 mb-2" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
              <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">Nenhuma avaliação encontrada.</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-white rounded-2xl border border-neutral-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {review.profiles?.full_name || 'Utilizador'}
                      </p>
                      <span className="text-neutral-300">→</span>
                      <p className="text-sm text-neutral-600">
                        {(review.professionals as unknown as { profiles: { full_name: string } })?.profiles?.full_name || 'Profissional'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'}`}
                        />
                      ))}
                      <span className="text-xs text-neutral-400 ml-1">
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
                  <p className="text-sm text-neutral-600 mb-4 bg-neutral-50 rounded-xl p-3">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                <div className="flex gap-2">
                  {!review.is_visible ? (
                    <>
                      <button
                        onClick={() => toggleReviewVisibility(review.id, true)}
                        disabled={actionLoading === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {actionLoading === review.id ? '...' : 'Aprovar'}
                      </button>
                      <button
                        onClick={() => deleteReview(review.id)}
                        disabled={actionLoading === review.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {actionLoading === review.id ? '...' : 'Rejeitar'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleReviewVisibility(review.id, false)}
                      disabled={actionLoading === review.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-500 hover:bg-neutral-600 text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50"
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
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-5 animate-pulse">
                  <div className="h-4 bg-neutral-200 rounded w-48 mb-2" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
              <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">Nenhum agendamento encontrado.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase">Utilizador</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase">Profissional</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase">Data</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase">Preço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {bookings.map(booking => {
                      const bookingStatusColors: Record<string, string> = {
                        pending: 'bg-amber-50 text-amber-700',
                        confirmed: 'bg-green-50 text-green-700',
                        completed: 'bg-green-50 text-green-700',
                        cancelled: 'bg-red-50 text-red-700',
                        no_show: 'bg-neutral-100 text-neutral-600',
                      }
                      const bookingStatusLabels: Record<string, string> = {
                        pending: 'Pendente',
                        confirmed: 'Confirmado',
                        completed: 'Concluído',
                        cancelled: 'Cancelado',
                        no_show: 'Não compareceu',
                      }
                      return (
                        <tr key={booking.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-neutral-900">{booking.user_profile?.full_name || '—'}</p>
                            <p className="text-xs text-neutral-400">{booking.user_profile?.email || ''}</p>
                          </td>
                          <td className="px-5 py-4 text-neutral-700">
                            {booking.professional_profile?.full_name || '—'}
                          </td>
                          <td className="px-5 py-4 text-neutral-700 whitespace-nowrap">
                            {new Date(booking.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            <span className="text-neutral-400 ml-1">
                              {new Date(booking.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${bookingStatusColors[booking.status] || 'bg-neutral-100 text-neutral-600'}`}>
                              {bookingStatusLabels[booking.status] || booking.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-medium text-neutral-900 whitespace-nowrap">
                            R$ {booking.price_brl?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Stats card component
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    accent: 'bg-accent-50 text-accent-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  )
}
