'use client'

import { Loader2 } from 'lucide-react'

export function BookingSuccessRedirect() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
        <Loader2 className="h-10 w-10 animate-spin text-green-500" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-slate-900 font-display">
        Redirecionando para o pagamento...
      </h2>
      <p className="text-slate-500">
        Aguarde enquanto preparamos a página de pagamento segura.
      </p>
    </div>
  )
}
