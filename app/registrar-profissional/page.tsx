import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'

export const metadata = { title: 'Registrar como profissional | Muuday' }

const BENEFITS = [
  'Onboarding guiado por etapas com checklist claro',
  'Controle de disponibilidade, agenda e regras de booking',
  'Espaco de financeiro para acompanhar ganhos e repasses',
  'Governanca de perfil para melhorar confianca e conversao',
]

export default async function RegistrarProfissionalPage() {
  return (
    <PublicPageLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 className="font-display text-4xl font-bold text-neutral-900">
              Registrar como profissional
            </h1>
            <p className="mt-4 text-neutral-600">
              Crie sua conta profissional para configurar perfil publico, servicos, disponibilidade,
              plano e regras de agendamento.
            </p>

            <div className="mt-6 space-y-3">
              {BENEFITS.map(benefit => (
                <div key={benefit} className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <p className="text-sm text-neutral-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-neutral-900">Proxima etapa</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Siga para criacao da conta e selecione o tipo de conta profissional.
            </p>

            <div className="mt-5 space-y-3">
              <Link
                href="/cadastro?role=profissional"
                className="block rounded-xl bg-brand-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Criar conta profissional
              </Link>
              <Link
                href="/login"
                className="block rounded-xl border border-neutral-300 bg-white px-5 py-3 text-center text-sm font-semibold text-neutral-800 transition hover:border-brand-300 hover:text-brand-700"
              >
                Ja tenho conta, fazer login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
