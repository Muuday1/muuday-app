export const metadata = { title: 'Agendamento Confirmado | Muuday' }

import Link from 'next/link'
import { CheckCircle2, Calendar, Clock, ArrowRight, MessageCircle } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export default async function BookingConfirmacaoPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/agenda/confirmacao/${bookingId}`)}`)
  }

  // Retry with delay to avoid race condition between booking creation/update and page load
  let booking = null
  let userProfile = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const [{ data: bookingData }, { data: profileData }] = await Promise.all([
      supabase
        .from('bookings')
        .select(
          `id, scheduled_at, start_time_utc, end_time_utc, duration_minutes, status, price_total, user_currency, price_brl,
          session_purpose, booking_type, recurrence_group_id,
          professionals(id, user_id, profiles(full_name, timezone)),
          professional_services(id, name, duration_minutes, price_brl)`
        )
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase.from('profiles').select('timezone').eq('id', user.id).maybeSingle(),
    ])

    if (bookingData) {
      booking = bookingData
      userProfile = profileData
      break
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
  }

  if (!booking) {
    notFound()
  }

  const proProfile = (booking.professionals as unknown as { profiles?: { full_name?: string; timezone?: string } } | null)?.profiles
  const professionalName = (proProfile as { full_name?: string } | undefined)?.full_name || 'Profissional'
  const professionalTimezone = (proProfile as { timezone?: string } | undefined)?.timezone || 'America/Sao_Paulo'

  const service = booking.professional_services as unknown as { name?: string; duration_minutes?: number; price_brl?: number } | null

  const scheduledAt = booking.scheduled_at
    ? new Date(booking.scheduled_at)
    : booking.start_time_utc
      ? new Date(booking.start_time_utc)
      : null

  const userTimezone = userProfile?.timezone || 'America/Sao_Paulo'
  const dateLabel = scheduledAt
    ? formatInTimeZone(scheduledAt, userTimezone, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null
  const timeLabel = scheduledAt
    ? formatInTimeZone(scheduledAt, userTimezone, 'HH:mm')
    : null
  const proTimeLabel = scheduledAt
    ? formatInTimeZone(scheduledAt, professionalTimezone, 'HH:mm')
    : null

  const duration = service?.duration_minutes ?? booking.duration_minutes ?? 60
  const priceBrl = service?.price_brl ?? booking.price_brl ?? 0
  const currency = (booking.user_currency as string) || 'BRL'
  const isRecurring = booking.booking_type === 'recurring_parent'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg px-6 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#9FE870]/15">
            <CheckCircle2 className="h-8 w-8 text-[#4a7c1f]" />
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-900">
            {booking.status === 'pending_payment'
              ? 'Aguardando pagamento'
              : booking.status === 'pending_confirmation'
                ? 'Solicitação enviada'
                : 'Agendamento confirmado'}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {booking.status === 'pending_payment'
              ? 'Finalize o pagamento para confirmar sua sessão.'
              : booking.status === 'pending_confirmation'
                ? `Sua solicitação foi enviada para ${professionalName}. Você receberá uma notificação quando for respondida.`
                : `Sua sessão com ${professionalName} foi confirmada.`}
          </p>

          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4 text-left">
            <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {service?.name || 'Sessão'}
                </p>
                <p className="text-xs text-slate-500">{professionalName}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              {dateLabel && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Data
                  </span>
                  <span className="font-medium text-slate-900 capitalize">{dateLabel}</span>
                </div>
              )}
              {timeLabel && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Horário
                  </span>
                  <span className="font-medium text-slate-900">
                    {timeLabel}
                    {proTimeLabel && proTimeLabel !== timeLabel && (
                      <span className="ml-1 text-xs text-slate-400">({proTimeLabel} no fuso do profissional)</span>
                    )}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Duração
                </span>
                <span className="font-medium text-slate-900">{duration} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="text-slate-400">R$</span>
                  Valor
                </span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(Number(priceBrl), currency)}
                </span>
              </div>
              {isRecurring && (
                <div className="flex items-center justify-between">
                  <span>Tipo</span>
                  <span className="font-medium text-slate-900">Pacote recorrente</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {booking.status === 'pending_payment' && (
              <Link
                href={`/pagamento/${bookingId}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#9FE870] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8ed85f]"
              >
                Pagar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <Link
              href="/agenda"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Ver minha agenda
            </Link>

            <Link
              href={`/mensagens?profissional=${(booking.professionals as unknown as { id?: string } | null)?.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar mensagem
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
