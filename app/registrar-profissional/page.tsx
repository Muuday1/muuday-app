import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  Home,
  MapPin,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { FadeIn } from '@/components/landing/FadeIn'
import { FaqAccordion } from '@/components/landing/FaqAccordion'
import { EarningsCalculator } from '@/components/landing/EarningsCalculator'
import { BookingFlowAnimation } from '@/components/landing/BookingFlowAnimation'
import { TestimonialCarouselPro } from '@/components/landing/TestimonialCarouselPro'
import { AnimatedCounter } from '@/components/landing/AnimatedCounter'
import { BlurBlob } from '@/components/landing/BlurBlob'
import { DotPattern } from '@/components/landing/DotPattern'
import { FloatingBadge } from '@/components/landing/FloatingBadge'
import { MagneticButton } from '@/components/landing/MagneticButton'
import { Sparkle } from '@/components/landing/Sparkle'
import { StaggerContainer, StaggerItem } from '@/components/landing/StaggerContainer'
import { WaveDivider } from '@/components/landing/WaveDivider'

export const metadata = { title: 'Registrar como profissional | Muuday' }

const STATS = [
  { value: 200, suffix: '+', label: 'Profissionais ativos', icon: Globe },
  { value: 50, suffix: '+', label: 'Países atendidos', icon: MapPin },
  { value: 10, suffix: 'k+', label: 'Sessões realizadas', icon: Video },
  { value: 49, suffix: '', label: 'Avaliação média', icon: Star, prefix: '4.' },
]

const FEATURES = [
  {
    icon: Globe,
    title: 'Alcance global',
    text: 'Brasileiros em Portugal, Espanha, EUA, Japão, Alemanha e mais 50 países buscam profissionais como você.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80',
  },
  {
    icon: Home,
    title: 'Trabalhe de qualquer lugar',
    text: 'Sem escritório, sem deslocamento. Sua casa, seu horário, suas regras. Você define quando e quanto quer trabalhar.',
    image: 'https://images.unsplash.com/photo-1593642632823-8f78536788c6?w=600&q=80',
  },
  {
    icon: Banknote,
    title: 'Receba com segurança',
    text: 'Pagamentos processados automaticamente. Cartão, Pix e parcelamento. O dinheiro cai na sua conta após cada sessão.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
  },
]

const HOW_STEPS = [
  {
    step: '01',
    title: 'Crie seu perfil',
    body: 'Cadastro em minutos. Adicione formação, foto, vídeo e especialidades.',
    icon: BadgeCheck,
    color: 'green' as const,
  },
  {
    step: '02',
    title: 'Configure e aprove',
    body: 'Defina preços, horários e serviços. Nossa equipe aprova em até 48h.',
    icon: ShieldCheck,
    color: 'blue' as const,
  },
  {
    step: '03',
    title: 'Receba clientes',
    body: 'Seu perfil fica público. Clientes agendam, você atende, a plataforma paga.',
    icon: Banknote,
    color: 'slate' as const,
  },
]

const UPCOMING = [
  {
    icon: BrainCircuit,
    title: 'Agenda inteligente com IA',
    text: 'Sugestões automáticas de horários otimizados para maximizar sua ocupação.',
    badge: 'Em breve',
  },
  {
    icon: Bell,
    title: 'Lembretes por WhatsApp',
    text: 'Reduza faltas com lembretes automáticos no canal que seu cliente realmente lê.',
    badge: 'Em breve',
  },
  {
    icon: BarChart3,
    title: 'Relatórios de crescimento',
    text: 'Dashboard com métricas de receita, retenção e avaliações ao longo do tempo.',
    badge: 'Em breve',
  },
  {
    icon: Repeat,
    title: 'Planos de assinatura',
    text: 'Ofereça pacotes mensais para clientes recorrentes com desconto automático.',
    badge: 'Em breve',
  },
]

const COMPARISON = [
  { traditional: 'Sua cidade', muuday: '50+ países' },
  { traditional: 'WhatsApp manual', muuday: 'Automática com conversão de fuso' },
  { traditional: 'Boleto, atraso, inadimplência', muuday: 'Cartão/Pix, protegido, na conta' },
  { traditional: 'Zoom pessoal', muuday: 'Videochamada HD integrada' },
  { traditional: 'Indicação boca a boca', muuday: 'Busca pública + filtros' },
]

