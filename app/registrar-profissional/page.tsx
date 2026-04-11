import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Globe2,
  Layers3,
  ShieldCheck,
  Sparkles,
  Star,
  Video,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'

export const metadata = { title: 'Registrar como profissional | Muuday' }

const heroBenefits = [
  'Atenda brasileiros no exterior com mais contexto cultural.',
  'Monte um perfil claro para gerar confiança desde o primeiro contato.',
  'Comece com onboarding guiado e estrutura pronta para operar online.',
]

const specialties = [
  'Psicólogos',
  'Advogados',
  'Contadores',
  'Consultores especializados',
  'Profissionais de apoio ao imigrante',
  'Outros especialistas que atendem brasileiros',
]

const processSteps = [
  {
    step: '1º passo',
    title: 'Envie seu cadastro',
    body: 'Preencha seus dados principais, área de atuação e informações iniciais para análise.',
  },
  {
    step: '2º passo',
    title: 'Monte seu perfil',
    body: 'Apresente experiência, especialidades, forma de atendimento e disponibilidade com clareza.',
  },
  {
    step: '3º passo',
    title: 'Comece a atender',
    body: 'Depois da aprovação, seu perfil entra no ar e você pode receber contatos e agendamentos.',
  },
]

const tools = [
  {
    title: 'Perfil profissional completo',
    body: 'Destaque experiência, especialidades, bio, idiomas e diferenciais em uma página pensada para conversão.',
    icon: BadgeCheck,
    accent: 'from-[#eef6ff] to-white',
  },
  {
    title: 'Atendimento remoto',
    body: 'A Muuday é vídeo-first. A jornada inteira foi desenhada para consulta online com menos atrito.',
    icon: Video,
    accent: 'from-[#fff6e3] to-white',
  },
  {
    title: 'Agenda e organização',
    body: 'Configure horários, recorrência, múltiplas datas e a janela de disponibilidade do seu atendimento.',
    icon: CalendarDays,
    accent: 'from-[#fff1e8] to-white',
  },
  {
    title: 'Mais confiança para o cliente',
    body: 'Um perfil claro e bem estruturado aumenta a percepção de seriedade desde o primeiro contato.',
    icon: ShieldCheck,
    accent: 'from-[#eef6ff] to-white',
  },
  {
    title: 'Audiência qualificada',
    body: 'Fale com brasileiros que valorizam idioma, proximidade cultural e entendimento da realidade brasileira.',
    icon: Globe2,
    accent: 'from-[#fff6e3] to-white',
  },
  {
    title: 'Suporte da plataforma',
    body: 'Conte com onboarding guiado, revisão de perfil e uma estrutura mais preparada para crescer.',
    icon: Layers3,
    accent: 'from-[#fff1e8] to-white',
  },
]

const professionalBenefits = [
  'Amplie sua presença além do Brasil.',
  'Atenda clientes com alta afinidade cultural.',
  'Ganhe visibilidade em um nicho com demanda real.',
  'Tenha mais flexibilidade no seu modelo de atendimento.',
  'Fortaleça sua autoridade profissional.',
  'Participe do crescimento de uma rede focada na comunidade brasileira no exterior.',
]

const trustPoints = [
  'Perfis estruturados para gerar confiança desde o primeiro contato.',
  'Comunicação clara para reduzir atrito entre descoberta e agendamento.',
  'Experiência feita para brasileiros no exterior, não uma adaptação genérica.',
  'Processo de entrada simples, profissional e coerente com quem quer operar bem.',
]

