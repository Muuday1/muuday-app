'use client'

import { motion } from 'framer-motion'

interface BlurBlobProps {
  className?: string
  color?: string
  delay?: number
  duration?: number
}

export function BlurBlob({
  className = '',
  color = 'bg-emerald-400/30',
  delay = 0,
  duration = 8,
}: BlurBlobProps) {
  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full blur-3xl ${color} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: [0.8, 1.1, 0.9, 1],
        opacity: [0.4, 0.7, 0.5, 0.6],
        x: [0, 30, -20, 0],
        y: [0, -20, 30, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    />
  )
}
