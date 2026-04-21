'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
          Ocorreu um erro inesperado ao carregar a avaliação. Tente novamente.
        </p>
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
