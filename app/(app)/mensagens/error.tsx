'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { area: 'mensagens', component: 'error-boundary' },
      extra: { digest: error.digest, message: error.message },
    })
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="font-display font-bold text-xl text-slate-900 mb-2">
          Algo deu errado
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Ocorreu um erro inesperado ao carregar as mensagens. Tente novamente.
        </p>
        {isDev && (
          <pre className="text-left text-xs bg-slate-100 rounded-md p-3 mb-4 overflow-auto max-h-40 text-red-600">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}
        <button
          onClick={reset}
          className="bg-[#9FE870] hover:bg-[#8ed85f] text-white font-semibold px-6 py-2.5 rounded-md transition-all text-sm"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
