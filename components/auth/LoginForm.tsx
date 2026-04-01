'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { captureEvent, identifyEventUser } from '@/lib/analytics/posthog-client'
import { resolvePostLoginDestination } from '@/lib/auth/post-login-destination'

function mapLoginErrorMessage(rawMessage: string) {
  const normalized = rawMessage.toLowerCase()
  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  }
  if (normalized.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  return 'Não foi possível entrar agora. Tente novamente em instantes.'
}

type LoginFormProps = {
  redirectTo?: string
  compact?: boolean
  title?: string
  subtitle?: string
  onSuccess?: () => void
  idPrefix?: string
}

export function LoginForm({ compact, title, subtitle, onSuccess, idPrefix }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedIdPrefix = idPrefix || 'login'
  const emailId = `${resolvedIdPrefix}-email`
  const passwordId = `${resolvedIdPrefix}-password`

  const oauthError = searchParams.get('erro')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (oauthError === 'oauth') {
      setError('Não foi possível concluir o login com Google. Tente novamente.')
    }
  }, [oauthError])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      captureEvent('auth_login_failed', { reason: 'invalid_credentials' })
      setError(mapLoginErrorMessage(loginError.message || ''))
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let destination = '/buscar'
    if (user) {
      identifyEventUser(user.id, { email: user.email || email })
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      destination = resolvePostLoginDestination(profile?.role)
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
      {title && <h1 className={titleClass}>{title}</h1>}
      {subtitle && <p className={subtitleClass}>{subtitle}</p>}

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
              href="/recuperar-senha"
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={submitClass}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <div className={compact ? 'mt-4' : 'mt-6'}>
        <div className={dividerClass}>
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-xs text-neutral-400 font-medium">ou entre com</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>
        <SocialAuthButtons roleHint="usuario" compact={compact} />
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
