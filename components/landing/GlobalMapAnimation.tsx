'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin } from 'lucide-react'

interface CountryData {
  name: string
  code: string
  count: string
  x: number
  y: number
}

const COUNTRIES: CountryData[] = [
  { name: 'Portugal', code: 'PT', count: '300.000+', x: 45, y: 35 },
  { name: 'Estados Unidos', code: 'US', count: '1.800.000+', x: 22, y: 35 },
  { name: 'Japão', code: 'JP', count: '200.000+', x: 85, y: 35 },
  { name: 'Reino Unido', code: 'GB', count: '220.000+', x: 47, y: 28 },
  { name: 'Espanha', code: 'ES', count: '150.000+', x: 46, y: 36 },
  { name: 'Itália', code: 'IT', count: '170.000+', x: 52, y: 36 },
  { name: 'Alemanha', code: 'DE', count: '100.000+', x: 51, y: 30 },
  { name: 'França', code: 'FR', count: '120.000+', x: 48, y: 33 },
  { name: 'Canadá', code: 'CA', count: '130.000+', x: 20, y: 25 },
  { name: 'Austrália', code: 'AU', count: '50.000+', x: 82, y: 70 },
  { name: 'Irlanda', code: 'IE', count: '30.000+', x: 45, y: 27 },
  { name: 'Holanda', code: 'NL', count: '25.000+', x: 49, y: 29 },
  { name: 'Suíça', code: 'CH', count: '35.000+', x: 50, y: 34 },
  { name: 'Suécia', code: 'SE', count: '15.000+', x: 53, y: 22 },
  { name: 'Brasil', code: 'BR', count: 'Base', x: 32, y: 60 },
]

export function GlobalMapAnimation() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % COUNTRIES.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  const active = COUNTRIES[activeIndex]

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-slate-900">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* World map with recognizable continent shapes */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.12]"
          viewBox="0 0 100 60"
          fill="none"
          preserveAspectRatio="none"
        >
          {/* North America */}
          <path
            d="M8 18 L12 14 L18 12 L24 14 L28 18 L26 24 L28 28 L24 32 L20 30 L16 32 L12 28 L10 24 L8 20 Z"
            fill="white"
          />
          {/* South America */}
          <path
            d="M22 36 L26 34 L30 36 L32 42 L30 50 L26 56 L22 54 L20 48 L18 42 L20 38 Z"
            fill="white"
          />
          {/* Europe */}
          <path
            d="M44 20 L48 18 L52 20 L54 24 L52 28 L48 30 L44 28 L42 24 Z"
            fill="white"
          />
          {/* Africa */}
          <path
            d="M44 32 L48 30 L52 32 L54 38 L52 46 L48 52 L44 50 L42 44 L40 38 L42 34 Z"
            fill="white"
          />
          {/* Asia */}
          <path
            d="M56 16 L62 14 L70 16 L78 20 L84 26 L82 32 L78 36 L72 34 L66 32 L60 28 L56 22 Z"
            fill="white"
          />
          {/* Australia */}
          <path
            d="M78 48 L84 46 L88 48 L90 52 L88 56 L82 58 L78 54 Z"
            fill="white"
          />
        </svg>

        {/* Connection lines from active country to others */}
        <svg className="absolute inset-0 h-full w-full">
          {COUNTRIES.map((c, i) => {
            if (i === activeIndex) return null
            const dx = c.x - active.x
            const dy = c.y - active.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > 40) return null
            return (
              <line
                key={c.code}
                x1={`${active.x}%`}
                y1={`${active.y}%`}
                x2={`${c.x}%`}
                y2={`${c.y}%`}
                stroke="#9FE870"
                strokeWidth="0.3"
                opacity="0.15"
                strokeDasharray="2 2"
              />
            )
          })}
        </svg>

        {/* Country pins */}
        {COUNTRIES.map((country, i) => {
          const isActive = i === activeIndex
          return (
            <div
              key={country.code}
              className="absolute"
              style={{ left: `${country.x}%`, top: `${country.y}%` }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                {/* Pulse ring */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.5, opacity: 0.8 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                  >
                    <div className="h-4 w-4 rounded-full bg-[#9FE870]" />
                  </motion.div>
                )}
                {/* Pin */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    backgroundColor: isActive ? '#9FE870' : '#334155',
                  }}
                  transition={{ duration: 0.4 }}
                  className="flex h-4 w-4 items-center justify-center rounded-full"
                >
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-slate-900' : 'bg-slate-500'}`}
                  />
                </motion.div>
              </div>
            </div>
          )
        })}

        {/* Active country card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.code}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-5 py-3 backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#9FE870]">
                <MapPin className="h-5 w-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{active.name}</p>
                <p className="text-xs text-[#9FE870]">{active.count} brasileiros</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Top stats */}
        <div className="absolute left-6 top-6">
          <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Brasileiros no exterior
            </p>
            <p className="font-display text-2xl font-black text-white">5.000.000+</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="absolute right-6 top-6 flex flex-col gap-1">
          {COUNTRIES.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === activeIndex ? 'w-4 bg-[#9FE870]' : 'w-1 bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
