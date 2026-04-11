import Link from 'next/link'
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Globe2,
  MessageSquareText,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
  Wallet,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { SEARCH_CATEGORIES } from '@/lib/search-config'

const heroSignals = [
  'Atendimento em vídeo com profissionais brasileiros verificados.',
  'Horários adaptados ao seu fuso, sem improviso de agenda.',
  'Sessão avulsa, recorrência ou várias datas no mesmo fluxo.',
]

const heroProducts = [
  {
    label: 'Busca com contexto',
    title: 'Compare com mais precisão',
    body: 'Categoria, subcategoria, especialidade, idioma, faixa de preço e disponibilidade no mesmo lugar.',
    tone: 'bg-[#edf5ff] border-[#c9dcf7]',
  },
  {
    label: 'Agendamento',
    title: 'Tudo pronto para converter',
    body: 'Sessão única, recorrente ou múltiplas datas, sem quebrar a jornada.',
    tone: 'bg-[#fff6de] border-[#f1d18f]',
  },
  {
    label: 'Operação',
    title: 'Acompanha depois do booking',
    body: 'Mensagens, lembretes, agenda e entrada na sessão conectados.',
    tone: 'bg-[#fff0e4] border-[#efc092]',
  },
]

const productLayers = [
  {
    eyebrow: 'Descoberta',
    title: 'Página pública com sinais reais',
    description: 'Perfis mais claros, especialidades organizadas e disponibilidade visível sem ruído visual.',
    icon: Sparkles,
  },
  {
    eyebrow: 'Sessão',
    title: 'Vídeo como formato padrão',
    description: 'A experiência inteira foi desenhada para vídeo, do primeiro clique ao acompanhamento recorrente.',
    icon: Video,
  },
  {
    eyebrow: 'Continuidade',
    title: 'Fluxo pensado para voltar',
    description: 'Recorrência, múltiplas datas e histórico operacional fazem parte do produto, não de um remendo.',
    icon: CalendarRange,
  },
]

const operationalPanels = [
  {
    title: 'Descoberta guiada',
    body: 'A landing prepara melhor a intenção de busca e leva para uma listagem mais coerente com o perfil público.',
    icon: Globe2,
    accent: 'from-[#eef6ff] to-white',
  },
  {
    title: 'Booking com clareza',
    body: 'Solicitação, confirmação, recorrência e múltiplas datas aparecem como partes do mesmo sistema.',
    icon: Clock3,
    accent: 'from-[#fff6de] to-white',
  },
  {
    title: 'Operação de verdade',
    body: 'Onboarding, agenda, financeiro, mensagens e sessão ao vivo reforçam que a Muuday é produto, não só vitrine.',
    icon: Wallet,
    accent: 'from-[#fff0e4] to-white',
  },
]

const faqItems = [
  {
    question: 'Preciso criar conta para pesquisar profissionais?',
    answer:
      'Não. A busca continua aberta. A conta entra quando você quer favoritar, agendar, solicitar atendimento ou acompanhar uma sessão.',
  },
  {
    question: 'Os atendimentos são sempre online?',
    answer:
      'Sim. A Muuday opera em formato vídeo-first. Isso deixa a agenda mais consistente para quem mora fora e simplifica a experiência dos dois lados.',
  },
  {
    question: 'Posso agendar recorrência ou várias datas de uma vez?',
    answer:
      'Sim. A plataforma suporta sessão única, múltiplas datas avulsas e recorrência com o mesmo dia e horário, dentro da janela disponível do profissional.',
  },
  {
    question: 'Como os profissionais entram na plataforma?',
    answer:
      'O onboarding passa por etapas de perfil, serviços, disponibilidade, plano e revisão antes de o profissional ficar público para agendamento.',
  },
]

