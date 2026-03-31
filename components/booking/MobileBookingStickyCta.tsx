'use client'

import Link from 'next/link'
import { Calendar, X } from 'lucide-react'
import { useState } from 'react'

type MobileBookingStickyCtaProps = {
  isLoggedIn: boolean
  bookHref: string
  priceText: string
  durationText: string
}

function sanitizeRedirectPath(value: string) {
  if (!value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

function buildAuthLink(path: string, mode: 'signup' | 'login') {
  const safePath = sanitizeRedirectPath(path)
  const redirectParam = encodeURIComponent(safePath || '/buscar')
  if (mode === 'signup') return `/cadastro?role=usuario&redirect=${redirectParam}`
  return `/login?redirect=${redirectParam}`
}

export function MobileBookingStickyCta({ isLoggedIn, bookHref, priceText, durationText }: MobileBookingStickyCtaProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="lg:hidden fixed bottom-20 left-0 right-0 z-20 bg-white/95 backdrop-blur-lg border-t border-neutral-100 px-4 py-3 flex items-center justify-between gap-3 safe-area-bottom">
        <div>
          <p className="text-lg font-bold text-neutral-900">{priceText}</p>
          <p className="text-xs text-neutral-500">{durationText}</p>
        </div>

        {isLoggedIn ? (
          <Link
            href={bookHref}
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Agendar
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all flex items-center gap-2"
            aria-label="Entrar para agendar"
          >
            <Calendar className="w-4 h-4" />
            Agendar
          </button>
        )}
      </div>

      {!isLoggedIn && open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-xl font-bold text-neutral-900">Continue para agendar</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Crie uma conta de usuário para continuar com o agendamento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Link
                href={buildAuthLink(bookHref, 'signup')}
                className="block w-full rounded-xl bg-brand-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Criar conta (recomendado)
              </Link>
              <Link
                href={buildAuthLink(bookHref, 'login')}
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
