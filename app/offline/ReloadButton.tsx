'use client'

export function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
    >
      Tentar novamente
    </button>
  )
}
