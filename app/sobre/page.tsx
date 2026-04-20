import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Compass,
  Globe,
  Heart,
  HeartHandshake,
  Lightbulb,
  MapPin,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { FadeIn } from '@/components/landing/FadeIn'
import { AnimatedCounter } from '@/components/landing/AnimatedCounter'
import { BlurBlob } from '@/components/landing/BlurBlob'
import { DotPattern } from '@/components/landing/DotPattern'
import { MagneticButton } from '@/components/landing/MagneticButton'
import { Sparkle } from '@/components/landing/Sparkle'
import { StaggerContainer, StaggerItem } from '@/components/landing/StaggerContainer'
import { WaveDivider } from '@/components/landing/WaveDivider'
import { GlobalMapAnimation } from '@/components/landing/GlobalMapAnimation'

export const metadata = { title: 'Sobre nós | Muuday' }

const STATS = [
  { value: 5, suffix: 'M+', label: 'Brasileiros no exterior', icon: Globe },
  { value: 50, suffix: '+', label: 'Países alcançados', icon: MapPin },
  { value: 200, suffix: '+', label: 'Profissionais ativos', icon: Users },
]

const MISSION_VISION = [
  {
    icon: Target,
    title: 'Missão',
    text: 'Encurtar a distância entre brasileiros no mundo e o cuidado que merecem. Conectar quem precisa com quem entende — na mesma língua, no mesmo contexto, sem barreiras.',
    color: 'green' as const,
  },
  {
    icon: Compass,
    title: 'Visão',
    text: 'Ser a principal ponte de apoio profissional para a comunidade brasileira global. Um lugar onde ninguém se sente longe demais para ser cuidado.',
    color: 'blue' as const,
  },
  {
    icon: Heart,
    title: 'Propósito',
    text: 'Acreditamos que morar fora não deveria significar abrir mão de ser atendido por quem entende sua cultura, sua história e sua língua.',
    color: 'slate' as const,
  },
]

const IDEALS = [
  'Ninguém deveria se sentir sozinho por estar longe de casa.',
  'Profissionais brasileiros têm talento para atender o mundo.',
  'A distância física não pode ser barreira para cuidado de qualidade.',
  'Cada brasileiro no exterior carrega uma história que merece ser ouvida.',
  'A tecnologia existe para aproximar pessoas, não para separá-las.',
]

const FUTURE = [
  {
    icon: Rocket,
    year: '2025',
    title: 'Expansão global',
    text: 'Alcançar 500 profissionais ativos em 60+ países, cobrindo todas as regiões com grande comunidade brasileira.',
  },
  {
    icon: BookOpen,
    year: '2026',
    title: 'Educação e conteúdo',
    text: 'Lançar programa de webinars, guias e recursos para ajudar brasileiros a se adaptarem em novos países.',
  },
  {
    icon: ShieldCheck,
    year: '2027',
    title: 'Padrão de excelência',
    text: 'Tornar-se a referência em atendimento online para brasileiros no exterior, com certificação própria.',
  },
]

