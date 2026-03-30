export const metadata = { title: 'Solicitar Horario | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import RequestBookingForm from '@/components/booking/RequestBookingForm'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'

const REQUEST_BOOKING_ALLOWED_TIERS = ['professional', 'premium']
export default async function SolicitarHorarioPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/solicitar/${params.id}`)

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id, user_id, status, tier, first_booking_enabled, session_duration_minutes, profiles(*)',
    )
    .eq('id', params.id)
    .single()

  if (!professional || professional.status !== 'approved') {
    notFound()
  }

  if (professional.user_id === user.id) {
    redirect(`/profissional/${params.id}?erro=auto-agendamento`)
  }

  if (!REQUEST_BOOKING_ALLOWED_TIERS.includes(String(professional.tier))) {
    redirect(`/profissional/${params.id}?erro=request-booking-indisponivel`)
  }

  const firstBookingEligibility = await evaluateFirstBookingEligibility(supabase, professional.id)
  if (!firstBookingEligibility.ok) {
    redirect(`/profissional/${params.id}?erro=primeiro-agendamento-bloqueado`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()

  const professionalProfile = Array.isArray(professional.profiles)
    ? professional.profiles[0]
    : professional.profiles
  const professionalTimezoneFallback = professionalProfile?.timezone || 'America/Sao_Paulo'

  const { data: settingsRow, error: settingsError } = await supabase
    .from('professional_settings')
    .select(
      'timezone, session_duration_minutes, buffer_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose',
    )
    .eq('professional_id', professional.id)
    .maybeSingle()

  const bookingSettings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    professionalTimezoneFallback,
  )

  return (
    <RequestBookingForm
      professionalId={professional.id}
      professionalName={professionalProfile?.full_name || 'Profissional'}
      professionalTimezone={bookingSettings.timezone}
      userTimezone={profile?.timezone || 'America/Sao_Paulo'}
      defaultDurationMinutes={
        bookingSettings.sessionDurationMinutes || professional.session_duration_minutes || 60
      }
    />
  )
}
