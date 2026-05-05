import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptCalendarJson, decryptCalendarSecret, encryptCalendarSecret } from './token-crypto'
import type {
  CaldavCredentialPayload,
  CalendarAuthType,
  CalendarBusySlotInput,
  CalendarConnectionStatus,
  CalendarIntegrationRow,
  CalendarProvider,
  CalendarTokenPayload,
} from './types'

function nowIso() {
  return new Date().toISOString()
}

const CALENDAR_INTEGRATION_FIELDS =
  'id,professional_id,provider,auth_type,connection_status,provider_account_email,external_account_id,external_calendar_id,access_token_encrypted,refresh_token_encrypted,token_expires_at,token_metadata,scope,sync_cursor,sync_enabled,last_sync_at,last_sync_error,last_sync_started_at,last_sync_completed_at,caldav_principal_url,caldav_calendar_url,connected_at,updated_at'

export async function getCalendarIntegrationByProfessionalId(
  admin: SupabaseClient,
  professionalId: string,
): Promise<CalendarIntegrationRow | null> {
  const { data, error } = await admin
    .from('calendar_integrations')
    .select(CALENDAR_INTEGRATION_FIELDS)
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (error) throw new Error(`Failed to load calendar integration: ${error.message}`)
  return (data as CalendarIntegrationRow | null) || null
}

export async function upsertCalendarIntegration(
  admin: SupabaseClient,
  input: {
    professionalId: string
    provider: CalendarProvider
    authType: CalendarAuthType
    connectionStatus?: CalendarConnectionStatus
    providerAccountEmail?: string | null
    externalAccountId?: string | null
    externalCalendarId?: string | null
    scope?: string | null
    syncEnabled?: boolean
    connectedAt?: string | null
    lastSyncError?: string | null
    syncCursor?: string | null
    caldavPrincipalUrl?: string | null
    caldavCalendarUrl?: string | null
  },
) {
  const patch = {
    professional_id: input.professionalId,
    provider: input.provider,
    auth_type: input.authType,
    connection_status: input.connectionStatus || 'pending',
    provider_account_email: input.providerAccountEmail || null,
    external_account_id: input.externalAccountId || null,
    external_calendar_id: input.externalCalendarId || 'primary',
    scope: input.scope || null,
    sync_enabled: input.syncEnabled ?? true,
    connected_at: input.connectedAt || null,
    last_sync_error: input.lastSyncError || null,
    sync_cursor: input.syncCursor || null,
    caldav_principal_url: input.caldavPrincipalUrl || null,
    caldav_calendar_url: input.caldavCalendarUrl || null,
    updated_at: nowIso(),
  }

  const { error } = await admin
    .from('calendar_integrations')
    .upsert(patch, { onConflict: 'professional_id' })

  if (error) throw new Error(`Failed to upsert calendar integration: ${error.message}`)
}

export async function saveOAuthTokens(
  admin: SupabaseClient,
  input: {
    professionalId: string
    token: CalendarTokenPayload
    scope?: string | null
    providerAccountEmail?: string | null
    externalAccountId?: string | null
    status?: CalendarConnectionStatus
    provider?: CalendarProvider
  },
) {
  const accessTokenEncrypted = encryptCalendarSecret(input.token.accessToken)
  const refreshTokenEncrypted = input.token.refreshToken
    ? encryptCalendarSecret(input.token.refreshToken)
    : null

  const patch = {
    access_token_encrypted: accessTokenEncrypted,
    refresh_token_encrypted: refreshTokenEncrypted,
    token_expires_at: input.token.expiresAt || null,
    token_metadata: {
      token_type: input.token.tokenType || null,
      scope: input.token.scope || null,
      saved_at: nowIso(),
    },
    scope: input.scope || input.token.scope || null,
    provider_account_email: input.providerAccountEmail || null,
    external_account_id: input.externalAccountId || null,
    connection_status: input.status || 'connected',
    token_refreshed_at: nowIso(),
    connected_at: nowIso(),
    last_sync_error: null,
    updated_at: nowIso(),
  }

  const query = admin.from('calendar_integrations').update(patch).eq('professional_id', input.professionalId)
  if (input.provider) {
    query.eq('provider', input.provider)
  }

  const { error } = await query
  if (error) throw new Error(`Failed to persist OAuth tokens: ${error.message}`)
}

