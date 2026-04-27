'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AuthOverlay } from '@/components/auth/AuthOverlay'
import { LoginForm } from '@/components/auth/LoginForm'
import { createClient } from '@/lib/supabase/client'
import { resolvePostLoginDestination } from '@/lib/auth/post-login-destination'
import { t } from '@/lib/i18n'
import {
  PUBLIC_CURRENCY_COOKIE,
  PUBLIC_CURRENCY_OPTIONS,
  PUBLIC_LANGUAGE_COOKIE,
  PUBLIC_LANGUAGE_OPTIONS,
  normalizeCurrency,
} from '@/lib/public-preferences'
import { getDefaultExchangeRates } from '@/lib/exchange-rates'

type PublicHeaderProps = {
  isLoggedIn: boolean
  loggedInHref: string
  initialCurrency: string
}

type NavItem = {
  href: string
  label: string
}

function useNavItems(): NavItem[] {
  return [
    { href: '/', label: t('header.nav.home') },
    { href: '/buscar', label: t('header.nav.search') },
    { href: '/registrar-profissional', label: t('header.nav.register') },
    { href: '/guias', label: t('header.nav.guides') },
    { href: '/blog', label: t('header.nav.blog') },
    { href: '/sobre', label: t('header.nav.about') },
  ]
}

