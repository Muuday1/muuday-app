import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getBookingExternalCalendarEvent,
  getCalendarIntegrationByProfessionalId,
  markBookingExternalEventDeleted,
  readCaldavCredentialsFromIntegration,
  readOAuthTokensFromIntegration,
  replaceExternalBusySlots,
  saveCaldavCredentials,
  saveOAuthTokens,
  setCalendarIntegrationStatus,
  upsertBookingExternalCalendarEvent,
  upsertCalendarIntegration,
} from '../integration-repo'
import { getCalendarProviderAdapter } from '../providers'
import type {
  CalendarIntegrationRow,
  CalendarProvider,
  CalendarTokenPayload,
} from '../types'

function shouldOccupyCalendar(status: string | null | undefined) {
  return status === 'confirmed' || status === 'pending_confirmation'
}

function getSyncWindow() {
  const now = new Date()
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const end = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
  }
}

async function refreshTokenIfNeeded(
  admin: SupabaseClient,
  integration: CalendarIntegrationRow,
): Promise<CalendarTokenPayload | null> {
  if (integration.auth_type !== 'oauth2') return null

  let token = readOAuthTokensFromIntegration(integration)
  if (!token) return null

  const adapter = getCalendarProviderAdapter(integration.provider)
  if (!adapter.refreshIfNeeded) return token

  const refreshed = await adapter.refreshIfNeeded(integration, token)
  token = refreshed.token

  await saveOAuthTokens(admin, {
    professionalId: integration.professional_id,
    token,
    scope: token.scope || integration.scope,
    providerAccountEmail: integration.provider_account_email,
    externalAccountId: integration.external_account_id,
    status: integration.connection_status,
    provider: integration.provider,
  })

  return token
}

