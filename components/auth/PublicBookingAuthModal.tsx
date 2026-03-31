'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Calendar, MessageCircle, X } from 'lucide-react'

type PublicBookingAuthModalProps = {
  isLoggedIn: boolean
  bookHref: string
  requestHref: string
  requestEnabled: boolean
}

type PendingAction = 'book' | 'request'

function buildAuthLink(path: string, mode: 'signup' | 'login') {
  const redirectParam = encodeURIComponent(path)
  if (mode === 'signup') return `/cadastro?role=usuario&redirect=${redirectParam}`
  return `/login?redirect=${redirectParam}`
}

export function PublicBookingAuthModal({
  isLoggedIn,
  bookHref,
  requestHref,
  requestEnabled,
}: PublicBookingAuthModalProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const nextTarget = useMemo(() => {
    if (pendingAction === 'request') return requestHref
    return bookHref
  }, [bookHref, pendingAction, requestHref])

  if (isLoggedIn) {
    return (
      <div className="space-y-2">
        <Link
          href={bookHref}
          className="block w-full rounded-xl bg-brand-500 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-brand-600"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" /> Agendar sessão
          </span>
        </Link>

        {requestEnabled ? (
          <Link
            href={requestHref}
            className="block w-full rounded-xl border border-brand-200 bg-brand-50 py-3 text-center text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" /> Solicitar horário
            </span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 py-3 text-sm font-semibold text-neutral-400"
          >
            <MessageCircle className="h-4 w-4" /> Solicitação de horário indisponível no plano atual
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setPendingAction('book')}
          className="block w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-600"
          aria-label="Entrar para agendar sessão"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" /> Agendar sessão
          </span>
        </button>

        {requestEnabled ? (
          <button
            type="button"
            onClick={() => setPendingAction('request')}
            className="block w-full rounded-xl border border-brand-200 bg-brand-50 py-3 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100"
            aria-label="Entrar para solicitar horário"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" /> Solicitar horário
            </span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 py-3 text-sm font-semibold text-neutral-400"
          >
            <MessageCircle className="h-4 w-4" /> Solicitação de horário indisponível no plano atual
          </button>
        )}
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-4" role="dialog" aria-modal="true" aria-label="Autenticação para agendamento">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-neutral-900">Continue para agendar</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Crie uma conta de usuário para continuar com agendamento e pagamentos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                href={buildAuthLink(nextTarget, 'signup')}
                className="block w-full rounded-xl bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Criar conta (recomendado)
              </Link>
              <Link
                href={buildAuthLink(nextTarget, 'login')}
                className="block w-full rounded-xl border border-neutral-200 px-4 py-3 text-center text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Já tenho conta - entrar
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
