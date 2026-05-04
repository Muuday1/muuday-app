import type { PlanConfig } from '@/lib/plan-config'
import type { BookingSettingsForm } from '@/components/settings/BookingSettingsClient'

export type AgendaView = 'overview' | 'inbox' | 'availability_rules'
export type InboxFilter = 'all' | 'confirmations' | 'requests'

export type BookingRecord = Record<string, any>
export type RequestRecord = Record<string, any>

export interface CalendarBooking {
  id: string
  start_utc: string
  end_utc: string
  status: string
  client_name?: string
}

export interface AvailabilityRule {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export interface AvailabilityException {
  date_local: string
  is_available: boolean
  start_time_local: string | null
  end_time_local: string | null
}

export interface ProfessionalAgendaPageProps {
  activeView: AgendaView
  inboxFilter: InboxFilter
  userTimezone: string
  pendingConfirmations: BookingRecord[]
  upcoming: BookingRecord[]
  past: BookingRecord[]
  activeRequests: RequestRecord[]
  calendarTimezone: string
  activeAvailabilityCount: number
  calendarIntegrationConnected: boolean
  calendarIntegrationProvider: string
  calendarIntegrationStatus: 'disconnected' | 'pending' | 'connected' | 'error'
  calendarIntegrationLastSyncAt: string
  calendarIntegrationAccountEmail: string
  calendarIntegrationLastSyncError: string
  overviewAvailabilityRules: AvailabilityRule[]
  overviewAvailabilityExceptions?: AvailabilityException[]
  overviewCalendarBookings: CalendarBooking[]
  professionalBookingRulesPanelProps: {
    userId: string
    professionalId: string
    tier: string
    initialPlanConfig: PlanConfig
    initialForm: BookingSettingsForm
  } | null
}