function setCookie(name: string, value: string) {
  const oneYear = 60 * 60 * 24 * 365
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${oneYear}; samesite=lax`
}

export function PublicHeader({
  isLoggedIn,
  loggedInHref,
  initialCurrency,
}: PublicHeaderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const [isLoggedInClient, setIsLoggedInClient] = useState(isLoggedIn)
  const [loggedInHrefClient, setLoggedInHrefClient] = useState(loggedInHref)
  const desktopLoginButtonRef = useRef<HTMLButtonElement | null>(null)
  const mobileLoginButtonRef = useRef<HTMLButtonElement | null>(null)
  const hasLanguageChoice = PUBLIC_LANGUAGE_OPTIONS.length > 1
  const showCurrencySelector =
    !isLoggedInClient &&
    (pathname.startsWith('/buscar') || pathname.startsWith('/profissional'))
  const activeCurrency = normalizeCurrency(searchParams?.get('moeda')) || initialCurrency

  useEffect(() => {
    setMenuOpen(false)
    setAuthMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const hasSupabasePublicEnv =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    if (!hasSupabasePublicEnv) {
      setIsLoggedInClient(isLoggedIn)
      setLoggedInHrefClient(loggedInHref)
      return
    }

    const supabase = createClient()
    let active = true

    async function syncSessionState() {
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!active) return

      if (!user) {
        setIsLoggedInClient(false)
        setLoggedInHrefClient('/buscar')
        return
      }

      const metadataRole =
        typeof user.app_metadata?.role === 'string'
          ? String(user.app_metadata.role).toLowerCase()
          : null

      if (metadataRole === 'profissional') {
        setIsLoggedInClient(true)
        setLoggedInHrefClient('/dashboard')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return
      setIsLoggedInClient(true)
      if (profile?.role) {
        setLoggedInHrefClient(resolvePostLoginDestination(profile.role))
        return
      }

      setLoggedInHrefClient('/buscar-auth')
    }

    void syncSessionState()

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void syncSessionState()
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [isLoggedIn, loggedInHref])

  function handleLanguageChange(language: string) {
    setCookie(PUBLIC_LANGUAGE_COOKIE, language)
  }

  function handleCurrencyChange(currency: string) {
    setCookie(PUBLIC_CURRENCY_COOKIE, currency)

    if (pathname.startsWith('/buscar')) {
      const params = new URLSearchParams(searchParams?.toString() || '')
      const previousCurrency = normalizeCurrency(params.get('moeda')) || initialCurrency
      const rates = getDefaultExchangeRates()
      const previousRate = rates[previousCurrency] || 1
      const nextRate = rates[currency] || 1

      const convertPriceParam = (key: 'precoMin' | 'precoMax') => {
        const raw = params.get(key)
        if (!raw) return
        const parsed = Number(raw)
        if (!Number.isFinite(parsed) || parsed <= 0) {
          params.delete(key)
          return
        }

        const normalizedBrl = parsed / previousRate
        const converted = Math.max(0, Math.round(normalizedBrl * nextRate))
        if (converted <= 0) {
          params.delete(key)
          return
        }
        params.set(key, String(converted))
      }

      convertPriceParam('precoMin')
      convertPriceParam('precoMax')
      params.set('moeda', currency)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    }
  }

  function navItemClass(href: string) {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))
    return `whitespace-nowrap text-sm font-semibold transition ${
      isActive
        ? 'text-white'
        : 'text-white/80 hover:text-white'
    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md px-2 py-1`
  }

  const navItems = useNavItems()
  const resolvedNavItems = navItems.map(item => {
    if (item.href === '/buscar' && isLoggedInClient) {
      return { ...item, href: '/buscar-auth' }
    }
    return item
  })

  const isDarkHeader = pathname === '/' || pathname === '/registrar-profissional' || pathname.startsWith('/guias')

  return (
    <header
      className={`sticky top-0 z-30 transition-colors ${
        isDarkHeader
          ? 'border-b border-white/10 bg-[#4a7c2f] backdrop-blur-xl'
          : 'border-b border-slate-200 bg-white/95 backdrop-blur-xl'
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-2 md:px-8">
        <div className="flex items-center justify-between gap-4 md:gap-6">
          <Link
            href="/"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <span className={`font-display text-2xl font-black tracking-tight ${isDarkHeader ? 'text-white' : 'text-slate-900'}`}>muuday</span>
          </Link>

          <nav className="hidden flex-1 items-center gap-2 overflow-x-auto scrollbar-hide md:flex">
            {resolvedNavItems.map(item => (
              <Link key={item.href} href={item.href} className={navItemClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <select
              value="pt-BR"
              onChange={event => handleLanguageChange(event.target.value)}
              disabled={!hasLanguageChoice}
              className={`h-9 rounded-md border px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                isDarkHeader
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
              aria-label={t('header.languageSelector')}
            >
              {PUBLIC_LANGUAGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {showCurrencySelector && (
              <select
                value={activeCurrency}
                onChange={event => handleCurrencyChange(event.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
                aria-label={t('header.currencySelector')}
              >
                {PUBLIC_CURRENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {isLoggedInClient ? (
              <Link
                href={loggedInHrefClient}
                className="mu-btn-primary !px-4 !py-2 !text-xs"
              >
                {t('header.myArea')}
              </Link>
            ) : (
              <>
                <button
                  ref={desktopLoginButtonRef}
                  type="button"
                  onClick={() => setAuthMenuOpen(true)}
                  className={`rounded-md border px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                    isDarkHeader
                      ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
                  }`}
                >
                  {t('header.login')}
                </button>
                <Link
                  href="/cadastro"
                  className={`rounded-md px-4 py-2 text-xs font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                    isDarkHeader
                      ? 'bg-[#9FE870] text-slate-900 hover:bg-[#8fd65f]'
                      : 'bg-[#8ed85f] hover:bg-[#7bc752]'
                  }`}
                >
                  {t('header.createAccount')}
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <select
              value="pt-BR"
              onChange={event => handleLanguageChange(event.target.value)}
              disabled={!hasLanguageChoice}
              className={`h-8 max-w-[90px] rounded-md border px-2.5 py-1.5 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                isDarkHeader
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
              aria-label="Selecionar idioma"
            >
              {PUBLIC_LANGUAGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {showCurrencySelector && (
              <select
                value={activeCurrency}
                onChange={event => handleCurrencyChange(event.target.value)}
                className={`h-8 max-w-[90px] rounded-md border px-2.5 py-1.5 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                  isDarkHeader
                    ? 'border-white/20 bg-white/10 text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
                aria-label="Selecionar moeda"
              >
                {PUBLIC_CURRENCY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen(value => !value)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                isDarkHeader
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
              aria-label={menuOpen ? t('header.menuClose') : t('header.menuOpen')}
              aria-expanded={menuOpen}
              aria-controls="public-nav-panel"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          id="public-nav-panel"
          className={`border-t md:hidden ${
            isDarkHeader
              ? 'border-white/10 bg-[#4a7c2f]'
              : 'border-slate-200 bg-white'
          }`}
        >
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-3">
            {resolvedNavItems.map(item => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md border px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 ${
                    isDarkHeader
                      ? isActive
                        ? 'border-[#9FE870]/50 bg-[#9FE870]/15 text-white focus-visible:ring-white/30'
                        : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white focus-visible:ring-white/30'
                      : isActive
                        ? 'border-[#8ed85f] bg-[#9FE870]/8 text-[#3d6b1f] focus-visible:ring-[#9FE870]/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f] focus-visible:ring-[#9FE870]/30'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}

            {isLoggedInClient ? (
              <Link
                href={loggedInHrefClient}
                onClick={() => setMenuOpen(false)}
                className={`mt-1 rounded-md px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${
                  isDarkHeader
                    ? 'bg-[#9FE870] text-slate-900 hover:bg-[#8fd65f] focus-visible:ring-white/30'
                    : 'bg-[#8ed85f] text-white hover:bg-[#7bc752] focus-visible:ring-[#9FE870]/30'
                }`}
              >
                {t('header.myArea')}
              </Link>
            ) : (
              <>
                <button
                  ref={mobileLoginButtonRef}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setAuthMenuOpen(true)
                  }}
                  className={`mt-1 rounded-md border px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${
                    isDarkHeader
                      ? 'border-white/20 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/30'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-[#9FE870]/40 hover:text-[#3d6b1f] focus-visible:ring-[#9FE870]/30'
                  }`}
                >
                  {t('header.login')}
                </button>
                <Link
                  href="/cadastro"
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${
                    isDarkHeader
                      ? 'bg-[#9FE870] text-slate-900 hover:bg-[#8fd65f] focus-visible:ring-white/30'
                      : 'bg-[#8ed85f] text-white hover:bg-[#7bc752] focus-visible:ring-[#9FE870]/30'
                  }`}
                >
                  {t('header.createAccount')}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      <AuthOverlay
        open={!isLoggedInClient && authMenuOpen}
        onClose={() => setAuthMenuOpen(false)}
        variant="popover"
        anchorEl={desktopLoginButtonRef.current || mobileLoginButtonRef.current}
        ariaLabel="Login"
      >
        <div className="max-h-[78vh] overflow-y-auto pr-1">
          <LoginForm
            title={t('header.loginTitle')}
            subtitle={t('header.loginSubtitle')}
            idPrefix="header-login"
            onSuccess={() => setAuthMenuOpen(false)}
          />
        </div>
      </AuthOverlay>
    </header>
  )
}
