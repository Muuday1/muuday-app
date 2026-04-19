import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { resolveAuthenticatedProfessionalContext } from '@/lib/calendar/auth-context'
import { getAppBaseUrl } from '@/lib/config/app-url'
import { createCalendarOAuthState } from '@/lib/calendar/oauth-state'
import { getCalendarProviderAdapter } from '@/lib/calendar/providers'
import { syncExternalBusySlotsForProfessional, verifyAndPersistAppleCaldavConnection } from '@/lib/calendar/sync/service'
import { upsertCalendarIntegration } from '@/lib/calendar/integration-repo'
import type { CalendarProvider } from '@/lib/calendar/types'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { validateCsrfOrigin } from '@/lib/http/csrf'

const PROVIDERS = new Set<CalendarProvider>(['google', 'outlook', 'apple'])
const NONCE_COOKIE_NAME = 'muuday_calendar_oauth_nonce'

const appleConnectSchema = z.object({
  username: z.string().email('Apple ID invalido.'),
  appPassword: z.string().min(8, 'App-specific password invalido.'),
  accountEmail: z.string().email('Email de conta invalido.').optional(),
  serverUrl: z.string().url('URL CalDAV invalida.').optional(),
})

function parseProvider(value: string): CalendarProvider | null {
  if (!PROVIDERS.has(value as CalendarProvider)) return null
  return value as CalendarProvider
}

function callbackUrl(request: NextRequest, provider: CalendarProvider) {
  const baseUrl = request.nextUrl.origin || getAppBaseUrl()
  return `${baseUrl}/api/professional/calendar/callback/${provider}`
}

export async function GET(
  request: NextRequest,
  context: { params: { provider: string } },
) {
  const ip = getClientIp(request)
  const rl = await rateLimit('calendarConnect', `calendar-connect:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
  }

  const csrfCheck = validateCsrfOrigin(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const provider = parseProvider(context.params.provider)
  if (!provider) {
    return NextResponse.json({ error: 'Provider invalido.' }, { status: 400 })
  }

  if (provider === 'apple') {
    return NextResponse.json(
      { error: 'Apple usa fluxo CalDAV via POST com credenciais.' },
      { status: 405 },
    )
  }

  const authContext = await resolveAuthenticatedProfessionalContext()
  if (!authContext.ok) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status })
  }

  const adapter = getCalendarProviderAdapter(provider)
  if (!adapter.getAuthUrl) {
    return NextResponse.json({ error: 'Provider nao suporta OAuth URL.' }, { status: 400 })
  }

  const redirectPath = request.nextUrl.searchParams.get('next') || '/dashboard'

  const { state, nonce } = createCalendarOAuthState({
    provider,
    professionalId: authContext.professionalId,
    userId: authContext.user.id,
    redirectPath,
  })

  const supabase = createClient()
  await upsertCalendarIntegration(supabase, {
    professionalId: authContext.professionalId,
    provider,
    authType: 'oauth2',
    connectionStatus: 'pending',
    providerAccountEmail: authContext.email,
    externalCalendarId: 'primary',
    syncEnabled: true,
    connectedAt: null,
    lastSyncError: null,
    syncCursor: null,
  })

  const authUrl = adapter.getAuthUrl({
    redirectUri: callbackUrl(request, provider),
    state,
    loginHint: authContext.email || null,
  })

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(NONCE_COOKIE_NAME, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/api/professional/calendar/callback/${provider}`,
    maxAge: 10 * 60,
  })
  return response
}

export async function POST(
  request: NextRequest,
  context: { params: { provider: string } },
) {
  const ip = getClientIp(request)
  const rl = await rateLimit('calendarConnect', `calendar-connect:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente mais tarde.' }, { status: 429 })
  }

  const csrfCheck = validateCsrfOrigin(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const provider = parseProvider(context.params.provider)
  if (!provider) {
    return NextResponse.json({ error: 'Provider invalido.' }, { status: 400 })
  }

  if (provider !== 'apple') {
    return NextResponse.json(
      { error: 'POST connect e exclusivo para Apple CalDAV.' },
      { status: 405 },
    )
  }

  const authContext = await resolveAuthenticatedProfessionalContext()
  if (!authContext.ok) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalido.' }, { status: 400 })
  }

  const parsed = appleConnectSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados invalidos.' }, { status: 400 })
  }

  const payload = parsed.data

  const supabase = createClient()
  await upsertCalendarIntegration(supabase, {
    professionalId: authContext.professionalId,
    provider: 'apple',
    authType: 'caldav',
    connectionStatus: 'pending',
    providerAccountEmail: payload.accountEmail || payload.username,
    externalCalendarId: payload.serverUrl || 'primary',
    syncEnabled: true,
    connectedAt: null,
    lastSyncError: null,
    syncCursor: null,
  })

  try {
    const probe = await verifyAndPersistAppleCaldavConnection(supabase, {
      professionalId: authContext.professionalId,
      providerAccountEmail: payload.accountEmail || payload.username,
      credentials: {
        username: payload.username,
        appPassword: payload.appPassword,
        serverUrl: payload.serverUrl || null,
      },
    })

    await supabase
      .from('professional_settings')
      .upsert(
        {
          professional_id: authContext.professionalId,
          calendar_sync_provider: 'apple',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'professional_id' },
      )

    await syncExternalBusySlotsForProfessional(supabase, authContext.professionalId, 'apple')

    return NextResponse.json({
      success: true,
      provider: 'apple',
      accountEmail: probe.accountEmail || payload.accountEmail || payload.username,
      principalUrl: probe.principalUrl || null,
      calendarUrl: probe.calendarUrl || null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao conectar Apple CalDAV.'

    await supabase
      .from('calendar_integrations')
      .update({
        connection_status: 'error',
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('professional_id', authContext.professionalId)
      .eq('provider', 'apple')

    return NextResponse.json({ error: 'Falha ao conectar Apple CalDAV.' }, { status: 400 })
  }
}
