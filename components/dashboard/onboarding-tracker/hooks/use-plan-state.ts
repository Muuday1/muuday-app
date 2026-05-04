'use client'

import { useState, useCallback } from 'react'
import type { SaveState, BillingCycle, PlanTier } from '../types'

export function usePlanState(
  activeTier: PlanTier,
  supabase: { auth: { getSession: () => Promise<{ data: { session: { access_token?: string } | null } }> } },
) {
  const [planPricing, setPlanPricing] = useState<{
    currency: string
    monthlyAmount: number
    annualAmount: number
    provider: string
    fallback?: boolean
    mode?: string
  } | null>(null)
  const [pricingError, setPricingError] = useState('')
  const [selectedPlanTier, setSelectedPlanTier] = useState<PlanTier>(activeTier)
  const [selectedPlanCycle, setSelectedPlanCycle] = useState<BillingCycle>('monthly')
  const [planActionState, setPlanActionState] = useState<SaveState>('idle')
  const [planActionError, setPlanActionError] = useState('')

  const savePlanSelection = useCallback(async () => {
    setPlanActionState('saving')
    setPlanActionError('')

    try {
      if (selectedPlanTier === String(activeTier || '').toLowerCase()) {
        setPlanActionState('saved')
        setTimeout(() => setPlanActionState('idle'), 1800)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          tier: selectedPlanTier,
          billingCycle: selectedPlanCycle,
          source: 'onboarding_modal',
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as { error?: string; url?: string }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || 'Não foi possível iniciar a seleção do plano agora.')
      }

      window.location.href = payload.url
    } catch (error) {
      setPlanActionState('error')
      setPlanActionError(
        error instanceof Error ? error.message : 'Não foi possível iniciar a seleção do plano agora.',
      )
    }
  }, [activeTier, selectedPlanTier, selectedPlanCycle, supabase])

  return {
    planPricing,
    setPlanPricing,
    pricingError,
    setPricingError,
    selectedPlanTier,
    setSelectedPlanTier,
    selectedPlanCycle,
    setSelectedPlanCycle,
    planActionState,
    setPlanActionState,
    planActionError,
    setPlanActionError,
    savePlanSelection,
  }
}
