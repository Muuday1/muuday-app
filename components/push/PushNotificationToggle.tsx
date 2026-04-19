'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (supported) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription)
        })
      })
    }
  }, [])

  async function handleSubscribe() {
    if (!isSupported) return
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
        }),
      })

      setIsSubscribed(true)
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUnsubscribe() {
    if (!isSupported) return
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
    } catch (err) {
      console.error('Failed to unsubscribe from push notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
        <BellOff className="h-5 w-5 text-neutral-400" />
        <div>
          <p className="text-sm font-medium text-neutral-700">Notificações push não suportadas</p>
          <p className="text-xs text-neutral-500">Seu navegador não suporta notificações push.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900">Notificações push</p>
          <p className="text-xs text-neutral-500">
            {isSubscribed ? 'Você recebe notificações push.' : 'Ative para receber notificações no dispositivo.'}
          </p>
        </div>
      </div>
      <button
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={isLoading}
        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
          isSubscribed
            ? 'border border-neutral-200 bg-white text-neutral-700 hover:border-red-300 hover:text-red-700'
            : 'bg-brand-500 text-white hover:bg-brand-600'
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isSubscribed ? (
          <>
            <BellOff className="h-3.5 w-3.5" />
            Desativar
          </>
        ) : (
          <>
            <Bell className="h-3.5 w-3.5" />
            Ativar
          </>
        )}
      </button>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
