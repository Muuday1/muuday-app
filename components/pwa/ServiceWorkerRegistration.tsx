'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

async function syncPushSubscription(registration: ServiceWorkerRegistration) {
  try {
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    // Subscription exists but may not be saved on this device/session;
    // re-post to backend so it stays in sync.
    const json = subscription.toJSON()
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    })

    if (!res.ok) {
      console.warn('[SW] Failed to sync push subscription:', res.status)
    }
  } catch (err) {
    console.warn('[SW] Push subscription sync error:', err)
  }
}

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

        // Sync existing push subscription with backend on every mount
        void syncPushSubscription(registration)

        // Detect when a new service worker is installed and waiting.
        // The SW calls skipWaiting() on install, so it activates immediately,
        // but the current page is still controlled by the old SW.
        // We reload to ensure the new SW takes control.
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              // New SW is active. If it's not the same as the current controller,
              // reload to let the new SW take control of this page.
              const currentController = navigator.serviceWorker.controller
              if (currentController && currentController.scriptURL !== newWorker.scriptURL) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('[SW] New service worker activated, reloading page')
                }
                window.location.reload()
              }
            }
          })
        })
      })
      .catch((err) => {
        Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
          tags: { area: 'service_worker_registration', context: 'register' },
        })
      })
  }, [])

  return null
}
