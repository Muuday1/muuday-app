'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AuthOverlay } from '@/components/auth/AuthOverlay'
import { LoginForm } from '@/components/auth/LoginForm'

type SearchBookingCtasProps = {
  isLoggedIn: boolean
  bookHref: string
  requestHref: string
  requestEnabled: boolean
}

type PendingAction = 'book' | 'request'

export function SearchBookingCtas({
  isLoggedIn,
  bookHref,
  requestHref,
  requestEnabled,
}: SearchBookingCtasProps) {
  const [open, setOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>('book')

  const redirectTo = useMemo(() => {
    return pendingAction === 'request' ? requestHref : bookHref
  }, [pendingAction, requestHref, bookHref])

  if (isLoggedIn) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={bookHref}
          className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          Agendar
        </Link>
        {requestEnabled ? (
          <Link
            href={requestHref}
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
          >
            Solicitar horário
          </Link>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPendingAction('book')
            setOpen(true)
          }}
          className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          Agendar
        </button>
        <button
          type="button"
          onClick={() => {
            setPendingAction('request')
            setOpen(true)
          }}
          disabled={!requestEnabled}
          className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
          aria-disabled={!requestEnabled}
        >
          Solicitar horário
        </button>
      </div>

      <AuthOverlay
        open={open}
        onClose={() => setOpen(false)}
        variant="modal"
        ariaLabel="Login"
      >
        <LoginForm
          title="Entre para continuar"
          subtitle="Faça login para concluir esta ação."
          redirectTo={redirectTo}
          idPrefix={`search-modal-${pendingAction}`}
          onSuccess={() => setOpen(false)}
        />
        <p className="mt-4 text-center text-xs text-neutral-500">
          Você vai voltar para {pendingAction === 'request' ? 'solicitar horário' : 'agendar'} depois do login.
        </p>
      </AuthOverlay>
    </>
  )
}

