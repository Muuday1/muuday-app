'use client'

import { ReactNode } from 'react'

interface AnimatedGradientTextProps {
  children: ReactNode
  className?: string
}

export function AnimatedGradientText({ children, className = '' }: AnimatedGradientTextProps) {
  return (
    <span
      className={`bg-gradient-to-r from-slate-900 via-[#4a7c2f] to-[#9FE870] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient ${className}`}
      style={{
        animation: 'gradient-shift 3s ease infinite',
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </span>
  )
}
