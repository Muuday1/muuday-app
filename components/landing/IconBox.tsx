'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface IconBoxProps {
  icon: LucideIcon
  className?: string
  iconClassName?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  gradient?: 'green' | 'blue' | 'slate' | 'orange'
  animate?: boolean
}

const sizeMap = {
  sm: { box: 'h-10 w-10', icon: 'h-4 w-4' },
  md: { box: 'h-14 w-14', icon: 'h-6 w-6' },
  lg: { box: 'h-20 w-20', icon: 'h-8 w-8' },
  xl: { box: 'h-24 w-24', icon: 'h-10 w-10' },
}

const gradientMap = {
  green: 'from-[#9FE870] to-emerald-500 text-slate-900',
  blue: 'from-[#9FE870]/80 to-[#3d6b1f] text-white',
  slate: 'from-slate-800 to-slate-900 text-white',
  orange: 'from-amber-400 to-orange-500 text-slate-900',
}

export function IconBox({
  icon: Icon,
  className = '',
  iconClassName = '',
  size = 'md',
  gradient = 'green',
  animate = true,
}: IconBoxProps) {
  const sizes = sizeMap[size]
  const grad = gradientMap[gradient]

  return (
    <motion.div
      className={`flex items-center justify-center rounded-lg bg-gradient-to-br ${grad} ${sizes.box} ${className}`}
      whileHover={animate ? { scale: 1.1, rotate: 5 } : undefined}
      whileTap={animate ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Icon className={`${sizes.icon} ${iconClassName}`} />
    </motion.div>
  )
}
