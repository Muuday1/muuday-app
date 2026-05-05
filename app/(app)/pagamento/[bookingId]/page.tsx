export const metadata = { title: 'Pagamento | Muuday' }

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentFormWrapper } from './PaymentFormWrapper'
import * as Sentry from '@sentry/nextjs'

export default async function PagamentoPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const supabase = await createClient()

  let user = null
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    Sentry.captureException(error, { tags: { area: 'payment', context: 'auth' } })
    redirect(`/login?redirect=${encodeURIComponent(`/pagamento/${bookingId}`)}`)
  }

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/pagamento/${bookingId}`)}`)
  }

  // Retry with delay to avoid race condition between booking creation and page load
  let booking = null
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(
          `id, status, price_total, user_currency, price_brl, scheduled_at, start_time_utc, end_time_utc, duration_minutes,
          professionals(id, profiles(full_name, avatar_url)),
          professional_services(id, name, duration_minutes, price_brl)`
        )
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (bookingData) {
        booking = bookingData
        break
      }

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 400))
      }
    }
  } catch (error) {
    Sentry.captureException(error, { tags: { area: 'payment', context: 'booking-lookup' } })
  }

  if (!booking) {
    notFound()
  }

  if (booking.status !== 'pending_payment') {
    redirect(`/agenda/confirmacao/${bookingId}`)
  }

  const professional = (booking.professionals as unknown as {
    id?: string
    profiles?: { full_name?: string; avatar_url?: string }
  } | null)

  const professionalName = professional?.profiles?.full_name || 'Profissional'
  const professionalAvatar = professional?.profiles?.avatar_url || null

  const service = booking.professional_services as unknown as {
    name?: string
    duration_minutes?: number
    price_brl?: number
  } | null

  const duration = service?.duration_minutes ?? booking.duration_minutes ?? 60
  const priceBrl = service?.price_brl ?? booking.price_brl ?? 0
  const currency = (booking.user_currency as string) || 'BRL'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg px-6 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Finalizar pagamento
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Complete o pagamento para confirmar sua sessão com {professionalName}.
          </p>

          <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              {professionalAvatar ? (
                <img
                  src={professionalAvatar}
                  alt={professionalName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                  {professionalName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {service?.name || 'Sessão'} com {professionalName}
                </p>
                <p className="text-xs text-slate-500">
                  {duration} min ·{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: currency,
                  }).format(Number(priceBrl))}
                </p>
              </div>
            </div>
          </div>

          <PaymentFormWrapper bookingId={bookingId} />
        </div>
      </div>
    </div>
  )
}
