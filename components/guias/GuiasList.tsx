'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  FileText,
  Calculator,
  Banknote,
  ShieldCheck,
  HeartPulse,
  GraduationCap,
  Users,
  Home,
  Briefcase,
  Truck,
  Car,
  Flag,
  Package,
  Phone,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/landing/StaggerContainer'
import { FadeIn } from '@/components/landing/FadeIn'
import { GUIDES, GUIDE_CATEGORIES } from '@/lib/guides-data'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Calculator,
  Banknote,
  ShieldCheck,
  HeartPulse,
  GraduationCap,
  Users,
  Home,
  Briefcase,
  Truck,
  Car,
  Flag,
  Package,
  Phone,
}

export default function GuiasList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('todos')

  const filteredGuides = useMemo(() => {
    let result = GUIDES
    if (activeCategory !== 'todos') {
      result = result.filter((g) => g.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.excerpt.toLowerCase().includes(q) ||
          g.content.some((c) => c.toLowerCase().includes(q))
      )
    }
    return result
  }, [searchQuery, activeCategory])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    GUIDES.forEach((g) => {
      counts[g.category] = (counts[g.category] || 0) + 1
    })
    return counts
  }, [])

  return (
    <>
      {/* Search bar */}
      <FadeIn direction="up" delay={0.15}>
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar guias: CPF, passaporte, impostos, INSS..."
              className="w-full rounded-lg border-0 bg-white/80 py-4 pl-12 pr-4 text-slate-900 backdrop-blur-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4a7c2f]"
            />
          </div>
        </div>
      </FadeIn>

      {/* Category filters */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mu-shell py-6">
          <FadeIn direction="up">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveCategory('todos')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === 'todos'
                    ? 'bg-[#9FE870] text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({GUIDES.length})
              </button>
              {GUIDE_CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || FileText
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeCategory === cat.id
                        ? 'bg-[#9FE870] text-slate-900'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                    <span className="ml-0.5 text-xs opacity-70">({categoryCounts[cat.id] || 0})</span>
                  </button>
                )
              })}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Guides grid */}
      <section className="bg-slate-50">
        <div className="mu-shell py-12 md:py-20">
          {filteredGuides.length === 0 ? (
            <FadeIn direction="up">
              <div className="mx-auto max-w-md text-center py-20">
                <Search className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">Nenhum guia encontrado</h3>
                <p className="mt-2 text-slate-500">
                  Tente outro termo de busca ou selecione outra categoria.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setActiveCategory('todos')
                  }}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#4a7c2f] hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            </FadeIn>
          ) : (
            <StaggerContainer
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              staggerDelay={0.05}
            >
              {filteredGuides.map((guide) => {
                const cat = GUIDE_CATEGORIES.find((c) => c.id === guide.category)
                const Icon = cat ? ICON_MAP[cat.icon] || FileText : FileText
                return (
                  <StaggerItem key={guide.slug}>
                    <Link
                      href={`/guias/${guide.slug}`}
                      className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 transition hover:border-[#9FE870]"
                    >
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#9FE870]/20 text-slate-900">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold leading-snug text-slate-900 transition group-hover:text-[#4a7c2f]">
                        {guide.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">
                        {guide.excerpt}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          {guide.readTime}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#4a7c2f] transition group-hover:gap-2">
                          Ler guia
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>
          )}
        </div>
      </section>
    </>
  )
}
