import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let user: any = null
  let profile: { role?: string } | null = null

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient()
      user = (await supabase.auth.getUser()).data.user

      if (user) {
        profile = (await supabase.from('profiles').select('role').eq('id', user.id).single()).data
      }
    } catch {
      user = null
      profile = null
    }
  }

  const acceptLanguage = headers().get('accept-language')
  const cookieStore = cookies()

  const cookieLanguage = normalizeLanguage(cookieStore.get(PUBLIC_LANGUAGE_COOKIE)?.value)
  const cookieCurrency = normalizeCurrency(cookieStore.get(PUBLIC_CURRENCY_COOKIE)?.value)

  const initialLanguage =
    cookieLanguage || resolveDefaultLanguageFromAcceptLanguage(acceptLanguage)
  const initialCurrency =
    cookieCurrency || resolveDefaultCurrencyFromAcceptLanguage(acceptLanguage)

  const loggedInHref =
    profile?.role === 'admin' ? '/admin' : profile?.role === 'profissional' ? '/dashboard' : '/buscar'

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
