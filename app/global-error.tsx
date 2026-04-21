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
          <h2 className="mb-2 font-display text-2xl font-bold text-slate-900">
            Ocorreu um erro inesperado
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Nossa equipe foi notificada automaticamente. Tente novamente.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-[#9FE870] px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-[#8ed85f]"
            type="button"
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  )
}
