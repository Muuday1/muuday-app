'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw } from 'lucide-react'

export function AutoRenewToggle({
  groupId,
  initialAutoRenew,
  hasPaymentMethod,
  status,
}: {
  groupId: string
  initialAutoRenew: boolean
  hasPaymentMethod: boolean
  status: string
}) {
  const [autoRenew, setAutoRenew] = useState(initialAutoRenew)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    if (isLoading) return

    const nextValue = !autoRenew

    if (nextValue && !hasPaymentMethod) {
      alert('Nenhum método de pagamento salvo. Realize um novo pagamento para reativar.')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/recurring/settings?groupId=${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRenew: nextValue }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.error || 'Erro ao atualizar. Tente novamente.')
        return
      }

      setAutoRenew(nextValue)
      router.refresh()
    } catch {
      alert('Erro de rede. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = status === 'payment_failed' && !autoRenew && !hasPaymentMethod

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
      <div>
        <p className="text-sm font-medium text-slate-900">Renovação automática</p>
        <p className="text-xs text-slate-500">
          {autoRenew
            ? 'Seu cartão será cobrado automaticamente antes do próximo ciclo.'
            : 'Você precisará realizar o pagamento manualmente.'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={isLoading || isDisabled}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          autoRenew ? 'bg-[#9FE870]' : 'bg-slate-300'
        } ${isLoading || isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        role="switch"
        aria-checked={autoRenew}
      >
        {isLoading ? (
          <Loader2 className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 animate-spin text-slate-600" />
        ) : (
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              autoRenew ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        )}
      </button>
    </div>
  )
}
