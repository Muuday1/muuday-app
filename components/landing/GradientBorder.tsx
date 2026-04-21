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
  borderClassName = 'p-[2px] rounded-lg bg-gradient-to-br from-[#9FE870] via-emerald-400 to-[#9FE870]',
}: GradientBorderProps) {
  return (
    <div className={borderClassName}>
      <div className={`h-full w-full rounded-lg bg-white ${className}`}>
        {children}
      </div>
    </div>
  )
}
