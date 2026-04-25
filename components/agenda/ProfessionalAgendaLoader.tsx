import { createClient } from '@/lib/supabase/server'
import { ProfessionalAgendaPage } from './ProfessionalAgendaPage'
import { normalizeProfessionalSettingsRow, DEFAULT_PROFESSIONAL_BOOKING_SETTINGS } from '@/lib/booking/settings'
import { getPlanConfigForTier, loadPlanConfigMap } from '@/lib/plan-config'
import type { BookingSettingsForm } from '@/components/settings/BookingSettingsClient'

export default async function ProfessionalAgendaLoader({
  userId,
  professionalId,
  professional,
  activeView,
  inboxFilter,
  userTimezone,
  upcoming,
  past,
  activeRequests,
  pendingConfirmations,
}: {
  userId: string
  professionalId: string
  professional: Record<string, any>
  activeView: 'overview' | 'inbox' | 'availability_rules'
  inboxFilter: 'all' | 'confirmations' | 'requests'
  userTimezone: string
  upcoming: any[]
  past: any[]
  activeRequests: any[]
  pendingConfirmations: any[]
}) {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()

  const [
    settingsResult,
    availabilityRulesResult,
    legacyAvailabilityResult,
    calendarIntegrationResult,
    externalBusyResult,
    availabilityExceptionsResult,
    planConfigMap,
  ] = await Promise.all([
    supabase
      .from('professional_settings')
      .select(
        'timezone, session_duration_minutes, buffer_minutes, buffer_time_minutes, minimum_notice_hours, max_booking_window_days, enable_recurring, confirmation_mode, cancellation_policy_code, require_session_purpose',
      )
      .eq('professional_id', professionalId)
      .maybeSingle(),
    supabase
      .from('availability_rules')
      .select('weekday, start_time_local, end_time_local, is_active')
      .eq('professional_id', professionalId)
      .eq('is_active', true)
      .order('weekday', { ascending: true }),
    supabase
      .from('availability')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('professional_id', professionalId)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true }),
    supabase
      .from('calendar_integrations')
      .select('id, provider, sync_enabled, connection_status, provider_account_email, last_sync_at, last_sync_completed_at, last_sync_error')
      .eq('professional_id', professionalId)
      .maybeSingle(),
    supabase
      .from('external_calendar_busy_slots')
      .select('id, start_time_utc, end_time_utc, provider')
      .eq('professional_id', professionalId)
      .gte('start_time_utc', nowIso)
      .order('start_time_utc', { ascending: true })
      .limit(120),
    supabase
      .from('availability_exceptions')
      .select('date_local, is_available, start_time_local, end_time_local')
      .eq('professional_id', professionalId)
      .eq('is_available', false),
    loadPlanConfigMap(),
  ])

  const professionalSettings = settingsResult.data as Record<string, any> | null

  const useModernRules =
    !availabilityRulesResult.error &&
    availabilityRulesResult.data &&
    availabilityRulesResult.data.length > 0

  const overviewAvailabilityRules = useModernRules
    ? (availabilityRulesResult.data || []).map((row: any) => ({
        day_of_week: Number(row.weekday),
        start_time: String(row.start_time_local || ''),
        end_time: String(row.end_time_local || ''),
        is_active: true,
      }))
    : (legacyAvailabilityResult.data || []).map((row: any) => ({
        day_of_week: Number(row.day_of_week),
        start_time: String(row.start_time).slice(0, 5),
        end_time: String(row.end_time).slice(0, 5),
        is_active: Boolean(row.is_active),
      })) || []

  const activeAvailabilityCount = overviewAvailabilityRules.length

  const overviewAvailabilityExceptions = (availabilityExceptionsResult.data || []) as Array<{
    date_local: string
    is_available: boolean
    start_time_local: string | null
    end_time_local: string | null
  }>

  const calendarIntegrationConnected = Boolean(calendarIntegrationResult.data?.sync_enabled)
  const calendarIntegrationProvider = String(calendarIntegrationResult.data?.provider || 'google')
  const rawConnectionStatus = String(calendarIntegrationResult.data?.connection_status || 'disconnected')
  const calendarIntegrationStatus: 'disconnected' | 'pending' | 'connected' | 'error' =
    rawConnectionStatus === 'connected'
      ? 'connected'
      : rawConnectionStatus === 'pending'
        ? 'pending'
        : rawConnectionStatus === 'error'
          ? 'error'
          : 'disconnected'

  const calendarIntegrationLastSyncAt = String(
    calendarIntegrationResult.data?.last_sync_completed_at ||
      calendarIntegrationResult.data?.last_sync_at ||
      '',
  )
  const calendarIntegrationAccountEmail = String(calendarIntegrationResult.data?.provider_account_email || '')
  const calendarIntegrationLastSyncError = String(calendarIntegrationResult.data?.last_sync_error || '')

  const overviewExternalBusySlots =
    (externalBusyResult.data || []).map((row: any) => ({
      id: String(row.id),
      start_time_utc: String(row.start_time_utc),
      end_time_utc: String(row.end_time_utc),
      provider: String(row.provider || 'calendar'),
    })) || []

  const calendarTimezone = String(professionalSettings?.timezone || userTimezone)

  const normalizedTier = String(professional?.tier || 'basic').toLowerCase()
  const tierConfig = getPlanConfigForTier(planConfigMap, normalizedTier)
  const normalizedSettings = normalizeProfessionalSettingsRow(
    professionalSettings,
    userTimezone || DEFAULT_PROFESSIONAL_BOOKING_SETTINGS.timezone,
  )
  const durationFromProfessional =
    typeof professional?.session_duration_minutes === 'number'
      ? professional.session_duration_minutes
      : normalizedSettings.sessionDurationMinutes

  const professionalBookingRulesPanelProps = {
    userId,
    professionalId,
    tier: normalizedTier,
    initialPlanConfig: tierConfig,
    initialForm: {
      timezone: normalizedSettings.timezone,
      sessionDurationMinutes: durationFromProfessional,
      bufferMinutes: Math.min(
        tierConfig.bufferConfig.maxMinutes,
        Math.max(0, normalizedSettings.bufferMinutes),
      ),
      minimumNoticeHours: normalizedSettings.minimumNoticeHours,
      maxBookingWindowDays: Math.min(
        tierConfig.limits.bookingWindowDays,
        Math.max(1, normalizedSettings.maxBookingWindowDays),
      ),
      enableRecurring: normalizedSettings.enableRecurring,
      confirmationMode: normalizedSettings.confirmationMode,
      cancellationPolicyCode: normalizedSettings.cancellationPolicyCode,
      requireSessionPurpose: normalizedSettings.requireSessionPurpose,
    } as BookingSettingsForm,
  }

  // Build overviewCalendarBookings
  const overviewCalendarBookings = [
    ...upcoming
      .map((booking: any) => {
        const scheduledAt = new Date(String(booking.scheduled_at || ''))
        const durationMinutes = Number(booking.duration_minutes || 60)
        const startUtcIso = String(booking.start_time_utc || booking.scheduled_at || '')
        const endUtcIso =
          String(booking.end_time_utc || '') ||
          (Number.isNaN(scheduledAt.getTime())
            ? ''
            : new Date(scheduledAt.getTime() + durationMinutes * 60000).toISOString())

        if (!startUtcIso || !endUtcIso) return null
        return {
          id: String(booking.id),
          start_utc: startUtcIso,
          end_utc: endUtcIso,
          status: String(booking.status || 'pending'),
          client_name: booking.profiles?.full_name || undefined,
        }
      })
      .filter(Boolean),
    ...overviewExternalBusySlots
      .map((slot: any) =>
        slot.start_time_utc && slot.end_time_utc
          ? {
              id: `external-${slot.id}`,
              start_utc: slot.start_time_utc,
              end_utc: slot.end_time_utc,
              status: `external_${slot.provider}`,
            }
          : null,
      )
      .filter(Boolean),
  ] as Array<{ id: string; start_utc: string; end_utc: string; status: string; client_name?: string }>

  return (
    <ProfessionalAgendaPage
      activeView={activeView}
      inboxFilter={inboxFilter}
      userTimezone={userTimezone}
      pendingConfirmations={pendingConfirmations}
      upcoming={upcoming}
      past={past}
      activeRequests={activeRequests}
      calendarTimezone={calendarTimezone}
      activeAvailabilityCount={activeAvailabilityCount}
      calendarIntegrationConnected={calendarIntegrationConnected}
      calendarIntegrationProvider={calendarIntegrationProvider}
      calendarIntegrationStatus={calendarIntegrationStatus}
      calendarIntegrationLastSyncAt={calendarIntegrationLastSyncAt}
      calendarIntegrationAccountEmail={calendarIntegrationAccountEmail}
      calendarIntegrationLastSyncError={calendarIntegrationLastSyncError}
      overviewAvailabilityRules={overviewAvailabilityRules}
      overviewAvailabilityExceptions={overviewAvailabilityExceptions}
      overviewCalendarBookings={overviewCalendarBookings}
      professionalBookingRulesPanelProps={professionalBookingRulesPanelProps}
    />
  )
}
