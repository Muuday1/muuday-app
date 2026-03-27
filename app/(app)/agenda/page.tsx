export const metadata = { title: 'Agenda | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Video, ChevronRight, Star } from 'lucide-react'
import BookingActions from '@/components/booking/BookingActions'

export default async function AgendaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Treat account as professional when it actually has a professional record,
  // even if role is currently set to "admin".
  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const professionalId: string | null = professional?.id ?? null
  const isProfissional = Boolean(professionalId)

  const upcomingBookingsQuery =
    isProfissional && professionalId
      ? supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_fkey(*), professionals(*, profiles(*))')
          .eq('professional_id', professionalId)
      : isProfissional
        ? null
        : supabase
            .from('bookings')
            .select('*, professionals(*, profiles(*))')
            .eq('user_id', user.id)

  const pastBookingsQuery =
    isProfissional && professionalId
      ? supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_fkey(*), professionals(*, profiles(*))')
          .eq('professional_id', professionalId)
      : isProfissional
        ? null
        : supabase
            .from('bookings')
            .select('*, professionals(*, profiles(*))')
            .eq('user_id', user.id)

  const { data: upcomingBookings } = upcomingBookingsQuery
    ? await upcomingBookingsQuery
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
    : { data: [] as any[] }

  const { data: pastBookings } = pastBookingsQuery
    ? await pastBookingsQuery
        .in('status', ['completed', 'cancelled', 'no_show'])
        .order('scheduled_at', { ascending: false })
        .limit(10)
    : { data: [] as any[] }

  const upcoming = upcomingBookings || []
  const past = pastBookings || []

  // Fetch existing reviews for completed bookings (so we can hide the "Avaliar" button if already reviewed)
  const completedBookingIds = past
    .filter((b: any) => b.status === 'completed')
    .map((b: any) => b.id)

  const reviewedBookingIds = new Set<string>()
  if (!isProfissional && completedBookingIds.length > 0) {
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('booking_id')
      .in('booking_id', completedBookingIds)
      .eq('user_id', user.id)
    ;(existingReviews || []).forEach((r: any) => reviewedBookingIds.add(r.booking_id))
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">Agenda</h1>
        <p className="text-neutral-500">
          {isProfissional
            ? 'Gerencie suas sessões com clientes'
            : 'Suas sessões agendadas'}
        </p>
      </div>

      {/* Upcoming sessions */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-lg text-neutral-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-500" />
          Próximas sessões
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
            <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-7 h-7 text-neutral-300" />
            </div>
            <p className="font-semibold text-neutral-900 mb-1">Nenhuma sessão agendada</p>
            <p className="text-sm text-neutral-500 mb-4">
              {isProfissional
                ? 'Quando clientes agendarem sessões, elas aparecerão aqui.'
                : 'Encontre um profissional e agende sua primeira sessão.'}
            </p>
            {!isProfissional && (
              <a
                href="/buscar"
                className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
              >
                Buscar profissional
                <ChevronRight className="w-4 h-4" />
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking: any) => {
              const otherPerson = isProfissional
                ? booking.profiles?.full_name
                : booking.professionals?.profiles?.full_name

              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-display font-bold flex-shrink-0">
                      {otherPerson?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900">{otherPerson || 'Profissional'}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(booking.scheduled_at).toLocaleDateString('pt-BR', {
                            weekday: 'short', day: 'numeric', month: 'short'
                          })} {' '}
                          {new Date(booking.scheduled_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        <span>{booking.duration_minutes || 50}min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        booking.status === 'confirmed'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {booking.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </span>
                      {booking.session_link && (
                        <a
                          href={booking.session_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-all"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Entrar
                        </a>
                      )}
                    </div>
                  </div>
                  <BookingActions
                    bookingId={booking.id}
                    status={booking.status}
                    sessionLink={booking.session_link}
                    isProfessional={isProfissional}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Past sessions */}
      {past.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-lg text-neutral-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-neutral-400" />
            Histórico
          </h2>
          <div className="space-y-2">
            {past.map((booking: any) => {
              const otherPerson = isProfissional
                ? booking.profiles?.full_name
                : booking.professionals?.profiles?.full_name

              const statusConfig: Record<string, { label: string; className: string }> = {
                completed: { label: 'Concluído', className: 'bg-green-50 text-green-700' },
                cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-600' },
                no_show: { label: 'Não compareceu', className: 'bg-neutral-100 text-neutral-500' },
              }
              const status = statusConfig[booking.status] || statusConfig.completed

              const canReview =
                !isProfissional &&
                booking.status === 'completed' &&
                !reviewedBookingIds.has(booking.id)

              return (
                <div key={booking.id} className="bg-white rounded-xl border border-neutral-100 p-4 flex items-center gap-4 opacity-80">
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 font-display font-bold text-sm flex-shrink-0">
                    {otherPerson?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-700 text-sm">{otherPerson || 'Profissional'}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {new Date(booking.scheduled_at).toLocaleDateString('pt-BR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canReview && (
                      <Link
                        href={`/avaliar/${booking.id}`}
                        className="flex items-center gap-1.5 bg-accent-50 hover:bg-accent-100 text-accent-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all"
                      >
                        <Star className="w-3 h-3 fill-accent-500 text-accent-500" />
                        Avaliar
                      </Link>
                    )}
                    {!canReview && booking.status === 'completed' && !isProfissional && (
                      <span className="text-xs text-neutral-300 font-medium">Avaliado</span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
