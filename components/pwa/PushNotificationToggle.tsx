'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Loader2, Send } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(rawData.split('').map(c => c.charCodeAt(0)))
}

export function PushNotificationToggle() {
  const [permission, setPermission] = useState<PermissionState>('unsupported')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission as PermissionState)

    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub)
        })
      )
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[PushNotificationToggle] VAPID_PUBLIC_KEY not configured')
      return
    }

    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        const permissionResult = await Notification.requestPermission()
        setPermission(permissionResult as PermissionState)

        if (permissionResult !== 'granted') {
          setLoading(false)
          return
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
        })
      }

      const json = subscription.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      })

      if (res.ok) {
        setSubscribed(true)
      } else {
        console.warn('[PushNotificationToggle] Subscribe API failed:', res.status)
      }
    } catch (err) {
      console.error('[PushNotificationToggle] Subscribe error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setSubscribed(false)
    } catch (err) {
      console.error('[PushNotificationToggle] Unsubscribe error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const sendTest = useCallback(async () => {
    setTestStatus('sending')
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setTestStatus('sent')
      } else {
        setTestStatus('failed')
      }
      setTimeout(() => setTestStatus('idle'), 3000)
    } catch {
      setTestStatus('failed')
      setTimeout(() => setTestStatus('idle'), 3000)
    }
  }, [])

  if (permission === 'unsupported') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-700">Notificações push</p>
            <p className="text-xs text-slate-500">Seu navegador não suporta notificações push.</p>
          </div>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Notificações bloqueadas</p>
            <p className="text-xs text-amber-700">
              Você bloqueou as notificações. Para reativar, clique no ícone de cadeado na barra de endereço e permita notificações.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (subscribed) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Notificações ativadas</p>
              <p className="text-xs text-emerald-700">Você receberá notificações push em segundo plano.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={sendTest}
              disabled={testStatus === 'sending'}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {testStatus === 'sending' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : testStatus === 'sent' ? (
                <Bell className="h-3.5 w-3.5" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {testStatus === 'sent' ? 'Enviado' : testStatus === 'failed' ? 'Falhou' : 'Testar'}
            </button>
            <button
              type="button"
              onClick={unsubscribe}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellOff className="h-3.5 w-3.5" />}
              Desativar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-800">Notificações push</p>
            <p className="text-xs text-slate-500">Receba alertas de mensagens e sessões mesmo com o app fechado.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={subscribe}
          disabled={loading || !VAPID_PUBLIC_KEY}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#9FE870] px-3 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-[#8dd65f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
          Ativar
        </button>
      </div>
      {!VAPID_PUBLIC_KEY && (
        <p className="mt-2 text-xs text-amber-600">Chave VAPID não configurada no servidor.</p>
      )}
    </div>
  )
}
