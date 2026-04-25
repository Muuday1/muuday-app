'use client'

import { useState } from 'react'
import { CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { AppCard } from '@/components/ui/AppCard'
import { createCustomerPortalSession } from '@/lib/actions/professional/subscription'
import type { ProfessionalSubscriptionStatus } from '@/lib/actions/professional/subscription'

interface Props {
  subscription: ProfessionalSubscriptionStatus
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  trialing: {
    label: 'Período de teste',
    icon: <Clock className="w-5 h-5 text-blue-500" />,
    color: 'text-blue-700 bg-blue-50',
  },
  active: {
    label: 'Assinatura ativa',
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    color: 'text-green-700 bg-green-50',
  },
  past_due: {
    label: 'Pagamento atrasado',
    icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    color: 'text-red-700 bg-red-50',
  },
  canceled: {
    label: 'Assinatura cancelada',
    icon: <AlertTriangle className="w-5 h-5 text-slate-500" />,
    color: 'text-slate-700 bg-slate-100',
  },
  incomplete: {
    label: 'Aguardando pagamento',
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    color: 'text-amber-700 bg-amber-50',
  },
  unpaid: {
    label: 'Não paga',
    icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    color: 'text-red-700 bg-red-50',
  },
  paused: {
    label: 'Pausada',
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    color: 'text-amber-700 bg-amber-50',
  },
}

function formatMinorUnits(minor: number, currency: string): string {
  const major = minor / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(major)
}

export function SubscriptionStatusCard({ subscription }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const config = statusConfig[subscription.status] || {
    label: subscription.status,
    icon: <CreditCard className="w-5 h-5 text-slate-500" />,
    color: 'text-slate-700 bg-slate-50',
  }

  const handleManagePayment = async () => {
    setIsLoading(true)
    const result = await createCustomerPortalSession()
    setIsLoading(false)

    if (result.success) {
      window.location.href = result.url
    } else {
      alert(result.error)
    }
  }

  const isPaymentNeeded = ['incomplete', 'past_due', 'unpaid'].includes(subscription.status)
  const isTrial = subscription.status === 'trialing'

  return (
    <AppCard className="mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h2 className="font-semibold text-slate-900">Assinatura Muuday Pro</h2>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">
            {formatMinorUnits(subscription.amountMinor, subscription.currency)}
          </p>
          <p className="text-xs text-slate-500">/ mês</p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600 mb-4">
        {isTrial && subscription.trialEnd && (
          <p>
            Seu período de teste termina em{' '}
            <strong>{new Date(subscription.trialEnd).toLocaleDateString('pt-BR')}</strong>.
            Após essa data, será cobrado mensalmente.
          </p>
        )}
        {subscription.currentPeriodEnd && !isTrial && (
          <p>
            Próximo pagamento:{' '}
            <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</strong>
          </p>
        )}
        {subscription.cancelAtPeriodEnd && (
          <p className="text-amber-600 font-medium">
            Sua assinatura será cancelada no fim do período atual.
          </p>
        )}
        {subscription.failureCount > 0 && (
          <p className="text-red-600">
            {subscription.failureCount} tentativa(s) de pagamento falhou(aram). Atualize seu método de pagamento.
          </p>
        )}
      </div>

      <button
        onClick={handleManagePayment}
        disabled={isLoading}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Carregando...' : isPaymentNeeded ? 'Adicionar método de pagamento' : 'Gerenciar pagamento'}
      </button>
    </AppCard>
  )
}
