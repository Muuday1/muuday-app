'use client'

import { useState } from 'react'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { Loader2 } from 'lucide-react'

interface PayPalButtonProps {
  bookingId: string
  amount: string
  currency: string
  professionalName: string
}

export function PayPalButton({ bookingId, amount, currency, professionalName }: PayPalButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  if (!clientId) {
    return null
  }

  return (
    <div className="mt-4">
      {/* Divider */}
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-200" />
        <span className="mx-3 text-xs text-slate-400">ou</span>
        <div className="flex-grow border-t border-slate-200" />
      </div>

      <PayPalScriptProvider
        options={{
          clientId,
          currency: currency.toUpperCase(),
          intent: 'capture',
        }}
      >
        {!isReady && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando PayPal...
          </div>
        )}

        <div className={isReady ? 'block' : 'hidden'}>
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'paypal',
              height: 44,
            }}
            onInit={() => setIsReady(true)}
            createOrder={async () => {
              setError(null)
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  bookingId,
                  amount,
                  currency: currency.toUpperCase(),
                  description: `Sessao com ${professionalName}`,
                }),
              })

              if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                setError(body.error || 'Erro ao criar ordem PayPal')
                throw new Error(body.error || 'Erro ao criar ordem PayPal')
              }

              const data = await res.json()
              return data.orderId
            }}
            onApprove={async (data) => {
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: data.orderID,
                  bookingId,
                }),
              })

              if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                setError(body.error || 'Erro ao capturar pagamento PayPal')
                return
              }

              // Redirect to confirmation page
              window.location.href = `${window.location.origin}/agenda/confirmacao/${bookingId}`
            }}
            onError={(err) => {
              console.error('PayPal error:', err)
              setError('Erro no PayPal. Tente novamente ou use outro método de pagamento.')
            }}
          />
        </div>
      </PayPalScriptProvider>

      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