export async function saveCaldavCredentials(
  admin: SupabaseClient,
  input: {
    professionalId: string
    providerAccountEmail: string
    credentials: CaldavCredentialPayload
    principalUrl?: string | null
    calendarUrl?: string | null
  },
) {
  const usernameEncrypted = encryptCalendarSecret(input.credentials.username)
  const passwordEncrypted = encryptCalendarSecret(input.credentials.appPassword)

  const { error } = await admin
    .from('calendar_integrations')
    .update({
      access_token_encrypted: usernameEncrypted,
      refresh_token_encrypted: passwordEncrypted,
      token_expires_at: null,
      provider_account_email: input.providerAccountEmail,
      connection_status: 'connected',
      auth_type: 'caldav',
      scope: null,
      token_metadata: {
        server_url: input.credentials.serverUrl || null,
        saved_at: nowIso(),
      },
      caldav_principal_url: input.principalUrl || null,
      caldav_calendar_url: input.calendarUrl || null,
      connected_at: nowIso(),
      last_sync_error: null,
      updated_at: nowIso(),
    })
    .eq('professional_id', input.professionalId)
    .eq('provider', 'apple')

  if (error) throw new Error(`Failed to persist CalDAV credentials: ${error.message}`)
}

export function readOAuthTokensFromIntegration(row: CalendarIntegrationRow): CalendarTokenPayload | null {
  if (!row.access_token_encrypted) return null

  const accessToken = decryptCalendarSecret(row.access_token_encrypted)
  const refreshToken = row.refresh_token_encrypted
    ? decryptCalendarSecret(row.refresh_token_encrypted)
    : null

  const tokenMeta = (row.token_metadata || {}) as Record<string, unknown>

  return {
    accessToken,
    refreshToken,
    expiresAt: row.token_expires_at,
    scope: row.scope || (typeof tokenMeta.scope === 'string' ? tokenMeta.scope : null),
    tokenType: typeof tokenMeta.token_type === 'string' ? tokenMeta.token_type : null,
  }
}

export function readCaldavCredentialsFromIntegration(row: CalendarIntegrationRow): CaldavCredentialPayload | null {
  if (!row.access_token_encrypted || !row.refresh_token_encrypted) return null

  const meta = (row.token_metadata || {}) as Record<string, unknown>

  return {
    username: decryptCalendarSecret(row.access_token_encrypted),
    appPassword: decryptCalendarSecret(row.refresh_token_encrypted),
    serverUrl: typeof meta.server_url === 'string' ? meta.server_url : null,
    calendarUrl: row.caldav_calendar_url,
  }
}

export async function setCalendarIntegrationStatus(
  admin: SupabaseClient,
  input: {
    professionalId: string
    status: CalendarConnectionStatus
    errorMessage?: string | null
    syncCursor?: string | null
    lastSyncAt?: string | null
  },
) {
  const { error } = await admin
    .from('calendar_integrations')
    .update({
      connection_status: input.status,
      last_sync_error: input.errorMessage || null,
      sync_cursor: input.syncCursor ?? undefined,
      last_sync_at: input.lastSyncAt || undefined,
      updated_at: nowIso(),
    })
    .eq('professional_id', input.professionalId)

  if (error) throw new Error(`Failed to set integration status: ${error.message}`)
}

