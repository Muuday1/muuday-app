import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Users,
  Video,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { FaqAccordion } from '@/components/landing/FaqAccordion'
import { FadeIn } from '@/components/landing/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/landing/StaggerContainer'
import { SEARCH_CATEGORIES } from '@/lib/search-config'

const STATS = [
  { value: '100%', label: 'Online por vídeo', icon: Video },
  { value: '6+', label: 'Áreas de atuação', icon: Globe },
  { value: '24/7', label: 'Agende quando quiser', icon: Clock },
]

const ALL_CATEGORIES = SEARCH_CATEGORIES

const FOR_WHO = [
  {
    title: 'Para quem mora fora',
    body: 'Psicólogos, nutricionistas e coaches que entendem sua realidade de brasileiro no exterior.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
  },
  {
    title: 'Para quem viaja',
    body: 'Agende sessões de qualquer lugar. Seu profissional está a um clique, independente do fuso.',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
  },
  {
    title: 'Para profissionais',
    body: 'Expanda sua clientela para brasileiros no mundo todo. Defina seus horários e preços.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
  },
]

const HOW_STEPS = [
  {
    step: '01',
    title: 'Busque',
    body: 'Filtros por especialidade, idioma, país e disponibilidade.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Agende',
    body: 'Escolha dia, horário e tipo de sessão. Confirmação instantânea.',
    icon: CalendarCheck,
  },
  {
    step: '03',
    title: 'Conecte',
    body: 'Videochamada integrada. Sem Zoom, Teams ou WhatsApp.',
    icon: Video,
  },
]

const TESTIMONIALS = [
  {
    name: 'Ana Paula',
    role: 'Psicóloga em Lisboa',
    text: 'A Muuday me conectou com brasileiros em Portugal que precisavam de atendimento em português. A plataforma cuida de tudo.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  },
  {
    name: 'Ricardo Mendes',
    role: 'Nutricionista em Londres',
    text: 'Finalmente consigo atender clientes do Brasil sem complicação de fuso horário. Tudo ajustado automaticamente.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  },
  {
    name: 'Carolina Dias',
    role: 'Cliente em Berlim',
    text: 'Encontrei uma psicóloga brasileira em minutos. Fazer terapia na minha língua, morando na Alemanha, fez toda a diferença.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Preciso criar conta para pesquisar profissionais?',
    answer: 'Não. Você pode procurar sem cadastro. Só precisa de conta para agendar, salvar favoritos ou mandar mensagem.',
  },
  {
    question: 'Os atendimentos são sempre online?',
    answer: 'Sim, todos por videochamada. Assim você pode atender ou ser atendido de qualquer lugar.',
  },
  {
    question: 'Posso agendar recorrência ou várias datas?',
    answer: 'Sim. Uma vez, toda semana, ou várias datas diferentes. Você escolhe.',
  },
  {
    question: 'Como funciona a entrada de profissionais?',
    answer: 'É simples: você cria seu perfil, define serviços e preços, e publica sua disponibilidade. A equipe revisa antes de aprovar.',
  },
]

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
          <div className="ml-4 flex-1 rounded-md bg-white py-1 px-3 text-xs text-slate-400">muuday.com/buscar</div>
        </div>
        {/* Mock content */}
        <div className="p-4">
          <div className="flex gap-2">
            <div className="h-10 flex-1 rounded-lg bg-slate-100" />
            <div className="h-10 w-24 rounded-lg bg-brand-600" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-8 flex-1 rounded-md bg-slate-100" />
            <div className="h-8 flex-1 rounded-md bg-slate-100" />
            <div className="h-8 flex-1 rounded-md bg-slate-100" />
          </div>
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <div className="h-12 w-12 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                  <div className="h-2 w-1/2 rounded bg-slate-100" />
                </div>
                <div className="h-8 w-20 rounded-lg bg-accent-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Floating elements */}
      <div className="absolute -right-4 -top-4 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-accent-600" />
          <span className="text-xs font-semibold text-slate-900">Sessão ao vivo</span>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <span className="text-xs font-semibold text-slate-900">4.9 média</span>
        </div>
      </div>
    </div>
  )
}

