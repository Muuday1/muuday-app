'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { captureEvent, identifyEventUser } from '@/lib/analytics/posthog-client'
import { resolvePostLoginDestination } from '@/lib/auth/post-login-destination'
import { guardAuthAttempt } from '@/lib/auth/attempt-guard-client'
import {
  AUTH_MESSAGES,
  type AuthLoginHint,
  isInvalidCredentialsError,
  mapLoginErrorMessage,
} from '@/lib/auth/messages'

type LoginFormProps = {
  compact?: boolean
  title?: string
  subtitle?: string
  onSuccess?: () => void
  idPrefix?: string
}

function normalizeRole(value: unknown) {
  const normalized = String(value || '').toLowerCase().trim()
  if (normalized === 'admin' || normalized === 'profissional' || normalized === 'usuario') {
    return normalized
  }
  return null
}

async function resolveLoginHint(email: string): Promise<AuthLoginHint> {
  try {
    const response = await fetch('/api/auth/login-hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    })
    if (!response.ok) return 'unknown'

    const payload = (await response.json().catch(() => null)) as { hint?: AuthLoginHint } | null
    if (payload?.hint === 'social_only') return 'social_only'
    if (payload?.hint === 'existing_account') return 'existing_account'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export function LoginForm({ compact, title, subtitle, onSuccess, idPrefix }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const safeRedirectPath =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//') && redirectParam !== '/'
      ? redirectParam
      : ''
  const resolvedIdPrefix = idPrefix || 'login'
  const emailId = `${resolvedIdPrefix}-email`
  const passwordId = `${resolvedIdPrefix}-password`

  const oauthError = searchParams.get('erro')
  const initialEmail = searchParams.get('email')?.trim() || ''
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRecoveryHint, setShowRecoveryHint] = useState(false)

  useEffect(() => {
    if (oauthError === 'oauth') {
      Sentry.captureMessage('auth_oauth_callback_failed', {
        level: 'warning',
        tags: { area: 'auth', flow: 'oauth' },
      })
      setError(AUTH_MESSAGES.login.oauthCallbackFailed)
      setShowRecoveryHint(false)
    }
  }, [oauthError])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShowRecoveryHint(false)

    const guard = await guardAuthAttempt('login', email)
    if (!guard.allowed) {
      captureEvent('auth_login_rate_limited')
      setError(guard.error || AUTH_MESSAGES.login.rateLimited)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: signInData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      captureEvent('auth_login_failed', { reason: 'invalid_credentials' })
      Sentry.captureMessage('auth_login_failed', {
        level: 'warning',
        tags: { area: 'auth', flow: 'password' },
        extra: { reason: loginError.message || 'unknown' },
      })

      const rawError = loginError.message || ''
      const invalidCredentials = isInvalidCredentialsError(rawError)
      const hint = invalidCredentials ? await resolveLoginHint(email) : 'unknown'
      setError(mapLoginErrorMessage(rawError, hint))
      setShowRecoveryHint(invalidCredentials)
      setLoading(false)
      return
    }

    let userId: string | null = signInData.user?.id ?? null
    let userEmail = String(signInData.user?.email || email || '')

    if (!userId) {
      const { data } = await supabase.auth.getUser()
      userId = data.user?.id ?? null
      const refreshedEmail = data.user?.email
      if (typeof refreshedEmail === 'string' && refreshedEmail.length > 0) {
        userEmail = refreshedEmail
      }
    }

    let destination = '/buscar-auth'
    if (userId) {
      identifyEventUser(userId, { email: userEmail || email })
      const metadataRole =
        normalizeRole(signInData.user?.app_metadata?.role) || normalizeRole(signInData.user?.user_metadata?.role)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
      destination = resolvePostLoginDestination(normalizeRole(profile?.role) || metadataRole)
    }
    if (safeRedirectPath) {
      destination = safeRedirectPath
    }

    captureEvent('auth_login_succeeded')
    onSuccess?.()
    router.push(destination)
    router.refresh()
  }

  const titleClass = compact
    ? 'font-display font-bold text-2xl leading-tight text-neutral-900 mb-1'
    : 'font-display font-bold text-3xl text-neutral-900 mb-2'
  const subtitleClass = compact ? 'text-sm text-neutral-500 mb-4' : 'text-neutral-500 mb-8'
  const formSpacingClass = compact ? 'space-y-3' : 'space-y-4'
  const inputClass = compact
    ? 'w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 transition-all focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20'
    : 'w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 transition-all focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20'
  const submitClass = compact
    ? 'w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-sm text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30'
    : 'w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30'
  const dividerClass = compact ? 'relative flex items-center gap-2 my-4' : 'relative flex items-center gap-3 my-6'

  return (
    <div>
      {title ? <h1 className={titleClass}>{title}</h1> : null}
      {subtitle ? <p className={subtitleClass}>{subtitle}</p> : null}

      <form onSubmit={handleLogin} className={formSpacingClass} noValidate>
        <div>
          <label htmlFor={emailId} className="mb-1 block text-sm font-medium text-neutral-700">
            E-mail
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className={inputClass}
            aria-invalid={Boolean(error)}
            autoComplete="email"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor={passwordId} className="block text-sm font-medium text-neutral-700">
              Senha
            </label>
            <Link
              href={email.trim() ? `/recuperar-senha?email=${encodeURIComponent(email.trim())}` : '/recuperar-senha'}
              className="rounded-md text-sm font-medium text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className={inputClass}
            aria-invalid={Boolean(error)}
            autoComplete="current-password"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            <p>{error}</p>
            {showRecoveryHint ? (
              <p className="mt-1 text-xs">
                Esqueceu a senha?{' '}
                <Link
                  href={email.trim() ? `/recuperar-senha?email=${encodeURIComponent(email.trim())}` : '/recuperar-senha'}
                  className="font-semibold underline"
                >
                  Clique aqui.
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        <button type="submit" disabled={loading} className={submitClass}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <div className={compact ? 'mt-4' : 'mt-6'}>
        <div className={dividerClass}>
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs font-medium text-neutral-400">ou entre com</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>
        <SocialAuthButtons redirectPath={safeRedirectPath || undefined} compact={compact} />
      </div>

      <p className={compact ? 'mt-4 text-center text-xs text-neutral-500' : 'mt-6 text-center text-sm text-neutral-500'}>
        Ainda não é membro?{' '}
        <Link
          href="/cadastro"
          className="rounded-md font-medium text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
        >
          Criar conta
        </Link>
      </p>
    </div>
  )
}
