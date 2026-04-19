'use client'

import { motion } from 'framer-motion'

interface SparkleProps {
  className?: string
  color?: string
  size?: number
  delay?: number
}

export function Sparkle({
  className = '',
  color = '#9FE870',
  size = 12,
  delay = 0,
}: SparkleProps) {
  return (
    <motion.svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      initial={{ scale: 0, rotate: 0, opacity: 0 }}
      animate={{
        scale: [0, 1, 0],
        rotate: [0, 180, 360],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <path
        d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
        fill={color}
      />
    </motion.svg>
  )
}
