'use client'

import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Ban,
  RotateCcw,
} from 'lucide-react'
import { AdminProfessionalIdentityBadge } from '@/components/admin/AdminProfessionalIdentityBadge'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'
import type { AdminDashboardData } from '@/lib/actions/admin'

interface AdminProfessionalsTabProps {
  stats: AdminDashboardData['stats']
  professionals: AdminDashboardData['professionals']
  professionalSpecialties: AdminDashboardData['professionalSpecialties']
  professionalCredentialCounts: AdminDashboardData['professionalCredentialCounts']
  professionalMinServicePrice: AdminDashboardData['professionalMinServicePrice']
  statusFilter: string
  setStatusFilter: (value: string) => void
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  actionLoading: string | null
  statusColors: Record<string, string>
  statusLabels: Record<string, string>
  getPrimarySpecialty: (professional: AdminDashboardData['professionals'][0]) => string
  getVisibleBasePrice: (professional: AdminDashboardData['professionals'][0]) => number
  updateProfessionalStatus: (id: string, newStatus: string) => void
  updateFirstBookingGate: (id: string, enabled: boolean) => void
}

export function AdminProfessionalsTab({
  stats,
  professionals,
  professionalSpecialties,
  professionalCredentialCounts,
  professionalMinServicePrice,
  statusFilter,
  setStatusFilter,
  expandedId,
  setExpandedId,
  actionLoading,
  statusColors,
  statusLabels,
  getPrimarySpecialty,
  getVisibleBasePrice,
  updateProfessionalStatus,
  updateFirstBookingGate,
}: AdminProfessionalsTabProps) {
  return (
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

      {professionals.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200/80 p-12 text-center">
          <p className="text-slate-500">Nenhum profissional encontrado com este filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {professionals.map(pro => {
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
                      {credentialCount > 0 ? `${credentialCount} credencial(is)` : 'Sem credenciais'}
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
                            {credentialCount > 0 ? `${credentialCount} documento(s) enviado(s)` : 'Nenhum documento enviado'}
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
  )
}
