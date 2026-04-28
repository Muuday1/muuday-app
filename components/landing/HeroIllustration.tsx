'use client'

import { motion } from 'framer-motion'

export function HeroIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-lg lg:max-w-xl"
    >
      <svg
        viewBox="0 0 480 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full"
        aria-hidden="true"
      >
        {/* Background blur shapes */}
        <circle cx="380" cy="80" r="100" fill="url(#greenBlur)" opacity="0.5" />
        <circle cx="80" cy="280" r="80" fill="url(#blueBlur)" opacity="0.4" />
        <circle cx="420" cy="300" r="60" fill="url(#greenBlur2)" opacity="0.3" />

        {/* Brazil map outline */}
        <path
          d="M220 60c-15 5-25 18-30 32-8 22-5 48 8 68 10 14 24 24 40 28 12 3 24 2 36-2 14-5 26-14 34-26 8-12 12-27 10-42-2-16-10-30-22-40-12-10-28-16-44-16-10 0-20 2-28 6-2 1-3 2-4 2z"
          fill="url(#mapGradient)"
          opacity="0.15"
        />
        <path
          d="M220 60c-15 5-25 18-30 32-8 22-5 48 8 68 10 14 24 24 40 28 12 3 24 2 36-2 14-5 26-14 34-26 8-12 12-27 10-42-2-16-10-30-22-40-12-10-28-16-44-16-10 0-20 2-28 6-2 1-3 2-4 2z"
          stroke="url(#mapGradient)"
          strokeWidth="1.5"
          opacity="0.3"
        />

        {/* Connection lines */}
        <path
          d="M120 140c40-20 80-10 120 20s70 50 110 30"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.4"
        />
        <path
          d="M160 220c50 10 90-20 130-10s60 40 90 20"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.3"
        />

        {/* Video call window */}
        <rect x="140" y="90" width="200" height="140" rx="16" fill="white" opacity="0.9" />
        <rect x="140" y="90" width="200" height="140" rx="16" stroke="#e2e8f0" strokeWidth="2" />
        {/* Video header */}
        <rect x="140" y="90" width="200" height="32" rx="16" fill="#f8fafc" />
        <circle cx="164" cy="106" r="6" fill="#ef4444" />
        <circle cx="182" cy="106" r="6" fill="#f59e0b" />
        <circle cx="200" cy="106" r="6" fill="#22c55e" />
        {/* Video content - person 1 */}
        <rect x="152" y="132" width="84" height="88" rx="10" fill="url(#person1)" />
        <circle cx="194" cy="162" r="16" fill="#f1f5f9" />
        <circle cx="194" cy="156" r="8" fill="#cbd5e1" />
        <path d="M178 178c4-6 8-8 16-8s12 2 16 8v6h-32v-6z" fill="#cbd5e1" />
        {/* Video content - person 2 */}
        <rect x="244" y="132" width="84" height="88" rx="10" fill="url(#person2)" />
        <circle cx="286" cy="162" r="16" fill="#f1f5f9" />
        <circle cx="286" cy="156" r="8" fill="#cbd5e1" />
        <path d="M270 178c4-6 8-8 16-8s12 2 16 8v6h-32v-6z" fill="#cbd5e1" />
        {/* Live indicator */}
        <rect x="156" y="196" width="36" height="16" rx="8" fill="#ef4444" />
        <text x="174" y="208" fill="white" fontSize="9" fontWeight="700" textAnchor="middle">AO VIVO</text>

        {/* Floating cards */}
        {/* Card 1 - Calendar */}
        <motion.g
          initial={{ y: 10 }}
          animate={{ y: [10, -6, 10] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <rect x="60" y="180" width="80" height="64" rx="10" fill="white" />
          <rect x="60" y="180" width="80" height="64" rx="10" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="68" y="192" width="20" height="6" rx="3" fill="#9FE870" />
          <rect x="68" y="204" width="48" height="4" rx="2" fill="#e2e8f0" />
          <rect x="68" y="214" width="36" height="4" rx="2" fill="#e2e8f0" />
          <rect x="68" y="224" width="44" height="4" rx="2" fill="#e2e8f0" />
          <circle cx="128" cy="230" r="8" fill="#2563eb" />
          <path d="M124 230h8M128 226v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>

        {/* Card 2 - Star rating */}
        <motion.g
          initial={{ y: -5 }}
          animate={{ y: [-5, 8, -5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <rect x="340" y="120" width="80" height="56" rx="10" fill="white" />
          <rect x="340" y="120" width="80" height="56" rx="10" stroke="#e2e8f0" strokeWidth="1.5" />
          <text x="360" y="148" fill="#f59e0b" fontSize="16">★★★★★</text>
          <rect x="352" y="158" width="56" height="4" rx="2" fill="#e2e8f0" />
        </motion.g>

        {/* Card 3 - Verified badge */}
        <motion.g
          initial={{ y: 5 }}
          animate={{ y: [5, -8, 5] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <rect x="360" y="240" width="72" height="48" rx="10" fill="white" />
          <rect x="360" y="240" width="72" height="48" rx="10" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle cx="396" cy="258" r="10" fill="#9FE870" />
          <path d="M391 258l4 4 7-7" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="372" y="274" width="48" height="4" rx="2" fill="#e2e8f0" />
        </motion.g>

        {/* Decorative dots */}
        <circle cx="80" cy="100" r="4" fill="#9FE870" opacity="0.6" />
        <circle cx="100" cy="80" r="3" fill="#2563eb" opacity="0.5" />
        <circle cx="400" cy="90" r="5" fill="#9FE870" opacity="0.4" />
        <circle cx="420" cy="180" r="3" fill="#2563eb" opacity="0.5" />
        <circle cx="100" cy="300" r="4" fill="#2563eb" opacity="0.4" />
        <circle cx="320" cy="320" r="3" fill="#9FE870" opacity="0.5" />

        {/* Gradients */}
        <defs>
          <radialGradient id="greenBlur" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#9FE870" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#9FE870" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="greenBlur2" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#9FE870" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#9FE870" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="blueBlur" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mapGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#9FE870" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9FE870" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="person1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0fdf4" />
            <stop offset="100%" stopColor="#dcfce7" />
          </linearGradient>
          <linearGradient id="person2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eff6ff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  )
}
