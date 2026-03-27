'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import SocialAuthButtons from '@/components/auth/SocialAuthButtons'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Bem-vindo de volta</h1>
      <p className="text-neutral-500 mb-8">Entre na sua conta Muuday</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-neutral-700">Senha</label>
            <Link href="/recuperar-senha" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Esqueceu a senha?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
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
        <SocialAuthButtons />
      </div>

      <p className="text-center text-sm text-neutral-500 mt-6">
        Não tem uma conta?{' '}
        <Link href="/cadastro" className="text-brand-600 hover:text-brand-700 font-medium">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}
