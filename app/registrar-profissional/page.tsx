import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Layers3,
  Search,
  ShieldCheck,
  Video,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'

export const metadata = { title: 'Registrar como profissional | Muuday' }

const HERO_FEATURES = [
  'Atenda brasileiros no exterior com contexto real de idioma e cultura.',
  'Monte seu perfil com segurança e tenha visibilidade na busca da Muuday.',
  'Gerencie agenda, contatos e disponibilidade em um só ambiente.',
]

const SPECIALTIES = [
  'Psicologia',
  'Direito e consultoria jurídica',
  'Contabilidade internacional',
  'Consultoria para famílias e gestantes',
  'Fisioterapia e saúde preventiva',
  'Coaching profissional',
  'Idiomas e mentoria educacional',
  'Outras áreas com aprovação da equipe',
]

const PROCESSES = [
  {
    step: '01',
    title: 'Cadastrar',
    text: 'Preencha seus dados principais e indique sua área de atuação com precisão.',
    media: '/assets/marketing/professionals/section-process-1.webp',
  },
  {
    step: '02',
    title: 'Montar perfil',
    text: 'Descreva sua experiência, idiomas e forma de atendimento para aumentar confiança.',
    media: '/assets/marketing/professionals/section-process-2.webp',
  },
  {
    step: '03',
    title: 'Começar a atender',
    text: 'Após análise, ative agenda, serviços e disponibilidade para receber novos clientes.',
    media: '/assets/marketing/professionals/section-process-3.webp',
  },
]

const TOOLS = [
  {
    icon: BadgeCheck,
    title: 'Perfil profissional',
    text: 'Estruture seus diferenciais com foco em clareza, credibilidade e confiança.',
  },
  {
    icon: Video,
    title: 'Videochamada',
    text: 'Atendimento remoto com padrão único de experiência para brasileiros no exterior.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda prática',
    text: 'Disponibilidade, recorrência e regras de atendimento no painel de controle.',
  },
  {
    icon: Search,
    title: 'Clientes qualificados',
    text: 'Seu perfil vira uma opção profissional com contexto cultural e idioma alinhados.',
  },
  {
    icon: Layers3,
    title: 'Ferramentas de operação',
    text: 'Gerencie revisão, mensagens e ajustes sem sair da estrutura da plataforma.',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança e reputação',
    text: 'Fluxo orientado para qualidade com validação de dados e consistência de perfil.',
  },
]

const BENEFITS = [
  'Amplie visibilidade em um nicho com alta procura.',
  'Atenda com aderência cultural e linguística.',
  'Destaque sua oferta para clientes com contexto real.',
  'Ganhe flexibilidade sem abrir mão de qualidade operacional.',
  'Fortaleça autoridade com perfil estruturado.',
  'Cresça em uma rede focada na comunidade brasileira global.',
]

export default async function RegistrarProfissionalPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <div className="mu-shell relative py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <ScrollReveal variant="slideUp">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 backdrop-blur-sm">
                  Para profissionais brasileiros
                </span>
                <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                  Conecte sua profissão a brasileiros no exterior
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-800">
                  A Muuday te ajuda a se posicionar com mais clareza, com estrutura de perfil profissional e operação orientada
                  para atendimento remoto.
                </p>

                <div className="mt-8 space-y-3">
                  {HERO_FEATURES.map((text) => (
                    <div
                      key={text}
                      className="flex items-start gap-3 rounded-xl border border-slate-900/5 bg-white/60 px-4 py-3 backdrop-blur-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-900" />
                      <p className="text-sm font-medium text-slate-800">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/cadastro?role=profissional"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20"
                  >
                    Quero me cadastrar
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="#como-funciona"
                    className="inline-flex items-center justify-center gap-2 text-base font-bold text-slate-900 underline underline-offset-4 transition hover:text-slate-700"
                  >
                    Saiba como funciona
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="scale" delay={0.15}>
              <div className="relative">
                <Image
                  src="/assets/marketing/professionals/hero-main.webp"
                  alt="Profissional em atendimento remoto com painel de agenda"
                  width={1200}
                  height={800}
                  className="w-full rounded-2xl border border-slate-900/10 bg-white p-2 shadow-xl"
                  priority
                />
                <div className="absolute left-4 top-4 rounded-xl border border-white/70 bg-white/90 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-sm backdrop-blur">
                  Estrutura pensada para começar rápido
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Value proposition */}
      <section className="mu-section bg-white">
        <div className="mu-shell grid gap-10 lg:grid-cols-2 lg:items-center">
          <ScrollReveal variant="slideUp">
            <div>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                Chegue mais perto de quem precisa de você
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Quem mora fora do Brasil valoriza profissionais que entendem contexto, idioma e rotina. Aqui, o primeiro
                contato começa com uma apresentação completa e organizada.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal variant="slideLeft" delay={0.1}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Quem pode ser destaque</p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                Se você atende brasileiros com foco em confiança cultural, pode se destacar na busca com posicionamento
                profissional e disponibilidade clara.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Specialties */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Especialidades com demanda constante
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Escolha áreas de atuação que já aparecem com busca recorrente de brasileiros no exterior.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SPECIALTIES.map((item, index) => (
              <ScrollReveal key={item} variant="scale" delay={index * 0.05}>
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Área</p>
                  <p className="mt-3 text-lg font-bold text-slate-900">{item}</p>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                    Perfil recomendado para entrada de demanda de brasileiros que buscam atendimento com contexto.
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mu-section bg-white" id="como-funciona">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Em 3 passos para começar
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PROCESSES.map((step, i) => (
              <ScrollReveal key={step.step} variant="slideUp" delay={i * 0.1}>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#9FE870] hover:shadow-xl hover:shadow-[#9FE870]/10">
                  <div className="relative">
                    <Image
                      src={step.media}
                      alt={step.title}
                      width={720}
                      height={480}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <span className="font-display text-4xl font-black text-[#9FE870]">{step.step}</span>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Um ambiente mais útil para transformar visitas em clientes
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool, i) => (
              <ScrollReveal key={tool.title} variant="scale" delay={i * 0.05}>
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9FE870]/20">
                    <tool.icon className="h-6 w-6 text-slate-900" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{tool.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{tool.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mu-section bg-white">
        <div className="mu-shell grid gap-10 lg:grid-cols-2 lg:items-start">
          <ScrollReveal variant="slideUp">
            <div>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Por que entrar para a Muuday
              </h2>
              <ul className="mt-8 space-y-3">
                {BENEFITS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9FE870]" />
                    <p className="text-sm font-medium text-slate-700">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="slideLeft" delay={0.1}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Resumo de confiança</p>
              <p className="mt-3 text-base leading-7 text-slate-700">
                A estrutura de perfil é feita para facilitar aprovação e manter padrão de clareza até o primeiro atendimento.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  'Perfil organizado',
                  'Onboarding claro',
                  'Fluxo integrado',
                  'Interface unificada',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#9FE870]" />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mu-section bg-[#9FE870]">
        <div className="mu-shell">
          <ScrollReveal variant="scale">
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-16 text-center md:px-16 md:py-24">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white md:text-4xl lg:text-5xl">
                Leve sua expertise para quem precisa
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                O cadastro começa hoje. Depois da análise, seu perfil entra na busca e você recebe clientes com menos atrito.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/cadastro?role=profissional"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE870] px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-lg hover:shadow-[#9FE870]/25"
                >
                  Quero me cadastrar
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/ajuda"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  Falar com a equipe
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicPageLayout>
  )
}
