'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-brand-500" />
        </div>
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Verifique seu email</h1>
        <p className="text-neutral-500 mb-8 max-w-sm mx-auto">
          Enviamos um link de recuperação para <span className="font-medium text-neutral-700">{email}</span>. Verifique sua caixa de entrada e spam.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-md text-brand-600 hover:text-brand-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm text-neutral-500 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar
      </Link>

      <h1 className="font-display font-bold text-3xl text-neutral-900 mb-2">Recuperar senha</h1>
      <p className="text-neutral-500 mb-8">
        Informe seu email e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 transition-all focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
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
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="text-center text-sm text-neutral-500 mt-6">
        Lembrou a senha?{' '}
        <Link href="/login" className="rounded-md text-brand-600 hover:text-brand-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20">
          Entrar
        </Link>
      </p>
    </div>
  )
}
