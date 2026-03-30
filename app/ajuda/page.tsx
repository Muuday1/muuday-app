import Link from 'next/link'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'

export const metadata = { title: 'Ajuda | Muuday' }

const FAQ_ITEMS = [
  {
    question: 'Posso buscar profissionais sem criar conta?',
    answer:
      'Sim. A descoberta e publica. Voce so precisa criar conta para iniciar um agendamento ou enviar solicitacao de horario.',
  },
  {
    question: 'Conta de usuario e conta profissional sao a mesma coisa?',
    answer:
      'Nao. Sao tipos de conta separados, com navegacao e permissoes diferentes para cada workspace.',
  },
  {
    question: 'Como funciona o fuso horario?',
    answer:
      'Horarios sao exibidos no fuso do usuario por padrao e o fuso do profissional e sempre identificado no fluxo de booking.',
  },
  {
    question: 'Onde vejo pagamentos, reembolsos e recibos?',
    answer:
      'Na area de Perfil/Bookings do usuario e na area Financeiro para profissionais, conforme o tipo de conta.',
  },
]

export default async function AjudaPage() {
  return (
    <PublicPageLayout>
      <section className="mx-auto w-full max-w-4xl px-4 py-12 md:px-8">
        <h1 className="font-display text-4xl font-bold text-neutral-900">Ajuda</h1>
        <p className="mt-4 text-neutral-600">
          FAQ inicial para apoiar usuarios e profissionais enquanto a central completa de suporte
          evolui nas proximas waves.
        </p>

        <div className="mt-8 space-y-3">
          {FAQ_ITEMS.map(item => (
            <details key={item.question} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-neutral-900">
                {item.question}
              </summary>
              <p className="mt-2 text-sm text-neutral-600">{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/buscar"
            className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Buscar profissionais
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:border-brand-300 hover:text-brand-700"
          >
            Login
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  )
}
