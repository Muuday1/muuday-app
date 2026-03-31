'use client'

import posthog from 'posthog-js'
import { COOKIE_CONSENT_NAME, safeParseConsent } from '@/components/cookies/consent'

type EventProps = Record<string, string | number | boolean | null | undefined>

const hasPosthog = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)

function hasAnalyticsConsent(): boolean {
  const consentCookie = document.cookie
    .split(';')
    .map(p => p.trim())
    .find(p => p.startsWith(`${COOKIE_CONSENT_NAME}=`))
    ?.slice(COOKIE_CONSENT_NAME.length + 1)

  const consent = safeParseConsent(consentCookie)
  return Boolean(consent?.analytics)
}

export function captureEvent(event: string, properties?: EventProps) {
  if (!hasPosthog || typeof window === 'undefined') return
  if (!hasAnalyticsConsent()) return
  posthog.capture(event, properties)
}

export function identifyEventUser(
  distinctId: string,
  properties?: EventProps,
) {
  if (!hasPosthog || typeof window === 'undefined') return
  if (!hasAnalyticsConsent()) return
  posthog.identify(distinctId, properties)
}
