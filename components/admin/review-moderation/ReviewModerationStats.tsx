'use client'

import { Clock, UserCheck, Ban, ShieldAlert } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
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

interface ReviewModerationStatsProps {
  pending: number
  approved: number
  rejected: number
  flagged: number
}

export function ReviewModerationStats({ pending, approved, rejected, flagged }: ReviewModerationStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard icon={<Clock className="w-5 h-5" />} label="Pendentes" value={pending} color="amber" />
      <StatCard icon={<UserCheck className="w-5 h-5" />} label="Aprovadas" value={approved} color="green" />
      <StatCard icon={<Ban className="w-5 h-5" />} label="Rejeitadas" value={rejected} color="red" />
      <StatCard icon={<ShieldAlert className="w-5 h-5" />} label="Sinalizadas" value={flagged} color="orange" />
    </div>
  )
}
