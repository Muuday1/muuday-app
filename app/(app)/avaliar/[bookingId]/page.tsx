export const metadata = { title: 'Avaliar Sessão | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ReviewForm } from './ReviewForm'
import { AppCard } from '@/components/ui/AppCard'
import { PageContainer } from '@/components/ui/AppShell'

export default async function AvaliarPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the booking with professional details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*, professionals(*, profiles!professionals_user_id_fkey(*))')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single()

  if (bookingError) {
    console.error('[avaliar] failed to load booking:', bookingError.message)
  }

  if (!booking) notFound()

  // Only allow reviews for completed bookings
  if (booking.status !== 'completed') {
    redirect('/agenda')
  }

  // Check if review already exists
  const { data: existingReview, error: reviewError } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at')
    .eq('booking_id', bookingId)
    .eq('user_id', user.id)
    .single()

  if (reviewError && !reviewError.message?.includes('0 rows')) {
    console.error('[avaliar] failed to load existing review:', reviewError.message)
  }

  const professional = booking.professionals as any
  const professionalName = professional?.profiles?.full_name || 'Profissional'
  const professionalInitial = professionalName.charAt(0)
  const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <PageContainer maxWidth="sm">
      {/* Back */}
      <Link
        href="/agenda"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar à agenda
      </Link>

      {/* Professional summary card */}
      <AppCard className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-md bg-[#9FE870] flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0">
          {professionalInitial}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{professionalName}</p>
          <p className="text-sm text-slate-400 mt-0.5">Sessão em {scheduledDate}</p>
        </div>
      </AppCard>

      {existingReview ? (
        /* Already reviewed state */
        <AppCard className="p-8 text-center">
          <div className="w-14 h-14 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900 mb-2">
            Avaliação enviada!
          </h2>
          <p className="text-slate-500 text-sm mb-1">
            Você avaliou esta sessão com {existingReview.rating} {existingReview.rating === 1 ? 'estrela' : 'estrelas'}.
          </p>
          {existingReview.comment && (
            <blockquote className="mt-4 bg-slate-50/70 rounded-md p-4 text-sm text-slate-600 italic text-left">
              &ldquo;{existingReview.comment}&rdquo;
            </blockquote>
          )}
          <p className="text-xs text-slate-300 mt-4">
            Avaliação enviada em {new Date(existingReview.created_at).toLocaleDateString('pt-BR')}. Ficará visível após revisão.
          </p>
          <Link
            href="/agenda"
            className="inline-flex items-center gap-2 mt-6 bg-[#9FE870] hover:bg-[#8ed85f] text-white font-semibold px-5 py-2.5 rounded-md transition-all text-sm"
          >
            Voltar à agenda
          </Link>
        </AppCard>
      ) : (
        /* Review form */
        <AppCard>
          <h1 className="font-display font-bold text-2xl text-slate-900 mb-1">
            Como foi a sessão?
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Sua avaliação ajuda outros usuários a encontrar os melhores profissionais.
          </p>
          <ReviewForm
            bookingId={bookingId}
            userId={user.id}
            professionalId={professional?.id}
          />
        </AppCard>
      )}
    </PageContainer>
  )
}