export default async function RootPage() {
  return (
    <PublicPageLayout>
      <section className="relative overflow-hidden border-b border-[#d9e3ef] bg-[#f7fbff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.18),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.2),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.24),rgba(255,255,255,0))]" />
        <div className="pointer-events-none absolute left-[6%] top-24 h-52 w-52 rounded-full bg-[#60a5fa]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[10%] top-40 h-40 w-40 rounded-full bg-[#fbbf24]/20 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-14 pt-10 md:px-8 md:pb-20 md:pt-14">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c9dcf7] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f4fa8] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Brasileiros conectando brasileiros no mundo
            </span>

            <div className="mt-7 space-y-4">
              <p className="font-display text-[18px] italic tracking-[-0.02em] text-[#0f4fa8]/80 md:text-[22px]">
                Descobrir melhor. Agendar com mais contexto. Voltar sem fricção.
              </p>
              <h1 className="font-display text-[3.4rem] font-bold leading-[0.9] tracking-[-0.055em] text-slate-950 md:text-[5.9rem]">
                A plataforma para encontrar o profissional brasileiro certo, online e no seu ritmo.
              </h1>
            </div>

            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-slate-600 md:text-[18px]">
              A Muuday organiza a jornada inteira em português: descoberta, comparação, agendamento, sessão em vídeo e
              continuidade. Menos atrito, mais confiança e uma experiência que parece produto desde o primeiro scroll.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f4fa8] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(15,79,168,0.24)] transition hover:bg-[#0b3f88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f4fa8]/30"
              >
                Buscar profissionais
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/registrar-profissional"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c8dcf6] bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-[#0f4fa8] hover:text-[#0f4fa8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f4fa8]/20"
              >
                Quero atender pela Muuday
              </Link>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.3fr_0.8fr] lg:items-start">
            <div className="space-y-4 lg:pt-12">
              {heroSignals.map(item => (
                <div
                  key={item}
                  className="rounded-[1.8rem] border border-[#d7e7fa] bg-white/88 px-5 py-5 shadow-[0_20px_45px_rgba(15,79,168,0.08)] backdrop-blur"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#0f4fa8]" />
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 top-10 -z-10 h-60 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.24),transparent_60%)] blur-3xl" />
              <div className="overflow-hidden rounded-[2.7rem] border border-[#d7e6fa] bg-white p-4 shadow-[0_36px_90px_rgba(15,79,168,0.16)] md:p-5">
                <div className="rounded-[2.2rem] bg-[linear-gradient(135deg,#edf5ff,#fff6de_64%,#fff)] p-4 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">Muuday product view</p>
                      <p className="mt-1 text-[26px] font-semibold leading-tight text-slate-950 md:text-[30px]">
                        Descobrir, reservar e acompanhar sem trocar de contexto.
                      </p>
                    </div>
                    <span className="rounded-full border border-[#f3cc79] bg-white/90 px-3 py-1 text-xs font-semibold text-[#9a5b00]">
                      vídeo-first
                    </span>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-[1.9rem] border border-white/80 bg-[#07111f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-white">Fluxo de agendamento com cara de produto</p>
                        <p className="text-xs text-white/60">Busca, perfil, decisão e continuidade na mesma superfície.</p>
                      </div>
                      <PlayCircle className="h-8 w-8 text-[#fbbf24]" />
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-white/50">Profissional em destaque</p>
                            <p className="mt-1 text-lg font-semibold text-white">Psicóloga clínica • Londres</p>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                            Sessão por vídeo
                          </div>
                        </div>

                        <div className="mt-4 rounded-[1.5rem] bg-white p-4 text-slate-900">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">Resumo do perfil</p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">
                                Ansiedade, adaptação no exterior e rotina emocional em português.
                              </p>
                            </div>
                            <div className="rounded-full bg-[#edf5ff] px-3 py-1 text-xs font-semibold text-[#0f4fa8]">
                              4.9
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-[#f7fbff] px-3 py-3">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Categoria</p>
                              <p className="mt-1 text-sm font-semibold">Saúde mental e bem-estar</p>
                            </div>
                            <div className="rounded-2xl bg-[#fff7e8] px-3 py-3">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Próximo horário</p>
                              <p className="mt-1 text-sm font-semibold">Quarta • 19:30 (BST)</p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {['Português', 'Terapia online', 'Recorrência disponível'].map(tag => (
                              <span
                                key={tag}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[1.5rem] bg-[#0f4fa8] px-4 py-4 text-white shadow-[0_20px_40px_rgba(15,79,168,0.25)]">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/65">Step 01</p>
                          <p className="mt-2 text-lg font-semibold">Busca por categoria, subcategoria e especialidade.</p>
                        </div>
                        <div className="rounded-[1.5rem] bg-[#fff3d1] px-4 py-4 text-slate-900">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a5b00]">Step 02</p>
                          <p className="mt-2 text-lg font-semibold">Escolha sessão avulsa, recorrente ou várias datas.</p>
                        </div>
                        <div className="rounded-[1.5rem] bg-white px-4 py-4 text-slate-900">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[#f59e0b]">Step 03</p>
                          <p className="mt-2 text-lg font-semibold">Receba lembretes, volte e continue no mesmo espaço.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-7 top-20 hidden rounded-[1.6rem] border border-[#d7e7fa] bg-white/92 px-4 py-4 shadow-[0_18px_45px_rgba(15,79,168,0.12)] lg:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0f4fa8]">Lembrete</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">24h</p>
                <p className="text-sm text-slate-500">antes da sessão</p>
              </div>

              <div className="absolute -right-7 bottom-8 hidden rounded-[1.6rem] border border-[#f0d190] bg-[#fff6df] px-4 py-4 shadow-[0_18px_45px_rgba(245,158,11,0.16)] lg:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a5b00]">Modo</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">3x</p>
                <p className="text-sm text-slate-600">única, recorrente, múltiplas datas</p>
              </div>
            </div>

            <div className="space-y-4 lg:pt-10">
              {heroProducts.map(item => (
                <div
                  key={item.title}
                  className={`rounded-[2rem] border px-5 py-5 shadow-[0_18px_40px_rgba(15,79,168,0.07)] ${item.tone}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-[22px] font-semibold leading-tight text-slate-950">{item.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                </div>
              ))}
              <div className="rounded-[2rem] bg-slate-950 px-5 py-5 text-white shadow-[0_25px_60px_rgba(15,23,42,0.24)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Para profissionais</p>
                <p className="mt-3 text-xl font-semibold leading-tight">
                  Onboarding guiado, plano, revisão e perfil público preparados para operar de forma coerente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#d9e3ef] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 md:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Construída para uma jornada mais clara
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {['Psicologia', 'Nutrição', 'Direito', 'Contabilidade'].map(item => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-sm font-semibold text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
        <div className="rounded-[2.7rem] border border-[#d8e7fa] bg-[linear-gradient(135deg,#edf5ff,#ffffff_52%,#fff5d8)] p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-[#c8dcf6] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
                Design do produto
              </span>
              <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.05em] text-slate-950 md:text-5xl">
                A landing precisa soar premium sem perder clareza operacional.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                O refinamento visual não serve para “embelezar” isoladamente. Ele precisa ajudar a contar melhor o que
                a Muuday já faz: descoberta forte, booking claro e continuidade bem resolvida.
              </p>

              <div className="mt-8 space-y-4">
                {productLayers.map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="flex gap-4 rounded-[1.7rem] border border-white/80 bg-white/70 px-4 py-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf5ff] text-[#0f4fa8]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.eyebrow}</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {operationalPanels.map(panel => {
                const Icon = panel.icon
                return (
                  <div
                    key={panel.title}
                    className={`rounded-[1.9rem] border border-white/80 bg-gradient-to-br ${panel.accent} p-5 shadow-sm`}
                  >
                    <Icon className="h-5 w-5 text-[#0f4fa8]" />
                    <p className="mt-4 text-xl font-semibold text-slate-950">{panel.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{panel.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="mb-8 flex flex-col gap-3 md:max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Comece pela categoria certa</span>
          <h2 className="font-display text-4xl font-bold tracking-[-0.05em] text-slate-950 md:text-5xl">
            Descoberta guiada por quem já sabe que precisa resolver.
          </h2>
          <p className="text-base leading-7 text-slate-600">
            Em vez de parecer uma listagem genérica, a Muuday pode puxar a conversa para intenção, contexto e clareza.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SEARCH_CATEGORIES.slice(0, 6).map((category, index) => (
            <Link
              key={category.slug}
              href={`/buscar?categoria=${category.slug}`}
              className={`group overflow-hidden rounded-[2rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,79,168,0.12)] ${
                index % 3 === 0
                  ? 'border-[#d7e8fb] bg-[#eef6ff]'
                  : index % 3 === 1
                    ? 'border-[#ffd78f] bg-[#fff6df]'
                    : 'border-[#f4c59a] bg-[#fff0e5]'
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Categoria</p>
              <p className="mt-4 text-2xl font-semibold leading-tight text-slate-950">
                {category.icon} {category.name}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Explore perfis, disponibilidade, experiência e o melhor formato de atendimento para o seu caso.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0f4fa8]">
                Ver profissionais
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffd37d]">
                O que a Muuday sustenta
              </span>
              <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.05em] text-white md:text-5xl">
                Uma jornada inteira, não só um catálogo.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                A landing ficou melhor quando começou a parecer continuação do produto: descoberta pública, área logada,
                booking, sessão e operação conectados pela mesma linguagem.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'Busca aberta para visitante e fluxo autenticado para avançar sem se perder.',
                  'Agenda, configurações, mensagens e financeiro articulados para profissionais.',
                  'Sessão em vídeo e continuidade pensadas como parte central da proposta.',
                ].map(item => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ffd37d]" />
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                <MessageSquareText className="h-6 w-6 text-[#ffd37d]" />
                <p className="mt-4 text-xl font-semibold">Descoberta com contexto</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Perfil público mais forte, taxonomia mais clara e sinais visuais que ajudam a decidir antes do booking.
                </p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
                <Wallet className="h-6 w-6 text-[#60a5fa]" />
                <p className="mt-4 text-xl font-semibold">Operação preparada</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Billing, agenda, lembretes e trilha de onboarding aparecem como parte de uma operação séria, não improvisada.
                </p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(96,165,250,0.12),rgba(255,255,255,0.02))] p-5 md:col-span-2">
                <div className="flex items-center gap-2 text-[#ffd37d]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-2xl font-semibold text-white">
                  “Mais composição de marca na frente. Mais sensação de produto no centro. Mais coerência no fechamento.”
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Essa segunda rodada visual foi desenhada para isso: menos blocos neutros, mais direção, mais clareza e uma presença mais forte da Muuday.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="inline-flex rounded-full border border-[#d7e8fb] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
              Perguntas frequentes
            </span>
            <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.05em] text-slate-950 md:text-5xl">
              O essencial, respondido sem ornamentação.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              A FAQ precisa fechar a conversa com clareza e confiança antes da busca ou do cadastro profissional.
            </p>
            <div className="mt-8">
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f4fa8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3f88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f4fa8]/30"
              >
                Começar a buscar
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div
                key={item.question}
                className={`rounded-[2rem] border p-5 ${
                  index === 1 ? 'border-[#ffd78f] bg-[#fff7e6]' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-lg font-semibold text-slate-950">{item.question}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8 md:pb-20">
        <div className="overflow-hidden rounded-[3rem] border border-[#d6e6fb] bg-[linear-gradient(135deg,#0f4fa8,#183b87_55%,#f59e0b_150%)] p-7 text-white shadow-[0_30px_80px_rgba(15,79,168,0.22)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffe0a6]">
                Pronta para a próxima camada
              </span>
              <h2 className="mt-5 font-display text-4xl font-bold tracking-[-0.05em] text-white md:text-5xl">
                Uma landing mais forte para um produto que já está ficando mais coerente.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100">
                A direção visual agora prepara melhor o terreno para onboarding, busca, perfil público, booking e sessão.
                O objetivo não é parecer outra empresa. É deixar a Muuday mais precisa, mais memorável e mais confiável.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0f4fa8] transition hover:bg-slate-100"
              >
                Buscar profissionais
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/planos"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
