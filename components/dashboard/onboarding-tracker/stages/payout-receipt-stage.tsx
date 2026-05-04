'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Blocker } from '../types'

interface PayoutReceiptStageProps {
  isFinanceBypassEnabled: boolean
  payoutReceiptBlockers: Array<{ code: string }>
  activeStageBlockers: Blocker[]
  onCloseModal: () => void
  onContinue: () => void
}

export function PayoutReceiptStage({
  isFinanceBypassEnabled,
  payoutReceiptBlockers,
  activeStageBlockers,
  onCloseModal,
  onContinue,
}: PayoutReceiptStageProps) {
  const hasBlocker = (code: string) => payoutReceiptBlockers.some(item => item.code === code)

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900">Financeiro</h3>
          {isFinanceBypassEnabled ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
              Modo de teste ativo
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-slate-700">
          {isFinanceBypassEnabled
            ? 'Esta etapa ficará para a ativação final. Para perfis de teste, você pode concluir o onboarding sem configurar recebimentos agora.'
            : 'Aqui você acompanha o cartão da assinatura e a prontidão de recebimentos. O checkout do plano e os detalhes financeiros continuam nas telas completas.'}
        </p>
        {!isFinanceBypassEnabled && (
          <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-semibold text-blue-900">
              Você precisa de uma conta PayPal para receber pagamentos
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Nosso parceiro de repasses (Trolley) exige uma conta PayPal válida.
              Transferência bancária será habilitada em breve.
            </p>
          </div>
        )}
        {isFinanceBypassEnabled ? (
          <p className="mt-2 text-xs text-amber-700">
            Financeiro será concluído depois. Seu acesso atual está em modo de teste.
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className={`rounded-md border p-3 ${hasBlocker('missing_billing_card') ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
          <p className="text-sm font-semibold text-slate-900">Cartão da assinatura</p>
          <p className="mt-1 text-xs text-slate-700">
            {hasBlocker('missing_billing_card')
              ? 'Ainda falta adicionar o cartão usado para cobrar o plano.'
              : 'Cartão configurado para a cobrança do plano.'}
          </p>
        </div>
        <div className={`rounded-md border p-3 ${hasBlocker('missing_payout_onboarding') ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
          <p className="text-sm font-semibold text-slate-900">Recebimentos (PayPal)</p>
          <p className="mt-1 text-xs text-slate-700">
            {hasBlocker('missing_payout_onboarding')
              ? 'Conecte sua conta PayPal no portal Trolley para receber pela plataforma.'
              : 'Conta PayPal conectada via Trolley.'}
          </p>
        </div>
        <div className={`rounded-md border p-3 ${hasBlocker('missing_payout_kyc') ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
          <p className="text-sm font-semibold text-slate-900">Validação KYC</p>
          <p className="mt-1 text-xs text-slate-700">
            {hasBlocker('missing_payout_kyc')
              ? 'Complete a validação de identidade no portal Trolley para liberar recebimentos.'
              : 'Validação KYC aprovada.'}
          </p>
        </div>
      </div>

      {activeStageBlockers.length > 0 && !isFinanceBypassEnabled ? (
        <ul className="space-y-2">
          {activeStageBlockers.map(blocker => (
            <li key={blocker.code} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <p className="font-semibold">{blocker.title}</p>
              <p className="mt-1 text-xs">{blocker.description}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/planos"
          onClick={onCloseModal}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
        >
          Abrir cobrança do plano
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/financeiro"
          onClick={onCloseModal}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900"
        >
          Abrir área financeira
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8ed85f]"
        >
          Continuar para envio
        </button>
      </div>
    </div>
  )
}
