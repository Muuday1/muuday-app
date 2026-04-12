import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Globe2,
  Layers3,
  Search,
  ShieldCheck,
  Video,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'

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

const CONFIDENCE_BLOCKS = [
  'Perfil organizado para reduzir ruído antes da primeira conversa.',
  'Onboarding com etapas claras e previsibilidade de aprovação.',
  'Experiência desenhada para perfil, serviços e disponibilidade.',
  'Interface alinhada com a busca pública e o fluxo de atendimento.',
]

function FeatureCard({ icon: Icon, title, text }: { icon: typeof CheckCircle2; title: string; text: string }) {
  return (
    <article className="mu-shell-card p-5 transition hover:border-brand-400 hover:shadow-[var(--mu-shadow-md)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--mu-radius-sm)] bg-brand-50 text-brand-700">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--mu-text)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--mu-muted)]">{text}</p>
    </article>
  )
}

function ProcessCard({ step, title, text, media }: { step: string; title: string; text: string; media: string }) {
  return (
    <div className="overflow-hidden rounded-[var(--mu-radius-lg)] border border-brand-100 bg-white">
      <div className="relative">
        <Image src={media} alt={title} width={720} height={480} className="aspect-[4/3] w-full object-cover" />
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Passo {step}</p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--mu-text)]">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-[var(--mu-muted)]">{text}</p>
      </div>
    </div>
  )
}

function BenefitRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 rounded-[var(--mu-radius-md)] border border-brand-100 bg-white p-4">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
      <p className="text-sm leading-6 text-[var(--mu-muted)]">{text}</p>
    </li>
  )
}

