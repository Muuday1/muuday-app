import { cookies, headers } from 'next/headers'
import {
  normalizeCurrency,
  normalizeLanguage,
  PUBLIC_CURRENCY_COOKIE,
  PUBLIC_LANGUAGE_COOKIE,
  resolveDefaultCurrencyFromAcceptLanguage,
  resolveDefaultLanguageFromAcceptLanguage,
} from '@/lib/public-preferences'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'

export async function PublicPageLayout({ children }: { children: React.ReactNode }) {
  // Public layout intentionally does not perform auth/profile fetches during SSR.
  // This keeps public pages resilient when auth infra is transiently unavailable.
  const user = null

  const acceptLanguage = headers().get('accept-language')
  const cookieStore = cookies()

  const cookieLanguage = normalizeLanguage(cookieStore.get(PUBLIC_LANGUAGE_COOKIE)?.value)
  const cookieCurrency = normalizeCurrency(cookieStore.get(PUBLIC_CURRENCY_COOKIE)?.value)

  const initialLanguage =
    cookieLanguage || resolveDefaultLanguageFromAcceptLanguage(acceptLanguage)
  const initialCurrency =
    cookieCurrency || resolveDefaultCurrencyFromAcceptLanguage(acceptLanguage)

  const loggedInHref = '/buscar'

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-neutral-900 flex flex-col">
      <PublicHeader
        isLoggedIn={Boolean(user)}
        loggedInHref={loggedInHref}
        initialLanguage={initialLanguage}
        initialCurrency={initialCurrency}
      />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
