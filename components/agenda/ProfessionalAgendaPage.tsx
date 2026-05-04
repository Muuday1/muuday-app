'use client'

import { useState } from 'react'

import { ProfessionalCalendarSyncModal } from './ProfessionalCalendarSyncModal'
import { ProfessionalAvailabilityWorkspace } from './ProfessionalAvailabilityWorkspace'
import { ProfessionalBookingRulesPanel } from './ProfessionalBookingRulesPanel'

import type { ProfessionalAgendaPageProps } from './professional-agenda/types'
import { useBlockTimeModal } from './professional-agenda/hooks/use-block-time-modal'
import { useInboxItems } from './professional-agenda/hooks/use-inbox-items'

import { AgendaHeader } from './professional-agenda/components/AgendaHeader'
import { AgendaStatsCards } from './professional-agenda/components/AgendaStatsCards'
import { UpcomingBookingsSection } from './professional-agenda/components/UpcomingBookingsSection'
import { OverviewCalendarSection } from './professional-agenda/components/OverviewCalendarSection'
import { InboxHeader } from './professional-agenda/components/InboxHeader'
import { InboxList } from './professional-agenda/components/InboxList'
import { BlockTimeModal } from './professional-agenda/components/BlockTimeModal'

export type { ProfessionalAgendaPageProps }

export function ProfessionalAgendaPage({
  activeView,
  inboxFilter,
  userTimezone,
  pendingConfirmations,
  upcoming,
  past: _past,
  activeRequests,
  calendarTimezone,
  activeAvailabilityCount: _activeAvailabilityCount,
  calendarIntegrationConnected,
  calendarIntegrationProvider,
  calendarIntegrationStatus,
  calendarIntegrationLastSyncAt,
  calendarIntegrationAccountEmail,
  calendarIntegrationLastSyncError,
  overviewAvailabilityRules,
  overviewAvailabilityExceptions = [],
  overviewCalendarBookings,
  professionalBookingRulesPanelProps,
}: ProfessionalAgendaPageProps) {
  const [showCalendarSyncModal, setShowCalendarSyncModal] = useState(false)

  const blockTime = useBlockTimeModal()
  const { filteredInboxItems } = useInboxItems({
    pendingConfirmations,
    activeRequests,
    inboxFilter,
  })

  const connectionLabel =
    calendarIntegrationStatus === 'connected'
      ? `${calendarIntegrationProvider === 'outlook' ? 'Outlook' : calendarIntegrationProvider === 'apple' ? 'Apple' : 'Google'} conectado`
      : calendarIntegrationStatus === 'pending'
        ? 'Conexão pendente'
        : calendarIntegrationStatus === 'error'
          ? 'Sync com erro'
          : 'Sem sync externo'

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <ProfessionalCalendarSyncModal
        isOpen={showCalendarSyncModal}
        onClose={() => setShowCalendarSyncModal(false)}
        initialProvider={calendarIntegrationProvider}
        initialConnected={calendarIntegrationConnected}
        initialConnectionStatus={calendarIntegrationStatus}
        initialAccountEmail={calendarIntegrationAccountEmail}
        initialLastSyncAt={calendarIntegrationLastSyncAt}
        initialLastSyncError={calendarIntegrationLastSyncError}
        premiumProvidersEnabled={Boolean(
          professionalBookingRulesPanelProps?.initialPlanConfig.features.includes('outlook_sync'),
        )}
      />

      <AgendaHeader activeView={activeView} />

      <AgendaStatsCards
        pendingConfirmationsCount={pendingConfirmations.length}
        activeRequestsCount={activeRequests.length}
        upcomingCount={upcoming.length}
      />

      {activeView === 'overview' && (
        <div className="space-y-6">
          <UpcomingBookingsSection upcoming={upcoming} userTimezone={userTimezone} />
          <OverviewCalendarSection
            calendarTimezone={calendarTimezone}
            connectionLabel={connectionLabel}
            calendarIntegrationLastSyncAt={calendarIntegrationLastSyncAt}
            calendarIntegrationLastSyncError={calendarIntegrationLastSyncError}
            overviewAvailabilityRules={overviewAvailabilityRules}
            overviewAvailabilityExceptions={overviewAvailabilityExceptions}
            overviewCalendarBookings={overviewCalendarBookings}
            onSlotClick={blockTime.openBlockModal}
            onManageSync={() => setShowCalendarSyncModal(true)}
          />
        </div>
      )}

      {activeView === 'inbox' && (
        <div className="space-y-6">
          <InboxHeader inboxFilter={inboxFilter} />
          <InboxList items={filteredInboxItems} userTimezone={userTimezone} />
        </div>
      )}

      {activeView === 'availability_rules' && (
        <div className="space-y-8">
          <ProfessionalAvailabilityWorkspace variant="embedded" />
          {professionalBookingRulesPanelProps && (
            <ProfessionalBookingRulesPanel {...professionalBookingRulesPanelProps} />
          )}
        </div>
      )}

      <BlockTimeModal
        isOpen={blockTime.blockModal?.open ?? false}
        date={blockTime.blockModal?.date ?? null}
        startMinutes={blockTime.blockModal?.startMinutes ?? 0}
        calendarTimezone={calendarTimezone}
        reason={blockTime.blockReason}
        loading={blockTime.blockLoading}
        error={blockTime.blockError}
        onReasonChange={blockTime.setBlockReason}
        onClose={blockTime.closeBlockModal}
        onError={blockTime.setBlockError}
        onLoadingChange={blockTime.setBlockLoading}
      />
    </div>
  )
}