export default async function RootPage() {
  return (
    <PublicPageLayout>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute top-20 right-20 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute bottom-10 left-10 h-48 w-48 rounded-full bg-[#2563eb]/10 blur-2xl" />

        <div className="mu-shell relative grid gap-10 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <FadeIn direction="right">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-900/70">
                Atendimento em vídeo para quem mora fora
              </p>
              <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
                Profissionais brasileiros, no seu fuso, na sua língua
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-800">
                Psicólogos, nutricionistas, coaches e outros especialistas que entendem sua realidade.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800"
                >
                  Ver profissionais
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/registrar-profissional"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-slate-900 bg-transparent px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-slate-900/10"
                >
                  Quero atender
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
                    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
                  ].map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt=""
                      width={48}
                      height={48}
                      className="h-10 w-10 rounded-full border-2 border-[#9FE870] object-cover"
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-800">
                  <span className="font-bold text-slate-900">+200 profissionais</span> ativos
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="left" delay={0.2}>
            <ProductMockup />
          </FadeIn>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mu-shell flex flex-wrap items-center justify-center gap-6 py-10 md:gap-16">
          {STATS.map((stat, i) => {
            const Icon = stat.icon
            return (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-display text-2xl font-bold text-slate-900 md:text-3xl">{stat.value}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                </div>
              </FadeIn>
            )
          })}
        </div>
      </section>

      {/* ========== FOR WHO (carousel-like cards) ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase tracking-tight text-slate-900 md:text-5xl">
                Para quem está longe, mas perto
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Muuday conecta brasileiros no exterior com profissionais que entendem sua jornada.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
            {FOR_WHO.map(item => (
              <StaggerItem key={item.title}>
                <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="mu-section bg-[#9FE870]">
        <div className="mu-shell">
          <FadeIn>
            <div className="text-center">
              <h2 className="font-display text-4xl font-black uppercase tracking-tight text-slate-900 md:text-5xl">
                Três passos. Sem complicação.
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.15}>
            {HOW_STEPS.map(item => {
              const Icon = item.icon
              return (
                <StaggerItem key={item.step}>
                  <div className="relative rounded-2xl bg-white p-8 shadow-sm">
                    <span className="absolute right-6 top-6 font-display text-6xl font-black text-slate-100">
                      {item.step}
                    </span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== CATEGORIES ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase tracking-tight text-slate-900 md:text-5xl">
                Escolha por especialidade
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Oito áreas de atuação com profissionais revisados e prontos para atender.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
            {ALL_CATEGORIES.map(category => (
              <StaggerItem key={category.slug}>
                <Link
                  href={`/buscar?categoria=${category.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
                    <span className="text-2xl" aria-hidden="true">{category.icon}</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{category.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{category.description}</p>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600">
                    Ver profissionais
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="mu-section bg-slate-50">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase tracking-tight text-slate-900 md:text-5xl">
                O que dizem quem usa
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
            {TESTIMONIALS.map(t => (
              <StaggerItem key={t.name}>
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell grid gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
          <FadeIn direction="right">
            <div>
              <h2 className="font-display text-4xl font-black uppercase tracking-tight text-slate-900 md:text-5xl">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-lg text-slate-600">Ainda com dúvida? Entre em contato conosco.</p>
              <Link
                href="/ajuda"
                className="mt-6 inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-brand-300 hover:text-brand-600"
              >
                Fale com a equipe
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>

          <FadeIn direction="left" delay={0.15}>
            <FaqAccordion items={FAQ_ITEMS} />
          </FadeIn>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="mu-section">
        <div className="mu-shell">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-8 py-20 text-center text-white md:px-16 md:py-24">
              {/* Background decorations */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent-400/20" />
              <div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />

              <div className="relative">
                <h2 className="mx-auto max-w-3xl font-display text-4xl font-black uppercase tracking-tight md:text-5xl lg:text-6xl">
                  Comece agora
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/90">
                  Procure um especialista ou cadastre seu perfil para começar a atender.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/buscar"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-bold text-brand-600 transition hover:bg-slate-100"
                  >
                    Ver especialistas
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/cadastro?role=profissional"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/40 bg-white/10 px-8 py-4 text-base font-bold text-white transition hover:bg-white/20"
                  >
                    Criar perfil profissional
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PublicPageLayout>
  )
}
