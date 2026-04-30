'use client'

import Link from 'next/link'
import { t } from '@/lib/i18n'

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  )
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-[#f2f4f7]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
        {/* Top: Big logo + social */}
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-display text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              muuday
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {t('footer.tagline')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {[
              { icon: FacebookIcon, href: '#', label: 'Facebook' },
              { icon: TwitterIcon, href: '#', label: 'Twitter' },
              { icon: InstagramIcon, href: '#', label: 'Instagram' },
              { icon: YoutubeIcon, href: '#', label: 'YouTube' },
              { icon: LinkedinIcon, href: '#', label: 'LinkedIn' },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-slate-300" />

        {/* Links grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">{t('footer.products')}</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/buscar" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  {t('footer.searchProfessionals')}
                </Link>
              </li>
              <li>
                <Link href="/registrar-profissional" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  {t('footer.registerProfessional')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">{t('footer.company')}</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/sobre" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">{t('footer.legal')}</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/politica-de-cookies" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  {t('footer.cookiePolicy')}
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/termos-de-uso" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">{t('footer.support')}</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/guias" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  {t('footer.guides')}
                </Link>
              </li>
              <li>
                <Link href="/ajuda" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  {t('footer.helpCenter')}
                </Link>
              </li>
              <li>
                <Link href="/ajuda" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline"
                  onClick={() => window?.MuudayCookieConsent?.open?.()}
                >
                  {t('footer.manageCookies')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-slate-300 pt-6">
          <p className="text-sm text-slate-500">
            &copy; Muuday {new Date().getFullYear()}. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}
