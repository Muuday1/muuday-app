'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Star, Send, Loader2 } from 'lucide-react'

type ReviewFormProps = {
  bookingId: string
  userId: string
  professionalId: string
}

const STAR_LABELS: Record<number, string> = {
  1: 'Muito ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente',
}

export function ReviewForm({ bookingId, userId, professionalId }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const displayRating = hovered || rating
  const charLimit = 1000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError('Por favor, selecione uma avaliação.')
      return
    }
    setError(null)
    setSubmitting(true)

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        user_id: userId,
        professional_id: professionalId,
        rating,
        comment: comment.trim() || null,
        is_visible: false, // Admin approves before publishing
      })

    setSubmitting(false)

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint — review already exists
        setError('Você já avaliou esta sessão.')
      } else {
        setError('Erro ao enviar avaliação. Tente novamente.')
      }
      return
    }

    setSuccess(true)
    // Refresh the page after a brief delay to show success via server component
    setTimeout(() => router.refresh(), 1200)
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎉</span>
        </div>
        <h2 className="font-display font-bold text-xl text-slate-900 mb-2">
          Obrigado pela avaliação!
        </h2>
        <p className="text-slate-500 text-sm">
          Sua avaliação foi enviada e ficará visível após revisão.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star rating */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Avaliação geral <span className="text-red-400">*</span>
        </label>
        <div
          className="flex items-center gap-2"
          onMouseLeave={() => setHovered(0)}
          role="group"
          aria-label="Selecione uma nota de 1 a 5 estrelas"
        >
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870] rounded-md transition-transform active:scale-95"
              aria-label={`${star} ${star === 1 ? 'estrela' : 'estrelas'}: ${STAR_LABELS[star]}`}
            >
              <Star
                className={`w-9 h-9 transition-all duration-100 ${
                  star <= displayRating
                    ? 'text-accent-500 fill-accent-500 scale-110'
                    : 'text-slate-200 hover:text-slate-300'
                }`}
              />
            </button>
          ))}
          {displayRating > 0 && (
            <span className="ml-2 text-sm font-medium text-slate-500">
              {STAR_LABELS[displayRating]}
            </span>
          )}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="review-comment"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Comentário{' '}
          <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, charLimit))}
          placeholder="Conte como foi a sua experiência com o profissional..."
          rows={4}
          className="w-full px-4 py-3 rounded-md border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 focus:border-[#9FE870] transition-all resize-none text-sm"
        />
        <p className="text-xs text-slate-400 mt-1.5 text-right">
          {comment.length}/{charLimit}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-4 py-3">
          <span className="flex-shrink-0">⚠️</span>
          {error}
        </div>
      )}

      {/* Info note */}
      <p className="text-xs text-slate-400 bg-slate-50/70 rounded-md px-4 py-3">
        Sua avaliação será revisada pela equipe muuday antes de ser publicada. Isso garante a qualidade das avaliações na plataforma.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full flex items-center justify-center gap-2 bg-[#9FE870] hover:bg-[#8ed85f] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition-all text-sm"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar avaliação
          </>
        )}
      </button>
    </form>
  )
}
