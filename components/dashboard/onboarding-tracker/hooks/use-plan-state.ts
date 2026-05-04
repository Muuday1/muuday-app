'use client'

import { useState } from 'react'
import type { SaveState, BillingCycle, PlanTier } from '../types'

export function usePlanState(initialTier: PlanTier) {
  const [planPricing, setPlanPricing] = useState<{
    currency: string
    monthlyAmount: number
    annualAmount: number
    provider: string
    fallback?: boolean
    mode?: string
  } | null>(null)
  const [pricingError, setPricingError] = useState('')
  const [selectedPlanTier, setSelectedPlanTier] = useState<PlanTier>(initialTier)
  const [selectedPlanCycle, setSelectedPlanCycle] = useState<BillingCycle>('monthly')
  const [planActionState, setPlanActionState] = useState<SaveState>('idle')
  const [planActionError, setPlanActionError] = useState('')

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
  }
}
