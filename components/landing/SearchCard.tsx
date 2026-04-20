'use client'

import { useState, useMemo } from 'react'
import { ArrowRight, Search, Globe } from 'lucide-react'
import Link from 'next/link'
import { GradientBorder } from '@/components/landing/GradientBorder'
import { MagneticButton } from '@/components/landing/MagneticButton'
import { SEARCH_CATEGORIES, getSpecialtyOptions } from '@/lib/search-config'

export function SearchCard() {
  const [selectedCategory, setSelectedCategory] = useState('')

  const specialtyOptions = useMemo(() => {
    return getSpecialtyOptions(selectedCategory || undefined)
  }, [selectedCategory])

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <GradientBorder borderClassName="p-[2px] rounded-3xl bg-gradient-to-br from-[#9FE870] via-emerald-400 to-brand-500">
        <div className="overflow-hidden rounded-3xl bg-white">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <svg className="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Profissionais verificados
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Você busca</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/20">
                  <Search className="h-5 w-5 text-slate-400" />
                  <select
                    className="flex-1 bg-transparent text-base font-semibold text-slate-900 outline-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Todas as categorias</option>
                    {SEARCH_CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500">Especialidade</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/20">
                  <Globe className="h-5 w-5 text-slate-400" />
                  <select className="flex-1 bg-transparent text-base font-semibold text-slate-900 outline-none">
                    <option value="">Todas as especialidades</option>
                    {specialtyOptions.map((specialty) => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
              </div>

              <MagneticButton className="w-full" strength={0.15}>
                <Link
                  href="/buscar"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#9FE870] px-6 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-lg hover:shadow-[#9FE870]/25"
                >
                  Buscar profissionais
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </MagneticButton>
            </div>
          </div>
        </div>
      </GradientBorder>
    </div>
  )
}
