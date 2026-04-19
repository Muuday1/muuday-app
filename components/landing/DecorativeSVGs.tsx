'use client'

import { motion } from 'framer-motion'

export function PersonWithLaptop({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <motion.circle cx="100" cy="55" r="25" fill="#1e293b" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} />
      {/* Body */}
      <motion.path d="M60 170 C60 120 140 120 140 170" stroke="#1e293b" strokeWidth="24" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.6 }} />
      {/* Laptop */}
      <motion.rect x="55" y="130" width="90" height="55" rx="4" fill="#334155" initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }} />
      <motion.rect x="65" y="140" width="70" height="35" rx="2" fill="#9FE870" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} />
      {/* Screen glow */}
      <motion.circle cx="115" cy="152" r="6" fill="white" opacity="0.6" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
    </svg>
  )
}

export function WorldMap({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d="M40 100 C60 60, 100 40, 200 40 C300 40, 340 60, 360 100 C340 140, 300 160, 200 160 C100 160, 60 140, 40 100Z"
        stroke="#1e293b"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        opacity="0.15"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, ease: 'easeInOut' }}
      />
      {/* Brazil */}
      <motion.circle cx="130" cy="115" r="5" fill="#9FE870" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 1, duration: 0.5 }} />
      {/* Portugal */}
      <motion.circle cx="95" cy="82" r="4" fill="#9FE870" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 1.3, duration: 0.5 }} />
      {/* UK */}
      <motion.circle cx="105" cy="68" r="4" fill="#9FE870" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 1.5, duration: 0.5 }} />
      {/* Germany */}
      <motion.circle cx="125" cy="72" r="4" fill="#9FE870" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 1.7, duration: 0.5 }} />
      {/* USA */}
      <motion.circle cx="85" cy="88" r="5" fill="#9FE870" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 1.9, duration: 0.5 }} />
      {/* Japan */}
      <motion.circle cx="310" cy="85" r="4" fill="#9FE870" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 2.1, duration: 0.5 }} />
      {/* Connection lines */}
      <motion.path d="M130 115 Q200 80 95 82" stroke="#9FE870" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2.5, duration: 1.5 }} />
      <motion.path d="M130 115 Q160 60 125 72" stroke="#9FE870" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2.7, duration: 1.5 }} />
    </svg>
  )
}

export function FloatingPhone({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 120 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="10" y="5" width="100" height="190" rx="16" fill="#1e293b" />
      <rect x="18" y="20" width="84" height="160" rx="8" fill="#f8fafc" />
      {/* Video indicator */}
      <circle cx="60" cy="55" r="18" fill="#9FE870" />
      <circle cx="60" cy="55" r="8" fill="#1e293b" />
      {/* Chat bubbles */}
      <rect x="28" y="95" width="50" height="12" rx="6" fill="#e2e8f0" />
      <rect x="28" y="115" width="40" height="12" rx="6" fill="#e2e8f0" />
      <rect x="50" y="135" width="44" height="12" rx="6" fill="#9FE870" />
      {/* Bottom nav */}
      <rect x="30" y="170" width="60" height="4" rx="2" fill="#1e293b" />
    </motion.svg>
  )
}
