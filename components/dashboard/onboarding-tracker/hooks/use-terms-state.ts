'use client'

import { useState, useMemo, useCallback } from 'react'
import { PROFESSIONAL_TERMS, type ProfessionalTermKey } from '@/lib/legal/professional-terms'
import { TERMS_KEYS } from '../constants'

export function useTermsState(initialTermsAcceptanceByKey?: Record<string, boolean>) {
  const bootstrapTermsAcceptance = useMemo(
    () =>
      TERMS_KEYS.reduce((acc, key) => {
        acc[key] = Boolean(initialTermsAcceptanceByKey?.[key])
        return acc
      }, {} as Record<ProfessionalTermKey, boolean>),
    [initialTermsAcceptanceByKey],
  )

  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<Record<ProfessionalTermKey, boolean>>(() =>
    TERMS_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: Boolean(initialTermsAcceptanceByKey?.[key]) }),
      {} as Record<ProfessionalTermKey, boolean>,
    ),
  )

  const [termsHydrated, setTermsHydrated] = useState(
    TERMS_KEYS.every(key => typeof initialTermsAcceptanceByKey?.[key] === 'boolean'),
  )

  const [activeTermsModalKey, setActiveTermsModalKey] = useState<ProfessionalTermKey | null>(null)
  const [termViewTokensByKey, setTermViewTokensByKey] = useState<
    Partial<Record<ProfessionalTermKey, string>>
  >({})
  const [termsModalScrolledToEnd, setTermsModalScrolledToEnd] = useState(false)
  const [submitTermsError, setSubmitTermsError] = useState('')

  const activeTerm = useMemo(
    () => PROFESSIONAL_TERMS.find(item => item.key === activeTermsModalKey) || null,
    [activeTermsModalKey],
  )

  const openTerm = useCallback(async (termKey: ProfessionalTermKey) => {
    setSubmitTermsError('')
    try {
      const response = await fetch('/api/professional/onboarding/open-term', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termKey }),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        token?: string
        error?: string
      }
      if (!response.ok || !payload.ok || !payload.token) {
        setSubmitTermsError(payload.error || 'Não foi possível abrir este termo agora.')
        return
      }

      setTermViewTokensByKey(previous => ({ ...previous, [termKey]: payload.token }))
      setActiveTermsModalKey(termKey)
      setTermsModalScrolledToEnd(false)
    } catch (error) {
      setSubmitTermsError(error instanceof Error ? error.message : 'Não foi possível abrir este termo agora.')
    }
  }, [])

  const acceptActiveTerm = useCallback(async () => {
    if (!activeTerm || !termsModalScrolledToEnd) return
    const termViewToken = termViewTokensByKey[activeTerm.key]
    if (!termViewToken) {
      setSubmitTermsError('Abra novamente o termo antes de aceitar.')
      return
    }
    setSubmitTermsError('')
    try {
      const response = await fetch('/api/professional/onboarding/accept-term', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termKey: activeTerm.key, termViewToken }),
      })
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !payload.ok) {
        setSubmitTermsError(payload.error || 'Não foi possível registrar o aceite deste termo.')
        return
      }
      setHasAcceptedTerms(previous => ({ ...previous, [activeTerm.key]: true }))
      setTermViewTokensByKey(previous => ({ ...previous, [activeTerm.key]: '' }))
      setActiveTermsModalKey(null)
      setTermsModalScrolledToEnd(false)
    } catch (error) {
      setSubmitTermsError(
        error instanceof Error ? error.message : 'Não foi possível registrar o aceite deste termo.',
      )
    }
  }, [activeTerm, termsModalScrolledToEnd, termViewTokensByKey])

  const allRequiredTermsAccepted = useCallback(() => {
    return termsHydrated && TERMS_KEYS.every(key => hasAcceptedTerms[key])
  }, [termsHydrated, hasAcceptedTerms])

  return {
    hasAcceptedTerms,
    setHasAcceptedTerms,
    termsHydrated,
    setTermsHydrated,
    activeTermsModalKey,
    setActiveTermsModalKey,
    termViewTokensByKey,
    setTermViewTokensByKey,
    termsModalScrolledToEnd,
    setTermsModalScrolledToEnd,
    submitTermsError,
    setSubmitTermsError,
    activeTerm,
    openTerm,
    acceptActiveTerm,
    allRequiredTermsAccepted,
  }
}
