import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between md:px-8">
        <p>Muuday © {new Date().getFullYear()} - brasileiros conectando brasileiros no mundo.</p>
        <div className="flex items-center gap-4">
          <Link href="/sobre" className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            Sobre nós
          </Link>
          <Link href="/ajuda" className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            Ajuda
          </Link>
          <Link href="/buscar" className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            Buscar profissionais
          </Link>
          <Link href="/politica-de-cookies" className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            Política de cookies
          </Link>
          <button
            type="button"
            className="rounded-md hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            onClick={() => window?.MuudayCookieConsent?.open?.()}
          >
            Gerenciar cookies
          </button>
        </div>
      </div>
    </footer>
  )
}
