import { cookies, headers } from 'next/headers'
import {
  normalizeCurrency,
  PUBLIC_CURRENCY_COOKIE,
  resolveDefaultCurrencyFromAcceptLanguage,
} from '@/lib/public-preferences'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'
import { createClient } from '@/lib/supabase/server'
import { resolvePostLoginDestination } from '@/lib/auth/post-login-destination'

export async function PublicPageLayout({ children }: { children: React.ReactNode }) {
  const acceptLanguage = headers().get('accept-language')
  const cookieStore = cookies()

  const cookieCurrency = normalizeCurrency(cookieStore.get(PUBLIC_CURRENCY_COOKIE)?.value)

  const initialCurrency =
    cookieCurrency || resolveDefaultCurrencyFromAcceptLanguage(acceptLanguage)

  let isLoggedIn = false
  let loggedInHref = '/buscar-auth'
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      isLoggedIn = true
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      loggedInHref = resolvePostLoginDestination(profile?.role)
    }
  } catch {
    // Keep public pages resilient if auth backend is transiently unavailable.
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-neutral-900">
      <PublicHeader
        isLoggedIn={isLoggedIn}
        loggedInHref={loggedInHref}
        initialCurrency={initialCurrency}
      />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
