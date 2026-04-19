import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  Globe,
  Search,
  Star,
  Video,
  Zap,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { FaqAccordion } from '@/components/landing/FaqAccordion'
import { FadeIn } from '@/components/landing/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/landing/StaggerContainer'
import { AnimatedCounter } from '@/components/landing/AnimatedCounter'
import { BlurBlob } from '@/components/landing/BlurBlob'
import { DotPattern } from '@/components/landing/DotPattern'
import { FloatingBadge } from '@/components/landing/FloatingBadge'
import { GradientBorder } from '@/components/landing/GradientBorder'
import { MagneticButton } from '@/components/landing/MagneticButton'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { Sparkle } from '@/components/landing/Sparkle'
import { WaveDivider } from '@/components/landing/WaveDivider'
import { CategoryCarousel } from '@/components/landing/CategoryCarousel'
import { TestimonialCarousel } from '@/components/landing/TestimonialCarousel'
import { ParallaxSection } from '@/components/landing/ParallaxSection'
import { WorksEverywhereTabs } from '@/components/landing/WorksEverywhereTabs'
import { SEARCH_CATEGORIES, getSpecialtyOptions } from '@/lib/search-config'

const STATS = [
  { value: 100, suffix: '%', label: 'Online por vídeo', icon: Video },
  { value: 50, suffix: '+', label: 'Áreas de atuação', icon: Globe },
  { value: 24, suffix: '/7', label: 'Agende quando quiser', icon: Clock },
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
    color: 'green' as const,
  },
  {
    step: '02',
    title: 'Agende',
    body: 'Escolha dia, horário e tipo de sessão. Confirmação instantânea.',
    icon: CalendarCheck,
    color: 'blue' as const,
  },
  {
    step: '03',
    title: 'Conecte',
    body: 'Videochamada integrada. Sem Zoom, Teams ou WhatsApp.',
    icon: Video,
    color: 'slate' as const,
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

const COUNTRIES = [
  ['🇵🇹', 'Portugal'],
  ['🇬🇧', 'Reino Unido'],
  ['🇩🇪', 'Alemanha'],
  ['🇫🇷', 'França'],
  ['🇮🇪', 'Irlanda'],
  ['🇳🇱', 'Holanda'],
  ['🇮🇹', 'Itália'],
  ['🇪🇸', 'Espanha'],
  ['🇺🇸', 'EUA'],
  ['🇨🇦', 'Canadá'],
  ['🇦🇺', 'Austrália'],
  ['🇯🇵', 'Japão'],
  ['🇧🇷', 'Brasil'],
  ['🇨🇭', 'Suíça'],
  ['🇸🇪', 'Suécia'],
  ['🇳🇴', 'Noruega'],
]

function SearchCard() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <GradientBorder borderClassName="p-[2px] rounded-3xl bg-gradient-to-br from-[#9FE870] via-emerald-400 to-brand-500">
        <div className="overflow-hidden rounded-3xl bg-white">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Profissionais verificados
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-500">Qualquer categoria</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/20">
                  <Search className="h-5 w-5 text-slate-400" />
                  <select className="flex-1 bg-transparent text-base font-semibold text-slate-900 outline-none">
                    <option>Todas as categorias</option>
                    {ALL_CATEGORIES.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-500">Especialidade</label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/20">
                  <Globe className="h-5 w-5 text-slate-400" />
                  <select className="flex-1 bg-transparent text-base font-semibold text-slate-900 outline-none">
                    <option>Todas as especialidades</option>
                    {getSpecialtyOptions().map((specialty) => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
              </div>

              <MagneticButton className="w-full" strength={0.15}>
                <Link
                  href="/buscar"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#9FE870] px-6 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-lg hover:shadow-[#9FE870]/25"
                >
                  Buscar profissionais
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </MagneticButton>
            </div>
          </div>
        </div>
      </GradientBorder>
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
      <FloatingBadge className="absolute -right-4 -top-4" delay={0.5} duration={3.5} yOffset={10}>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100">
              <Video className="h-4 w-4 text-accent-600" />
            </div>
            <span className="text-xs font-semibold text-slate-900">Sessão ao vivo</span>
          </div>
        </div>
      </FloatingBadge>
      <FloatingBadge className="absolute -bottom-4 -left-4" delay={1} duration={4} yOffset={12}>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-xs font-semibold text-slate-900">4.9 média</span>
          </div>
        </div>
      </FloatingBadge>
    </div>
  )
}

export default async function RootPage() {
  return (
    <PublicPageLayout>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        {/* Animated blur blobs */}
        <BlurBlob className="-top-20 -right-20 h-96 w-96" color="bg-white/30" delay={0} duration={10} />
        <BlurBlob className="bottom-0 left-0 h-72 w-72" color="bg-[#2563eb]/15" delay={1} duration={12} />
        <BlurBlob className="top-1/3 right-1/4 h-48 w-48" color="bg-[#a3e635]/40" delay={2} duration={8} />
        <BlurBlob className="top-10 left-1/4 h-32 w-32" color="bg-white/20" delay={0.5} duration={9} />

        {/* Sparkle decorations */}
        <Sparkle className="absolute top-20 left-[15%]" size={16} delay={0} />
        <Sparkle className="absolute top-32 right-[20%]" size={12} delay={1.2} color="#2563eb" />
        <Sparkle className="absolute bottom-32 left-[25%]" size={14} delay={0.8} />
        <Sparkle className="absolute top-1/2 right-[10%]" size={10} delay={1.8} color="#fff" />

        <div className="mu-shell relative pt-16 pb-8 md:pt-24 md:pb-12 lg:pt-32 lg:pb-16">
          <FadeIn direction="up">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
                Psicólogos, advogados, contadores, nutricionistas do Brasil
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-800 md:text-xl">
                Psicólogos, advogados, contadores, nutricionistas do Brasil — atendendo você onde quer que esteja. No seu idioma, no seu fuso horário, com segurança.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <MagneticButton strength={0.2}>
                  <Link
                    href="/buscar"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20"
                  >
                    Encontrar profissionais
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </MagneticButton>
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
          <ScrollReveal variant="fade">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                Confiado por brasileiros no mundo todo
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="mt-10 grid gap-6 sm:grid-cols-3" staggerDelay={0.15}>
            {STATS.map((stat) => {
              const Icon = stat.icon
              return (
                <StaggerItem key={stat.label}>
                  <div className="group flex flex-col items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg transition group-hover:scale-110 group-hover:rotate-[5deg]">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <p className="mt-4 font-display text-4xl font-black text-slate-900">
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={2} />
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== WHY SECTION (green, bold headline) ========== */}
      <section className="relative mu-section bg-[#9FE870] overflow-hidden">
        <DotPattern className="opacity-30" dotColor="#0f172a" spacing={32} dotSize={2} />

        <div className="mu-shell relative">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Economize tempo e encontre quem entende você
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800">
                Diferente de buscadores genéricos, todos os profissionais da Muuday falam português e entendem a realidade de viver fora do Brasil.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <MagneticButton strength={0.15}>
                  <Link
                    href="/buscar"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20"
                  >
                    Buscar agora
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </MagneticButton>
                <Link
                  href="/sobre"
                  className="inline-flex items-center justify-center gap-2 text-base font-bold text-slate-900 underline underline-offset-4 transition hover:text-slate-700"
                >
                  Como funciona
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Comparison table style */}
          <ScrollReveal variant="scale" delay={0.15}>
            <div className="mx-auto mt-14 max-w-xl overflow-hidden rounded-3xl bg-white shadow-xl">
              <div className="flex items-center justify-between bg-slate-900 px-6 py-4">
                <span className="text-sm font-semibold text-white/70 line-through">Busca tradicional</span>
                <ArrowRight className="h-4 w-4 text-white/30" />
                <span className="text-sm font-semibold text-[#9FE870]">Muuday</span>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { traditional: 'Horários em fusos diferentes', muuday: 'Agendamento automático no seu fuso' },
                  { traditional: 'Idioma pode ser barreira', muuday: '100% em português' },
                  { traditional: 'Sem contexto da vida no exterior', muuday: 'Profissionais que vivem ou viveram fora' },
                  { traditional: 'Várias ferramentas', muuday: 'Busca, agendamento e vídeo em um só lugar' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50">
                    <span className="flex-1 text-sm text-slate-400 line-through">{row.traditional}</span>
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9FE870]">
                      <ArrowRight className="h-3 w-3 text-slate-900" />
                    </div>
                    <span className="flex-1 text-right text-sm font-semibold text-slate-900">{row.muuday}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Wave divider */}
      <div className="relative h-16 bg-[#9FE870]">
        <WaveDivider fillColor="#ffffff" flip />
      </div>

      {/* ========== FOR WHO (The account that moves with you style) ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Muuday é para quem está longe, mas quer se sentir em casa
              </h2>
            </div>
          </ScrollReveal>

          <ParallaxSection speed={0.3}>
            <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
              {FOR_WHO.map((item, i) => (
                <StaggerItem key={item.title}>
                  <ScrollReveal variant="scale" delay={i * 0.1}>
                    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1">
                      <div className="aspect-[4/3] overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={600}
                          height={450}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </ParallaxSection>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="relative mu-section bg-[#9FE870] overflow-hidden">
        <DotPattern className="opacity-20" dotColor="#0f172a" spacing={40} dotSize={2} />

        <div className="mu-shell relative">
          <ScrollReveal variant="slideUp">
            <div className="text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Três passos. Sem complicação.
              </h2>
            </div>
          </ScrollReveal>

          <ParallaxSection speed={0.2}>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {HOW_STEPS.map((item, index) => {
                const Icon = item.icon
                const isLast = index === HOW_STEPS.length - 1
                return (
                  <ScrollReveal key={item.step} variant="slideUp" delay={index * 0.15}>
                    <div className="relative rounded-3xl bg-white p-8 shadow-sm transition hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-1">
                    {/* Connector line */}
                    {!isLast && (
                      <div className="pointer-events-none absolute top-16 -right-3 hidden h-0.5 w-6 md:block">
                        <svg className="h-8 w-full" viewBox="0 0 24 8" fill="none">
                          <path d="M0 4C8 4 16 4 24 4" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 4" opacity="0.2" />
                          <path d="M20 1L24 4L20 7" stroke="#0f172a" strokeWidth="2" opacity="0.2" />
                        </svg>
                      </div>
                    )}

                    <span className="absolute right-6 top-6 font-display text-7xl font-black text-slate-100">
                      {item.step}
                    </span>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition group-hover:scale-110 group-hover:rotate-[5deg] ${
                      item.color === 'green' ? 'bg-gradient-to-br from-[#9FE870] to-emerald-500 text-slate-900' :
                      item.color === 'blue' ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white' :
                      'bg-gradient-to-br from-slate-800 to-slate-900 text-white'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </ParallaxSection>
        </div>
      </section>

      {/* Wave divider */}
      <div className="relative h-16 bg-[#9FE870]">
        <WaveDivider fillColor="#ffffff" flip />
      </div>

      {/* ========== CATEGORIES CAROUSEL ========== */}
      <section className="relative mu-section bg-white overflow-hidden">
        <div className="mu-shell relative">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Escolha por especialidade
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Oito áreas de atuação com profissionais revisados e prontos para atender.
              </p>
            </div>
          </ScrollReveal>

          <CategoryCarousel />
        </div>
      </section>

      {/* ========== TESTIMONIALS (Wise style big cards) ========== */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                4.9 no Trustpilot
              </div>
              <h2 className="mt-6 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl">
                O que dizem quem usa
              </h2>
            </div>
          </ScrollReveal>

          <TestimonialCarousel />
        </div>
      </section>

      {/* ========== WORKS EVERYWHERE ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Muuday funciona em todo lugar
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Brasileiros em mais de 50 países já usam a plataforma para encontrar e atender especialistas.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="scale" delay={0.15}>
            <WorksEverywhereTabs />
          </ScrollReveal>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {COUNTRIES.map(([flag, country]) => (
              <div
                key={country}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-[#9FE870] hover:shadow-sm"
              >
                <span>{flag}</span>
                <span className="font-medium">{country}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell grid gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
          <ScrollReveal variant="slideRight">
            <div>
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl">
                Perguntas frequentes
              </h2>
              <p className="mt-4 text-lg text-slate-600">Ainda com dúvida? Entre em contato conosco.</p>
              <MagneticButton strength={0.15} className="mt-6 inline-block">
                <Link
                  href="/ajuda"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-[#9FE870] hover:text-slate-700 hover:shadow-md"
                >
                  Fale com a equipe
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </MagneticButton>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="slideLeft" delay={0.15}>
            <FaqAccordion items={FAQ_ITEMS} />
          </ScrollReveal>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="relative mu-section bg-[#9FE870] overflow-hidden">
        <DotPattern className="opacity-20" dotColor="#0f172a" spacing={48} dotSize={2} />

        <div className="mu-shell relative">
          <ScrollReveal variant="scale">
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-16 text-center md:px-16 md:py-24">
              {/* Decorative rings */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
                <div className="h-80 w-80 rounded-full border border-white/30" />
                <div className="absolute h-60 w-60 rounded-full border border-white/30" />
                <div className="absolute h-40 w-40 rounded-full border border-white/30" />
              </div>

              {/* Sparkles */}
              <Sparkle className="absolute top-16 left-[20%]" size={14} delay={0.3} color="#9FE870" />
              <Sparkle className="absolute bottom-20 right-[15%]" size={12} delay={1.5} color="#fff" />
              <Sparkle className="absolute top-24 right-[25%]" size={10} delay={0.8} color="#9FE870" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#9FE870] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Sem custo para começar
                </div>

                <h2 className="mt-6 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white md:text-5xl lg:text-6xl">
                  Comece agora
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/70">
                  Procure um especialista ou cadastre seu perfil para começar a atender.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <MagneticButton strength={0.2}>
                    <Link
                      href="/buscar"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE870] px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-xl hover:shadow-[#9FE870]/25"
                    >
                      Ver especialistas
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </MagneticButton>
                  <Link
                    href="/cadastro?role=profissional"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/5"
                  >
                    Criar perfil profissional
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicPageLayout>
  )
}
