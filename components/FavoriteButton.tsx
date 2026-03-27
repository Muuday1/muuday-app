'use client'

import { useState, useEffect, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { isFavorited, toggleFavorite } from '@/lib/favorites'

export function FavoriteButton({ professionalId }: { professionalId: string }) {
  const [favorited, setFavorited] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    isFavorited(professionalId).then(setFavorited)
  }, [professionalId])

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleFavorite(professionalId)
      setFavorited(result)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
        favorited
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
      } ${isPending ? 'opacity-50' : ''}`}
      aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
      {favorited ? 'Salvo' : 'Salvar'}
    </button>
  )
}
