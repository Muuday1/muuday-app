'use client'

import {
  Brain,
  HeartPulse,
  GraduationCap,
  Calculator,
  Scale,
  Rocket,
  Languages,
  Puzzle,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  'saude-mental-bem-estar': Brain,
  'saude-corpo-movimento': HeartPulse,
  'educacao-desenvolvimento': GraduationCap,
  'contabilidade-financas': Calculator,
  'direito-suporte-juridico': Scale,
  'carreira-negocios-desenvolvimento': Rocket,
  'traducao-suporte-documental': Languages,
  outro: Puzzle,
}

export function CategoryIcon({ slug, className = '' }: { slug: string; className?: string }) {
  const Icon = ICON_MAP[slug] || Puzzle
  return <Icon className={className} />
}
