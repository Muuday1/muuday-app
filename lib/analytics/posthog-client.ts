'use client'

import posthog from 'posthog-js'

type EventProps = Record<string, string | number | boolean | null | undefined>

const hasPosthog = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)

export function captureEvent(event: string, properties?: EventProps) {
  if (!hasPosthog || typeof window === 'undefined') return
  posthog.capture(event, properties)
}

export function identifyEventUser(
  distinctId: string,
  properties?: EventProps,
) {
  if (!hasPosthog || typeof window === 'undefined') return
  posthog.identify(distinctId, properties)
}
