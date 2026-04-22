'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SW] Registered:', registration.scope)
        }
      })
      .catch((err) => {
        console.error('[SW] Registration failed:', err)
      })
  }, [])

  return null
}
