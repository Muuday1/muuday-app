'use client'

import { cn } from '@/lib/utils'

interface AppBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  default: 'bg-[#9FE870]/15 text-[#3d6b1f] border-[#9FE870]/25',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-600 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
}

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

export function AppBadge({ children, variant = 'default', size = 'md', className }: AppBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-semibold',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
