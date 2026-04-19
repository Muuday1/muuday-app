export const metadata = { title: 'Avaliar Sessão | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ReviewForm } from './ReviewForm'

export default async function AvaliarPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the booking with professional details
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, professionals(*, profiles(*))')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single()

  if (!booking) notFound()

  // Only allow reviews for completed bookings
  if (booking.status !== 'completed') {
    redirect('/agenda')
  }

  // Check if review already exists
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at')
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .single()

  const professional = booking.professionals as any
  const professionalName = professional?.profiles?.full_name || 'Profissional'
  const professionalInitial = professionalName.charAt(0)
  const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/agenda"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à agenda
      </Link>

      {/* Professional summary card */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-brand-500 flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0">
          {professionalInitial}
        </div>
        <div>
          <p className="font-semibold text-neutral-900">{professionalName}</p>
          <p className="text-sm text-neutral-400 mt-0.5">Sessão em {scheduledDate}</p>
        </div>
      </div>

      {existingReview ? (
        /* Already reviewed state */
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="font-display font-bold text-xl text-neutral-900 mb-2">
            Avaliação enviada!
          </h2>
          <p className="text-neutral-500 text-sm mb-1">
            Você avaliou esta sessão com {existingReview.rating} {existingReview.rating === 1 ? 'estrela' : 'estrelas'}.
          </p>
          {existingReview.comment && (
            <blockquote className="mt-4 bg-neutral-50 rounded-xl p-4 text-sm text-neutral-600 italic text-left">
              "{existingReview.comment}"
            </blockquote>
          )}
          <p className="text-xs text-neutral-300 mt-4">
            Avaliação enviada em {new Date(existingReview.created_at).toLocaleDateString('pt-BR')}. Ficará visível após revisão.
          </p>
          <Link
            href="/agenda"
            className="inline-flex items-center gap-2 mt-6 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Voltar à agenda
          </Link>
        </div>
      ) : (
        /* Review form */
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h1 className="font-display font-bold text-2xl text-neutral-900 mb-1">
            Como foi a sessão?
          </h1>
          <p className="text-neutral-500 text-sm mb-6">
            Sua avaliação ajuda outros usuários a encontrar os melhores profissionais.
          </p>
          <ReviewForm
            bookingId={bookingId}
            userId={user.id}
            professionalId={professional?.id}
          />
        </div>
      )}
    </div>
  )
}
