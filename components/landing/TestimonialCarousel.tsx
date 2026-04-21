'use client'

import { useRef, useState, useEffect } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Ana Paula',
    role: 'Psicóloga em Lisboa',
    text: 'A Muuday me conectou com brasileiros em Portugal que precisavam de atendimento em português. A plataforma cuida de tudo.',
    flag: '🇵🇹',
  },
  {
    name: 'Ricardo Mendes',
    role: 'Nutricionista em Londres',
    text: 'Finalmente consigo atender clientes do Brasil sem complicação de fuso horário. Tudo ajustado automaticamente.',
    flag: '🇬🇧',
  },
  {
    name: 'Carolina Dias',
    role: 'Cliente em Berlim',
    text: 'Encontrei uma psicóloga brasileira em minutos. Fazer terapia na minha língua, morando na Alemanha, fez toda a diferença.',
    flag: '🇩🇪',
  },
]

export function TestimonialCarousel() {
  const [index, setIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)

  function go(dir: 'prev' | 'next') {
    setIndex((i) => {
      if (dir === 'prev') return i === 0 ? TESTIMONIALS.length - 1 : i - 1
      return i === TESTIMONIALS.length - 1 ? 0 : i + 1
    })
  }

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.style.transform = `translateX(-${index * 100}%)`
  }, [index])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      go(diff > 0 ? 'next' : 'prev')
    }
  }

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-out"
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="w-full shrink-0 px-4">
            <div className="flex h-full flex-col rounded-lg bg-[#9FE870] p-8 md:p-10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{t.flag}</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-700">{t.role}</p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-base font-medium leading-7 text-slate-800">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-6 inline-flex items-center self-start rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                {t.name.split(' ')[0]} no Muuday
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="mt-6 flex justify-center gap-2">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? 'w-8 bg-[#9FE870]' : 'w-2.5 bg-slate-300'
            }`}
            aria-label={`Testemunho ${i + 1}`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => go('prev')}
        className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-[#9FE870] md:flex"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5 text-slate-700" />
      </button>
      <button
        type="button"
        onClick={() => go('next')}
        className="absolute right-0 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white transition hover:border-[#9FE870] md:flex"
        aria-label="Próximo"
      >
        <ChevronRight className="h-5 w-5 text-slate-700" />
      </button>
    </div>
  )
}
