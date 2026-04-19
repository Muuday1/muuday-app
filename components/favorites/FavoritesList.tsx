'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Star, Clock, Heart, Search, Trash2 } from 'lucide-react'
import { CATEGORIES } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'
import { removeFavorite } from '@/lib/actions/favorites'

type Professional = {
  id: string
  public_code?: number | null
  category: string
  rating: number
  total_reviews: number
  session_price_brl: number
  session_duration_minutes: number
  profiles: Record<string, unknown> | Record<string, unknown>[] | null
}

type FeedbackState = {
  type: 'success' | 'error'
  message: string
} | null

interface FavoritesListProps {
  initialProfessionals: Professional[]
  userCurrency: string
}

export default function FavoritesList({ initialProfessionals, userCurrency }: FavoritesListProps) {
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals)
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  function handleRemove(professionalId: string) {
    setFeedback(null)
    setRemovingId(professionalId)

    startTransition(async () => {
      const result = await removeFavorite(professionalId)
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Erro ao remover favorito.' })
        setRemovingId(null)
        return
      }

      setProfessionals(prev => prev.filter(p => p.id !== professionalId))
      setFeedback({ type: 'success', message: 'Profissional removido dos favoritos.' })
      setRemovingId(null)
    })
  }

  return (
    <>
      <div aria-live="polite" className="mb-4">
        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
            role="status"
          >
            {feedback.message}
          </div>
        )}
      </div>

      {professionals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100">
          <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-neutral-300" />
          </div>
          <h2 className="font-display font-semibold text-lg text-neutral-900 mb-2">Nenhum favorito ainda</h2>
          <p className="text-neutral-500 text-sm mb-6 max-w-xs mx-auto">
            Salve profissionais que você gosta para acessá-los rapidamente aqui.
          </p>
          <Link
            href="/buscar"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            <Search className="w-4 h-4" />
            Buscar profissionais
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-400 mb-4">
            {professionals.length} {professionals.length === 1 ? 'profissional salvo' : 'profissionais salvos'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.map(pro => {
              const category = CATEGORIES.find(c => c.slug === pro.category)
              const profile = Array.isArray(pro.profiles) ? pro.profiles[0] : pro.profiles
              const name = ((profile as Record<string, unknown>)?.full_name as string) || 'Profissional'
              const initial = (name || '').trim().charAt(0).toUpperCase() || 'P'
              const isRemoving = removingId === pro.id

              return (
                <div
                  key={pro.id}
                  className={`bg-white rounded-2xl border border-neutral-100 hover:shadow-md transition-all duration-300 overflow-hidden group relative ${
                    isRemoving ? 'opacity-50 scale-[0.99]' : ''
                  }`}
                >
                  <button
                    onClick={() => handleRemove(pro.id)}
                    disabled={isPending || isRemoving}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-neutral-500 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                    aria-label={`Remover ${name} dos favoritos`}
                    title="Remover dos favoritos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <Link
                    href={buildProfessionalProfilePath({
                      id: pro.id,
                      fullName: name,
                      publicCode: pro.public_code,
                    })}
                    className="block focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    <div className="bg-gradient-to-br from-brand-50 to-brand-100 h-24 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-display font-bold text-2xl">
                        {initial}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors pr-2">{name}</h3>
                      <p className="text-sm text-neutral-500 mt-0.5 capitalize">{category?.icon} {category?.name || pro.category}</p>

                      <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-accent-500 fill-accent-500" />
                          {pro.rating > 0 ? pro.rating.toFixed(1) : 'Novo'}
                          {pro.total_reviews > 0 && <span className="text-neutral-400">({pro.total_reviews})</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {pro.session_duration_minutes}min
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                        <span className="font-semibold text-neutral-900">{formatCurrency(pro.session_price_brl, userCurrency)}</span>
                        <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2.5 py-1 rounded-full">Agendar</span>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mt-8 p-5 bg-white rounded-2xl border border-neutral-100 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-neutral-900 text-sm">Quer descobrir mais profissionais?</p>
              <p className="text-xs text-neutral-400 mt-0.5">Explore por categoria ou especialidade</p>
            </div>
            <Link
              href="/buscar"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl transition-all text-sm"
            >
              <Search className="w-3.5 h-3.5" />
              Buscar
            </Link>
          </div>
        </>
      )}
    </>
  )
}
