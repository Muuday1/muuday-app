'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface AppEmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function AppEmptyState({ icon: Icon, title, description, action, className }: AppEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 md:py-16', className)}>
      <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-300" />
      </div>
      <h3 className="font-display text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-slate-400 max-w-[280px]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
