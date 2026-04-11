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
  },
  {
    title: 'Atendimento remoto',
    body: 'A Muuday é vídeo-first. A jornada inteira foi desenhada para consulta online com menos atrito.',
    icon: Video,
  },
  {
    title: 'Agenda e organização',
    body: 'Configure horários, recorrência, múltiplas datas e a janela de disponibilidade do seu atendimento.',
    icon: CalendarDays,
  },
  {
    title: 'Mais confiança para o cliente',
    body: 'Um perfil claro e bem estruturado aumenta a percepção de seriedade desde o primeiro contato.',
    icon: ShieldCheck,
  },
  {
    title: 'Audiência qualificada',
    body: 'Fale com brasileiros que valorizam idioma, proximidade cultural e entendimento da realidade brasileira.',
    icon: Globe2,
  },
  {
    title: 'Suporte da plataforma',
    body: 'Conte com onboarding guiado, revisão de perfil e uma estrutura mais preparada para crescer.',
    icon: Layers3,
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

function ProfessionalHeroStage() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#d7e7fa] bg-white p-3 shadow-[0_24px_70px_rgba(15,79,168,0.12)] md:p-4">
      <div className="rounded-[1.7rem] bg-[linear-gradient(135deg,#eef5ff,#ffffff_58%,#fff5dc)] p-4 md:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">Muuday para profissionais</p>
            <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950 md:text-2xl">
              Estrutura para apresentar, organizar e operar melhor.
            </p>
          </div>
          <span className="rounded-full border border-[#f1d18d] bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#9a5b00]">
            onboarding guiado
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <figure className="overflow-hidden rounded-[1.55rem] border border-[#dbe8f7] bg-[#0b1423] p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Atendimento remoto</p>
                <p className="mt-1 text-sm font-semibold text-white md:text-base">Seu trabalho com mais alcance</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/75">online</span>
            </div>

            <div className="mt-4 aspect-[4/3] overflow-hidden rounded-[1.3rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.22),transparent_30%),linear-gradient(180deg,#101c31,#0b1423)] p-4">
              <div className="flex h-full flex-col justify-between rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
                <div className="max-w-[14rem]">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Painel profissional</p>
                  <p className="mt-2 text-base font-semibold text-white">Perfil, agenda e entrada guiada</p>
                  <p className="mt-1 text-sm leading-6 text-white/65">Uma base mais séria para começar a atender brasileiros que vivem fora.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-xs font-medium text-white/80">
                    Perfil estruturado
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-xs font-medium text-white/80">
                    Agenda flexível
                  </div>
                </div>
              </div>
            </div>
          </figure>

          <div className="grid gap-3">
            <div className="rounded-[1.4rem] border border-[#dbe8f7] bg-white px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Demanda</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Brasileiros no exterior procuram contexto cultural</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Idioma, referência cultural e confiança contam mais do que uma listagem genérica.</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#f1d18d] bg-[#fff7e4] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a5b00]">Entrada</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Cadastro, perfil, revisão e go-live</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">A promessa da página precisa bater com o fluxo real de onboarding e publicação.</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#dbe8f7] bg-[#eef5ff] px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f4fa8]">Operação</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">Vídeo, agenda e continuidade no mesmo produto</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">A Muuday não é só vitrine. Ela precisa sustentar a operação depois do cadastro.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function RegistrarProfissionalPage() {
  return (
    <PublicPageLayout>
      <section className="relative overflow-hidden border-b border-[#d8e4f0] bg-[#f7fbff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(251,191,36,0.12),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0))]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-8 md:px-8 md:pb-16 md:pt-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c3daf7] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Para profissionais brasileiros
              </span>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]/75">
                Alcance internacional. Entrada guiada. Operação mais séria.
              </p>

              <h1 className="mt-3 text-[2.15rem] font-semibold leading-[0.95] tracking-[-0.05em] text-slate-950 md:text-[3.7rem] xl:text-[4rem]">
                Atenda brasileiros no exterior com a Muuday — de onde você estiver.
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 md:text-base">
                A Muuday conecta profissionais brasileiros a pessoas que vivem fora do Brasil e procuram atendimento com idioma, contexto e confiança cultural. Mais do que visibilidade, você entra em uma estrutura pensada para apresentar seu trabalho com clareza e operar melhor.
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

              <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {heroBenefits.map(item => (
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
              <ProfessionalHeroStage />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-[#d8e6f7] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
              Oportunidade real
            </span>
            <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.6rem]">
              A Muuday aproxima profissionais brasileiros de quem mais precisa deles fora do Brasil.
            </h2>
          </div>

          <div className="rounded-[1.8rem] border border-[#d8e6f7] bg-[linear-gradient(135deg,#eef6ff,#ffffff_58%,#fff5dc)] p-5 md:p-6">
            <p className="text-sm leading-8 text-slate-600 md:text-base">
              Muitas pessoas que vivem no exterior procuram profissionais que entendam sua língua, sua cultura e sua realidade. A Muuday foi criada para facilitar essa conexão de forma simples, confiável e escalável.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8e4f0] bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
          <div className="mb-8 flex flex-col gap-3 md:max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Quem pode crescer com a Muuday
            </span>
            <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.6rem]">
              Perfis que podem se reconhecer aqui em poucos segundos.
            </h2>
            <p className="text-sm leading-7 text-slate-600 md:text-base">
              Se você oferece um serviço relevante para brasileiros que vivem fora, a Muuday pode ser o canal certo para ampliar sua atuação.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {specialties.map((item, index) => (
              <div
                key={item}
                className={`rounded-[1.7rem] border p-5 ${
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

      <section id="como-funciona" className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="inline-flex rounded-full border border-[#d8e6f7] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
              Como funciona
            </span>
            <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.6rem]">
              Veja como é simples começar.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              Criamos um processo claro para que você entre na plataforma com segurança e rapidez.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <div key={step.title} className="overflow-hidden rounded-[1.7rem] border border-[#d8e6f7] bg-white shadow-sm">
                <div
                  className={`h-24 ${
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
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
          <div className="mb-8 flex flex-col gap-3 md:max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Estrutura para o profissional
            </span>
            <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.6rem]">
              Uma base pensada para apresentar, organizar e operar melhor.
            </h2>
            <p className="text-sm leading-7 text-slate-600 md:text-base">
              Mais do que visibilidade, a Muuday oferece uma estrutura para você apresentar seu trabalho com clareza, gerar confiança e organizar sua atuação.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool, index) => {
              const Icon = tool.icon
              return (
                <div
                  key={tool.title}
                  className={`rounded-[1.7rem] border p-5 ${index % 3 === 1 ? 'border-[#f1d29a] bg-[#fff7e4]' : 'border-[#d8e6f7] bg-white'}`}
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

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full border border-[#d8e6f7] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f4fa8]">
              Por que fazer parte
            </span>
            <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-slate-950 md:text-[2.6rem]">
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

          <div className="rounded-[1.95rem] border border-[#d8e6f7] bg-[linear-gradient(135deg,#0f4fa8,#173b87_58%,#f59e0b_155%)] p-6 text-white shadow-[0_24px_70px_rgba(15,79,168,0.18)] md:p-7">
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
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffd37d]">
                Confiança
              </span>
              <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-white md:text-[2.6rem]">
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
                  className={`rounded-[1.7rem] border p-5 ${
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

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 md:px-8 md:pb-20 md:pt-14">
        <div className="overflow-hidden rounded-[2.4rem] border border-[#d8e6f7] bg-[linear-gradient(135deg,#0f4fa8,#183b87_55%,#f59e0b_150%)] p-7 text-white shadow-[0_24px_70px_rgba(15,79,168,0.2)] md:p-9">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ffe0a6]">
                Próximo passo
              </span>
              <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-white md:text-[2.6rem]">
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