export default async function SobrePage() {
  return (
    <PublicPageLayout>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <BlurBlob className="-top-20 -right-20 h-96 w-96" color="bg-white/30" delay={0} duration={10} />
        <BlurBlob className="bottom-0 left-0 h-72 w-72" color="bg-[#2563eb]/15" delay={1} duration={12} />
        <BlurBlob className="top-1/3 right-1/4 h-48 w-48" color="bg-[#a3e635]/40" delay={2} duration={8} />

        <Sparkle className="absolute top-20 left-[15%]" size={16} delay={0} />
        <Sparkle className="absolute top-32 right-[20%]" size={12} delay={1.2} color="#2563eb" />
        <Sparkle className="absolute bottom-32 left-[25%]" size={14} delay={0.8} />

        <div className="mu-shell relative pt-16 pb-8 md:pt-24 md:pb-12 lg:pt-32 lg:pb-16">
          <FadeIn direction="up">
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 backdrop-blur-sm">
                <Heart className="h-3.5 w-3.5" />
                Feito por brasileiros, para brasileiros
              </span>
              <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
                A distância não deveria significar distanciamento
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-800 md:text-xl">
                A Muuday nasceu de uma saudade. Da vontade de sentir que, mesmo do outro lado do
                mundo, você ainda tem alguém que entende sua história.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <div className="relative h-16 bg-[#9FE870]">
        <WaveDivider fillColor="#ffffff" flip />
      </div>

      {/* ========== STATS ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <StaggerContainer className="grid gap-6 sm:grid-cols-3" staggerDelay={0.15}>
            {STATS.map((stat) => {
              const Icon = stat.icon
              return (
                <StaggerItem key={stat.label}>
                  <div className="group flex flex-col items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9FE870] to-emerald-500 shadow-lg transition group-hover:scale-110 group-hover:rotate-[5deg]">
                      <Icon className="h-8 w-8 text-slate-900" />
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

      {/* ========== GLOBAL MAP ========== */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Brasileiros espalhados pelo mundo
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Mais de 5 milhões de brasileiros vivem fora do país. Cada ponto no mapa é uma
                história, uma família, um sonho.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12">
            <GlobalMapAnimation />
          </div>
        </div>
      </section>

      {/* ========== MANIFESTO / STORY ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal variant="slideRight">
              <div className="relative">
                <div className="overflow-hidden rounded-3xl">
                  <Image
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80"
                    alt="Brasileiros conectados pelo mundo"
                    width={800}
                    height={600}
                    className="w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 rounded-2xl bg-slate-900 p-5 shadow-xl">
                  <p className="font-display text-3xl font-black text-[#9FE870]">2019</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/60">Onde tudo começou</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="slideLeft" delay={0.15}>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                  <Lightbulb className="h-3.5 w-3.5 text-[#9FE870]" />
                  Nossa história
                </span>
                <h2 className="mt-6 font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                  Tudo começou com uma saudade
                </h2>
                <div className="mt-6 space-y-4 text-base leading-7 text-slate-600">
                  <p>
                    A Muuday surgiu quando percebemos que milhões de brasileiros no exterior
                    enfrentam o mesmo desafio: precisar de ajuda profissional, mas não encontrar
                    alguém que realmente entenda sua realidade.
                  </p>
                  <p>
                    Um psicólogo que entende a dor da saudade. Um advogado que conhece as leis
                    dos dois países. Um contador que sabe como declarar imposto morando fora.
                    Um nutricionista que entende os ingredientes que você tem acesso.
                  </p>
                  <p>
                    Não se trata apenas de falar português. Trata-se de compartilhar uma
                    cultura, uma história, um contexto. De sentir que, mesmo a milhares de
                    quilômetros, você não está sozinho.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========== MISSION / VISION / PURPOSE ========== */}
      <section className="relative mu-section bg-[#9FE870] overflow-hidden">
        <DotPattern className="opacity-20" dotColor="#0f172a" spacing={40} dotSize={2} />

        <div className="mu-shell relative">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                O que nos guia
              </h2>
              <p className="mt-4 text-lg text-slate-800">
                Três pilares que definem quem somos e para onde vamos.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {MISSION_VISION.map((item, index) => {
              const Icon = item.icon
              return (
                <ScrollReveal key={item.title} variant="slideUp" delay={index * 0.15}>
                  <div className="relative rounded-3xl bg-white p-8 shadow-sm transition hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-1">
                    <span className="absolute right-6 top-6 font-display text-7xl font-black text-slate-100">
                      0{index + 1}
                    </span>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
                      item.color === 'green' ? 'bg-gradient-to-br from-[#9FE870] to-emerald-500 text-slate-900' :
                      item.color === 'blue' ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white' :
                      'bg-gradient-to-br from-slate-800 to-slate-900 text-white'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      <div className="relative h-16 bg-[#9FE870]">
        <WaveDivider fillColor="#ffffff" flip />
      </div>

      {/* ========== IDEALS / PRINCIPLES ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <ScrollReveal variant="slideRight">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                  <Zap className="h-3.5 w-3.5 text-[#9FE870]" />
                  O que nos move
                </span>
                <h2 className="mt-6 font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                  Ideais que não abrimos mão
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Princípios que carregamos em cada decisão, em cada funcionalidade, em cada
                  conversa com quem usa a plataforma.
                </p>

                <div className="mt-8 space-y-4">
                  {IDEALS.map((ideal, i) => (
                    <ScrollReveal key={i} variant="slideUp" delay={i * 0.05}>
                      <div className="flex items-start gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#9FE870]/20">
                          <HeartHandshake className="h-4 w-4 text-slate-900" />
                        </div>
                        <p className="text-sm font-medium leading-6 text-slate-700">{ideal}</p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="slideLeft" delay={0.15}>
              <div className="relative">
                <div className="overflow-hidden rounded-3xl">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
                    alt="Profissional brasileiro atendendo online"
                    width={800}
                    height={600}
                    className="w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 rounded-2xl bg-[#9FE870] p-5 shadow-xl">
                  <p className="font-display text-3xl font-black text-slate-900">200+</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-800/60">Profissionais ativos</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========== COMMUNITY ========== */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Uma comunidade que cresce junto
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                A Muuday não é só uma plataforma. É um ecossistema de pessoas que acreditam
                que cuidar de quem está longe é um ato de amor.
              </p>
            </div>
          </ScrollReveal>

          <StaggerContainer className="mt-12 grid gap-6 md:grid-cols-3" staggerDelay={0.12}>
            {[
              {
                icon: Users,
                title: 'Para quem está fora',
                text: 'Brasileiros em 50+ países que encontram na Muuday um pedacinho de casa. Profissionais que falam sua língua e entendem sua realidade.',
              },
              {
                icon: BadgeCheck,
                title: 'Para quem atende',
                text: 'Profissionais que expandem sua clientela para o mundo todo sem sair de casa. Que transformam expertise em renda global com propósito.',
              },
              {
                icon: Heart,
                title: 'Para quem acredita',
                text: 'Em um mundo onde a distância não significa distanciamento. Onde tecnologia aproxima corações e cuida de quem precisa.',
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <div className="group h-full rounded-3xl border border-slate-200 bg-white p-8 transition hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9FE870] to-emerald-500 shadow-lg transition group-hover:scale-110">
                    <item.icon className="h-6 w-6 text-slate-900" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ========== WHERE WE'RE GOING ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#9FE870]" />
                Onde queremos chegar
              </span>
              <h2 className="mt-6 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                O futuro que estamos construindo
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-12 relative">
            {/* Timeline connector */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 md:left-1/2 md:-translate-x-px" />

            <div className="space-y-12">
              {FUTURE.map((item, i) => {
                const Icon = item.icon
                return (
                  <ScrollReveal key={item.year} variant="slideUp" delay={i * 0.1}>
                    <div className={`relative grid gap-6 md:grid-cols-2 md:gap-16 ${i % 2 === 1 ? 'md:text-right' : ''}`}>
                      <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                        <div className="flex items-center gap-4 md:justify-start">
                          <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#9FE870] font-display text-lg font-black text-slate-900 shadow-lg">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#9FE870]">{item.year}</p>
                            <h3 className="font-display text-xl font-bold text-slate-900">{item.title}</h3>
                          </div>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600 md:ml-16">{item.text}</p>
                      </div>
                      <div className={i % 2 === 1 ? 'md:order-1' : ''} />
                    </div>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ========== RESOURCES ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 md:text-4xl">
                Recursos gratuitos
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Além da plataforma, criamos guias práticos para ajudar brasileiros no exterior
                a resolver burocracias e viver melhor.
              </p>
              <Link
                href="/guias"
                className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-[#9FE870] hover:text-slate-700 hover:shadow-md"
              >
                Explorar guias
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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
                  <Heart className="h-3.5 w-3.5" />
                  Faça parte dessa história
                </div>

                <h2 className="mt-6 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight text-white md:text-5xl lg:text-6xl">
                  Você não está sozinho
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/70">
                  Seja para encontrar apoio ou para oferecer seu talento a quem precisa.
                  A distância é só geografia.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <MagneticButton strength={0.2}>
                    <Link
                      href="/buscar"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE870] px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-xl hover:shadow-[#9FE870]/25"
                    >
                      Encontrar profissionais
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </MagneticButton>
                  <Link
                    href="/registrar-profissional"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/5"
                  >
                    Quero atender pela Muuday
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
