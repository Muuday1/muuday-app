'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FloatingBadgeProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  yOffset?: number
}

export function FloatingBadge({
  children,
  className = '',
  delay = 0,
  duration = 3,
  yOffset = 12,
}: FloatingBadgeProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0 }}
      animate={{ y: [-yOffset / 2, yOffset / 2, -yOffset / 2] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}
