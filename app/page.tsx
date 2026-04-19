import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  Globe,
  Search,
  ShieldCheck,
  Star,
  Video,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { FaqAccordion } from '@/components/landing/FaqAccordion'
import { SEARCH_CATEGORIES } from '@/lib/search-config'

const STATS = [
  { value: '100%', label: 'online por vídeo' },
  { value: '6+', label: 'áreas de atuação' },
  { value: '24/7', label: 'agende a qualquer hora' },
]

const FEATURES = [
  {
    icon: Search,
    title: 'Filtros que fazem sentido',
    body: 'Busque por especialidade, idioma, país e horário. Sem enrolação.',
  },
  {
    icon: CalendarCheck,
    title: 'Agende do seu jeito',
    body: 'Uma sessão, várias, ou recorrente. O fuso horário é ajustado automaticamente.',
  },
  {
    icon: Video,
    title: 'Videochamada integrada',
    body: 'Da busca à sessão, tudo acontece aqui. Sem precisar de Zoom, Teams ou WhatsApp.',
  },
  {
    icon: ShieldCheck,
    title: 'Profissionais revisados',
    body: 'Cada perfil é verificado antes de entrar no ar. Você sabe com quem está falando.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Busque',
    body: 'Use filtros práticos para encontrar quem entende sua situação.',
  },
  {
    step: '02',
    title: 'Agende',
    body: 'Escolha dia e horário. A confirmação chega na hora.',
  },
  {
    step: '03',
    title: 'Conecte',
    body: 'Faça a sessão por vídeo aqui mesmo. Tudo registrado em um só lugar.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Preciso criar conta para pesquisar profissionais?',
    answer:
      'Não. Você pode procurar sem cadastro. Só precisa de conta para agendar, salvar favoritos ou mandar mensagem.',
  },
  {
    question: 'Os atendimentos são sempre online?',
    answer:
      'Sim, todos por videochamada. Assim você pode atender ou ser atendido de qualquer lugar.',
  },
  {
    question: 'Posso agendar recorrência ou várias datas?',
    answer:
      'Sim. Uma vez, toda semana, ou várias datas diferentes. Você escolhe.',
  },
  {
    question: 'Como funciona a entrada de profissionais?',
    answer:
      'É simples: você cria seu perfil, define serviços e preços, e publica sua disponibilidade. A equipe revisa antes de aprovar.',
  },
]

const TOP_CATEGORIES = SEARCH_CATEGORIES.slice(0, 4)

