'use client'

import { useEffect } from 'react'
import type { PlanTier, SaveState } from '../types'

interface UsePlanCheckoutParamsOptions {
  open: boolean
  professionalId: string
  supabase: unknown
  refreshTrackerEvaluation: () => Promise<{ ok: boolean; termsLoaded: boolean }>
  setPlanActionState: React.Dispatch<React.SetStateAction<SaveState>>
  setManualCompletedStageIds: React.Dispatch<React.SetStateAction<string[]>>
  setPlanActionError: React.Dispatch<React.SetStateAction<string>>
  setActiveTier: React.Dispatch<React.SetStateAction<PlanTier>>
  setSelectedPlanTier: React.Dispatch<React.SetStateAction<PlanTier>>
}

export function usePlanCheckoutParams(options: UsePlanCheckoutParamsOptions) {
  const {
    open,
    professionalId,
    supabase,
    refreshTrackerEvaluation,
    setPlanActionState,
    setManualCompletedStageIds,
    setPlanActionError,
    setActiveTier,
    setSelectedPlanTier,
  } = options

  useEffect(() => {
    if (!open || typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const checkoutState = params.get('planCheckout')
    if (!checkoutState) return

    if (checkoutState === 'success') {
      setPlanActionState('saved')
      setManualCompletedStageIds(previous =>
        previous.includes('c6_plan_billing_setup_post') ? previous : [...previous, 'c6_plan_billing_setup_post'],
      )
      void refreshTrackerEvaluation()
      void (async () => {
        const sb = supabase as { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: { tier?: string | null } | null }> } } } }
        const { data: freshProfessional } = await sb
          .from('professionals')
          .select('tier')
          .eq('id', professionalId)
          .maybeSingle()
        const freshTier = String(freshProfessional?.tier || '').toLowerCase()
        const normalizedFreshTier: PlanTier =
          freshTier === 'professional' || freshTier === 'premium' ? freshTier : 'basic'
        setActiveTier(normalizedFreshTier)
        setSelectedPlanTier(normalizedFreshTier)
      })()
      setTimeout(() => setPlanActionState('idle'), 2200)
    } else if (checkoutState === 'cancelled') {
      setPlanActionState('error')
      setPlanActionError('Seleção de plano cancelada. Você pode tentar novamente.')
    }

    params.delete('planCheckout')
    const nextQuery = params.toString()
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`
    window.history.replaceState({}, '', nextUrl)
  }, [open, professionalId, refreshTrackerEvaluation, supabase, setPlanActionState, setManualCompletedStageIds, setPlanActionError, setActiveTier, setSelectedPlanTier])
}
