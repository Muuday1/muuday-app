import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import {
  DEFAULT_PROFESSIONAL_BOOKING_SETTINGS,
  normalizeProfessionalSettingsRow,
} from '@/lib/booking/settings'
import { getPlanConfigForTier, loadPlanConfigMap } from '@/lib/plan-config'
import { BookingSettingsClient, type BookingSettingsForm } from '@/components/settings/BookingSettingsClient'

export default async function ConfiguracoesAgendamentoPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: professional }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, timezone')
      .eq('id', user.id)
      .maybeSingle(),
    getPrimaryProfessionalForUser(supabase, user.id, 'id, session_duration_minutes, tier'),
  ])

  if (!profile || profile.role !== 'profissional' || !professional) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-neutral-900 mb-2">Acesso restrito</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Esta página é exclusiva para profissionais.
          </p>
          <Link
            href="/perfil"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Voltar ao perfil
          </Link>
        </div>
      </div>
    )
  }

  const { data: settingsRow, error: settingsError } = await supabase
    .from('professional_settings')
    .select(
      'timezone, session_duration_minutes, buffer_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose',
    )
    .eq('professional_id', professional.id)
    .maybeSingle()

  const normalized = normalizeProfessionalSettingsRow(
    settingsError ? null : (settingsRow as Record<string, unknown> | null),
    profile.timezone || DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.timezone,
  )

  const durationFromProfessional =
    typeof professional.session_duration_minutes === 'number'
      ? professional.session_duration_minutes
      : normalized.sessionDurationMinutes

  const normalizedTier = String(professional.tier || 'basic').toLowerCase()
  const planConfigMap = await loadPlanConfigMap()
  const tierConfig = getPlanConfigForTier(planConfigMap, normalizedTier)
  const tierLimits = tierConfig.limits
  const maxBufferMinutes = tierConfig.bufferConfig.maxMinutes

  const initialForm: BookingSettingsForm = {
    timezone: normalized.timezone,
    sessionDurationMinutes: durationFromProfessional,
    bufferMinutes: Math.min(maxBufferMinutes, Math.max(0, normalized.bufferMinutes)),
    minimumNoticeHours: normalized.minimumNoticeHours,
    maxBookingWindowDays: Math.min(tierLimits.bookingWindowDays, Math.max(1, normalized.maxBookingWindowDays)),
    enableRecurring: normalized.enableRecurring,
    confirmationMode: normalized.confirmationMode,
    cancellationPolicyCode: normalized.cancellationPolicyCode,
    requireSessionPurpose: normalized.requireSessionPurpose,
  }

  return (
    <BookingSettingsClient
      userId={user.id}
      professionalId={professional.id}
      tier={normalizedTier}
      initialPlanConfig={tierConfig}
      initialForm={initialForm}
    />
  )
}
