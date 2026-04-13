import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getAppBaseUrl } from '@/lib/config/app-url'
import { parseAndValidateCalendarOAuthState } from '@/lib/calendar/oauth-state'
import { getCalendarProviderAdapter } from '@/lib/calendar/providers'
import { saveOAuthTokens, upsertCalendarIntegration } from '@/lib/calendar/integration-repo'
import { syncExternalBusySlotsForProfessional } from '@/lib/calendar/sync/service'
import type { CalendarProvider } from '@/lib/calendar/types'

const PROVIDERS = new Set<CalendarProvider>(['google', 'outlook', 'apple'])
const NONCE_COOKIE_NAME = 'muuday_calendar_oauth_nonce'

function baseRedirect(path: string) {
  const baseUrl = getAppBaseUrl()
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}

function parseProvider(value: string): CalendarProvider | null {
  if (!PROVIDERS.has(value as CalendarProvider)) return null
  return value as CalendarProvider
}

function safeRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard'
  return path
}

export async function GET(
  request: NextRequest,
  context: { params: { provider: string } },
) {
  const provider = parseProvider(context.params.provider)
  if (!provider || provider === 'apple') {
    return NextResponse.redirect(baseRedirect('/dashboard?calendarError=provider'))
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const oauthError = request.nextUrl.searchParams.get('error')

  if (oauthError || !code || !state) {
    return NextResponse.redirect(baseRedirect('/dashboard?calendarError=oauth'))
  }

  const parsedState = parseAndValidateCalendarOAuthState(state)
  if (!parsedState || parsedState.provider !== provider) {
    return NextResponse.redirect(baseRedirect('/dashboard?calendarError=state'))
  }

  const nonceCookie = request.cookies.get(NONCE_COOKIE_NAME)?.value || ''
  if (!nonceCookie || nonceCookie !== parsedState.nonce) {
    return NextResponse.redirect(baseRedirect('/dashboard?calendarError=nonce'))
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== parsedState.userId) {
    return NextResponse.redirect(baseRedirect('/dashboard?calendarError=user'))
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.redirect(baseRedirect('/dashboard?calendarError=admin'))
  }

  const adapter = getCalendarProviderAdapter(provider)
  if (!adapter.exchangeCode) {
    return NextResponse.redirect(baseRedirect('/dashboard?calendarError=adapter'))
  }

  const redirectUri = `${getAppBaseUrl()}/api/professional/calendar/callback/${provider}`

  try {
    const exchange = await adapter.exchangeCode({ code, redirectUri })

    await upsertCalendarIntegration(admin, {
      professionalId: parsedState.professionalId,
      provider,
      authType: 'oauth2',
      connectionStatus: 'connected',
      providerAccountEmail: exchange.accountEmail || user.email || null,
      externalAccountId: exchange.accountId || null,
      externalCalendarId: 'primary',
      scope: exchange.token.scope || null,
      syncEnabled: true,
      connectedAt: new Date().toISOString(),
      lastSyncError: null,
      syncCursor: null,
      caldavPrincipalUrl: null,
      caldavCalendarUrl: null,
    })

    await saveOAuthTokens(admin, {
      professionalId: parsedState.professionalId,
      token: exchange.token,
      scope: exchange.token.scope || null,
      providerAccountEmail: exchange.accountEmail || user.email || null,
      externalAccountId: exchange.accountId || null,
      status: 'connected',
      provider,
    })

    await admin
      .from('professional_settings')
      .upsert(
        {
          professional_id: parsedState.professionalId,
          calendar_sync_provider: provider,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'professional_id' },
      )

    await syncExternalBusySlotsForProfessional(admin, parsedState.professionalId, provider)

    const destination = safeRedirectPath(parsedState.redirectPath)
    const response = NextResponse.redirect(`${getAppBaseUrl()}${destination}?calendarConnected=${provider}`)
    response.cookies.set(NONCE_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/api/professional/calendar/callback/${provider}`,
      maxAge: 0,
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth callback failed.'

    await admin
      .from('calendar_integrations')
      .update({
        connection_status: 'error',
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('professional_id', parsedState.professionalId)
      .eq('provider', provider)

    const response = NextResponse.redirect(baseRedirect('/dashboard?calendarError=callback'))
    response.cookies.set(NONCE_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/api/professional/calendar/callback/${provider}`,
      maxAge: 0,
    })
    return response
  }
}
