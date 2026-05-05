'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Link from 'next/link'

export default function SearchError({
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
          Não foi possível carregar a busca
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Ocorreu um erro ao carregar os resultados. Tente novamente ou volte para a página inicial.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-[#9FE870] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f]"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="rounded-md border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-[#9FE870]/40 hover:text-[#3d6b1f]"
          >
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