export async function syncExternalBusySlotsForIntegration(
  admin: SupabaseClient,
  integration: CalendarIntegrationRow,
) {
  const adapter = getCalendarProviderAdapter(integration.provider)
  const window = getSyncWindow()

  const token = integration.auth_type === 'oauth2' ? await refreshTokenIfNeeded(admin, integration) : null
  const caldavCredentials = integration.auth_type === 'caldav' ? readCaldavCredentialsFromIntegration(integration) : null

  await setCalendarIntegrationStatus(admin, {
    professionalId: integration.professional_id,
    status: integration.connection_status === 'disconnected' ? 'pending' : integration.connection_status,
    errorMessage: null,
  })

  try {
    const result = await adapter.pullBusyChanges({
      integration,
      token,
      caldavCredentials,
      windowStartUtc: window.startUtc,
      windowEndUtc: window.endUtc,
    })

    await replaceExternalBusySlots(admin, {
      professionalId: integration.professional_id,
      provider: integration.provider,
      slots: result.slots.map(slot => ({
        professionalId: integration.professional_id,
        provider: integration.provider,
        externalEventId: slot.externalEventId,
        externalCalendarId: slot.externalCalendarId,
        title: slot.title,
        startUtc: slot.startUtc,
        endUtc: slot.endUtc,
        sourceUpdatedAt: slot.sourceUpdatedAt,
        payload: slot.payload,
      })),
    })

    await upsertCalendarIntegration(admin, {
      professionalId: integration.professional_id,
      provider: integration.provider,
      authType: integration.auth_type,
      connectionStatus: 'connected',
      providerAccountEmail: result.accountEmail || integration.provider_account_email,
      externalAccountId: result.accountId || integration.external_account_id,
      externalCalendarId: integration.external_calendar_id || 'primary',
      scope: integration.scope,
      syncEnabled: integration.sync_enabled,
      connectedAt: integration.connected_at || new Date().toISOString(),
      syncCursor: result.nextCursor,
      lastSyncError: null,
      caldavPrincipalUrl: integration.caldav_principal_url,
      caldavCalendarUrl: integration.caldav_calendar_url,
    })

    await admin
      .from('calendar_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_started_at: new Date().toISOString(),
        last_sync_completed_at: new Date().toISOString(),
        last_sync_error: null,
        connection_status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('professional_id', integration.professional_id)
      .eq('provider', integration.provider)

    return {
      ok: true as const,
      slots: result.slots.length,
      provider: integration.provider,
      professionalId: integration.professional_id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await admin
      .from('calendar_integrations')
      .update({
        last_sync_error: message.slice(0, 1000),
        connection_status: 'error',
        last_sync_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('professional_id', integration.professional_id)
      .eq('provider', integration.provider)

    return {
      ok: false as const,
      provider: integration.provider,
      professionalId: integration.professional_id,
      error: message,
    }
  }
}

export async function syncExternalBusySlotsForProfessional(
  admin: SupabaseClient,
  professionalId: string,
  provider?: CalendarProvider,
) {
  const integration = await getCalendarIntegrationByProfessionalId(admin, professionalId)
  if (!integration) return { ok: true as const, skipped: 'no_integration' as const }
  if (provider && integration.provider !== provider) return { ok: true as const, skipped: 'provider_mismatch' as const }
  if (!integration.sync_enabled) return { ok: true as const, skipped: 'sync_disabled' as const }
  if (integration.connection_status === 'disconnected') return { ok: true as const, skipped: 'disconnected' as const }

  return syncExternalBusySlotsForIntegration(admin, integration)
}

export async function upsertBookingInExternalCalendar(admin: SupabaseClient, bookingId: string) {
  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, professional_id, user_id, status, start_time_utc, end_time_utc, scheduled_at, session_purpose, notes')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError) throw new Error(`Failed to load booking for external calendar sync: ${bookingError.message}`)
  if (!booking?.id || !booking.professional_id) return { ok: true as const, skipped: 'booking_not_found' as const }
  if (!shouldOccupyCalendar(String(booking.status || ''))) {
    return cancelBookingInExternalCalendar(admin, bookingId)
  }

  const integration = await getCalendarIntegrationByProfessionalId(admin, String(booking.professional_id))
  if (!integration || !integration.sync_enabled || integration.connection_status === 'disconnected') {
    return { ok: true as const, skipped: 'integration_unavailable' as const }
  }

  const adapter = getCalendarProviderAdapter(integration.provider)

  const token = integration.auth_type === 'oauth2' ? await refreshTokenIfNeeded(admin, integration) : null
  const caldavCredentials = integration.auth_type === 'caldav' ? readCaldavCredentialsFromIntegration(integration) : null

  const existingEvent = await getBookingExternalCalendarEvent(admin, bookingId, integration.provider)

  const { data: profile } = await admin
    .from('profiles')
    .select('email')
    .eq('id', String(booking.user_id || ''))
    .maybeSingle()

  const eventResult = await adapter.upsertBookingEvent({
    integration,
    token,
    caldavCredentials,
    payload: {
      bookingId,
      title: 'Sessao Muuday',
      description: [booking.session_purpose, booking.notes].filter(Boolean).join('\n\n') || null,
      startUtc: String(booking.start_time_utc || booking.scheduled_at),
      endUtc: String(booking.end_time_utc || ''),
      timezone: 'UTC',
      attendeeEmail: String(profile?.email || ''),
      existingExternalEventId: existingEvent?.external_event_id || undefined,
      externalCalendarId: integration.external_calendar_id,
    },
  })

  await upsertBookingExternalCalendarEvent(admin, {
    bookingId,
    professionalId: String(booking.professional_id),
    provider: integration.provider,
    externalEventId: eventResult.externalEventId,
    externalCalendarId: eventResult.externalCalendarId,
    eventEtag: eventResult.eventEtag,
    eventUrl: eventResult.eventUrl,
    payload: eventResult.raw,
    syncStatus: 'synced',
  })

  return {
    ok: true as const,
    provider: integration.provider,
    bookingId,
    externalEventId: eventResult.externalEventId,
  }
}

export async function cancelBookingInExternalCalendar(admin: SupabaseClient, bookingId: string) {
  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('id, professional_id')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError) throw new Error(`Failed to load booking for external cancellation: ${bookingError.message}`)
  if (!booking?.id || !booking.professional_id) return { ok: true as const, skipped: 'booking_not_found' as const }

  const integration = await getCalendarIntegrationByProfessionalId(admin, String(booking.professional_id))
  if (!integration || !integration.sync_enabled || integration.connection_status === 'disconnected') {
    return { ok: true as const, skipped: 'integration_unavailable' as const }
  }

  const link = await getBookingExternalCalendarEvent(admin, bookingId, integration.provider)
  if (!link?.external_event_id) {
    return { ok: true as const, skipped: 'no_external_event' as const }
  }

  const adapter = getCalendarProviderAdapter(integration.provider)
  const token = integration.auth_type === 'oauth2' ? await refreshTokenIfNeeded(admin, integration) : null
  const caldavCredentials = integration.auth_type === 'caldav' ? readCaldavCredentialsFromIntegration(integration) : null

  await adapter.cancelBookingEvent({
    integration,
    token,
    caldavCredentials,
    externalEventId: link.external_event_id,
    payload: {
      bookingId,
      title: 'Sessao Muuday',
      startUtc: '',
      endUtc: '',
      timezone: 'UTC',
      externalCalendarId: link.external_calendar_id,
    },
  })

  await markBookingExternalEventDeleted(admin, bookingId, integration.provider)

  return {
    ok: true as const,
    provider: integration.provider,
    bookingId,
  }
}

export async function verifyAndPersistAppleCaldavConnection(
  admin: SupabaseClient,
  input: {
    professionalId: string
    providerAccountEmail: string
    credentials: { username: string; appPassword: string; serverUrl?: string | null }
  },
) {
  const adapter = getCalendarProviderAdapter('apple')
  if (!adapter.verifyCredentials) {
    throw new Error('Apple CalDAV adapter does not support credential verification.')
  }

  const probe = await adapter.verifyCredentials({
    username: input.credentials.username,
    appPassword: input.credentials.appPassword,
    serverUrl: input.credentials.serverUrl || null,
  })

  await upsertCalendarIntegration(admin, {
    professionalId: input.professionalId,
    provider: 'apple',
    authType: 'caldav',
    connectionStatus: 'connected',
    providerAccountEmail: input.providerAccountEmail,
    externalAccountId: probe.accountId || input.credentials.username,
    externalCalendarId: probe.calendarUrl || 'primary',
    scope: null,
    syncEnabled: true,
    connectedAt: new Date().toISOString(),
    lastSyncError: null,
    syncCursor: null,
    caldavPrincipalUrl: probe.principalUrl || null,
    caldavCalendarUrl: probe.calendarUrl || null,
  })

  await saveCaldavCredentials(admin, {
    professionalId: input.professionalId,
    providerAccountEmail: input.providerAccountEmail,
    credentials: {
      username: input.credentials.username,
      appPassword: input.credentials.appPassword,
      serverUrl: input.credentials.serverUrl || null,
      calendarUrl: probe.calendarUrl || null,
    },
    principalUrl: probe.principalUrl || null,
    calendarUrl: probe.calendarUrl || null,
  })

  return probe
}
