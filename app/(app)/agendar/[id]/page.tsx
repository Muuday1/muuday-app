export const metadata = { title: 'Agendar Sessão | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CATEGORIES } from '@/types'
import BookingForm from '@/components/booking/BookingForm'
import { normalizeProfessionalSettingsRow } from '@/lib/booking/settings'
import { evaluateFirstBookingEligibility } from '@/lib/professional/onboarding-state'

export default async function AgendarPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch professional with profile
  const { data: professional } = await supabase
    .from('professionals')
    .select('*, profiles(*), first_booking_enabled')
    .eq('id', params.id)
    .single()

  if (!professional || professional.status !== 'approved') {
    notFound()
  }

  // Prevent professionals from booking themselves
  if (professional.user_id === user.id) {
    redirect(`/profissional/${params.id}?erro=auto-agendamento`)
  }

  const firstBookingEligibility = await evaluateFirstBookingEligibility(supabase, professional.id)
  if (!firstBookingEligibility.ok) {
    redirect(`/profissional/${params.id}?erro=primeiro-agendamento-bloqueado`)
  }

  // Fetch user profile for timezone and currency
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone, currency, full_name')
    .eq('id', user.id)
    .single()

  const { data: settingsRow, error: settingsError } = await supabase
    .from('professional_settings')
    .select(
      'timezone, session_duration_minutes, buffer_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose'
    )
    .eq('professional_id', professional.id)
    .maybeSingle()

  const professionalProfile = Array.isArray(professional.profiles)
    ? professional.profiles[0]
    : professional.profiles

  const bookingSettings = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    professionalProfile?.timezone || 'America/Sao_Paulo'
  )

  // Fetch professional's weekly availability
  const { data: availabilityRulesRows, error: availabilityRulesError } = await supabase
    .from('availability_rules')
    .select('weekday, start_time_local, end_time_local, is_active')
    .eq('professional_id', professional.id)
    .eq('is_active', true)
    .order('weekday')

  const { data: legacyAvailability } = await supabase
    .from('availability')
    .select('id, day_of_week, start_time, end_time')
    .eq('professional_id', professional.id)
    .eq('is_active', true)
    .order('day_of_week')

  const availability =
    !availabilityRulesError && availabilityRulesRows && availabilityRulesRows.length > 0
      ? availabilityRulesRows.map(rule => ({
          id: `rule-${rule.weekday}-${rule.start_time_local}-${rule.end_time_local}`,
          day_of_week: rule.weekday,
          start_time: rule.start_time_local,
          end_time: rule.end_time_local,
        }))
      : legacyAvailability || []

  // Fetch existing bookings for the next 30 days to block already-booked slots
  const now = new Date()
  const thirtyDaysLater = new Date(now)
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('scheduled_at, duration_minutes')
    .eq('professional_id', professional.id)
    .in('status', ['pending', 'pending_confirmation', 'confirmed'])
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', thirtyDaysLater.toISOString())

  const profProfile = professionalProfile as any
  const category = CATEGORIES.find(c => c.slug === professional.category)

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-100 px-6 md:px-8 py-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display font-bold text-2xl text-neutral-900">
            Agendar sessão
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {profProfile?.full_name}
            {category ? ` · ${category.icon} ${category.name}` : ''}
            {' · '}
            {professional.session_duration_minutes} min
          </p>
        </div>
      </div>

      <BookingForm
        professional={{
          id: professional.id,
          session_price_brl: professional.session_price_brl,
          session_duration_minutes: bookingSettings.sessionDurationMinutes || professional.session_duration_minutes,
          category: professional.category,
        }}
        profileName={profProfile?.full_name || 'Profissional'}
        availability={availability || []}
        existingBookings={existingBookings || []}
        userTimezone={profile?.timezone || 'America/Sao_Paulo'}
        userCurrency={profile?.currency || 'BRL'}
        professionalTimezone={bookingSettings.timezone}
        minimumNoticeHours={bookingSettings.minimumNoticeHours}
        maxBookingWindowDays={bookingSettings.maxBookingWindowDays}
        confirmationMode={bookingSettings.confirmationMode}
        requireSessionPurpose={bookingSettings.requireSessionPurpose}
        enableRecurring={bookingSettings.enableRecurring}
      />
    </div>
  )
}
