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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Muuday â€” Especialistas brasileiros, onde vocÃª estiver',
  description: 'Conectamos brasileiros no exterior aos melhores profissionais do Brasil.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${jakarta.variable} ${bricolage.variable} min-h-screen font-sans antialiased bg-[#f6f4ef] flex flex-col`}
      >
        <CookieConsentRoot country="BR" />
        <PostHogProvider>{children}</PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

