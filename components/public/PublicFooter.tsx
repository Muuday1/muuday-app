import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between md:px-8">
        <p>Muuday © {new Date().getFullYear()} - brasileiros conectando brasileiros no mundo.</p>
        <div className="flex items-center gap-4">
          <Link href="/sobre" className="hover:text-neutral-700">
            Sobre nós
          </Link>
          <Link href="/ajuda" className="hover:text-neutral-700">
            Ajuda
          </Link>
          <Link href="/buscar" className="hover:text-neutral-700">
            Buscar profissionais
          </Link>
        </div>
      </div>
    </footer>
  )
}
