'use client'

import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-brand-100 bg-[var(--mu-surface)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--mu-radius-md)] bg-gradient-to-br from-brand-500 to-brand-700 shadow-[var(--mu-shadow-sm)]">
              <span className="font-display text-sm font-bold text-white">M</span>
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-[var(--mu-text)]">muuday</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                brasileiros conectando brasileiros no mundo
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--mu-muted)]">
            Descoberta, agendamento, sessão em vídeo e continuidade em uma plataforma pensada para brasileiros
            que vivem fora e querem encontrar profissionais com contexto.
          </p>

          <p className="mt-4 text-sm text-[var(--mu-muted)]">Muuday © {new Date().getFullYear()}</p>
        </div>

        <div className="grid gap-3 text-sm text-[var(--mu-muted)] md:justify-self-end">
          <Link
            href="/sobre"
            className="rounded-md hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            Sobre nós
          </Link>
          <Link
            href="/ajuda"
            className="rounded-md hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            Ajuda
          </Link>
          <Link
            href="/buscar"
            className="rounded-md hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            Buscar profissionais
          </Link>
          <Link
            href="/registrar-profissional"
            className="rounded-md hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            Registrar como profissional
          </Link>
          <Link
            href="/politica-de-cookies"
            className="rounded-md hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            Política de cookies
          </Link>
          <button
            type="button"
            className="rounded-md text-left hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            onClick={() => window?.MuudayCookieConsent?.open?.()}
          >
            Gerenciar cookies
          </button>
        </div>
      </div>
    </footer>
  )
}
