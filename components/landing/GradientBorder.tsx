'use client'

import { ReactNode } from 'react'

interface GradientBorderProps {
  children: ReactNode
  className?: string
  borderClassName?: string
}

export function GradientBorder({
  children,
  className = '',
  borderClassName = 'p-[2px] rounded-3xl bg-gradient-to-br from-[#9FE870] via-emerald-400 to-brand-500',
}: GradientBorderProps) {
  return (
    <div className={borderClassName}>
      <div className={`h-full w-full rounded-3xl bg-white ${className}`}>
        {children}
      </div>
    </div>
  )
}
