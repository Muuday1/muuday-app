'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // #region agent log (c00bae)
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7729/ingest/a51596be-eb67-4191-9398-29f465a9e679', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c00bae' },
      body: JSON.stringify({
        sessionId: 'c00bae',
        runId: 'pre-fix',
        hypothesisId: 'H5',
        location: 'app/(app)/error.tsx:12',
        message: 'Route error boundary rendered',
        data: { digest: error?.digest, name: error?.name, message: String(error?.message || ''), href: window.location.href },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }
  // #endregion

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="font-display font-bold text-xl text-neutral-900 mb-2">
          Algo deu errado
        </h2>
        <p className="text-neutral-500 text-sm mb-6">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <button
          onClick={reset}
          className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
