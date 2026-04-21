'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

export default function PasswordResetForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const normalizedEmail = email.trim().toLowerCase()

    const response = await fetch('/api/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    })

    const payload = (await response.json().catch(() => null)) as { error?: string } | null

    if (!response.ok) {
      setError(payload?.error || 'Não foi possível enviar o e-mail de recuperação.')
      setLoading(false)
      return
    }

    setEmail(normalizedEmail)
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-[#9FE870]/8">
          <CheckCircle className="h-8 w-8 text-[#9FE870]" />
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold text-slate-900">Verifique seu e-mail</h1>
        <p className="mx-auto mb-8 max-w-sm text-slate-500">
          Se houver uma conta Muuday para <span className="font-medium text-slate-700">{email}</span>, você receberá o link de recuperação em instantes. Verifique caixa de entrada e spam.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-md font-medium text-[#3d6b1f] hover:text-[#3d6b1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 rounded-md text-sm text-slate-500 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar
      </Link>

      <h1 className="mb-2 font-display text-3xl font-bold text-slate-900">Recuperar senha</h1>
      <p className="mb-8 text-slate-500">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus-visible:border-[#9FE870] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9FE870] py-3 font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
            </>
          ) : (
            'Enviar link de recuperação'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Lembrou a senha?{' '}
        <Link
          href="/login"
          className="rounded-md font-medium text-[#3d6b1f] hover:text-[#3d6b1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}
