import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'
import PostHogProvider from '@/components/analytics/PostHogProvider'
import { CookieConsentRoot } from '@/components/cookies/CookieConsentRoot'
import { cookies, headers } from 'next/headers'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Muuday — Especialistas brasileiros, onde você estiver',
  description: 'Conectamos brasileiros no exterior aos melhores profissionais do Brasil.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  let country = 'BR'
  try {
    const cookieStore = cookies()
    const countryFromCookie = cookieStore.get('muuday_country')?.value
    const countryFromHeader =
      headers().get('x-vercel-ip-country') ||
      headers().get('cf-ipcountry') ||
      headers().get('x-country-code')
    country = (countryFromCookie || countryFromHeader || 'BR').toUpperCase()
  } catch {
    country = 'BR'
  }

  return (
    <html lang="pt-BR">
      <body
        className={`${jakarta.variable} ${bricolage.variable} min-h-screen font-sans antialiased bg-[#f6f4ef] flex flex-col`}
      >
        <CookieConsentRoot country={country} />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
