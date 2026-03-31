import Link from 'next/link'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'

export const metadata = { title: 'Sobre nós | Muuday' }

export default async function SobrePage() {
  return (
    <PublicPageLayout>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 md:px-8">
        <h1 className="font-display text-4xl font-bold text-neutral-900">Sobre nós</h1>
        <p className="mt-4 text-neutral-600">
          A Muuday conecta brasileiros no exterior a profissionais de confiança no Brasil.
          Nosso objetivo é facilitar demandas reais do dia a dia com busca clara,
          agendamento simples e atendimento em português.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-display text-xl font-semibold text-neutral-900">Missão</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Facilitar acesso a suporte profissional em português para quem vive fora do Brasil.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-display text-xl font-semibold text-neutral-900">Como funciona</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Você compara perfis, vê avaliações, escolhe o horário e agenda em poucos passos.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/buscar"
            className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Buscar profissionais
          </Link>
          <Link
            href="/registrar-profissional"
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:border-brand-300 hover:text-brand-700"
          >
            Registrar como profissional
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  )
}
