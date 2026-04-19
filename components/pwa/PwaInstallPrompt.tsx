'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  function handleDismiss() {
    setIsVisible(false)
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !isVisible) return null

  // Check if dismissed recently
  const dismissedAt = localStorage.getItem('pwa-install-dismissed')
  if (dismissedAt) {
    const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24)
    if (daysSince < 7) return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:bottom-4 md:left-auto md:right-4 md:w-80">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
              <Download className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Instale o Muuday</p>
              <p className="text-xs text-neutral-500">Acesse mais rápido e offline.</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="mt-3 w-full rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Instalar aplicativo
        </button>
      </div>
    </div>
  )
}
