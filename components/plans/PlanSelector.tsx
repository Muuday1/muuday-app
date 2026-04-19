'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { getDefaultPlanConfigMap, type PlanConfigMap } from '@/lib/plan-config'

type BillingCycle = 'monthly' | 'annual'
type TierId = 'basic' | 'professional' | 'premium'

const PLAN_PRICES_BRL: Record<TierId, number> = {
  basic: 49.99,
  professional: 99.99,
  premium: 149.99,
}

function tierLabel(tier: TierId) {
  if (tier === 'basic') return 'Basico'
  if (tier === 'professional') return 'Professional'
  return 'Premium'
}

function getPrice(tier: TierId, cycle: BillingCycle) {
  const monthly = PLAN_PRICES_BRL[tier]
  return cycle === 'annual' ? monthly * 10 : monthly
}

function yesNo(value: boolean) {
  return value ? 'Sim' : 'Não'
}

function buildPlanFeatures(plans: PlanConfigMap): Array<{ label: string; basic: string; professional: string; premium: string }> {
  const basic = plans.basic
  const professional = plans.professional
  const premium = plans.premium

  return [
    {
      label: 'Serviços ativos',
      basic: String(basic.limits.services),
      professional: String(professional.limits.services),
      premium: String(premium.limits.services),
    },
    {
      label: 'Especialidades',
      basic: String(basic.limits.specialties),
      professional: String(professional.limits.specialties),
      premium: String(premium.limits.specialties),
    },
    {
      label: 'Tags de foco',
      basic: String(basic.limits.tags),
      professional: String(professional.limits.tags),
      premium: String(premium.limits.tags),
    },
    {
      label: 'Janela de agendamento',
      basic: `${basic.limits.bookingWindowDays} dias`,
      professional: `${professional.limits.bookingWindowDays} dias`,
      premium: `${premium.limits.bookingWindowDays} dias`,
    },
    {
      label: 'Opções por serviço',
      basic: String(basic.limits.serviceOptionsPerService),
      professional: String(professional.limits.serviceOptionsPerService),
      premium: String(premium.limits.serviceOptionsPerService),
    },
    {
      label: 'Antecedência máxima',
      basic: `${basic.minNoticeRange.max}h`,
      professional: `${professional.minNoticeRange.max}h`,
      premium: `${premium.minNoticeRange.max}h`,
    },
    {
      label: 'Buffer configurável',
      basic: yesNo(basic.bufferConfig.configurable),
      professional: yesNo(professional.bufferConfig.configurable),
      premium: yesNo(premium.bufferConfig.configurable),
    },
    {
      label: 'Valor máximo do buffer',
      basic: `${basic.bufferConfig.maxMinutes} min`,
      professional: `${professional.bufferConfig.maxMinutes} min`,
      premium: `${premium.bufferConfig.maxMinutes} min`,
    },
    {
      label: 'Vídeo no perfil',
      basic: yesNo(basic.features.includes('video_intro')),
      professional: yesNo(professional.features.includes('video_intro')),
      premium: yesNo(premium.features.includes('video_intro')),
    },
    {
      label: 'WhatsApp no perfil',
      basic: yesNo(basic.features.includes('whatsapp_profile')),
      professional: yesNo(professional.features.includes('whatsapp_profile')),
      premium: yesNo(premium.features.includes('whatsapp_profile')),
    },
    {
      label: 'Links sociais',
      basic: basic.socialLinksLimit > 0 ? `Até ${basic.socialLinksLimit}` : 'Não',
      professional: professional.socialLinksLimit > 0 ? `Até ${professional.socialLinksLimit}` : 'Não',
      premium: premium.socialLinksLimit > 0 ? `Até ${premium.socialLinksLimit}` : 'Não',
    },
    {
      label: 'Confirmação manual',
      basic: yesNo(basic.features.includes('manual_accept')),
      professional: yesNo(professional.features.includes('manual_accept')),
      premium: yesNo(premium.features.includes('manual_accept')),
    },
    {
      label: 'Auto-aceite',
      basic: yesNo(basic.features.includes('auto_accept')),
      professional: yesNo(professional.features.includes('auto_accept')),
      premium: yesNo(premium.features.includes('auto_accept')),
    },
    {
      label: 'Exportação PDF',
      basic: yesNo(basic.features.includes('pdf_export')),
      professional: yesNo(professional.features.includes('pdf_export')),
      premium: yesNo(premium.features.includes('pdf_export')),
    },
  ]
}

interface PlanSelectorProps {
  currentTier: TierId
  planConfigs: PlanConfigMap
  message: string | null
  sessionToken: string | null
}

export default function PlanSelector({ currentTier, planConfigs, message: initialMessage, sessionToken }: PlanSelectorProps) {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [loadingTier, setLoadingTier] = useState<TierId | null>(null)
  const [message, setMessage] = useState<string | null>(initialMessage)

  const planFeatures = buildPlanFeatures(planConfigs)

  async function handleSelectPlan(tier: TierId) {
    if (loadingTier) return
    if (tier === currentTier) return

    setLoadingTier(tier)
    setMessage(null)
    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        credentials: 'include',
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
          const isCurrent = tier === currentTier
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
            {planFeatures.map(feature => (
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
