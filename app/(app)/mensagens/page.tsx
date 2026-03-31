export const metadata = { title: 'Mensagens | Muuday' }

import Link from 'next/link'

export default function MensagensPage({
  searchParams,
}: {
  searchParams?: { profissional?: string }
}) {
  const professionalId = (searchParams?.profissional || '').trim()

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8 md:py-8">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-neutral-900 md:text-3xl">Mensagens</h1>
        <p className="mt-2 text-sm text-neutral-600">
          O inbox completo entra na Wave 4. Por enquanto, este atalho já preserva o fluxo e o contexto da ação.
        </p>

        {professionalId ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            Conversa iniciada para o profissional ID: <span className="font-mono">{professionalId}</span>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/buscar"
            className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            Voltar para buscar
          </Link>
          {professionalId ? (
            <Link
              href={`/profissional/${professionalId}`}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
            >
              Ver perfil
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
