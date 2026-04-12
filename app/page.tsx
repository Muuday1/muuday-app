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
  { value: '100%', label: 'atendimento em vídeo' },
  { value: '6+', label: 'categorias profissionais' },
  { value: '24/7', label: 'agendamento global' },
]

const FEATURES = [
  {
    icon: Search,
    title: 'Busca inteligente',
    body: 'Encontre por categoria, especialidade, idioma, país e disponibilidade no mesmo fluxo.',
  },
  {
    icon: CalendarCheck,
    title: 'Agendamento flexível',
    body: 'Sessão única, recorrência ou várias datas, com ajuste de fuso no mesmo fluxo de busca.',
  },
  {
    icon: Video,
    title: 'Videochamada em toda etapa',
    body: 'Atendimento remoto de ponta a ponta, com contexto profissional e previsibilidade de agenda.',
  },
  {
    icon: ShieldCheck,
    title: 'Perfis confiáveis',
    body: 'Todos os perfis passam por revisão antes de ficar públicos para atendimento.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Busque',
    body: 'Encontre um profissional por filtros claros e com contexto da língua e experiência.',
  },
  {
    step: '02',
    title: 'Agende',
    body: 'Escolha horário, duração e modo de atendimento com confirmação transparente.',
  },
  {
    step: '03',
    title: 'Conecte',
    body: 'Realize a sessão em videochamada com o profissional e mantenha toda comunicação no fluxo.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Preciso criar conta para pesquisar profissionais?',
    answer:
      'Não. A busca funciona sem cadastro. A conta é necessária para favoritos, mensagens, agendamento e histórico.',
  },
  {
    question: 'Os atendimentos são sempre online?',
    answer:
      'Sim. A Muuday opera em formato video-first para manter agenda e experiência consistentes para quem está fora do Brasil.',
  },
  {
    question: 'Posso agendar recorrência ou várias datas?',
    answer:
      'Sim. O fluxo permite sessão única, recorrência e múltiplas datas conforme disponibilidade publicada.',
  },
  {
    question: 'Como funciona a entrada de profissionais?',
    answer:
      'Há um onboarding guiado com validação por etapas para perfil público, serviços, disponibilidade, faturamento e aprovação.',
  },
]

const TOP_CATEGORIES = SEARCH_CATEGORIES.slice(0, 4)

export default async function RootPage() {
  return (
    <PublicPageLayout>
      <section className="relative overflow-hidden bg-[var(--mu-surface-muted)] py-10 md:py-[56px] lg:py-16">
        <div className="pointer-events-none absolute -left-40 -top-44 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(26,138,80,0.08),transparent_74%)]" />
        <div className="pointer-events-none absolute -right-36 top-8 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.08),transparent_74%)]" />

        <div className="mu-shell relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="mx-auto w-full max-w-[38rem] lg:mx-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-brand-700">
              <Globe className="h-3.5 w-3.5" />
              Conectando brasileiros no exterior.
            </p>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--mu-text)] md:text-6xl">
              Seu atendimento ao alcance de quem precisa.
            </h1>
            <p className="mt-5 max-w-[46ch] text-base leading-7 text-[var(--mu-muted)]">
              Encontre profissionais brasileiros fora do país, com contexto linguístico e cultural, em uma experiência de busca
              feita para agenda real.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/buscar" className="mu-btn-primary inline-flex items-center justify-center gap-2">
                Buscar profissionais
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/registrar-profissional" className="mu-btn-outline inline-flex items-center justify-center gap-2">
                Sou profissional
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="mu-shell-card-lg relative overflow-hidden bg-white p-2 md:p-3">
              <Image
                src="/assets/marketing/landing/hero-main.webp"
                alt="Interface da Muuday para busca e agenda de profissionais"
                width={1360}
                height={820}
                className="w-full rounded-[var(--mu-radius-lg)] object-cover"
                priority
              />

              <div className="absolute left-3 top-3 flex flex-col gap-3 md:left-4 md:top-4">
                <p className="inline-flex max-w-[10rem] rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-brand-700 shadow-[var(--mu-shadow-sm)] md:max-w-none">
                  Perfis verificados para atendimento.
                </p>
                <p className="inline-flex max-w-[10rem] rounded-xl bg-brand-600/95 px-3 py-2 text-xs font-semibold text-white shadow-[var(--mu-shadow-sm)]">
                  Agenda no seu fuso
                </p>
              </div>

              <div className="absolute right-3 bottom-3 grid min-w-[11rem] gap-2 rounded-xl border border-white/60 bg-white/85 p-3 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold text-[var(--mu-muted)]">Destaque da semana</p>
                <p className="text-sm font-semibold text-[var(--mu-text)]">+200 profissionais ativos</p>
                <div className="flex items-center gap-2 text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-xs font-semibold text-[var(--mu-muted)]">Perfil público organizado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="mu-section">
        <div className="mu-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Por que a Muuday</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Foco em confiança e resultado.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {FEATURES.map(feature => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className="mu-shell-card p-6 transition hover:border-brand-300 hover:shadow-[var(--mu-shadow-md)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[var(--mu-radius-sm)] bg-brand-50 text-brand-700">
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

      <section className="mu-section border-y border-brand-100 bg-white">
        <div className="mu-shell">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Como funciona</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              3 passos. Sem ruído.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map(item => (
              <div key={item.step} className="relative rounded-[var(--mu-radius-md)] border border-brand-100 bg-brand-50 p-6">
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

      <section className="mu-section">
        <div className="mu-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Categorias</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Escolha por área de atuação.
            </h2>
            <p className="mu-copy mt-4 text-sm leading-7 text-[var(--mu-muted)]">
              Filtros alinhados para evitar ruído na busca e reduzir conflito entre especialidade, idioma e disponibilidade.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {TOP_CATEGORIES.map(category => (
              <Link
                key={category.slug}
                href={`/buscar?categoria=${category.slug}`}
                className="mu-shell-card p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_10px_32px_rgba(16,35,24,0.08)]"
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

      <section className="mu-section border-t border-brand-100 bg-white">
        <div className="mu-shell grid gap-12 lg:grid-cols-[0.45fr_0.55fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">FAQ</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Perguntas frequentes
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--mu-muted)]">Ainda com dúvida? entre em contato conosco.</p>
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

      <section className="mu-section">
        <div className="mu-shell">
          <div className="rounded-[var(--mu-radius-lg)] bg-brand-700 px-8 py-10 text-center text-white md:px-10 md:py-12">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-[-0.03em]">
              Pronto para começar?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/90">
              Busque profissionais agora, ou registre seu perfil e comece a ser encontrado por quem precisa.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/buscar" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-[var(--mu-surface-soft)]">
                Buscar profissionais
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/cadastro?role=profissional" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/45 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                Quero me cadastrar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}