const TESTIMONIALS = [
  {
    name: 'Dra. Fernanda Lima',
    role: 'Psicóloga Clínica · Lisboa',
    text: 'Em 3 meses passei a atender 12 brasileiros em Lisboa e Londres. A plataforma cuida de toda a burocrática — agenda, pagamento, lembretes — e eu foco no atendimento. Minha renda aumentou 40% sem eu sair de casa.',
  },
  {
    name: 'Dr. Ricardo Mendes',
    role: 'Nutricionista · Londres',
    text: 'Finalmente consigo atender clientes do Brasil sem complicação de fuso horário. Tudo ajustado automaticamente. Meu consultório virtual funciona 24/7 e eu tenho controle total da minha agenda.',
  },
  {
    name: 'Carolina Dias',
    role: 'Advogada · Berlim',
    text: 'A Muuday me deu acesso a clientes brasileiros na Europa que precisavam de orientação jurídica em português. A plataforma cuida do agendamento e pagamento, eu cuido do atendimento.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Quanto custa para começar?',
    answer:
      'O cadastro é simples e rápido. Você só paga uma taxa por transação quando recebe um pagamento — não há mensalidade fixa nem custo para manter seu perfil ativo.',
  },
  {
    question: 'Quanto tempo leva para aprovar meu perfil?',
    answer: 'Até 48 horas úteis. Preencha todos os campos e use documentos legíveis para acelerar.',
  },
  {
    question: 'Como recebo os pagamentos?',
    answer: 'Conecte sua conta bancária no dashboard. Após cada sessão, o valor é liberado em até 48h e cai na sua conta em 1-3 dias úteis.',
  },
  {
    question: 'Preciso de CNPJ?',
    answer: 'Não é obrigatório para começar. Você pode atender como pessoa física e emitir nota fiscal quando quiser.',
  },
  {
    question: 'Quais especialidades são aceitas?',
    answer: 'Psicologia, nutrição, direito, contabilidade, coaching, fisioterapia, mentoria educacional e outras áreas com aprovação da equipe.',
  },
]