export async function clearCalendarIntegrationSecrets(admin: SupabaseClient, professionalId: string) {
  const { error } = await admin
    .from('calendar_integrations')
    .update({
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      token_metadata: {},
      scope: null,
      sync_cursor: null,
      connection_status: 'disconnected',
      sync_enabled: false,
      last_sync_error: null,
      provider_account_email: null,
      external_account_id: null,
      caldav_principal_url: null,
      caldav_calendar_url: null,
      updated_at: nowIso(),
    })
    .eq('professional_id', professionalId)

  if (error) throw new Error(`Failed to clear integration secrets: ${error.message}`)
}

export async function replaceExternalBusySlots(
  admin: SupabaseClient,
  input: {
    professionalId: string
    provider: CalendarProvider
    slots: CalendarBusySlotInput[]
  },
) {
  const now = nowIso()

  const slotsJson = input.slots.map(slot => ({
    external_event_id: slot.externalEventId,
    external_calendar_id: slot.externalCalendarId,
    title: slot.title || null,
    start_time_utc: slot.startUtc,
    end_time_utc: slot.endUtc,
    source_updated_at: slot.sourceUpdatedAt || null,
    payload: slot.payload || {},
    created_at: now,
    updated_at: now,
  }))

  const { error } = await admin.rpc('replace_external_busy_slots', {
    p_professional_id: input.professionalId,
    p_provider: input.provider,
    p_slots: slotsJson,
  })

  if (error) throw new Error(`Failed to replace external busy slots: ${error.message}`)
}

export async function upsertBookingExternalCalendarEvent(
  admin: SupabaseClient,
  input: {
    bookingId: string
    professionalId: string
    provider: CalendarProvider
    externalEventId: string
    externalCalendarId?: string | null
    eventEtag?: string | null
    eventUrl?: string | null
    payload?: Record<string, unknown>
    syncStatus?: 'pending' | 'synced' | 'error' | 'deleted'
    lastError?: string | null
  },
) {
  const { error } = await admin
    .from('booking_external_calendar_events')
    .upsert(
      {
        booking_id: input.bookingId,
        professional_id: input.professionalId,
        provider: input.provider,
        external_event_id: input.externalEventId,
        external_calendar_id: input.externalCalendarId || null,
        event_etag: input.eventEtag || null,
        event_url: input.eventUrl || null,
        payload: input.payload || {},
        sync_status: input.syncStatus || 'synced',
        last_error: input.lastError || null,
        last_synced_at: nowIso(),
        updated_at: nowIso(),
      },
      { onConflict: 'booking_id,provider' },
    )

  if (error) throw new Error(`Failed to upsert booking external event link: ${error.message}`)
}

export async function getBookingExternalCalendarEvent(
  admin: SupabaseClient,
  bookingId: string,
  provider: CalendarProvider,
) {
  const { data, error } = await admin
    .from('booking_external_calendar_events')
    .select('id,external_event_id,external_calendar_id,provider')
    .eq('booking_id', bookingId)
    .eq('provider', provider)
    .maybeSingle()

  if (error) throw new Error(`Failed to load booking external event link: ${error.message}`)
  return data as
    | {
        id: string
        external_event_id: string
        external_calendar_id: string | null
        provider: CalendarProvider
      }
    | null
}

export async function markBookingExternalEventDeleted(
  admin: SupabaseClient,
  bookingId: string,
  provider: CalendarProvider,
) {
  const { error } = await admin
    .from('booking_external_calendar_events')
    .update({
      sync_status: 'deleted',
      last_error: null,
      last_synced_at: nowIso(),
      updated_at: nowIso(),
    })
    .eq('booking_id', bookingId)
    .eq('provider', provider)

  if (error) throw new Error(`Failed to mark booking external event as deleted: ${error.message}`)
}

export function readTokenMetadata<T extends Record<string, unknown>>(row: CalendarIntegrationRow): T {
  const value = row.token_metadata || {}
  return value as T
}

export function readEncryptedJsonMetadata<T>(sealed: string | null | undefined): T | null {
  return decryptCalendarJson<T>(sealed)
}
