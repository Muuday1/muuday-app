import Link from 'next/link'
import { CalendarDays, CheckCircle2, Layers3, Video } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'

export const metadata = { title: 'Registrar como profissional | Muuday' }

const BENEFITS = [
  'Atendimento por vídeo para clientes no mundo inteiro',
  'Cadastro em etapas com checklist claro no dashboard',
  'Recorrência e múltiplas datas no agendamento',
  'Perfil profissional com foco em confiança e conversão',
]

const ONBOARDING_STEPS = [
  'C1 Conta',
  'C2 Identidade',
  'C3 Perfil público',
  'C4 Serviço',
  'C5 Disponibilidade',
  'C6 Plano + Termos',
  'C7 Payout (Stripe)',
  'C8 Envio para revisão',
  'C9 Go live',
]

const TIER_PREVIEW = [
  { name: 'Básico', services: '1 serviço', specialties: '1 especialidade', window: '60 dias' },
  { name: 'Professional', services: '5 serviços', specialties: '3 especialidades', window: '90 dias' },
  { name: 'Premium', services: '10 serviços', specialties: '3 especialidades', window: '180 dias' },
]

export default async function RegistrarProfissionalPage() {
  return (
    <PublicPageLayout>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 className="font-display text-4xl font-bold text-neutral-900">Registrar como profissional</h1>
            <p className="mt-4 text-neutral-600">
              Crie sua conta profissional, complete o onboarding em etapas e publique seu perfil
              para receber agendamentos online.
            </p>

            <div className="mt-6 space-y-3">
              {BENEFITS.map(benefit => (
                <div
                  key={benefit}
                  className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <p className="text-sm text-neutral-700">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-3">
                <Video className="h-4 w-4 text-brand-600" />
                <p className="mt-2 text-sm font-semibold text-neutral-900">Somente vídeo</p>
                <p className="mt-1 text-xs text-neutral-600">Sem presencial nesta fase do produto.</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-3">
                <CalendarDays className="h-4 w-4 text-brand-600" />
                <p className="mt-2 text-sm font-semibold text-neutral-900">Agenda recorrente</p>
                <p className="mt-1 text-xs text-neutral-600">
                  Configure periodicidade e duração das sessões.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-3">
                <Layers3 className="h-4 w-4 text-brand-600" />
                <p className="mt-2 text-sm font-semibold text-neutral-900">Tiers progressivos</p>
                <p className="mt-1 text-xs text-neutral-600">Básico, Professional e Premium.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6">
              <h2 className="font-display text-xl font-semibold text-neutral-900">Próxima etapa</h2>
              <p className="mt-2 text-sm text-neutral-600">
                Siga para a criação de conta e escolha o tipo de conta profissional.
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
                  Já tenho conta, fazer login
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-neutral-900">Onboarding em 9 etapas</h3>
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {ONBOARDING_STEPS.map(step => (
                  <li key={step} className="text-xs text-neutral-600">
                    • {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Preview de planos</h3>
                <Link href="/planos" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
                  Ver planos completos
                </Link>
              </div>
              <div className="space-y-2">
                {TIER_PREVIEW.map(plan => (
                  <div key={plan.name} className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                    <p className="text-sm font-semibold text-neutral-900">{plan.name}</p>
                    <p className="mt-1 text-xs text-neutral-600">
                      {plan.services} • {plan.specialties} • janela de {plan.window}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
