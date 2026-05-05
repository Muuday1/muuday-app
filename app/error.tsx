'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({
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
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-red-50">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="mb-2 font-display text-xl font-bold text-slate-900">
          Algo deu errado
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-[#9FE870] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
