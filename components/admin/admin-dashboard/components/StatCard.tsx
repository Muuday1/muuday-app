'use client'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}

export function StatCard({ icon, label, value, color }: StatCardProps) {
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
