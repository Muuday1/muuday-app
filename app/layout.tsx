import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import PostHogProvider from '@/components/analytics/PostHogProvider'
import { CookieConsentRoot } from '@/components/cookies/CookieConsentRoot'

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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.muuday.com'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${jakarta.variable} ${bricolage.variable} min-h-screen flex flex-col bg-[#f6f8fb] font-sans antialiased`}
      >
        <CookieConsentRoot country="BR" />
        <PostHogProvider>{children}</PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
