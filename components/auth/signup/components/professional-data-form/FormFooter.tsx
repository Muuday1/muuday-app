'use client'

import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface FormFooterProps {
  loading: boolean
  error: string
  showForgotPasswordLink: boolean
  email: string
  errorList: string[]
  onBack: () => void
}

export function FormFooter({
  loading,
  error,
  showForgotPasswordLink,
  email,
  errorList,
  onBack,
}: FormFooterProps) {
  return (
    <>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
          <p className="font-semibold">{error}</p>
          {showForgotPasswordLink ? (
            <p className="mt-1 text-xs">
              Esqueceu a senha?{' '}
              <Link
                href={`/recuperar-senha?email=${encodeURIComponent(email.trim())}`}
                className="font-semibold underline"
              >
                Clique aqui.
              </Link>
            </p>
          ) : null}
          {errorList.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-xs">
              {errorList.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 flex-1 rounded-md border border-slate-200 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#9FE870] py-3 font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Criando...
            </>
          ) : (
            'Enviar para análise'
          )}
        </button>
      </div>
    </>
  )
}
