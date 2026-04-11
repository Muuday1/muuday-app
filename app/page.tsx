import Link from 'next/link'
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Globe2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { SEARCH_CATEGORIES } from '@/lib/search-config'

const heroSignals = [
  'Atendimento em vídeo com profissionais brasileiros verificados.',
  'Horários adaptados ao seu fuso, sem improviso de agenda.',
  'Sessão avulsa, recorrência ou várias datas no mesmo fluxo.',
]

const supportBlocks = [
  {
    title: 'Busca com contexto',
    body: 'Categoria, subcategoria, especialidade, idioma e disponibilidade no mesmo fluxo.',
    icon: Globe2,
  },
  {
    title: 'Booking claro',
    body: 'Sessão única, recorrente ou várias datas com uma lógica de produto consistente.',
    icon: CalendarRange,
  },
  {
    title: 'Continuidade real',
    body: 'Mensagens, lembretes e sessão em vídeo conectados depois do agendamento.',
    icon: MessageSquareText,
  },
]

const productHighlights = [
  {
    title: 'Descoberta guiada',
    body: 'Perfis mais claros e uma taxonomia mais útil para decidir antes do contato.',
  },
  {
    title: 'Vídeo como padrão',
    body: 'A experiência inteira foi desenhada para atendimento online, não adaptada depois.',
  },
  {
    title: 'Voltar sem fricção',
    body: 'Histórico, múltiplas datas e recorrência reforçam continuidade em vez de atrito.',
  },
]

