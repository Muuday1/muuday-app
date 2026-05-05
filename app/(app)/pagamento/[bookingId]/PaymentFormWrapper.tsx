'use client'

import { useEffect, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { PaymentForm } from './PaymentForm'
import { Loader2 } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

export function PaymentFormWrapper({ bookingId }: { bookingId: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPaymentIntent() {
      try {
        const res = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body.error || `Erro ${res.status}`)
          return
        }

        const body = await res.json()
        if (body.clientSecret) {
          setClientSecret(body.clientSecret)
        } else {
          setError('Resposta inválida do servidor')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao iniciar pagamento')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentIntent()
  }, [bookingId])

  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Iniciando pagamento...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Não foi possível iniciar o pagamento.
      </div>
    )
  }

  return (
    <div className="mt-6">
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#4a7c1f',
              colorBackground: '#ffffff',
              colorText: '#1e293b',
              colorDanger: '#ef4444',
              borderRadius: '8px',
            },
          },
        }}
      >
        <PaymentForm bookingId={bookingId} />
      </Elements>
    </div>
  )
}