function GeometricHero() {
  return (
    <div className="relative hidden h-[420px] w-full lg:block">
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(34,197,94,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(34,197,94,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating shapes */}
      <div className="absolute top-8 left-8 h-14 w-14 rotate-12 rounded-lg border border-brand-200" />
      <div className="absolute top-16 right-16 h-20 w-20 rounded-full border border-brand-200" />
      <div className="absolute bottom-16 left-16 h-10 w-10 -rotate-12 rounded-md bg-brand-50" />
      <div className="absolute bottom-24 right-24 h-16 w-24 rotate-6 rounded-lg border border-brand-200" />
      <div className="absolute top-1/2 left-1/3 h-8 w-8 -translate-y-1/2 rounded-full border-2 border-brand-100" />

      {/* Central card mockup */}
      <div className="absolute top-1/2 left-1/2 w-56 -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-lg border border-brand-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-brand-50" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-20 rounded bg-brand-100" />
              <div className="h-1.5 w-14 rounded bg-brand-50" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded bg-brand-50" />
            <div className="h-1.5 w-4/5 rounded bg-brand-50" />
          </div>
        </div>
        <div className="mt-2 rounded-lg border border-brand-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-brand-100" />
            <div className="h-2 w-16 rounded bg-brand-50" />
          </div>
        </div>
      </div>

      {/* Connector lines SVG */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <line
          x1="80"
          y1="80"
          x2="200"
          y2="180"
          stroke="rgba(34,197,94,0.12)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1="350"
          y1="120"
          x2="280"
          y2="200"
          stroke="rgba(34,197,94,0.12)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1="120"
          y1="320"
          x2="220"
          y2="260"
          stroke="rgba(34,197,94,0.12)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle cx="350" cy="120" r="3" fill="rgba(34,197,94,0.2)" />
        <circle cx="80" cy="80" r="3" fill="rgba(34,197,94,0.2)" />
        <circle cx="120" cy="320" r="3" fill="rgba(34,197,94,0.2)" />
      </svg>
    </div>
  )
}

export default async function RootPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--mu-surface-muted)] py-10 md:py-[56px] lg:py-16">
        <div className="mu-shell relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="mx-auto w-full max-w-[38rem] lg:mx-0">
            <p className="inline-flex items-center gap-2 rounded-md border border-brand-100 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-brand-700">
              <Globe className="h-3.5 w-3.5" />
              Atendimento em vídeo para quem mora fora
            </p>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--mu-text)] md:text-6xl">
              Profissionais brasileiros, no seu fuso, na sua língua.
            </h1>
            <p className="mt-5 max-w-[46ch] text-base leading-7 text-[var(--mu-muted)]">
              Psicólogos, nutricionistas, coaches e outros especialistas que entendem sua realidade — porque também passaram por isso.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/buscar" className="mu-btn-primary inline-flex items-center justify-center gap-2">
                Ver profissionais disponíveis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/registrar-profissional" className="mu-btn-outline inline-flex items-center justify-center gap-2">
                Quero atender pela Muuday
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <GeometricHero />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-brand-100 bg-[var(--mu-surface)]">
        <div className="mu-shell flex flex-wrap items-center justify-center gap-8 py-8 text-center">
          {STATS.map(stat => (
            <div key={stat.label} className="w-full sm:w-auto">
              <p className="font-display text-3xl font-semibold text-brand-700 md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-[var(--mu-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mu-section">
        <div className="mu-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">O que você encontra aqui</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Encontre quem fala a mesma língua — literalmente.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {FEATURES.map(feature => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className="mu-shell-card p-6 transition hover:border-brand-300">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-[var(--mu-text)]">{feature.title}</h3>
                  <p className="mu-copy mt-2 text-sm leading-7 text-[var(--mu-muted)]">{feature.body}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mu-section border-y border-brand-100 bg-white">
        <div className="mu-shell">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Como funciona</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Três passos. Nada de complicação.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map(item => (
              <div key={item.step} className="relative rounded-lg border border-brand-100 bg-brand-50 p-6">
                <span className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 font-semibold text-white">
                  {item.step}
                </span>
                <h3 className="text-2xl font-semibold text-[var(--mu-text)]">{item.title}</h3>
                <p className="mu-copy mt-3 text-sm leading-7 text-[var(--mu-muted)]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mu-section">
        <div className="mu-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Categorias</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Escolha por especialidade.
            </h2>
            <p className="mu-copy mt-4 text-sm leading-7 text-[var(--mu-muted)]">
              Cada categoria tem profissionais que combinam expertise com a experiência de viver fora do Brasil.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {TOP_CATEGORIES.map(category => (
              <Link
                key={category.slug}
                href={`/buscar?categoria=${category.slug}`}
                className="mu-shell-card p-5 transition hover:-translate-y-0.5 hover:border-brand-300"
              >
                <span className="text-3xl" aria-hidden="true">
                  {category.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--mu-text)]">{category.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--mu-muted)]">{category.description}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  Ver profissionais
                  <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mu-section border-t border-brand-100 bg-white">
        <div className="mu-shell grid gap-12 lg:grid-cols-[0.45fr_0.55fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">FAQ</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Perguntas frequentes
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--mu-muted)]">Ainda com dúvida? Entre em contato conosco.</p>
            <Link
              href="/ajuda"
              className="mu-btn-outline mt-6 inline-flex items-center gap-1.5 text-sm"
            >
              Fale com a equipe
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </section>

      {/* CTA */}
      <section className="mu-section">
        <div className="mu-shell">
          <div className="rounded-xl bg-brand-700 px-8 py-10 text-center text-white md:px-10 md:py-12">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-[-0.03em]">
              Comece agora.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/90">
              Procure um especialista ou cadastre seu perfil para começar a atender.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/buscar" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
                Ver especialistas
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/cadastro?role=profissional" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/45 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                Criar perfil profissional
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
