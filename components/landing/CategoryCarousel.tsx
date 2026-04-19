'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SEARCH_CATEGORIES } from '@/lib/search-config'

const ALL_CATEGORIES = SEARCH_CATEGORIES

export function CategoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  return (
    <div className="relative mt-12">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 pt-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {ALL_CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            href={`/buscar?categoria=${category.slug}`}
            className="group flex w-[260px] shrink-0 snap-start flex-col rounded-3xl border border-slate-200 bg-white p-8 transition hover:border-[#9FE870] hover:shadow-xl hover:shadow-[#9FE870]/10 hover:-translate-y-1"
          >
            {/* Animated icon with pulse ring */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#9FE870]/20 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-2 rounded-full bg-[#9FE870]/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#9FE870] to-emerald-500 text-3xl shadow-lg transition group-hover:scale-110">
                {category.icon}
              </div>
            </div>
            <h3 className="mt-5 text-center text-base font-bold text-slate-900">{category.name}</h3>
            <p className="mt-2 flex-1 text-center text-sm leading-6 text-slate-500">{category.description}</p>
            <p className="mt-4 inline-flex items-center justify-center gap-1 text-sm font-bold text-brand-600 transition group-hover:text-slate-900">
              Ver profissionais
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </p>
          </Link>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition hover:border-[#9FE870] md:flex"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5 text-slate-700" />
      </button>
      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition hover:border-[#9FE870] md:flex"
        aria-label="Próximo"
      >
        <ChevronRight className="h-5 w-5 text-slate-700" />
      </button>
    </div>
  )
}
