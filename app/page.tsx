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
  Users,
  Clock,
  MapPin,
  MessageCircle,
  Heart,
  TrendingUp,
  Briefcase,
  FileText,
  ArrowUpRight,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { FaqAccordion } from '@/components/landing/FaqAccordion'
import { FadeIn } from '@/components/landing/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/landing/StaggerContainer'
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
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
  },
  {
    icon: CalendarCheck,
    title: 'Agende do seu jeito',
    body: 'Uma sessão, várias, ou recorrente. O fuso horário é ajustado automaticamente.',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80',
  },
  {
    icon: Video,
    title: 'Videochamada integrada',
    body: 'Da busca à sessão, tudo acontece aqui. Sem precisar de Zoom, Teams ou WhatsApp.',
    image: 'https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=600&q=80',
  },
  {
    icon: ShieldCheck,
    title: 'Profissionais revisados',
    body: 'Cada perfil é verificado antes de entrar no ar. Você sabe com quem está falando.',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Busque',
    body: 'Use filtros práticos para encontrar quem entende sua situação.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Agende',
    body: 'Escolha dia e horário. A confirmação chega na hora.',
    icon: CalendarCheck,
  },
  {
    step: '03',
    title: 'Conecte',
    body: 'Faça a sessão por vídeo aqui mesmo. Tudo registrado em um só lugar.',
    icon: Video,
  },
]

const ALL_CATEGORIES = SEARCH_CATEGORIES

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'saude-mental': <Heart className="h-6 w-6" />,
  'saude-corpo': <Users className="h-6 w-6" />,
  'educacao': <TrendingUp className="h-6 w-6" />,
  'contabilidade': <Briefcase className="h-6 w-6" />,
  'direito': <FileText className="h-6 w-6" />,
  'carreira': <TrendingUp className="h-6 w-6" />,
  'traducao': <MessageCircle className="h-6 w-6" />,
  'outro': <Star className="h-6 w-6" />,
}

const TESTIMONIALS = [
  {
    name: 'Ana Paula',
    role: 'Psicóloga em Lisboa',
    text: 'A Muuday me conectou com brasileiros em Portugal que precisavam de atendimento em português. A plataforma cuida de tudo — agenda, pagamento, videochamada.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  },
  {
    name: 'Ricardo Mendes',
    role: 'Nutricionista em Londres',
    text: 'Finalmente consigo atender clientes do Brasil sem complicação de fuso horário. A plataforma ajusta tudo automaticamente.',
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

export default async function RootPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        {/* Background shapes */}
        <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-brand-50 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/4 translate-y-1/4 rounded-full bg-accent-50 blur-3xl" />

        <div className="mu-shell relative grid gap-8 py-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-24">
          <FadeIn direction="right">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-md bg-brand-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-brand-700">
                <Globe className="h-3.5 w-3.5" />
                Atendimento em vídeo para quem mora fora
              </p>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 md:text-6xl lg:text-7xl">
                Profissionais brasileiros, no seu fuso, na sua língua.
              </h1>
              <p className="mt-5 max-w-[46ch] text-lg leading-8 text-slate-600">
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

              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2">
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
                      width={40}
                      height={40}
                      className="h-8 w-8 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-900">+200 profissionais</span> já atendendo
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="left" delay={0.2}>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
                  alt="Profissional brasileiro em atendimento por vídeo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating cards */}
              <div className="absolute -left-4 top-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:left-4 md:top-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-100 text-accent-600">
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Sessão ao vivo</p>
                    <p className="text-[10px] text-slate-500">Videochamada HD</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 bottom-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:right-4 md:bottom-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-100 text-brand-600">
                    <Star className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">4.9 de média</p>
                    <p className="text-[10px] text-slate-500">+1.000 avaliações</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mu-shell flex flex-wrap items-center justify-center gap-8 py-10 text-center md:gap-16">
          {STATS.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div className="w-full sm:w-auto">
                <p className="font-display text-4xl font-bold text-brand-600 md:text-5xl">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Features — alternating layout */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">O que você encontra aqui</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
                Encontre quem fala a mesma língua — literalmente.
              </h2>
            </div>
          </FadeIn>

          <div className="mt-16 space-y-20">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              const isReversed = i % 2 === 1
              return (
                <FadeIn key={feature.title} direction={isReversed ? 'left' : 'right'}>
                  <div className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${isReversed ? 'lg:grid-flow-dense' : ''}`}>
                    <div className={isReversed ? 'lg:col-start-2' : ''}>
                      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={feature.image}
                          alt={feature.title}
                          width={600}
                          height={450}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className={isReversed ? 'lg:col-start-1 lg:row-start-1' : ''}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-6 text-2xl font-bold text-slate-900">{feature.title}</h3>
                      <p className="mt-3 text-base leading-7 text-slate-600">{feature.body}</p>
                    </div>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mu-section bg-slate-50">
        <div className="mu-shell">
          <FadeIn>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Como funciona</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
                Três passos. Nada de complicação.
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3" staggerDelay={0.15}>
            {HOW_IT_WORKS.map(item => {
              const Icon = item.icon
              return (
                <StaggerItem key={item.step}>
                  <div className="relative rounded-xl border border-slate-200 bg-white p-8">
                    <span className="absolute right-6 top-6 font-display text-5xl font-bold text-slate-100">
                      {item.step}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
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

      {/* Categories */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Categorias</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
                Escolha por especialidade.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Cada categoria tem profissionais que combinam expertise com a experiência de viver fora do Brasil.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
            {ALL_CATEGORIES.map(category => (
              <StaggerItem key={category.slug}>
                <Link
                  href={`/buscar?categoria=${category.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
                    {CATEGORY_ICONS[category.slug] || <Star className="h-5 w-5" />}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{category.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{category.description}</p>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                    Ver profissionais
                    <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mu-section bg-slate-50">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Depoimentos</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
                O que dizem quem usa.
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
            {TESTIMONIALS.map(t => (
              <StaggerItem key={t.name}>
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent-400 text-accent-400" />
                    ))}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* FAQ */}
      <section className="mu-section bg-white">
        <div className="mu-shell grid gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
          <FadeIn direction="right">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">FAQ</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">Ainda com dúvida? Entre em contato conosco.</p>
              <Link
                href="/ajuda"
                className="mu-btn-outline mt-6 inline-flex items-center gap-1.5 text-sm"
              >
                Fale com a equipe
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeIn>

          <FadeIn direction="left" delay={0.15}>
            <FaqAccordion items={FAQ_ITEMS} />
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="mu-section">
        <div className="mu-shell">
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl bg-brand-600 px-8 py-16 text-center text-white md:px-16 md:py-20">
              {/* Background decoration */}
              <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/4 rounded-full bg-accent-500/20" />

              <div className="relative">
                <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-[-0.03em] md:text-5xl">
                  Comece agora.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-white/90">
                  Procure um especialista ou cadastre seu perfil para começar a atender.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/buscar" className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-8 py-3.5 text-base font-semibold text-brand-600 transition hover:bg-slate-100">
                    Ver especialistas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/cadastro?role=profissional" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/40 bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/20">
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
