'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="bg-[#f6f4ef]">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <h2 className="mb-2 font-display text-2xl font-bold text-neutral-900">
            Ocorreu um erro inesperado
          </h2>
          <p className="mb-6 text-sm text-neutral-500">
            Nossa equipe foi notificada automaticamente. Tente novamente.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-600"
            type="button"
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  )
}
