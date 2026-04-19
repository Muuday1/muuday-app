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
  Zap,
  Headphones,
  TrendingUp,
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
    flag: '🇵🇹',
    country: 'Portugal',
  },
  {
    name: 'Ricardo Mendes',
    role: 'Nutricionista em Londres',
    text: 'Finalmente consigo atender clientes do Brasil sem complicação de fuso horário. Tudo ajustado automaticamente.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    flag: '🇬🇧',
    country: 'Reino Unido',
  },
  {
    name: 'Carolina Dias',
    role: 'Cliente em Berlim',
    text: 'Encontrei uma psicóloga brasileira em minutos. Fazer terapia na minha língua, morando na Alemanha, fez toda a diferença.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    flag: '🇩🇪',
    country: 'Alemanha',
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

function SearchCard() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Profissionais verificados
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-500">Você busca</label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Search className="h-5 w-5 text-slate-400" />
                <select className="flex-1 bg-transparent text-base font-semibold text-slate-900 outline-none">
                  <option>Qualquer especialidade</option>
                  {ALL_CATEGORIES.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500">Que fala</label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Globe className="h-5 w-5 text-slate-400" />
                <select className="flex-1 bg-transparent text-base font-semibold text-slate-900 outline-none">
                  <option>Português</option>
                  <option>English</option>
                  <option>Español</option>
                  <option>Français</option>
                </select>
              </div>
            </div>

            <Link
              href="/buscar"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#9FE870] px-6 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f]"
            >
              Buscar profissionais
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
          <div className="ml-4 flex-1 rounded-md bg-white py-1 px-3 text-xs text-slate-400">muuday.com/buscar</div>
        </div>
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
        {/* Decorative blur shapes */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#2563eb]/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-[#a3e635]/30 blur-2xl" />

        <div className="mu-shell relative pt-16 pb-8 md:pt-24 md:pb-12 lg:pt-32 lg:pb-16">
          <FadeIn direction="up">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="font-display text-5xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 md:text-7xl lg:text-8xl">
                Profissionais brasileiros, no seu fuso, na sua língua
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800 md:text-xl">
                Psicólogos, nutricionistas, coaches e outros especialistas que entendem sua realidade.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800"
                >
                  Encontrar profissionais
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/registrar-profissional"
                  className="inline-flex items-center justify-center gap-2 text-base font-bold text-slate-900 underline underline-offset-4 transition hover:text-slate-700"
                >
                  Quero atender pela Muuday
                </Link>
              </div>
              <div className="mt-10 flex items-center justify-center gap-3">
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
        </div>
      </section>

      {/* ========== SEARCH CARD (Calculator style) ========== */}
      <section className="relative -mt-8 z-10 px-4 md:-mt-12">
        <FadeIn direction="up" delay={0.1}>
          <SearchCard />
        </FadeIn>
      </section>

      {/* ========== TRUST STATS ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                Confiado por brasileiros no mundo todo
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-10 grid gap-6 sm:grid-cols-3" staggerDelay={0.1}>
            {STATS.map((stat, i) => {
              const Icon = stat.icon
              return (
                <StaggerItem key={stat.label}>
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e0f2fe]">
                      <Icon className="h-7 w-7 text-[#0369a1]" />
                    </div>
                    <p className="mt-4 font-display text-4xl font-black text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== WHY SECTION (green, bold headline) ========== */}
      <section className="mu-section bg-[#9FE870]">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Economize tempo e encontre quem entende você
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800">
                Diferente de buscadores genéricos, todos os profissionais da Muuday falam português e entendem a realidade de viver fora do Brasil.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800"
                >
                  Buscar agora
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/sobre"
                  className="inline-flex items-center justify-center gap-2 text-base font-bold text-slate-900 underline underline-offset-4 transition hover:text-slate-700"
                >
                  Como funciona
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Comparison table style */}
          <FadeIn delay={0.15}>
            <div className="mx-auto mt-14 max-w-xl overflow-hidden rounded-3xl bg-white shadow-lg">
              <div className="flex items-center justify-between bg-slate-900 px-6 py-4">
                <span className="text-sm font-semibold text-white">Busca tradicional</span>
                <span className="text-sm font-semibold text-white">Muuday</span>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { traditional: 'Horários em fusos diferentes', muuday: 'Agendamento automático no seu fuso' },
                  { traditional: 'Idioma pode ser barreira', muuday: '100% em português' },
                  { traditional: 'Sem contexto da vida no exterior', muuday: 'Profissionais que vivem ou viveram fora' },
                  { traditional: 'Várias ferramentas', muuday: 'Busca, agendamento e vídeo em um só lugar' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <span className="flex-1 text-sm text-slate-500 line-through">{row.traditional}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    <span className="flex-1 text-right text-sm font-semibold text-slate-900">{row.muuday}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ========== FOR WHO (The account that moves with you style) ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Muuday é para quem está longe, mas quer se sentir em casa
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
            {FOR_WHO.map(item => (
              <StaggerItem key={item.title}>
                <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:shadow-xl">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={600}
                      height={450}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
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
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Três passos. Sem complicação.
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.15}>
            {HOW_STEPS.map((item, index) => {
              const Icon = item.icon
              return (
                <StaggerItem key={item.step}>
                  <div className="relative rounded-3xl bg-white p-8 shadow-sm">
                    <span className="absolute right-6 top-6 font-display text-7xl font-black text-slate-100">
                      {item.step}
                    </span>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
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
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
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
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#9FE870] hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-[#9FE870]">
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

      {/* ========== TESTIMONIALS (Wise style big cards) ========== */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                4.9 no Trustpilot
              </div>
              <h2 className="mt-6 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl">
                O que dizem quem usa
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
            {TESTIMONIALS.map(t => (
              <StaggerItem key={t.name}>
                <div className="flex h-full flex-col rounded-3xl bg-[#9FE870] p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{t.flag}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-700">{t.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-base font-medium leading-7 text-slate-800">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="mt-6 inline-flex items-center self-start rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                    {t.name.split(' ')[0]} no Muuday
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== SAFE AT EVERY STEP ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <FadeIn>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Seguro em cada etapa
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Seus dados e pagamentos estão protegidos. Cada profissional é verificado antes de entrar na plataforma.
              </p>
              <Link
                href="/sobre"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE870] px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f]"
              >
                Conheça nossa segurança
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-3xl bg-[#1a3a1a] px-8 py-16 text-center md:px-16 md:py-20">
              {/* Concentric circles decoration */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
                <div className="h-64 w-64 rounded-full border border-white/20" />
                <div className="absolute h-48 w-48 rounded-full border border-white/20" />
                <div className="absolute h-32 w-32 rounded-full border border-white/20" />
              </div>
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#9FE870]/20">
                <Globe className="h-10 w-10 text-[#9FE870]" />
              </div>
              <h3 className="relative mt-6 text-2xl font-bold text-white">Dados protegidos</h3>
              <p className="relative mx-auto mt-2 max-w-md text-sm leading-6 text-white/70">
                Seus dados pessoais e de pagamento são criptografados e nunca compartilhados com terceiros.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell grid gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
          <FadeIn direction="right">
            <div>
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-lg text-slate-600">Ainda com dúvida? Entre em contato conosco.</p>
              <Link
                href="/ajuda"
                className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-[#9FE870] hover:text-slate-700"
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

      {/* ========== FINAL CTA ========== */}
      <section className="mu-section bg-[#9FE870]">
        <div className="mu-shell">
          <FadeIn>
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Comece agora
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800">
                Procure um especialista ou cadastre seu perfil para começar a atender.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800"
                >
                  Ver especialistas
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/cadastro?role=profissional"
                  className="inline-flex items-center justify-center gap-2 text-base font-bold text-slate-900 underline underline-offset-4 transition hover:text-slate-700"
                >
                  Criar perfil profissional
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PublicPageLayout>
  )
}
