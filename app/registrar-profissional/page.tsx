import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Globe,
  Home,
  Laptop,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Video,
  X,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { FadeIn } from '@/components/landing/FadeIn'
import { FaqAccordion } from '@/components/landing/FaqAccordion'
import { EarningsCalculator } from '@/components/landing/EarningsCalculator'

export const metadata = { title: 'Registrar como profissional | Muuday' }

const SOCIAL_PROOF = [
  { value: '200+', label: 'Profissionais ativos' },
  { value: '50+', label: 'Países atendidos' },
  { value: '10k+', label: 'Sessões realizadas' },
  { value: '4.9', label: 'Avaliação média' },
]

const FEATURES = [
  {
    icon: Globe,
    title: 'Alcance global',
    text: 'Brasileiros em Portugal, Espanha, EUA, Japão, Alemanha e mais 50 países buscam profissionais como você.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  },
  {
    icon: Home,
    title: 'Trabalhe de qualquer lugar',
    text: 'Sem escritório, sem deslocamento. Sua casa, seu horário, suas regras. Você define quando e quanto quer trabalhar.',
    image: 'https://images.unsplash.com/photo-1593642632823-8f78536788c6?w=800&q=80',
  },
  {
    icon: Banknote,
    title: 'Receba com segurança',
    text: 'Pagamentos processados automaticamente. Cartão, Pix e parcelamento. O dinheiro cai na sua conta após cada sessão.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
  },
]

const HOW_STEPS = [
  {
    step: '01',
    title: 'Crie seu perfil',
    text: 'Cadastro em minutos. Adicione formação, foto, vídeo e especialidades.',
  },
  {
    step: '02',
    title: 'Configure e aprove',
    text: 'Defina preços, horários e serviços. Nossa equipe aprova em até 48h.',
  },
  {
    step: '03',
    title: 'Receba clientes',
    text: 'Seu perfil fica público. Clientes agendam, você atende, a plataforma paga.',
  },
]

const COMPARISON = [
  { label: 'Alcance', old: 'Sua cidade', muu: '50+ países' },
  { label: 'Agenda', old: 'WhatsApp manual', muu: 'Automática com conversão de fuso' },
  { label: 'Pagamento', old: 'Boleto, atraso, inadimplência', muu: 'Cartão/Pix, protegido, na conta' },
  { label: 'Sessões', old: 'Zoom pessoal', muu: 'Videochamada HD integrada' },
  { label: 'Visibilidade', old: 'Indicação boca a boca', muu: 'Busca pública + filtros' },
]

const TESTIMONIAL = {
  name: 'Dra. Fernanda Lima',
  role: 'Psicóloga Clínica',
  text: 'Em 3 meses passei a atender 12 brasileiros em Lisboa e Londres. A plataforma cuida de toda a burocrática — agenda, pagamento, lembretes — e eu foco no atendimento. Minha renda aumentou 40% sem eu sair de casa.',
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  flag: '🇵🇹',
}

const FAQ_ITEMS = [
  {
    question: 'Quanto custa para começar?',
    answer: 'Zero. O cadastro é 100% gratuito. Você só paga uma taxa por transação quando recebe um pagamento.',
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
      {/* ========== HERO (split layout, not green) ========== */}
      <section className="relative overflow-hidden bg-slate-50">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #0f172a 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="mu-shell relative py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <FadeIn direction="up">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                  <BadgeCheck className="h-3.5 w-3.5 text-[#9FE870]" />
                  Cadastro gratuito
                </span>
                <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Transforme sua expertise em renda global
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Atenda brasileiros em 50+ países sem sair de casa. Agenda automatizada, pagamento
                  garantido e videochamada integrada. Você cuida do atendimento, a Muuday cuida do resto.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/cadastro?role=profissional"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE870] px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-lg hover:shadow-[#9FE870]/25"
                  >
                    Criar perfil grátis
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="#como-funciona"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 transition hover:border-slate-300"
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
                      <Image key={i} src={src} alt="" width={40} height={40} className="h-8 w-8 rounded-full border-2 border-white object-cover" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-slate-900">200+ profissionais</span> já atendendo
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.15}>
              <EarningsCalculator />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ========== SOCIAL PROOF STRIP ========== */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mu-shell py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {SOCIAL_PROOF.map((item, i) => (
              <FadeIn key={item.label} direction="up" delay={i * 0.05}>
                <div className="text-center">
                  <p className="font-display text-3xl font-black text-slate-900">{item.value}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES (alternating image/text) ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell space-y-20">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={feature.title} variant={i % 2 === 0 ? 'slideRight' : 'slideLeft'}>
              <div className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg">
                    <Image src={feature.image} alt={feature.title} width={800} height={500} className="w-full object-cover" />
                  </div>
                </div>
                <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9FE870]/20">
                    <feature.icon className="h-6 w-6 text-slate-900" />
                  </div>
                  <h2 className="mt-5 font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                    {feature.title}
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-slate-600">{feature.text}</p>
                  <div className="mt-6 space-y-3">
                    {i === 0 && (
                      <>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9FE870]" />
                          <p className="text-sm font-medium text-slate-700">Atenda em português, onde o cliente estiver</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9FE870]" />
                          <p className="text-sm font-medium text-slate-700">Cliente já entende sua cultura e contexto</p>
                        </div>
                      </>
                    )}
                    {i === 1 && (
                      <>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9FE870]" />
                          <p className="text-sm font-medium text-slate-700">Sem aluguel de sala, sem deslocamento</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9FE870]" />
                          <p className="text-sm font-medium text-slate-700">Trabalhe no horário que você quiser</p>
                        </div>
                      </>
                    )}
                    {i === 2 && (
                      <>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9FE870]" />
                          <p className="text-sm font-medium text-slate-700">Pix, cartão e parcelamento</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9FE870]" />
                          <p className="text-sm font-medium text-slate-700">Dinheiro na conta em até 48h após a sessão</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS (timeline) ========== */}
      <section className="mu-section bg-[#f2f4f7]" id="como-funciona">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                Do cadastro ao primeiro cliente em 48h
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-12 relative">
            {/* connector line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 md:left-1/2 md:-translate-x-px" />

            <div className="space-y-12">
              {HOW_STEPS.map((step, i) => (
                <ScrollReveal key={step.step} variant="slideUp" delay={i * 0.1}>
                  <div className={`relative grid gap-6 md:grid-cols-2 md:gap-16 ${i % 2 === 1 ? 'md:text-right' : ''}`}>
                    <div className={`${i % 2 === 1 ? 'md:order-2' : ''}`}>
                      <div className="flex items-center gap-4 md:justify-start">
                        <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#9FE870] font-display text-lg font-black text-slate-900 shadow-lg">
                          {step.step}
                        </span>
                        <h3 className="font-display text-xl font-bold text-slate-900">{step.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 md:ml-16">{step.text}</p>
                    </div>
                    <div className={`${i % 2 === 1 ? 'md:order-1' : ''}`} />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== SPOTLIGHT TESTIMONIAL ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="scale">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-slate-900">
              <div className="grid md:grid-cols-[0.4fr_0.6fr]">
                <div className="relative h-64 md:h-auto">
                  <Image
                    src={TESTIMONIAL.image}
                    alt={TESTIMONIAL.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-8 md:p-12">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{TESTIMONIAL.flag}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-6 text-lg leading-8 text-white/90">
                    &ldquo;{TESTIMONIAL.text}&rdquo;
                  </p>
                  <div className="mt-8">
                    <p className="font-bold text-white">{TESTIMONIAL.name}</p>
                    <p className="text-sm text-white/60">{TESTIMONIAL.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========== COMPARISON ========== */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                Tradicional vs Muuday
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-10 mx-auto max-w-3xl space-y-3">
            {COMPARISON.map((row, i) => (
              <ScrollReveal key={row.label} variant="slideUp" delay={i * 0.03}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 shrink-0 text-red-400" />
                    <span className="text-sm text-slate-500">{row.old}</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 uppercase">
                    {row.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#9FE870]" />
                    <span className="text-sm font-bold text-slate-900">{row.muu}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell grid gap-12 lg:grid-cols-[0.4fr_0.6fr] lg:items-start">
          <ScrollReveal variant="slideRight">
            <div>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Dúvidas frequentes
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Respostas diretas para você começar sem enrolação.
              </p>
              <Link
                href="/ajuda/c/profissionais"
                className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-[#9FE870] hover:text-slate-700 hover:shadow-md"
              >
                Ver todos os artigos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="slideLeft" delay={0.15}>
            <FaqAccordion items={FAQ_ITEMS} />
          </ScrollReveal>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="mu-section bg-[#9FE870]">
        <div className="mu-shell">
          <ScrollReveal variant="scale">
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-16 text-center md:px-16 md:py-24">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white md:text-4xl lg:text-5xl">
                Sua carreira sem fronteiras começa aqui
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Cadastro gratuito. Perfil aprovado em 48h. Comece a receber clientes esta semana.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/cadastro?role=profissional"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE870] px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-lg hover:shadow-[#9FE870]/25"
                >
                  Criar perfil grátis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/ajuda/c/profissionais"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  Ver artigos para profissionais
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicPageLayout>
  )
}
