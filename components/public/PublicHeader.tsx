'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  PUBLIC_CURRENCY_COOKIE,
  PUBLIC_CURRENCY_OPTIONS,
  PUBLIC_LANGUAGE_COOKIE,
  PUBLIC_LANGUAGE_OPTIONS,
} from '@/lib/public-preferences'

type PublicHeaderProps = {
  isLoggedIn: boolean
  loggedInHref: string
  initialLanguage: string
  initialCurrency: string
}

type NavItem = {
  href: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/buscar', label: 'Buscar profissionais' },
  { href: '/registrar-profissional', label: 'Registrar como profissional' },
  { href: '/sobre', label: 'Sobre nos' },
  { href: '/ajuda', label: 'Ajuda' },
]

function setCookie(name: string, value: string) {
  const oneYear = 60 * 60 * 24 * 365
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${oneYear}; samesite=lax`
}

export function PublicHeader({
  isLoggedIn,
  loggedInHref,
  initialLanguage,
  initialCurrency,
}: PublicHeaderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  function handleLanguageChange(language: string) {
    setCookie(PUBLIC_LANGUAGE_COOKIE, language)
  }

  function handleCurrencyChange(currency: string) {
    setCookie(PUBLIC_CURRENCY_COOKIE, currency)

    if (pathname.startsWith('/buscar')) {
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.set('moeda', currency)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-[#f6f4ef]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500">
              <span className="font-display text-sm font-bold text-white">M</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-neutral-900">muuday</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <select
              defaultValue={initialLanguage}
              onChange={event => handleLanguageChange(event.target.value)}
              className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700"
              aria-label="Selecionar idioma"
            >
              {PUBLIC_LANGUAGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              defaultValue={initialCurrency}
              onChange={event => handleCurrencyChange(event.target.value)}
              className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700"
              aria-label="Selecionar moeda"
            >
              {PUBLIC_CURRENCY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {isLoggedIn ? (
              <Link
                href={loggedInHref}
                className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Minha area
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <nav className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1">
          {NAV_ITEMS.map(item => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                {item.label}
              </Link>
            )
          })}

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <select
              defaultValue={initialLanguage}
              onChange={event => handleLanguageChange(event.target.value)}
              className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700"
              aria-label="Selecionar idioma"
            >
              {PUBLIC_LANGUAGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              defaultValue={initialCurrency}
              onChange={event => handleCurrencyChange(event.target.value)}
              className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700"
              aria-label="Selecionar moeda"
            >
              {PUBLIC_CURRENCY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isLoggedIn ? (
              <Link
                href={loggedInHref}
                className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Area
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