export default async function RegistrarProfissionalPage() {
  return (
    <PublicPageLayout>
      <section className="relative overflow-hidden border-b border-[#d8e4f0] bg-[#f7fbff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(59,130,246,0.14),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(251,191,36,0.14),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0))]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-8 md:px-8 md:pb-16 md:pt-10">
          <div className="rounded-[2.35rem] border border-[#d8e6f7] bg-[#eaf4ff] px-5 py-6 shadow-[0_24px_60px_rgba(15,79,168,0.08)] md:px-7 md:py-7">
            <div className="grid gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#c3daf7] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8] shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Para profissionais brasileiros
                </span>

                <h1 className="mt-6 max-w-xl text-[2.35rem] font-semibold leading-[0.94] tracking-[-0.05em] text-slate-950 md:text-[3.9rem]">
                  Atenda brasileiros no exterior com a Muuday — de onde você estiver.
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                  A Muuday conecta profissionais brasileiros a pessoas que vivem fora do Brasil e procuram atendimento
                  com idioma, contexto e confiança cultural. Mais do que visibilidade, você entra em uma estrutura
                  pensada para apresentar seu trabalho com clareza e operar melhor.
                </p>

                <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row">
                  <Link
                    href="/cadastro?role=profissional"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f4fa8] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,79,168,0.2)] transition hover:bg-[#0b3f88]"
                  >
                    Quero me cadastrar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#como-funciona"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c8dcf6] bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-[#0f4fa8] hover:text-[#0f4fa8]"
                  >
                    Saiba como funciona
                  </Link>
                </div>

                <div className="mt-7 space-y-3">
                  {heroBenefits.map(item => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-[1.5rem] border border-white/80 bg-white/84 px-4 py-4 shadow-[0_14px_30px_rgba(15,79,168,0.05)]"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0f4fa8]" />
                      <p className="text-sm leading-6 text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative pt-1">
                <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white p-3 shadow-[0_24px_70px_rgba(15,79,168,0.12)]">
                  <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,#ffffff,#eef6ff_54%,#fff7e5)] p-4 md:p-5">
                    <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                      <div className="rounded-[1.55rem] border border-[#dce8f7] bg-white p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0f4fa8]">
                          Clientes brasileiros no exterior
                        </p>
                        <div className="mt-4 space-y-3">
                          {[
                            'Psicologia em português',
                            'Consultoria jurídica para brasileiros fora',
                            'Suporte contábil com contexto local',
                          ].map(item => (
                            <div
                              key={item}
                              className="rounded-2xl border border-[#eef3f7] bg-[#fafcff] px-3 py-3 text-sm text-slate-600"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.7rem] border border-[#dce8f7] bg-[#0b1423] p-4 text-white">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                            Atendimento remoto
                          </p>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">
                            online
                          </span>
                        </div>

                        <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                          <div className="rounded-[1.2rem] bg-white p-4 text-slate-900">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Painel profissional
                            </p>
                            <div className="mt-3 space-y-3">
                              <div className="rounded-xl bg-[#eef6ff] px-3 py-3">
                                <p className="text-xs font-semibold text-[#0f4fa8]">Perfil verificado</p>
                                <p className="mt-1 text-sm text-slate-600">Experiência, especialidades e atendimento online.</p>
                              </div>
                              <div className="rounded-xl bg-[#fff7e8] px-3 py-3">
                                <p className="text-xs font-semibold text-[#9a5b00]">Agenda flexível</p>
                                <p className="mt-1 text-sm text-slate-600">Sessão única, recorrente ou múltiplas datas.</p>
                              </div>
                              <div className="rounded-xl bg-[#f8fafc] px-3 py-3">
                                <p className="text-xs font-semibold text-slate-700">Suporte da equipe</p>
                                <p className="mt-1 text-sm text-slate-600">Entrada guiada até o go live.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      {['Perfil verificado', 'Agenda flexível', 'Cadastro simples', 'Suporte da equipe'].map(item => (
                        <div
                          key={item}
                          className="rounded-[1.35rem] border border-[#dce8f7] bg-white px-4 py-4 text-sm font-semibold text-slate-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute -left-5 top-16 hidden rounded-[1.3rem] border border-[#f1d29a] bg-[#fff7e4] px-4 py-4 shadow-[0_14px_32px_rgba(245,158,11,0.1)] lg:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a5b00]">Oportunidade</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">Global</p>
                  <p className="text-xs text-slate-600">Atenda de onde estiver</p>
                </div>

                <div className="absolute -right-5 bottom-8 hidden rounded-[1.3rem] border border-[#d5e4f8] bg-white px-4 py-4 shadow-[0_14px_32px_rgba(15,79,168,0.08)] lg:block">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f4fa8]">Entrada</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">C1–C9</p>
                  <p className="text-xs text-slate-500">Onboarding guiado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-[#d8e6f7] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
              Oportunidade real
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">
              A Muuday aproxima profissionais brasileiros de quem mais precisa deles fora do Brasil.
            </h2>
          </div>

          <div className="rounded-[1.9rem] border border-[#d8e6f7] bg-[linear-gradient(135deg,#eef6ff,#ffffff_58%,#fff5dc)] p-5 md:p-6">
            <p className="text-sm leading-8 text-slate-600 md:text-base">
              Muitas pessoas que vivem no exterior procuram profissionais que entendam sua língua, sua cultura e sua
              realidade. A Muuday foi criada para facilitar essa conexão de forma simples, confiável e escalável.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8e4f0] bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
          <div className="mb-8 flex flex-col gap-3 md:max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Quem pode crescer com a Muuday
            </span>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">
              Profissionais que podem se reconhecer aqui em poucos segundos.
            </h2>
            <p className="text-sm leading-7 text-slate-600 md:text-base">
              Se você oferece um serviço relevante para brasileiros que vivem fora, a Muuday pode ser o canal certo para ampliar sua atuação.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {specialties.map((item, index) => (
              <div
                key={item}
                className={`rounded-[1.8rem] border p-5 ${
                  index % 3 === 0
                    ? 'border-[#d8e6f7] bg-[#eef6ff]'
                    : index % 3 === 1
                      ? 'border-[#f1d29a] bg-[#fff7e4]'
                      : 'border-[#efc092] bg-[#fff0e4]'
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Perfil</p>
                <p className="mt-3 text-xl font-semibold leading-tight text-slate-950">{item}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Uma presença mais clara para quem quer atender brasileiros no exterior com mais contexto e confiança.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="inline-flex rounded-full border border-[#d8e6f7] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
              Como funciona
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">
              Veja como é simples começar.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              Criamos um processo claro para que você entre na plataforma com segurança e rapidez.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <div key={step.title} className="overflow-hidden rounded-[1.8rem] border border-[#d8e6f7] bg-white shadow-sm">
                <div
                  className={`h-28 ${
                    index === 0
                      ? 'bg-[linear-gradient(135deg,#eef6ff,#dbeafe)]'
                      : index === 1
                        ? 'bg-[linear-gradient(135deg,#fff7e4,#ffedd5)]'
                        : 'bg-[linear-gradient(135deg,#eef6ff,#fff5dc)]'
                  }`}
                >
                  <div className="flex h-full items-end px-5 pb-4">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                      {step.step}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-5">
                  <p className="text-lg font-semibold text-slate-950">{step.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8e4f0] bg-[#f8fbff]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
          <div className="mb-8 flex flex-col gap-3 md:max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Estrutura para o profissional
            </span>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">
              Uma base pensada para apresentar, organizar e operar melhor.
            </h2>
            <p className="text-sm leading-7 text-slate-600 md:text-base">
              Mais do que visibilidade, a Muuday oferece uma estrutura para você apresentar seu trabalho com clareza, gerar confiança e organizar sua atuação.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tools.map(tool => {
              const Icon = tool.icon
              return (
                <div
                  key={tool.title}
                  className={`rounded-[1.8rem] border border-white/80 bg-gradient-to-br ${tool.accent} p-5 shadow-sm`}
                >
                  <Icon className="h-5 w-5 text-[#0f4fa8]" />
                  <p className="mt-4 text-lg font-semibold text-slate-950">{tool.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{tool.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-[#d8e6f7] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
              Por que fazer parte
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl">
              Um caminho para ampliar presença, confiança e alcance.
            </h2>
            <div className="mt-6 space-y-3">
              {professionalBenefits.map(item => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#e7eef7] bg-white px-4 py-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0f4fa8]" />
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#d8e6f7] bg-[linear-gradient(135deg,#0f4fa8,#173b87_58%,#f59e0b_155%)] p-6 text-white shadow-[0_24px_70px_rgba(15,79,168,0.18)] md:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffe3a8]">
              Benefício principal
            </p>
            <p className="mt-4 text-2xl font-semibold leading-tight md:text-3xl">
              Você não entra só em um diretório. Você entra em uma plataforma com estrutura.
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-sm font-semibold">Descoberta</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Perfil mais forte para ser encontrado e entendido com mais rapidez.
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4">
                <p className="text-sm font-semibold">Operação</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Agenda, booking, mensagens e vídeo organizados com mais coerência.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8e4f0] bg-slate-950 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffd37d]">
                Confiança
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                Construída para gerar confiança desde o primeiro contato.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 md:text-base">
                Mesmo sem depender de promessas exageradas, a página precisa transmitir seriedade, cuidado e direção.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {trustPoints.map((item, index) => (
                <div
                  key={item}
                  className={`rounded-[1.8rem] border p-5 ${
                    index % 2 === 0
                      ? 'border-white/10 bg-white/5'
                      : 'border-[#a56b11]/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(255,255,255,0.03))]'
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

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-14 md:px-8 md:pb-20">
        <div className="overflow-hidden rounded-[2.5rem] border border-[#d8e6f7] bg-[linear-gradient(135deg,#0f4fa8,#183b87_55%,#f59e0b_150%)] p-7 text-white shadow-[0_24px_70px_rgba(15,79,168,0.2)] md:p-9">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffe0a6]">
                Próximo passo
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                Leve seu trabalho para brasileiros no exterior com a Muuday.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-100 md:text-base">
                Cadastre-se para apresentar sua atuação, ampliar seu alcance e fazer parte de uma rede feita para conectar pessoas com mais contexto, proximidade e confiança.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/cadastro?role=profissional"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0f4fa8] transition hover:bg-slate-100"
              >
                Quero me cadastrar
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/ajuda"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Falar com a equipe
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
