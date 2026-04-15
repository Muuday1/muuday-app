'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'

type BillingCycle = 'monthly' | 'annual'
type TierId = 'basic' | 'professional' | 'premium'

const PLAN_PRICES_BRL: Record<TierId, number> = {
  basic: 49.99,
  professional: 99.99,
  premium: 149.99,
}

const PLAN_FEATURES: Array<{ label: string; basic: string; professional: string; premium: string }> = [
  { label: 'Servicos ativos', basic: '1', professional: '5', premium: '10' },
  { label: 'Especialidades', basic: '1', professional: '3', premium: '3' },
  { label: 'Tags', basic: '3', professional: '5', premium: '10' },
  { label: 'Janela de agendamento', basic: '60 dias', professional: '90 dias', premium: '180 dias' },
  { label: 'Recorrencia + pacotes', basic: 'Sim', professional: 'Sim', premium: 'Sim' },
  { label: 'Multiplas datas no checkout', basic: 'Sim', professional: 'Sim', premium: 'Sim' },
  { label: 'Video intro no perfil', basic: 'Nao', professional: 'Sim', premium: 'Sim' },
  { label: 'WhatsApp no perfil', basic: 'Nao', professional: 'Sim', premium: 'Sim' },
  { label: 'Redes sociais', basic: 'Nao', professional: 'Ate 2', premium: 'Ate 5' },
  { label: 'Manual accept', basic: 'Nao', professional: 'Sim', premium: 'Sim' },
]

function tierLabel(tier: TierId) {
  if (tier === 'basic') return 'Basico'
  if (tier === 'professional') return 'Professional'
  return 'Premium'
}

function getPrice(tier: TierId, cycle: BillingCycle) {
  const monthly = PLAN_PRICES_BRL[tier]
  return cycle === 'annual' ? monthly * 10 : monthly
}

export default function PlanosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [loadingTier, setLoadingTier] = useState<TierId | null>(null)
  const [message, setMessage] = useState<string | null>(
    searchParams.get('checkout') === 'success'
      ? 'Pagamento recebido. Seu plano sera atualizado apos confirmacao do webhook.'
      : searchParams.get('checkout') === 'cancelled'
        ? 'Checkout cancelado.'
        : null,
  )
  const [currentTier, setCurrentTier] = useState<TierId>('basic')
  const [roleChecked, setRoleChecked] = useState(false)

  useEffect(() => {
    let mounted = true
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (mounted) setRoleChecked(true)
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()

      if (profile?.role === 'profissional') {
        const { data: professional } = await supabase
          .from('professionals')
          .select('tier')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        const tier = String(professional?.tier || 'basic').toLowerCase()
        if (tier === 'professional' || tier === 'premium') {
          if (mounted) setCurrentTier(tier)
        } else if (mounted) {
          setCurrentTier('basic')
        }
      }
      if (mounted) setRoleChecked(true)
    })()
    return () => {
      mounted = false
    }
  }, [supabase])

  async function handleSelectPlan(tier: TierId) {
    if (loadingTier) return
    if (tier === currentTier) return

    setLoadingTier(tier)
    setMessage(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        ...(session?.access_token
          ? {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          : {}),
        body: JSON.stringify({ tier, billingCycle }),
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json?.error || 'Nao foi possivel iniciar o checkout.')
      }
      if (json.url) {
        window.location.href = json.url
        return
      }
      setMessage('Checkout iniciado sem URL de redirecionamento.')
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Falha inesperada ao selecionar plano.'
      setMessage(detail)
    } finally {
      setLoadingTier(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Planos Muuday</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Trial de 3 meses apos aprovacao de go-live. Plano anual custa 10x o mensal.
          </p>
        </div>
        <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              'rounded-lg px-3 py-1.5 font-semibold transition',
              billingCycle === 'monthly' ? 'bg-brand-500 text-white' : 'text-neutral-600',
            )}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={cn(
              'rounded-lg px-3 py-1.5 font-semibold transition',
              billingCycle === 'annual' ? 'bg-brand-500 text-white' : 'text-neutral-600',
            )}
          >
            Anual (10x)
          </button>
        </div>
      </div>

      {message ? (
        <div className="mb-5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
          {message}
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(['basic', 'professional', 'premium'] as TierId[]).map(tier => {
          const price = getPrice(tier, billingCycle)
          const isCurrent = roleChecked && tier === currentTier
          return (
            <div key={tier} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{tierLabel(tier)}</p>
              <p className="mt-2 text-3xl font-bold text-neutral-900">{formatCurrency(price, 'BRL')}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {billingCycle === 'annual' ? 'cobranca anual' : 'cobranca mensal'}
              </p>
              <button
                type="button"
                onClick={() => handleSelectPlan(tier)}
                disabled={isCurrent || Boolean(loadingTier)}
                className={cn(
                  'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                  isCurrent
                    ? 'cursor-not-allowed border border-neutral-200 bg-neutral-100 text-neutral-500'
                    : 'bg-brand-500 text-white hover:bg-brand-600',
                )}
              >
                {loadingTier === tier ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isCurrent ? 'Plano atual' : `Escolher ${tierLabel(tier)}`}
              </button>
            </div>
          )
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-neutral-700">Recurso</th>
              <th className="px-4 py-3 text-neutral-700">Basico</th>
              <th className="px-4 py-3 text-neutral-700">Professional</th>
              <th className="px-4 py-3 text-neutral-700">Premium</th>
            </tr>
          </thead>
          <tbody>
            {PLAN_FEATURES.map(feature => (
              <tr key={feature.label} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium text-neutral-800">{feature.label}</td>
                <td className="px-4 py-3 text-neutral-600">{feature.basic}</td>
                <td className="px-4 py-3 text-neutral-600">{feature.professional}</td>
                <td className="px-4 py-3 text-neutral-600">{feature.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
        <p className="mb-2 font-semibold text-neutral-800">FAQ rapido</p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-brand-500" />
            Upgrade e imediato apos confirmacao do webhook.
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-brand-500" />
            Downgrade para Basico entra no proximo ciclo de cobranca.
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-brand-500" />
            Trial de 3 meses comeca apos aprovacao e go-live.
          </li>
        </ul>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="mt-4 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700"
        >
          Voltar para dashboard
        </button>
      </div>
    </div>
  )
}
