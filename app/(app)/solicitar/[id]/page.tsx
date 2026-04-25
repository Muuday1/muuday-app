export const metadata = { title: 'Solicitar Horário | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import RequestBookingForm from '@/components/booking/RequestBookingForm'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'
import { buildProfessionalProfilePath } from '@/lib/professional/public-profile-url'

const REQUEST_BOOKING_ALLOWED_TIERS = ['professional', 'premium']
export default async function SolicitarHorarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/solicitar/${id}`)

  // Fetch user profile and professional in parallel
  const [
    { data: userProfile },
    { data: professional },
  ] = await Promise.all([
    supabase.from('profiles').select('role, timezone').eq('id', user.id).single(),
    supabase.from('professionals').select('id,user_id,public_code,status,tier,session_duration_minutes').eq('id', id).single(),
  ])

  // Professional accounts are provider-only workspaces and cannot purchase sessions.
  if (userProfile?.role === 'profissional') {
    redirect('/dashboard?erro=conta-profissional-nao-pode-contratar')
  }

  if (!professional || professional.status !== 'approved') {
    notFound()
  }

  const { data: professionalProfile } = await supabase
    .from('profiles')
    .select('full_name, timezone')
    .eq('id', professional.user_id)
    .maybeSingle()
  const professionalProfileHref = buildProfessionalProfilePath({
    id: professional.id,
    fullName: professionalProfile?.full_name,
    publicCode: professional.public_code,
  })

  if (professional.user_id === user.id) {
    redirect(`${professionalProfileHref}?erro=auto-agendamento`)
  }

  if (!REQUEST_BOOKING_ALLOWED_TIERS.includes(String(professional.tier))) {
    redirect(`${professionalProfileHref}?erro=request-booking-indisponivel`)
  }

  const firstBookingEligibility = await evaluateFirstBookingEligibility(supabase, professional.id)
  if (!firstBookingEligibility.ok) {
    redirect(`${professionalProfileHref}?erro=primeiro-agendamento-bloqueado`)
  }

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
      profileHref={professionalProfileHref}
      professionalName={professionalProfile?.full_name || 'Profissional'}
      professionalTimezone={bookingSettings.timezone}
      userTimezone={userProfile?.timezone || 'America/Sao_Paulo'}
      defaultDurationMinutes={
        bookingSettings.sessionDurationMinutes || professional.session_duration_minutes || 60
      }
    />
  )
}
