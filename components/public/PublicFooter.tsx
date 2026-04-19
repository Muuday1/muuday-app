'use client'

import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'

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
              Brasileiros conectando brasileiros no mundo
            </p>
          </div>

          <div className="flex items-center gap-3">
            {[
              { icon: Facebook, href: '#', label: 'Facebook' },
              { icon: Twitter, href: '#', label: 'Twitter' },
              { icon: Instagram, href: '#', label: 'Instagram' },
              { icon: Youtube, href: '#', label: 'YouTube' },
              { icon: Linkedin, href: '#', label: 'LinkedIn' },
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
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">Produtos</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/buscar" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Buscar profissionais
                </Link>
              </li>
              <li>
                <Link href="/registrar-profissional" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Registrar como profissional
                </Link>
              </li>
              <li>
                <Link href="/ajuda" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Central de ajuda
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">Empresa</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/sobre" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Sobre nós
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Carreiras
                </Link>
              </li>
              <li>
                <Link href="/ajuda" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">Legal</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/politica-de-cookies" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Política de cookies
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos-de-uso" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  Termos de uso
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">Suporte</p>
            <ul className="mt-4 space-y-3">
              <li>
                <button
                  type="button"
                  className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline"
                  onClick={() => window?.MuudayCookieConsent?.open?.()}
                >
                  Gerenciar cookies
                </button>
              </li>
              <li>
                <Link href="/ajuda" className="text-sm text-slate-600 transition hover:text-slate-900 hover:underline">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-slate-300 pt-6">
          <p className="text-sm text-slate-500">
            &copy; Muuday {new Date().getFullYear()}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
