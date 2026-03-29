'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { PostHogProvider as PostHogReactProvider } from 'posthog-js/react'
import posthog from 'posthog-js'

type Props = {
  children: React.ReactNode
}

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

export default function PostHogProvider({ children }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    if (!posthogKey) return

    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: false,
      person_profiles: 'identified_only',
    })
  }, [])

  useEffect(() => {
    if (!posthogKey || !pathname) return

    posthog.capture('$pageview', {
      $pathname: pathname,
      $current_url:
        typeof window !== 'undefined' ? window.location.href : pathname,
    })
  }, [pathname])

  return <PostHogReactProvider client={posthog}>{children}</PostHogReactProvider>
}
