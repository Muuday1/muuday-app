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

/* ───────────────────────── data ───────────────────────── */

const STATS = [
  { value: '100%', label: 'Online via video' },
  { value: '6+', label: 'Categorias profissionais' },
  { value: '24/7', label: 'Agendamento global' },
]

const FEATURES = [
  {
    icon: Search,
    title: 'Busca inteligente',
    body: 'Encontre por categoria, especialidade, idioma, pais e disponibilidade. Tudo num fluxo so.',
  },
  {
    icon: CalendarCheck,
    title: 'Agendamento flexivel',
    body: 'Sessao unica, recorrencia semanal ou varias datas de uma vez. No seu fuso, sem surpresas.',
  },
  {
    icon: Video,
    title: 'Sessao em video',
    body: 'Toda consulta acontece por video. Sem deslocamento, sem fronteiras, com o profissional certo.',
  },
  {
    icon: ShieldCheck,
    title: 'Profissionais verificados',
    body: 'Cada perfil passa por revisao antes de ficar publico. Credenciais, experiencia e qualificacoes checadas.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Busque',
    body: 'Explore profissionais por area, especialidade, idioma e horario disponivel.',
  },
  {
    step: '02',
    title: 'Agende',
    body: 'Escolha a data e horario que funcionam para voce. Confirmacao instantanea ou sob aprovacao.',
  },
  {
    step: '03',
    title: 'Conecte',
    body: 'Sua sessao em video acontece direto na plataforma. Facil, privado e no seu fuso horario.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Preciso criar conta para pesquisar profissionais?',
    answer:
      'Nao. A busca e aberta para todos. A conta so e necessaria quando voce quer favoritar, agendar ou acompanhar uma sessao.',
  },
  {
    question: 'Os atendimentos sao sempre online?',
    answer:
      'Sim. A Muuday opera em formato video-first. Isso garante consistencia de agenda para quem mora fora e simplifica a experiencia dos dois lados.',
  },
  {
    question: 'Posso agendar recorrencia ou varias datas de uma vez?',
    answer:
      'Sim. A plataforma suporta sessao unica, multiplas datas avulsas e recorrencia com o mesmo dia e horario, dentro da janela disponivel do profissional.',
  },
  {
    question: 'Como os profissionais entram na plataforma?',
    answer:
      'O onboarding passa por etapas de perfil, servicos, disponibilidade, plano e revisao antes de o profissional ficar publico para agendamento.',
  },
]

const TOP_CATEGORIES = SEARCH_CATEGORIES.slice(0, 4)

/* ───────────────────────── page ───────────────────────── */

export default async function RootPage() {
  return (
    <PublicPageLayout>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white">
        {/* subtle gradient orbs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(15,79,168,0.06),transparent_70%)]" />
        <div className="pointer-events-none absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.06),transparent_70%)]" />

        <div className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-16 text-center md:px-8 md:pb-24 md:pt-24">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-600">
            <Globe className="h-3.5 w-3.5 text-brand-500" />
            Brasileiros conectando brasileiros no mundo
          </div>

          <h1 className="mx-auto mt-8 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-neutral-950 md:text-6xl lg:text-7xl">
            Seu profissional brasileiro.{' '}
            <span className="text-brand-500">Online.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-neutral-500 md:text-lg md:leading-8">
            Encontre, agende e conecte com profissionais brasileiros verificados.
            Sessoes em video, no seu fuso, sem complicacao.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/buscar"
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-neutral-900/20 transition hover:bg-neutral-800"
            >
              Buscar profissionais
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/registrar-profissional"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-7 py-3.5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900"
            >
              Sou profissional
            </Link>
          </div>

          {/* Hero product mockup area */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-2xl shadow-neutral-900/8">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-neutral-200" />
                  <div className="h-3 w-3 rounded-full bg-neutral-200" />
                  <div className="h-3 w-3 rounded-full bg-neutral-200" />
                </div>
                <div className="ml-4 flex-1 rounded-lg bg-neutral-100 px-4 py-1.5 text-xs text-neutral-400">
                  muuday.com/buscar
                </div>
              </div>

              {/* Mock product UI */}
              <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
                {/* Professional card 1 */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-600">
                      A
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Ana Silva</p>
                      <p className="text-xs text-neutral-500">Psicologa Clinica</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">Portugues</span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">Ingles</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-semibold">4.9</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">R$ 180</span>
                  </div>
                </div>

                {/* Professional card 2 */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-50 text-lg font-bold text-accent-700">
                      R
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Ricardo Mendes</p>
                      <p className="text-xs text-neutral-500">Advogado Tributario</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">Portugues</span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">Espanhol</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-semibold">4.8</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">R$ 250</span>
                  </div>
                </div>

                {/* Professional card 3 */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-lg font-bold text-emerald-600">
                      C
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Carla Oliveira</p>
                      <p className="text-xs text-neutral-500">Nutricionista Clinica</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">Portugues</span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-600">Frances</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-semibold">5.0</span>
                    </div>
                    <span className="text-sm font-semibold text-neutral-900">R$ 150</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-8 px-4 py-8 sm:flex-row sm:gap-16 md:px-8 md:py-10">
          {STATS.map(stat => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-neutral-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 md:px-8 md:py-28">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
              Por que a Muuday
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold tracking-[-0.03em] text-neutral-950 md:text-4xl">
              Tudo que voce precisa para encontrar e conectar
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {FEATURES.map(feature => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5 md:p-8"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 transition group-hover:bg-brand-50 group-hover:text-brand-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-neutral-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-500">{feature.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 md:px-8 md:py-28">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
              Como funciona
            </p>
            <h2 className="mx-auto mt-4 max-w-xl font-display text-3xl font-bold tracking-[-0.03em] text-neutral-950 md:text-4xl">
              Tres passos. Sem complicacao.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map(item => (
              <div key={item.step} className="text-center md:text-left">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 font-display text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-5 text-xl font-semibold text-neutral-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-neutral-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 md:px-8 md:py-28">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
              Categorias
            </p>
            <h2 className="mx-auto mt-4 max-w-xl font-display text-3xl font-bold tracking-[-0.03em] text-neutral-950 md:text-4xl">
              Encontre por area de atuacao
            </h2>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOP_CATEGORIES.map(category => (
              <Link
                key={category.slug}
                href={`/buscar?categoria=${category.slug}`}
                className="group rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-900/5"
              >
                <span className="text-3xl">{category.icon}</span>
                <h3 className="mt-4 text-base font-semibold text-neutral-900 group-hover:text-brand-600">
                  {category.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {category.description}
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 opacity-0 transition group-hover:opacity-100">
                  Explorar
                  <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/buscar"
              className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-neutral-900"
            >
              Ver todas as categorias
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 md:px-8 md:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                FAQ
              </p>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] text-neutral-950 md:text-4xl">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-500 md:text-base">
                Nao encontrou sua resposta?
              </p>
              <Link
                href="/ajuda"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 transition hover:text-brand-700"
              >
                Fale conosco
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <FaqAccordion items={FAQ_ITEMS} />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-20 md:px-8 md:py-28">
          <div className="rounded-3xl bg-neutral-950 px-8 py-16 text-center md:px-16 md:py-20">
            <h2 className="mx-auto max-w-lg font-display text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
              Pronto para encontrar seu profissional?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-neutral-400">
              Busca aberta, sem compromisso. Crie sua conta quando quiser avancar.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/buscar"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
              >
                Buscar profissionais
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/registrar-profissional"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Sou profissional
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
