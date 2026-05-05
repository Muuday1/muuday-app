'use client'

import { Users, Shield, Calendar, Star, AlertTriangle } from 'lucide-react'
import { AdminProfessionalIdentityBadge } from '@/components/admin/AdminProfessionalIdentityBadge'
import { StatCard } from './StatCard'
import type { AdminDashboardData } from '@/lib/actions/admin'

interface AdminOverviewTabProps {
  stats: AdminDashboardData['stats']
  professionals: AdminDashboardData['professionals']
  statusColors: Record<string, string>
  statusLabels: Record<string, string>
  getPrimarySpecialty: (professional: AdminDashboardData['professionals'][0]) => string
  getVisibleBasePrice: (professional: AdminDashboardData['professionals'][0]) => number
  onNavigateToProfessionals: (statusFilter: string) => void
  onNavigateToReviews: () => void
}

export function AdminOverviewTab({
  stats,
  professionals,
  statusColors,
  statusLabels,
  getPrimarySpecialty,
  getVisibleBasePrice,
  onNavigateToProfessionals,
  onNavigateToReviews,
}: AdminOverviewTabProps) {
  return (
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
                onClick={() => onNavigateToProfessionals('pending_review')}
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
                onClick={onNavigateToReviews}
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
  )
}
