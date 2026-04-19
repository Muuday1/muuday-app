import Link from 'next/link'
import { ArrowRight, HelpCircle, MessageCircle, Search } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { FaqAccordion } from '@/components/landing/FaqAccordion'

export const metadata = { title: 'Ajuda | Muuday' }

const FAQ_ITEMS = [
  {
    question: 'Posso buscar profissionais sem criar conta?',
    answer:
      'Sim. A busca é pública. Você só precisa criar conta para iniciar um agendamento ou enviar solicitação de horário.',
  },
  {
    question: 'Conta de usuário e conta profissional são a mesma coisa?',
    answer:
      'Não. São tipos de conta separados, com navegação e permissões diferentes para cada um.',
  },
  {
    question: 'Como funciona o fuso horário?',
    answer:
      'Os horários são exibidos no fuso do usuário por padrão. O fuso do profissional aparece durante o agendamento.',
  },
  {
    question: 'Onde vejo pagamentos, reembolsos e recibos?',
    answer:
      'Na área de Perfil/Agenda do usuário e na área Financeiro para profissionais, conforme o tipo de conta.',
  },
  {
    question: 'Como funciona a videochamada?',
    answer:
      'A sessão acontece diretamente na plataforma Muuday. Você recebe um link na hora do agendamento e pode acessar pelo navegador, sem instalar nada.',
  },
  {
    question: 'Posso cancelar ou remarcar uma sessão?',
    answer:
      'Sim. Você pode cancelar ou remarcar seguindo a política de cancelamento definida pelo profissional. O reembolso é processado automaticamente quando aplicável.',
  },
]

const QUICK_LINKS = [
  { icon: Search, label: 'Buscar profissionais', href: '/buscar' },
  { icon: HelpCircle, label: 'Como funciona', href: '/sobre' },
  { icon: MessageCircle, label: 'Fale conosco', href: '/sobre' },
]

export default async function AjudaPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <div className="mu-shell relative py-16 md:py-24">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Central de ajuda
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800">
                Respostas rápidas para as dúvidas mais comuns de quem busca ou atende pela Muuday.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Quick links */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <div className="grid gap-4 sm:grid-cols-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#9FE870]/20 transition group-hover:bg-[#9FE870]/30">
                  <link.icon className="h-6 w-6 text-slate-900" />
                </div>
                <span className="text-sm font-bold text-slate-900">{link.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell grid gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
          <ScrollReveal variant="slideRight">
            <div>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Ainda com dúvida? Entre em contato conosco.
              </p>
              <Link
                href="/sobre"
                className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-[#9FE870] hover:text-slate-700 hover:shadow-md"
              >
                Fale com a equipe
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="slideLeft" delay={0.15}>
            <FaqAccordion items={FAQ_ITEMS} />
          </ScrollReveal>
        </div>
      </section>
    </PublicPageLayout>
  )
}
