'use client'

import { useState } from 'react'
import { Wallet, AlertTriangle, CheckCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react'
import { AppCard } from '@/components/ui/AppCard'
import { formatMinorUnits, formatKycStatus } from '@/lib/payments/format-utils'
import { initiatePayoutSetup, refreshPayoutStatus, getTrolleyPortalUrl } from '@/lib/actions/professional-payout'

interface PayoutStatusCardProps {
  payoutStatus: {
    hasRecipient: boolean
    kycStatus?: string
    isActive?: boolean
    payoutMethod?: string
    paypalEmail?: string
  }
  balance: {
    available: number
    withheld: number
    pending: number
    debt: number
    lastPayoutAt: string | null
  } | null
  periodicity?: 'weekly' | 'biweekly' | 'monthly'
}

function calculateNextPayoutDate(
  lastPayoutAt: string | null,
  periodicity: 'weekly' | 'biweekly' | 'monthly',
): Date {
  const now = new Date()
  // Payouts happen at 8h UTC on Mondays (weekly/biweekly) or 1st of month (monthly)
  if (periodicity === 'monthly') {
    // Next 1st of month
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0)
    return next
  }

  // Find next Monday at 8h UTC
  const nextMonday = new Date(now)
  nextMonday.setUTCHours(8, 0, 0, 0)
  const day = nextMonday.getUTCDay() // 0=Sun, 1=Mon
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day
  nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday)

  if (periodicity === 'biweekly') {
    // If last payout was recent, skip to the Monday after next
    if (lastPayoutAt) {
      const last = new Date(lastPayoutAt)
      const daysSinceLastPayout = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastPayout < 10) {
        nextMonday.setUTCDate(nextMonday.getUTCDate() + 7)
      }
    }
  }

  return nextMonday
}

export function PayoutStatusCard({ payoutStatus, balance, periodicity = 'weekly' }: PayoutStatusCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const kyc = formatKycStatus(payoutStatus.kycStatus)

  async function handleSetup() {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await initiatePayoutSetup()
      if (result.error) {
        setError(result.error)
      } else if (result.alreadyExists) {
        setSuccess('Configuração de pagamento já existe. Aguardando validação KYC. Você precisará vincular sua conta PayPal no portal.')
        if (result.portalUrl) {
          window.open(result.portalUrl, '_blank')
        }
      } else {
        setSuccess('Configuração iniciada! Complete seus dados e vincule sua conta PayPal no portal de pagamentos.')
        if (result.portalUrl) {
          window.open(result.portalUrl, '_blank')
        }
      }
    } catch {
      setError('Erro ao iniciar configuração. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCompleteKyc() {
    setIsPortalLoading(true)
    setError(null)
    try {
      const result = await getTrolleyPortalUrl()
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        window.open(result.url, '_blank')
      }
    } catch {
      setError('Erro ao abrir portal de KYC. Tente novamente.')
    } finally {
      setIsPortalLoading(false)
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    setError(null)
    try {
      const result = await refreshPayoutStatus()
      if (result.error) {
        setError(result.error)
      } else {
        window.location.reload()
      }
    } catch {
      setError('Erro ao sincronizar status.')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <AppCard>
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-[#9FE870]" />
        <h2 className="font-semibold text-slate-900">Saldo e Recebimentos</h2>
      </div>

      {/* Balance grid */}
      {balance ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-md bg-green-50 border border-green-100 p-3">
            <p className="text-[11px] font-medium text-green-700 uppercase tracking-wide">Disponível</p>
            <p className="text-lg font-semibold text-green-900 mt-1">{formatMinorUnits(balance.available)}</p>
          </div>
          <div className="rounded-md bg-slate-50 border border-slate-100 p-3">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Retido</p>
            <p className="text-lg font-semibold text-slate-900 mt-1">{formatMinorUnits(balance.withheld)}</p>
          </div>
          <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
            <p className="text-[11px] font-medium text-blue-700 uppercase tracking-wide">Pendente</p>
            <p className="text-lg font-semibold text-blue-900 mt-1">{formatMinorUnits(balance.pending)}</p>
          </div>
          <div className="rounded-md bg-red-50 border border-red-100 p-3">
            <p className="text-[11px] font-medium text-red-700 uppercase tracking-wide">Dívida</p>
            <p className="text-lg font-semibold text-red-900 mt-1">{formatMinorUnits(balance.debt)}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-slate-50 border border-slate-100 p-4 mb-5 text-center">
          <p className="text-sm text-slate-500">Nenhum saldo registrado ainda.</p>
          <p className="text-xs text-slate-400 mt-1">Os saldos aparecem após o primeiro pagamento confirmado.</p>
        </div>
      )}

      {/* Next payout */}
      {balance && balance.available > 0 && (
        <div className="mb-5 rounded-md border border-green-100 bg-green-50/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-green-700">Próximo repasse estimado</p>
              <p className="text-sm font-semibold text-green-900">
                {formatMinorUnits(balance.available)} em{' '}
                {calculateNextPayoutDate(balance.lastPayoutAt, periodicity).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-semibold text-green-800 uppercase tracking-wide">
              {periodicity === 'weekly' ? 'Semanal' : periodicity === 'biweekly' ? 'Quinzenal' : 'Mensal'}
            </span>
          </div>
        </div>
      )}

      {/* Onboarding status -->
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${kyc.color}`}>
            {payoutStatus.isActive ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {kyc.label}
          </span>
          {payoutStatus.payoutMethod && (
            <span className="text-xs text-slate-500">
              via {payoutStatus.payoutMethod === 'paypal' ? 'PayPal' : 'Transferência'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!payoutStatus.isActive && (
            <>
              {!payoutStatus.hasRecipient ? (
                <button
                  onClick={handleSetup}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 rounded-md bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#8ed85f] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Configurando...' : 'Configurar Pagamento'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={handleCompleteKyc}
                  disabled={isPortalLoading}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPortalLoading ? 'Abrindo...' : 'Completar KYC'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 disabled:opacity-50"
            title="Atualizar status"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-100 p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-100 p-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* PayPal account info */}
      {payoutStatus.paypalEmail && (
        <div className="rounded-md bg-blue-50 border border-blue-100 p-3 flex items-start gap-2 mt-3">
          <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Conta PayPal vinculada</p>
            <p className="text-blue-600">{payoutStatus.paypalEmail}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-slate-500 space-y-1">
        <p>Repasses são processados via <strong>PayPal</strong> toda segunda-feira às 8h UTC.</p>
        <p>Você precisa de uma conta PayPal para receber os pagamentos. Outros métodos serão habilitados em breve.</p>
        <p>Período de segurança: 48h após o término da sessão.</p>
        {balance?.lastPayoutAt && (
          <p>Último repasse: {new Date(balance.lastPayoutAt).toLocaleDateString('pt-BR')}</p>
        )}
      </div>
    </AppCard>
  )
}
