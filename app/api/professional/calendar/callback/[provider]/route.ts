import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAppBaseUrl } from '@/lib/config/app-url'
import { parseAndValidateCalendarOAuthState } from '@/lib/calendar/oauth-state'
import { getCalendarProviderAdapter } from '@/lib/calendar/providers'
import { saveOAuthTokens, upsertCalendarIntegration } from '@/lib/calendar/integration-repo'
import { syncExternalBusySlotsForProfessional } from '@/lib/calendar/sync/service'
import type { CalendarProvider } from '@/lib/calendar/types'

const PROVIDERS = new Set<CalendarProvider>(['google', 'outlook', 'apple'])
const NONCE_COOKIE_NAME = 'muuday_calendar_oauth_nonce'

function requestBaseUrl(request: NextRequest) {
  return request.nextUrl.origin || getAppBaseUrl()
}

function parseProvider(value: string): CalendarProvider | null {
  if (!PROVIDERS.has(value as CalendarProvider)) return null
  return value as CalendarProvider
}

/** Whitelist of safe post-OAuth redirect paths. Prevents open redirect if state signing is compromised. */
const ALLOWED_REDIRECT_PATHS = new Set([
  '/dashboard',
  '/agenda',
  '/configuracoes',
  '/disponibilidade',
  '/configuracoes-agendamento',
  '/editar-perfil-profissional',
])

function safeRedirectPath(path: string | null | undefined) {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard'
  // Reject paths with query strings, fragments, or protocol handlers to prevent open redirect
  if (path.includes('?') || path.includes('#') || path.includes(':')) return '/dashboard'
  // Only allow known-safe paths
  if (!ALLOWED_REDIRECT_PATHS.has(path)) return '/dashboard'
  return path
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: rawProvider } = await context.params
  const provider = parseProvider(rawProvider)
  if (!provider || provider === 'apple') {
    return NextResponse.redirect(`${requestBaseUrl(request)}/dashboard?calendarError=provider`)
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const oauthError = request.nextUrl.searchParams.get('error')

  if (oauthError || !code || !state) {
    return NextResponse.redirect(`${requestBaseUrl(request)}/dashboard?calendarError=oauth`)
  }

  const parsedState = parseAndValidateCalendarOAuthState(state)
  if (!parsedState || parsedState.provider !== provider) {
    return NextResponse.redirect(`${requestBaseUrl(request)}/dashboard?calendarError=state`)
  }

  const nonceCookie = request.cookies.get(NONCE_COOKIE_NAME)?.value || ''
  if (!nonceCookie || nonceCookie !== parsedState.nonce) {
    return NextResponse.redirect(`${requestBaseUrl(request)}/dashboard?calendarError=nonce`)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== parsedState.userId) {
    return NextResponse.redirect(`${requestBaseUrl(request)}/dashboard?calendarError=user`)
  }

  const adapter = getCalendarProviderAdapter(provider)
  if (!adapter.exchangeCode) {
    return NextResponse.redirect(`${requestBaseUrl(request)}/dashboard?calendarError=adapter`)
  }

  const redirectUri = `${requestBaseUrl(request)}/api/professional/calendar/callback/${provider}`

  try {
    const exchange = await adapter.exchangeCode({ code, redirectUri })

    await upsertCalendarIntegration(supabase, {
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

    await saveOAuthTokens(supabase, {
      professionalId: parsedState.professionalId,
      token: exchange.token,
      scope: exchange.token.scope || null,
      providerAccountEmail: exchange.accountEmail || user.email || null,
      externalAccountId: exchange.accountId || null,
      status: 'connected',
      provider,
    })

    await supabase
      .from('professional_settings')
      .upsert(
        {
          professional_id: parsedState.professionalId,
          calendar_sync_provider: provider,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'professional_id' },
      )

    await syncExternalBusySlotsForProfessional(supabase, parsedState.professionalId, provider)

    const destination = safeRedirectPath(parsedState.redirectPath)
    const response = NextResponse.redirect(`${requestBaseUrl(request)}${destination}?calendarConnected=${provider}`)
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

    await supabase
      .from('calendar_integrations')
      .update({
        connection_status: 'error',
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('professional_id', parsedState.professionalId)
      .eq('provider', provider)

    const response = NextResponse.redirect(`${requestBaseUrl(request)}/dashboard?calendarError=callback`)
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
