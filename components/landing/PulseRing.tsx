'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PulseRingProps {
  children: ReactNode
  className?: string
  ringColor?: string
  ringCount?: number
}

export function PulseRing({
  children,
  className = '',
  ringColor = 'bg-[#9FE870]',
  ringCount = 3,
}: PulseRingProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {Array.from({ length: ringCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute inset-0 rounded-full ${ringColor}`}
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: 1.8 + i * 0.3, opacity: 0 }}
          transition={{
            duration: 2,
            delay: i * 0.6,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
      <div className="relative">{children}</div>
    </div>
  )
}
