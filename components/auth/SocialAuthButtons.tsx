'use client'

import { useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { guardAuthAttempt } from '@/lib/auth/attempt-guard-client'
import { AUTH_MESSAGES } from '@/lib/auth/messages'

type Provider = 'google'
type SocialAuthButtonsProps = {
  redirectPath?: string
  roleHint?: 'usuario' | 'profissional'
  compact?: boolean
}

const PROVIDERS = [
  {
    id: 'google' as Provider,
    label: 'Continuar com Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
]

function sanitizeRedirectPath(value?: string) {
  if (!value) return ''
  if (value === '/') return ''
  if (!value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

function getClientAppBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  const configured = String(process.env.NEXT_PUBLIC_APP_URL || '').trim()
  if (configured.startsWith('http://') || configured.startsWith('https://')) {
    return configured.replace(/\/+$/, '')
  }
  return ''
}

export default function SocialAuthButtons({
  redirectPath,
  roleHint,
  compact = false,
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null)
  const [error, setError] = useState('')

  async function handleSocialLogin(provider: Provider) {
    setLoadingProvider(provider)
    setError('')

    const guard = await guardAuthAttempt('oauth_start')
    if (!guard.allowed) {
      setError(guard.error || AUTH_MESSAGES.login.rateLimited)
      setLoadingProvider(null)
      return
    }

    const callbackUrl = new URL('/auth/callback', getClientAppBaseUrl())
    const safeRedirect = sanitizeRedirectPath(redirectPath)
    if (safeRedirect) callbackUrl.searchParams.set('next', safeRedirect)
    if (roleHint) callbackUrl.searchParams.set('role', roleHint)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    })

    if (authError) {
      Sentry.captureMessage('auth_oauth_start_failed', {
        level: 'warning',
        tags: { area: 'auth', flow: 'oauth' },
        extra: {
          reason: authError.message || 'unknown',
          provider,
        },
      })
      setError(AUTH_MESSAGES.login.oauthFailed)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="space-y-3">
      {PROVIDERS.map(provider => (
        <button
          key={provider.id}
          type="button"
          onClick={() => handleSocialLogin(provider.id)}
          disabled={loadingProvider !== null}
          className={`w-full rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30 disabled:cursor-not-allowed disabled:opacity-60 ${
            compact
              ? 'flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-slate-50/70'
              : 'flex items-center justify-center gap-3 px-4 py-3 hover:bg-slate-50/70'
          }`}
          aria-label={provider.label}
        >
          {loadingProvider === provider.id ? (
            <Loader2 className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} animate-spin text-slate-400`} />
          ) : (
            <span className={compact ? 'scale-90' : undefined}>{provider.icon}</span>
          )}
          {provider.label}
        </button>
      ))}

      {error && (
        <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
      )}
    </div>
  )
}
