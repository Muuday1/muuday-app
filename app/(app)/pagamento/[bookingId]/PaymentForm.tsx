'use client'

import { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function PaymentForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/agenda/confirmacao/${bookingId}`,
      },
    })

    setIsLoading(false)

    if (error) {
      setErrorMessage(error.message || 'Erro ao processar pagamento. Tente novamente.')
    }
    // If successful, Stripe redirects to return_url automatically
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="rounded-lg border border-slate-200 p-4">
        <PaymentElement
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
          }}
        />
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#9FE870] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          'Confirmar pagamento'
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Pagamento processado com segurança por Stripe
      </p>
    </form>
  )
}