const faqItems = [
  {
    question: 'Preciso criar conta para pesquisar profissionais?',
    answer:
      'Não. A busca continua aberta. A conta entra quando você quer favoritar, solicitar atendimento, agendar ou acompanhar uma sessão.',
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

function HeroProductStage() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#d7e7fa] bg-white p-3 shadow-[0_24px_70px_rgba(15,79,168,0.12)] md:p-4">
      <div className="rounded-[1.7rem] bg-[linear-gradient(135deg,#eef5ff,#ffffff_58%,#fff5dc)] p-4 md:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">Muuday experience</p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950 md:text-2xl">
              Descobrir, reservar e acompanhar no mesmo contexto.
            </p>
          </div>
          <span className="rounded-full border border-[#f1d18d] bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#9a5b00]">
            vídeo-first
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <figure className="relative overflow-hidden rounded-[1.55rem] border border-[#dbe8f7] bg-[#0b1423] p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Profissional em destaque</p>
                <p className="mt-1 text-sm font-semibold text-white md:text-base">Psicóloga clínica • Londres</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/75">4.9</span>
            </div>

            <div className="mt-4 aspect-[4/3] overflow-hidden rounded-[1.3rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.22),transparent_30%),linear-gradient(180deg,#101c31,#0b1423)] p-4">
              <div className="flex h-full flex-col justify-between rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-[14rem]">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Janela de agenda</p>
                    <p className="mt-2 text-base font-semibold text-white">Quarta • 19:30</p>
                    <p className="mt-1 text-sm leading-6 text-white/65">Fuso adaptado, confirmação clara e continuidade depois do booking.</p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-[1rem] bg-white/10 text-[#ffd37d]">
                    <Video className="h-6 w-6" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {['Português', 'Atendimento online', 'Recorrência disponível'].map(tag => (
                    <div key={tag} className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-xs font-medium text-white/80">
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </figure>

          <div className="grid gap-3">
            <div className="rounded-[1.4rem] border border-[#dbe8f7] bg-white px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Etapa 01</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Descoberta com taxonomia mais útil</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Categoria, subcategoria e especialidade ajudam a decidir antes do contato.</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#f1d18d] bg-[#fff7e4] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a5b00]">Etapa 02</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Agendamento com menos atrito</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Sessão única, múltiplas datas e recorrência tratados como partes do mesmo sistema.</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#dbe8f7] bg-[#eef5ff] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f4fa8]">Etapa 03</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Continuidade na mesma experiência</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Mensagens, lembretes e sessão em vídeo seguem a mesma linguagem do resto do produto.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function RootPage() {
  return (
    <PublicPageLayout>
      <section className="relative overflow-hidden border-b border-[#d9e3ef] bg-[#f7fbff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_84%_14%,rgba(251,191,36,0.12),transparent_16%),linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0))]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-8 md:px-8 md:pb-16 md:pt-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cbdcf4] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Brasileiros conectando brasileiros no mundo
              </span>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]/75">
                Descobrir melhor. Agendar com mais contexto. Voltar sem fricção.
              </p>

              <h1 className="mt-3 font-display text-[2.15rem] font-bold leading-[0.95] tracking-[-0.05em] text-slate-950 md:text-[3.7rem] xl:text-[4rem]">
                A plataforma para encontrar o profissional brasileiro certo, online e no seu ritmo.
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 md:text-base">
                A Muuday organiza a jornada inteira em português: descoberta, comparação, agendamento, sessão em vídeo e continuidade. Menos atrito, mais confiança e uma experiência que parece produto desde o primeiro scroll.
              </p>

              <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row">
                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f4fa8] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,79,168,0.2)] transition hover:bg-[#0b3f88]"
                >
                  Buscar profissionais
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/registrar-profissional"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c8dcf6] bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-[#0f4fa8] hover:text-[#0f4fa8]"
                >
                  Quero atender pela Muuday
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {heroSignals.map(item => (
                  <div
                    key={item}
                    className="rounded-[1.35rem] border border-[#d7e7fa] bg-white/88 px-4 py-4 shadow-[0_12px_28px_rgba(15,79,168,0.05)]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#0f4fa8]" />
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:pt-2">
              <HeroProductStage />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {supportBlocks.map(block => {
            const Icon = block.icon
            return (
              <div key={block.title} className="rounded-[1.6rem] border border-[#d8e7fa] bg-white px-5 py-5 shadow-sm">
                <Icon className="h-5 w-5 text-[#0f4fa8]" />
                <p className="mt-4 text-lg font-semibold text-slate-950">{block.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{block.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-[#c8dcf6] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
              O que a Muuday sustenta
            </span>
            <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.75rem]">
              Mais sensação de produto. Menos ruído entre intenção, booking e continuidade.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
              A landing funciona melhor quando prepara o próximo passo real do usuário: buscar com contexto, decidir com mais segurança e avançar sem se perder no fluxo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {productHighlights.map((item, index) => (
              <div
                key={item.title}
                className={`rounded-[1.7rem] border p-5 ${
                  index === 1
                    ? 'border-[#f1d18d] bg-[#fff7e4]'
                    : 'border-[#d8e7fa] bg-[linear-gradient(135deg,#eef5ff,#ffffff)]'
                }`}
              >
                <p className="text-base font-semibold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#d9e3ef] bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
          <div className="mb-8 flex flex-col gap-3 md:max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Comece pela categoria certa</span>
            <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.6rem]">
              Descoberta guiada por quem já sabe que precisa resolver.
            </h2>
            <p className="text-sm leading-7 text-slate-600 md:text-base">
              Em vez de parecer uma listagem genérica, a Muuday pode puxar a conversa para intenção, contexto e clareza.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SEARCH_CATEGORIES.slice(0, 6).map((category, index) => (
              <Link
                key={category.slug}
                href={`/buscar?categoria=${category.slug}`}
                className={`group rounded-[1.7rem] border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,79,168,0.08)] ${
                  index % 3 === 0
                    ? 'border-[#d7e8fb] bg-[#eef6ff]'
                    : index % 3 === 1
                      ? 'border-[#ffd78f] bg-[#fff6df]'
                      : 'border-[#f4c59a] bg-[#fff0e5]'
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Categoria</p>
                <p className="mt-3 text-xl font-semibold leading-tight text-slate-950">
                  {category.icon} {category.name}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Explore perfis, disponibilidade, experiência e o melhor formato de atendimento para o seu caso.
                </p>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0f4fa8]">
                  Ver profissionais
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffd37d]">
                Experiência completa
              </span>
              <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-white md:text-[2.6rem]">
                Uma jornada inteira, não só um catálogo.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
                A Muuday parece mais forte quando descoberta pública, área logada, booking e sessão compartilham a mesma lógica visual e operacional.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                'Busca aberta para visitante e fluxo autenticado para avançar sem se perder.',
                'Agenda, mensagens e financeiro articulados para profissionais.',
                'Sessão em vídeo e continuidade como parte central da proposta.',
                'Onboarding e shell público mais coerentes com o que o produto realmente entrega.',
              ].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-[1.7rem] border p-5 ${
                    index === 1 ? 'border-[#a56b11]/25 bg-[linear-gradient(135deg,rgba(245,158,11,0.14),rgba(255,255,255,0.03))]' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[#ffd37d]">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star key={starIndex} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="inline-flex rounded-full border border-[#d7e8fb] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
              Perguntas frequentes
            </span>
            <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.6rem]">
              O essencial, respondido sem ornamentação.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              A FAQ fecha a conversa com clareza e confiança antes da busca ou do cadastro profissional.
            </p>
            <div className="mt-7">
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f4fa8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3f88]"
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
                className={`rounded-[1.7rem] border p-5 ${index === 1 ? 'border-[#ffd78f] bg-[#fff7e6]' : 'border-slate-200 bg-white'}`}
              >
                <p className="text-base font-semibold text-slate-950 md:text-lg">{item.question}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 md:px-8 md:pb-20">
        <div className="overflow-hidden rounded-[2.5rem] border border-[#d6e6fb] bg-[linear-gradient(135deg,#0f4fa8,#183b87_55%,#f59e0b_150%)] p-7 text-white shadow-[0_28px_70px_rgba(15,79,168,0.2)] md:p-9">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffe0a6]">
                Próximo passo
              </span>
              <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-white md:text-[2.6rem]">
                Uma landing mais forte para um produto que já está ficando mais coerente.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100 md:text-base">
                A direção visual agora prepara melhor o terreno para onboarding, busca, perfil público, booking e sessão. O objetivo não é parecer outra empresa. É deixar a Muuday mais precisa, mais memorável e mais confiável.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0f4fa8] transition hover:bg-slate-100"
              >
                Buscar profissionais
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/registrar-profissional"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Atender pela Muuday
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
