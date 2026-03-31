'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'
import { captureEvent, identifyEventUser } from '@/lib/analytics/posthog-client'

function sanitizeRedirectPath(value: string | null) {
  if (!value) return ''
  if (value === '/') return ''
  if (!value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

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

function getRedirectHint(path: string) {
  if (!path) return ''
  if (path.startsWith('/agendar/')) return 'Você vai voltar para concluir o agendamento.'
  if (path.startsWith('/solicitar/')) return 'Você vai voltar para concluir a solicitação de horário.'
  if (path.startsWith('/profissional/')) return 'Você vai voltar para o perfil do profissional.'
  if (path.startsWith('/buscar')) return 'Você vai voltar para a busca.'
  return 'Você vai voltar para a página anterior.'
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = sanitizeRedirectPath(searchParams.get('redirect'))
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

    let destination = redirectTo || '/buscar'
    if (user) {
      identifyEventUser(user.id, { email: user.email || email })
      if (!redirectTo) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        destination = profile?.role === 'profissional' ? '/dashboard' : '/buscar'
      }
    }

    captureEvent('auth_login_succeeded')
    router.push(destination)
    router.refresh()
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Bem-vindo de volta</h1>
      <p className="text-neutral-500 mb-8">Entre na sua conta Muuday</p>

      {redirectTo && (
        <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700" role="status">
          {getRedirectHint(redirectTo)}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-neutral-700 mb-1.5">E-mail</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 transition-all focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
            aria-invalid={Boolean(error)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-sm font-medium text-neutral-700">Senha</label>
            <Link href="/recuperar-senha" className="rounded-md text-sm font-medium text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20">
              Esqueceu a senha?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 transition-all focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
            aria-invalid={Boolean(error)}
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
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : 'Entrar'}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-xs text-neutral-400 font-medium">ou entre com</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>
        <SocialAuthButtons redirectPath={redirectTo} roleHint="usuario" />
      </div>

      <p className="text-center text-sm text-neutral-500 mt-6">
        Não tem uma conta?{' '}
        <Link href="/cadastro" className="rounded-md text-brand-600 hover:text-brand-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <LoginPageContent />
    </Suspense>
  )
}
