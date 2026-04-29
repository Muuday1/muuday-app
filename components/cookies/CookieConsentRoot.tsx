'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Cookie, Settings, X, Check } from 'lucide-react'
import {
  COOKIE_CONSENT_NAME,
  defaultConsentForCountry,
  resolveConsentMode,
  safeParseConsent,
  serializeConsent,
  type CookieConsent,
} from './consent'

type Props = {
  country: string
}

declare global {
  interface Window {
    MuudayCookieConsent?: {
      open: () => void
    }
  }
}

function getCookie(name: string): string | null {
  const parts = document.cookie.split(';').map(p => p.trim())
  const found = parts.find(p => p.startsWith(`${name}=`))
  if (!found) return null
  return found.slice(name.length + 1)
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`
}

export function CookieConsentRoot({ country }: Props) {
  const mode = useMemo(() => resolveConsentMode(country), [country])
  const [isOpen, setIsOpen] = useState(false)
  const [isCustomize, setIsCustomize] = useState(false)
  const [draft, setDraft] = useState<CookieConsent>(() => defaultConsentForCountry(country))

  useEffect(() => {
    const existing = safeParseConsent(getCookie(COOKIE_CONSENT_NAME))
    if (existing) {
      setDraft(existing)
      setIsOpen(false)
      return
    }
    setDraft(defaultConsentForCountry(country))
    setIsOpen(true)
  }, [country])

  useEffect(() => {
    window.MuudayCookieConsent = {
      open: () => {
        const existing = safeParseConsent(getCookie(COOKIE_CONSENT_NAME))
        setDraft(existing || defaultConsentForCountry(country))
        setIsCustomize(true)
        setIsOpen(true)
      },
    }
    return () => {
      if (window.MuudayCookieConsent) delete window.MuudayCookieConsent
    }
  }, [country])

  function saveConsent(next: CookieConsent) {
    const payload: CookieConsent = {
      ...next,
      version: 1,
      necessary: true,
      country: (country || 'BR').toUpperCase(),
      mode,
      updatedAt: new Date().toISOString(),
    }
    setCookie(COOKIE_CONSENT_NAME, serializeConsent(payload), 60 * 60 * 24 * 180)
    setDraft(payload)
    setIsOpen(false)
    setIsCustomize(false)
    window.dispatchEvent(new CustomEvent('muuday:cookie-consent-changed', { detail: payload }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] safe-area-bottom pb-16 md:pb-0" role="dialog" aria-modal="true" aria-label="Preferências de cookies">
      {/* Backdrop for customize mode */}
      {isCustomize && (
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={() => setIsOpen(false)} />
      )}

      {!isCustomize ? (
        /* Compact bottom strip */
        <div className="mx-3 mb-3 rounded-lg border border-slate-200 bg-white sm:mx-4 sm:mb-4">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#9FE870]/20">
                <Cookie className="h-5 w-5 text-slate-900" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {mode === 'ccpa'
                    ? 'Cookies e privacidade'
                    : 'Sua privacidade importa'}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600">
                  {mode === 'ccpa'
                    ? 'Usamos cookies necessários e você pode recusar cookies não essenciais.'
                    : 'Usamos cookies necessários e, com sua permissão, cookies de analytics e marketing.'}
                  {' '}
                  <Link
                    href="/politica-de-cookies"
                    className="font-semibold underline underline-offset-2 hover:text-slate-900"
                  >
                    Saiba mais
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                data-testid="cookie-customize"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setIsCustomize(true)}
              >
                <Settings className="h-3.5 w-3.5" />
                Personalizar
              </button>
              <button
                type="button"
                data-testid="cookie-reject"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                onClick={() =>
                  saveConsent({
                    ...defaultConsentForCountry(country),
                    analytics: false,
                    marketing: false,
                  })
                }
              >
                Recusar
              </button>
              <button
                type="button"
                data-testid="cookie-accept"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#9FE870] px-5 text-xs font-bold text-slate-900 transition hover:bg-[#8fd65f]/25"
                onClick={() =>
                  saveConsent({
                    ...defaultConsentForCountry(country),
                    analytics: true,
                    marketing: true,
                  })
                }
              >
                <Check className="h-3.5 w-3.5" />
                Aceitar
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Expanded customize panel */
        <div className="mx-3 mb-3 rounded-lg border border-slate-200 bg-white sm:mx-auto sm:mb-6 sm:max-w-xl">
          <div className="flex items-start justify-between gap-4 p-5">
            <div>
              <p className="font-display text-lg font-bold text-slate-900">Cookies e privacidade</p>
              <p className="mt-1 text-sm text-slate-600">
                Escolha quais cookies você permite. Necessários são sempre ativos.
              </p>
            </div>
            <button
              type="button"
              data-testid="cookie-close"
              className="rounded-lg p-1 text-slate-400 transition hover:text-slate-700"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 pb-2">
            <Link
              href="/politica-de-cookies"
              className="text-sm font-semibold text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
            >
              Ler Política de Cookies
            </Link>
          </div>

          <div className="mt-3 space-y-3 p-5 pt-0">
            {/* Necessary - always on */}
            <div className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-bold text-slate-900">Necessários</p>
                <p className="text-xs text-slate-500">Essenciais para o funcionamento do site.</p>
              </div>
              <span className="rounded-full bg-[#9FE870] px-3 py-1 text-xs font-bold text-slate-900">Sempre ativo</span>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-slate-200 p-4 transition hover:border-[#9FE870]">
              <div>
                <p className="text-sm font-bold text-slate-900">Analytics</p>
                <p className="text-xs text-slate-500">Mede uso para melhorar o produto.</p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#9FE870]"
                checked={draft.analytics}
                onChange={e => setDraft(prev => ({ ...prev, analytics: e.target.checked }))}
                aria-label="Ativar cookies de analytics"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-slate-200 p-4 transition hover:border-[#9FE870]">
              <div>
                <p className="text-sm font-bold text-slate-900">Marketing</p>
                <p className="text-xs text-slate-500">Ajuda a medir e personalizar campanhas.</p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#9FE870]"
                checked={draft.marketing}
                onChange={e => setDraft(prev => ({ ...prev, marketing: e.target.checked }))}
                aria-label="Ativar cookies de marketing"
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              onClick={() => {
                setIsCustomize(false)
                setDraft(prev => ({ ...prev, analytics: false, marketing: false }))
              }}
            >
              Voltar
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#9FE870] px-5 text-sm font-bold text-slate-900 transition hover:bg-[#8fd65f]/25"
              onClick={() => saveConsent(draft)}
            >
              Salvar preferências
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
