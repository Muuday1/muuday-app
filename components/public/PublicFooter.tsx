'use client'

import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-[#d8e4f0] bg-[linear-gradient(180deg,#ffffff,#f7fbff)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#0f4fa8,#1f6ad1)] shadow-[0_10px_24px_rgba(15,79,168,0.22)]">
              <span className="font-display text-sm font-bold text-white">M</span>
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-neutral-900">muuday</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]/70">
                brasileiros conectando brasileiros no mundo
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-500">
            Descoberta, agendamento, sessão em vídeo e continuidade em uma plataforma pensada para brasileiros que vivem fora e querem resolver com clareza.
          </p>

          <p className="mt-4 text-sm text-neutral-400">Muuday © {new Date().getFullYear()}</p>
        </div>

        <div className="grid gap-3 text-sm text-neutral-500 md:justify-self-end">
          <Link href="/sobre" className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            Sobre nós
          </Link>
          <Link href="/ajuda" className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            Ajuda
          </Link>
          <Link href="/buscar" className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            Buscar profissionais
          </Link>
          <Link href="/planos" className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            Planos
          </Link>
          <Link href="/politica-de-cookies" className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            Política de cookies
          </Link>
          <button
            type="button"
            className="rounded-md text-left hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            onClick={() => window?.MuudayCookieConsent?.open?.()}
          >
            Gerenciar cookies
          </button>
        </div>
      </div>
    </footer>
  )
}
