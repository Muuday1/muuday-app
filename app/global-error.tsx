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
    // #region agent log (c00bae)
    fetch('http://127.0.0.1:7729/ingest/a51596be-eb67-4191-9398-29f465a9e679', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c00bae' },
      body: JSON.stringify({
        sessionId: 'c00bae',
        runId: 'pre-fix',
        hypothesisId: 'H5',
        location: 'app/global-error.tsx:18',
        message: 'GlobalError rendered',
        data: {
          digest: error?.digest,
          name: error?.name,
          message: String(error?.message || ''),
          href: typeof window !== 'undefined' ? window.location.href : '',
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
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
