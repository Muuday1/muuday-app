import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from 'next/font/google'
import { cookies } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import PostHogProvider from '@/components/analytics/PostHogProvider'
import { AuthHostBridge } from '@/components/auth/AuthHostBridge'
import { CookieConsentRoot } from '@/components/cookies/CookieConsentRoot'
import { getAppBaseUrl } from '@/lib/config/app-url'

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

const appUrl = getAppBaseUrl()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'Muuday - Especialistas brasileiros, onde voce estiver',
  description: 'Conectamos brasileiros no exterior aos melhores profissionais do Brasil.',
  openGraph: {
    type: 'website',
    url: appUrl,
    title: 'Muuday - Especialistas brasileiros, onde voce estiver',
    description: 'Conectamos brasileiros no exterior aos melhores profissionais do Brasil.',
    images: [
      {
        url: '/assets/marketing/landing/hero-main.webp',
        width: 1200,
        height: 630,
        alt: 'Muuday',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muuday - Especialistas brasileiros, onde voce estiver',
    description: 'Conectamos brasileiros no exterior aos melhores profissionais do Brasil.',
    images: ['/assets/marketing/landing/hero-main.webp'],
  },
}

async function resolveCookieConsentCountry() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('muuday_country')?.value || ''
  const normalized = raw.trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(normalized)) return normalized
  return 'BR'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const consentCountry = await resolveCookieConsentCountry()

  return (
    <html lang="pt-BR">
      <body
        className={`${jakarta.variable} ${bricolage.variable} min-h-screen flex flex-col bg-[#f6f8fb] font-sans antialiased`}
      >
        <AuthHostBridge />
        <CookieConsentRoot country={consentCountry} />
        <PostHogProvider>{children}</PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