export default async function RegistrarProfissionalPage() {
  return (
    <PublicPageLayout>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <BlurBlob className="-top-20 -right-20 h-96 w-96" color="bg-white/30" delay={0} duration={10} />
        <BlurBlob className="bottom-0 left-0 h-72 w-72" color="bg-[#2563eb]/15" delay={1} duration={12} />
        <BlurBlob className="top-1/3 right-1/4 h-48 w-48" color="bg-[#a3e635]/40" delay={2} duration={8} />
        <BlurBlob className="top-10 left-1/4 h-32 w-32" color="bg-white/20" delay={0.5} duration={9} />

        <Sparkle className="absolute top-20 left-[15%]" size={16} delay={0} />
        <Sparkle className="absolute top-32 right-[20%]" size={12} delay={1.2} color="#2563eb" />
        <Sparkle className="absolute bottom-32 left-[25%]" size={14} delay={0.8} />
        <Sparkle className="absolute top-1/2 right-[10%]" size={10} delay={1.8} color="#fff" />

        <div className="mu-shell relative pt-16 pb-8 md:pt-24 md:pb-12 lg:pt-32 lg:pb-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <FadeIn direction="up">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 backdrop-blur-sm">
                  <BadgeCheck className="h-3.5 w-3.5 text-slate-900" />
                  Plataforma para profissionais
                </span>
                <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Transforme sua expertise em renda global
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-800">
                  Atenda brasileiros em 50+ países sem sair de casa. Agenda automatizada,
                  pagamento garantido e videochamada integrada.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <MagneticButton strength={0.2}>
                    <Link
                      href="/cadastro?role=profissional"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20"
                    >
                      Criar meu perfil
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </MagneticButton>
                  <Link
                    href="#como-funciona"
                    className="inline-flex items-center justify-center gap-2 text-base font-bold text-slate-900 underline underline-offset-4 transition hover:text-slate-700"
                  >
                    Como funciona
                  </Link>
                </div>

                <div className="mt-8 flex items-center gap-4">
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
                        className="h-8 w-8 rounded-full border-2 border-[#9FE870] object-cover"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-800">
                    <span className="font-bold text-slate-900">200+ profissionais</span> já atendendo
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.15}>
              <div className="relative mx-auto w-full max-w-md">
                <EarningsCalculator />
                <FloatingBadge className="absolute -right-4 -top-4" delay={0.5} duration={3.5} yOffset={10}>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9FE870]/20">
                        <Zap className="h-4 w-4 text-slate-900" />
                      </div>
                      <span className="text-xs font-semibold text-slate-900">Aprovação em 48h</span>
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
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Wave divider */}
      <div className="relative h-16 bg-[#9FE870]">
        <WaveDivider fillColor="#ffffff" flip />
      </div>

      {/* ========== STATS ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="fade">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                Números que mostram nosso crescimento
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4" staggerDelay={0.15}>
            {STATS.map((stat) => {
              const Icon = stat.icon
              return (
                <StaggerItem key={stat.label}>
                  <div className="group flex flex-col items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9FE870] to-emerald-500 shadow-lg transition group-hover:scale-110 group-hover:rotate-[5deg]">
                      <Icon className="h-8 w-8 text-slate-900" />
                    </div>
                    <p className="mt-4 font-display text-4xl font-black text-slate-900">
                      {stat.prefix && <span>{stat.prefix}</span>}
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

      {/* ========== FEATURES (landing-style cards) ========== */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Tudo que você precisa para atender online
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Uma plataforma completa. Você cuida do atendimento, a Muuday cuida do resto.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
            {FEATURES.map((feature, i) => (
              <StaggerItem key={feature.title}>
                <ScrollReveal variant="scale" delay={i * 0.1}>
                  <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1">
                    <div className="aspect-[4/3] overflow-hidden">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={600}
                        height={450}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9FE870]/20">
                        <feature.icon className="h-5 w-5 text-slate-900" />
                      </div>
                      <h3 className="mt-4 text-xl font-bold text-slate-900">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
                    </div>
                  </div>
                </ScrollReveal>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== BOOKING FLOW DEMO ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal variant="slideRight">
              <div>
                <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                  Seu cliente te encontra em 4 passos
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  A experiência de agendamento é tão simples que seus clientes convertem sem
                  hesitar. Você só recebe o agendamento confirmado na sua agenda.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    { icon: Search, label: 'Busca', text: 'Cliente encontra seu perfil por especialidade e localização.' },
                    { icon: ChevronRight, label: 'Serviço', text: 'Escolhe o serviço, vê preços e disponibilidade em tempo real.' },
                    { icon: Clock, label: 'Horário', text: 'Seleciona dia e hora com conversão automática de fuso.' },
                    { icon: Banknote, label: 'Pagamento', text: 'Paga com cartão ou Pix. Você recebe após a sessão.' },
                  ].map((s, i) => (
                    <div key={s.label} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9FE870]/20">
                        <s.icon className="h-5 w-5 text-slate-900" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {i + 1}. {s.label}
                        </p>
                        <p className="text-sm text-slate-600">{s.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="slideLeft" delay={0.15}>
              <BookingFlowAnimation />
            </ScrollReveal>
          </div>
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

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {HOW_STEPS.map((item, index) => {
              const Icon = item.icon
              const isLast = index === HOW_STEPS.length - 1
              return (
                <ScrollReveal key={item.step} variant="slideUp" delay={index * 0.15}>
                  <div className="relative rounded-3xl bg-white p-8 shadow-sm transition hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-1">
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
        </div>
      </section>

      {/* Wave divider */}
      <div className="relative h-16 bg-[#9FE870]">
        <WaveDivider fillColor="#ffffff" flip />
      </div>

      {/* ========== COMPARISON (landing-style table) ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Tradicional vs Muuday
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="scale" delay={0.15}>
            <div className="mx-auto mt-14 max-w-xl overflow-hidden rounded-3xl bg-white shadow-xl">
              <div className="flex items-center justify-between bg-slate-900 px-6 py-4">
                <span className="text-sm font-semibold text-white/70 line-through">Método tradicional</span>
                <ArrowRight className="h-4 w-4 text-white/30" />
                <span className="text-sm font-semibold text-[#9FE870]">Muuday</span>
              </div>
              <div className="divide-y divide-slate-100">
                {COMPARISON.map((row, i) => (
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

      {/* ========== TESTIMONIALS ========== */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                4.9 no Trustpilot
              </div>
              <h2 className="mt-6 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl">
                O que dizem quem atende
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-10">
            <TestimonialCarouselPro items={TESTIMONIALS} />
          </div>
        </div>
      </section>

      {/* ========== UPCOMING FEATURES ========== */}
      <section className="mu-section bg-slate-900">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#9FE870]">
                <Sparkles className="h-3.5 w-3.5" />
                O que vem por aí
              </span>
              <h2 className="mt-6 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white md:text-5xl lg:text-6xl">
                Funcionalidades que vão impulsionar sua prática
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Estamos construindo as ferramentas que os melhores profissionais do mundo usam.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
            {UPCOMING.map((item) => (
              <StaggerItem key={item.title}>
                <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-[#9FE870]/30 hover:bg-white/[0.07]">
                  <span className="absolute right-4 top-4 rounded-full bg-[#9FE870]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9FE870]">
                    {item.badge}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9FE870]/15">
                    <item.icon className="h-5 w-5 text-[#9FE870]" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell grid gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
          <ScrollReveal variant="slideRight">
            <div>
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl">
                Dúvidas frequentes
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Respostas diretas para você começar sem enrolação.
              </p>
              <MagneticButton strength={0.15} className="mt-6 inline-block">
                <Link
                  href="/ajuda/c/profissionais"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-[#9FE870] hover:text-slate-700 hover:shadow-md"
                >
                  Ver todos os artigos
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
                  <Zap className="h-3.5 w-3.5" />
                  Perfil aprovado em 48h
                </div>

                <h2 className="mt-6 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white md:text-5xl lg:text-6xl">
                  Sua carreira sem fronteiras começa aqui
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/70">
                  Comece a receber clientes esta semana.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <MagneticButton strength={0.2}>
                    <Link
                      href="/cadastro?role=profissional"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE870] px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-xl hover:shadow-[#9FE870]/25"
                    >
                      Criar meu perfil
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </MagneticButton>
                  <Link
                    href="/ajuda/c/profissionais"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/5"
                  >
                    Ver artigos para profissionais
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