export default async function RegistrarProfissionalPage() {
  return (
    <PublicPageLayout>
      <section className="relative overflow-hidden bg-[var(--mu-page-bg)] py-[48px] md:py-[56px] lg:py-[72px]">
        <div className="pointer-events-none absolute left-1/2 top-[-14rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(26,138,80,0.12),transparent_72%)]" />

        <div className="mu-shell relative grid gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:items-center">
          <div className="max-w-[40rem]">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-xs font-semibold tracking-[0.12em] text-brand-700">
              Para profissionais brasileiros
            </p>
            <h1 className="mt-5 max-w-5xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--mu-text)] md:text-[3rem]">
              Conecte sua profissão a brasileiros no exterior.
            </h1>
            <p className="mu-copy mt-5 text-sm leading-7 text-[var(--mu-muted)] md:text-base">
              A Muuday te ajuda a se posicionar com mais clareza, com estrutura de perfil profissional e operação orientada
              para atendimento remoto.
            </p>

            <div className="mt-7 grid gap-3">
              {HERO_FEATURES.map(text => (
                <p
                  key={text}
                  className="rounded-[var(--mu-radius-sm)] border border-brand-100 bg-white px-4 py-3 text-sm font-medium leading-7 text-[var(--mu-muted)]"
                >
                  {text}
                </p>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro?role=profissional" className="mu-btn-primary inline-flex items-center justify-center gap-2">
                Quero me cadastrar
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#como-funciona" className="mu-btn-outline inline-flex items-center justify-center gap-2">
                Saiba como funciona
              </Link>
            </div>
          </div>

          <div className="relative">
            <Image
              src="/assets/marketing/professionals/hero-main.webp"
              alt="Profissional em atendimento remoto com painel de agenda"
              width={1200}
              height={800}
              className="w-full rounded-[var(--mu-radius-lg)] border border-brand-100 bg-white p-2 shadow-[var(--mu-shadow-md)]"
              priority
            />
            <div className="absolute left-3 top-3 rounded-[var(--mu-radius-sm)] border border-white/70 bg-white/90 px-4 py-3 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
              Estrutura pensada para começar rápido
            </div>
          </div>
        </div>
      </section>

      <section className="mu-section border-y border-brand-100 bg-white" id="proposta-valor">
        <div className="mu-shell grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Proposta de valor</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Chegue mais perto de quem precisa de você.
            </h2>
            <p className="mu-copy mt-4 text-sm leading-8 text-[var(--mu-muted)]">
              Quem mora fora do Brasil valoriza profissionais que entendem contexto, idioma e rotina. Aqui, o primeiro
              contato começa com uma apresentação completa e organizada.
            </p>
          </div>
          <div className="mu-shell-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Quem pode ser destaque</p>
            <p className="mt-3 text-sm leading-8 text-[var(--mu-muted)]">
              Se você atende brasileiros com foco em confiança cultural, pode se destacar na busca com posicionamento
              profissional e disponibilidade clara.
            </p>
          </div>
        </div>
      </section>

      <section className="mu-section">
        <div className="mu-shell">
          <div className="mb-6 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Especialidades</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Especialidades com demanda constante.
            </h2>
            <p className="mu-copy mt-4 text-sm leading-7 text-[var(--mu-muted)]">
              Escolha áreas de atuação que já aparecem com busca recorrente de brasileiros no exterior.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {SPECIALTIES.map((item, index) => (
              <article
                key={item}
                className={`rounded-[var(--mu-radius-lg)] border p-5 ${
                  index % 2 === 0 ? 'bg-brand-50 border-brand-100' : 'bg-white border-brand-100'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Área</p>
                <p className="mt-2 text-xl font-semibold text-[var(--mu-text)]">{item}</p>
                <p className="mt-2 max-w-md text-sm leading-7 text-[var(--mu-muted)]">
                  Perfil recomendado para entrada de demanda de brasileiros que buscam atendimento com contexto.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mu-section bg-white border-y border-brand-100" id="como-funciona">
        <div className="mu-shell">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Como funciona</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Em 3 passos para começar.
            </h2>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-3">
            {PROCESSES.map(step => (
              <ProcessCard key={step.step} step={step.step} title={step.title} text={step.text} media={step.media} />
            ))}
          </div>
        </div>
      </section>

      <section className="mu-section">
        <div className="mu-shell">
          <div className="grid gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Estrutura da plataforma</p>
            <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Um ambiente mais útil para transformar visitas em clientes.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map(tool => (
              <FeatureCard key={tool.title} icon={tool.icon as typeof CheckCircle2} title={tool.title} text={tool.text} />
            ))}
          </div>
        </div>
      </section>

      <section className="mu-section bg-[var(--mu-surface-soft)]">
        <div className="mu-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Benefícios</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--mu-text)] md:text-5xl">
              Por que entrar para a Muuday.
            </h2>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map(item => (
                <BenefitRow key={item} text={item} />
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--mu-radius-lg)] border border-brand-100 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Resumo de confiança</p>
            <p className="mt-3 text-sm leading-7 text-[var(--mu-muted)]">
              A estrutura de perfil é feita para facilitar aprovação e manter padrão de clareza até o primeiro atendimento.
            </p>
            <ul className="mt-5 space-y-2">
              {CONFIDENCE_BLOCKS.map(item => (
                <li key={item} className="flex items-start gap-2 rounded-[calc(var(--mu-radius-sm)-2px)] border border-brand-100 bg-white p-3 text-sm text-[var(--mu-muted)]">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-700" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mu-section">
        <div className="mu-shell rounded-[var(--mu-radius-lg)] border border-brand-100 bg-brand-700 p-6 text-white md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">Próximo passo</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-[-0.03em] md:text-5xl">
                Leve sua expertise para quem precisa.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/90 md:text-base">
                O cadastro começa hoje. Depois da análise, seu perfil entra na busca e você recebe clientes com menos atrito.
              </p>
            </div>
            <div className="grid gap-3 sm:flex">
              <Link
                href="/cadastro?role=profissional"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-[var(--mu-surface-soft)]"
              >
                Quero me cadastrar
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/ajuda"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20"
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
