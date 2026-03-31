'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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
  const [open, setOpen] = useState(false)
  const [customize, setCustomize] = useState(false)
  const [draft, setDraft] = useState<CookieConsent>(() => defaultConsentForCountry(country))

  useEffect(() => {
    const existing = safeParseConsent(getCookie(COOKIE_CONSENT_NAME))
    if (existing) {
      setDraft(existing)
      setOpen(false)
      return
    }
    setDraft(defaultConsentForCountry(country))
    setOpen(true)
  }, [country])

  useEffect(() => {
    window.MuudayCookieConsent = {
      open: () => {
        const existing = safeParseConsent(getCookie(COOKIE_CONSENT_NAME))
        setDraft(existing || defaultConsentForCountry(country))
        setCustomize(true)
        setOpen(true)
      },
    }
    return () => {
      if (window.MuudayCookieConsent) delete window.MuudayCookieConsent
    }
  }, [country])

  function save(next: CookieConsent) {
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
    setOpen(false)
    setCustomize(false)
    window.dispatchEvent(new CustomEvent('muuday:cookie-consent-changed', { detail: payload }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Preferências de cookies">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Fechar" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold text-neutral-900">Cookies e privacidade</p>
              <p className="mt-1 text-sm text-neutral-600">
                {mode === 'ccpa'
                  ? 'Usamos cookies necessários e você pode recusar cookies não essenciais.'
                  : 'Usamos cookies necessários e, com sua permissão, cookies de analytics e marketing.'}
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              onClick={() => setOpen(false)}
            >
              Fechar
            </button>
          </div>

          <div className="mt-4 text-sm text-neutral-600">
            <Link
              href="/politica-de-cookies"
              className="underline underline-offset-4 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 rounded"
            >
              Ler Política de Cookies
            </Link>
          </div>

          {customize ? (
            <div className="mt-5 space-y-3">
              <label className="block rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Analytics</p>
                    <p className="text-xs text-neutral-500">Mede uso para melhorar o produto.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={draft.analytics}
                    onChange={e => setDraft(prev => ({ ...prev, analytics: e.target.checked }))}
                    aria-label="Ativar cookies de analytics"
                  />
                </div>
              </label>

              <label className="block rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Marketing</p>
                    <p className="text-xs text-neutral-500">Ajuda a medir e personalizar campanhas.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={draft.marketing}
                    onChange={e => setDraft(prev => ({ ...prev, marketing: e.target.checked }))}
                    aria-label="Ativar cookies de marketing"
                  />
                </div>
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-end sm:p-5">
          {customize ? (
            <>
              <button
                type="button"
                className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() => {
                  setCustomize(false)
                  setDraft(prev => ({ ...prev, analytics: false, marketing: false }))
                }}
              >
                Voltar
              </button>
              <button
                type="button"
                className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() => save(draft)}
              >
                Salvar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() => setCustomize(true)}
              >
                Personalizar
              </button>
              <button
                type="button"
                className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() =>
                  save({
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
                className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() =>
                  save({
                    ...defaultConsentForCountry(country),
                    analytics: true,
                    marketing: true,
                  })
                }
              >
                Aceitar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
  if (typeof document === 'undefined') return null
  const parts = document.cookie.split(';').map(p => p.trim())
  const found = parts.find(p => p.startsWith(`${name}=`))
  if (!found) return null
  return found.slice(name.length + 1)
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === 'undefined') return
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

  const title =
    mode === 'ccpa'
      ? 'Privacidade e cookies'
      : 'Cookies e privacidade'

  const description =
    mode === 'gdpr'
      ? 'Usamos cookies necessários para o site funcionar e, com sua permissão, cookies de analytics e marketing. Você pode aceitar, recusar ou personalizar.'
      : mode === 'lgpd'
        ? 'Usamos cookies necessários para o site funcionar e, com seu consentimento, cookies de analytics e marketing. Você pode aceitar, recusar ou personalizar.'
        : mode === 'ccpa'
          ? 'Usamos cookies necessários e podemos usar cookies de analytics/marketing. Você pode recusar cookies não essenciais ou personalizar suas preferências.'
          : 'Usamos cookies necessários e, com sua escolha, cookies de analytics e marketing. Você pode personalizar suas preferências.'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Preferências de cookies"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold text-neutral-900">{title}</p>
              <p className="mt-1 text-sm text-neutral-600">{description}</p>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              onClick={() => setIsOpen(false)}
            >
              Fechar
            </button>
          </div>

          <div className="mt-4 text-sm text-neutral-600">
            <Link
              href="/politica-de-cookies"
              className="underline underline-offset-4 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 rounded"
            >
              Ler Política de Cookies
            </Link>
          </div>

          {isCustomize ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Cookies necessários</p>
                    <p className="text-xs text-neutral-500">Sempre ativos para o site funcionar.</p>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500">Ativo</span>
                </div>
              </div>

              <label className="block rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Analytics</p>
                    <p className="text-xs text-neutral-500">Mede uso para melhorar o produto.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={draft.analytics}
                    onChange={e => setDraft(prev => ({ ...prev, analytics: e.target.checked }))}
                    aria-label="Ativar cookies de analytics"
                  />
                </div>
              </label>

              <label className="block rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Marketing</p>
                    <p className="text-xs text-neutral-500">Ajuda a personalizar comunicações e campanhas.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={draft.marketing}
                    onChange={e => setDraft(prev => ({ ...prev, marketing: e.target.checked }))}
                    aria-label="Ativar cookies de marketing"
                  />
                </div>
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-end sm:p-5">
          {isCustomize ? (
            <div className="contents">
              <button
                type="button"
                className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() => {
                  setIsCustomize(false)
                  setDraft(prev => ({ ...prev, analytics: false, marketing: false }))
                }}
              >
                Voltar
              </button>
              <button
                type="button"
                className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() => saveConsent(draft)}
              >
                Salvar preferências
              </button>
            </div>
          ) : (
            <div className="contents">
              <button
                type="button"
                className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() => setIsCustomize(true)}
              >
                Personalizar
              </button>
              <button
                type="button"
                className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
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
                className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() =>
                  saveConsent({
                    ...defaultConsentForCountry(country),
                    analytics: true,
                    marketing: true,
                  })
                }
              >
                Aceitar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
  const description =
    mode === 'gdpr'
      ? 'Usamos cookies necessários para o site funcionar e, com sua permissão, cookies de analytics e marketing. Você pode aceitar, recusar ou personalizar.'
      : mode === 'lgpd'
        ? 'Usamos cookies necessários para o site funcionar e, com seu consentimento, cookies de analytics e marketing. Você pode aceitar, recusar ou personalizar.'
        : mode === 'ccpa'
          ? 'Usamos cookies necessários e podemos usar cookies de analytics/marketing. Você pode recusar cookies não essenciais ou personalizar suas preferências.'
          : 'Usamos cookies necessários e, com sua escolha, cookies de analytics e marketing. Você pode personalizar suas preferências.'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Preferências de cookies"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-bold text-neutral-900">{title}</p>
              <p className="mt-1 text-sm text-neutral-600">{description}</p>
            </div>
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              onClick={() => setIsOpen(false)}
            >
              Fechar
            </button>
          </div>

          <div className="mt-4 text-sm text-neutral-600">
            <Link
              href="/politica-de-cookies"
              className="underline underline-offset-4 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 rounded"
            >
              Ler Política de Cookies
            </Link>
          </div>

          {isCustomize ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Cookies necessários</p>
                    <p className="text-xs text-neutral-500">Sempre ativos para o site funcionar.</p>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500">Ativo</span>
                </div>
              </div>

              <label className="block rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Analytics</p>
                    <p className="text-xs text-neutral-500">Mede uso para melhorar o produto.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={draft.analytics}
                    onChange={e => setDraft(prev => ({ ...prev, analytics: e.target.checked }))}
                    aria-label="Ativar cookies de analytics"
                  />
                </div>
              </label>

              <label className="block rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Marketing</p>
                    <p className="text-xs text-neutral-500">Ajuda a personalizar comunicações e campanhas.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={draft.marketing}
                    onChange={e => setDraft(prev => ({ ...prev, marketing: e.target.checked }))}
                    aria-label="Ativar cookies de marketing"
                  />
                </div>
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-end sm:p-5">
          {isCustomize ? (
            <>
              <button
                type="button"
                className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() => {
                  setIsCustomize(false)
                  setDraft(prev => ({ ...prev, analytics: false, marketing: false }))
                }}
              >
                Voltar
              </button>
              <button
                type="button"
                className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() => saveConsent(draft)}
              >
                Salvar preferências
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() => {
                  setIsCustomize(true)
                }}
              >
                Personalizar
              </button>
              <button
                type="button"
                className="h-10 rounded-xl border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
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
                className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                onClick={() =>
                  saveConsent({
                    ...defaultConsentForCountry(country),
                    analytics: true,
                    marketing: true,
                  })
                }
              >
                Aceitar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

