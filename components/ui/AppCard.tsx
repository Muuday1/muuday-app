'use client'

import { cn } from '@/lib/utils'

interface AppCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
}

export function AppCard({ children, className, padding = 'md', hover = false, onClick }: AppCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-slate-200/80 bg-white',
        'transition-all duration-200',
        hover && 'hover:border-slate-300 cursor-pointer',
        onClick && 'cursor-pointer',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

interface AppCardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function AppCardHeader({ title, subtitle, action, icon, className }: AppCardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div className="min-w-0 flex items-center gap-2.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
