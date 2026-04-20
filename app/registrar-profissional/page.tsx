import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Globe,
  Home,
  Laptop,
  Layers3,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Video,
  X,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { AnimatedCounter } from '@/components/landing/AnimatedCounter'
import { BlurBlob } from '@/components/landing/BlurBlob'
import { Sparkle } from '@/components/landing/Sparkle'
import { FadeIn } from '@/components/landing/FadeIn'
import { FaqAccordion } from '@/components/landing/FaqAccordion'

export const metadata = { title: 'Registrar como profissional | Muuday' }

const STATS = [
  { value: 50, suffix: '+', label: 'Países atendidos', icon: Globe },
  { value: 100, suffix: '%', label: 'Atendimento online', icon: Video },
  { value: 0, suffix: '', label: 'Custo para começar', icon: Banknote, prefix: 'R$' },
]

const WHY_ITEMS = [
  {
    icon: Globe,
    title: 'Cliente brasileiro no mundo todo',
    text: 'Atenda brasileiros em Portugal, Espanha, EUA, Japão e mais de 50 países — tudo em português.',
  },
  {
    icon: Home,
    title: 'Trabalhe de onde quiser',
    text: 'Sem escritório, sem deslocamento. Sua agenda, suas regras. Você define quando e quanto trabalha.',
  },
  {
    icon: Banknote,
    title: 'Receba com segurança',
    text: 'Pagamentos processados automaticamente. Cartão, Pix e parcelamento. O dinheiro cai na sua conta.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda automatizada',
    text: 'O cliente escolhe o horário, o fuso é convertido automaticamente e você recebe a confirmação.',
  },
  {
    icon: Video,
    title: 'Videochamada integrada',
    text: 'Sem Zoom, Teams ou WhatsApp. A sessão acontece direto na plataforma, com qualidade HD.',
  },
  {
    icon: Laptop,
    title: 'Tudo em um só lugar',
    text: 'Perfil, agenda, mensagens, pagamentos e prontuário. Uma única plataforma para sua operação.',
  },
]

const HOW_STEPS = [
  {
    step: '01',
    title: 'Crie seu perfil',
    text: 'Cadastre-se em minutos. Adicione sua formação, especialidades, foto e vídeo de apresentação.',
  },
  {
    step: '02',
    title: 'Configure seus serviços',
    text: 'Defina preços, duração das sessões, disponibilidade e política de cancelamento.',
  },
  {
    step: '03',
    title: 'Comece a atender',
    text: 'Após aprovação, seu perfil fica visível na busca e você recebe agendamentos automaticamente.',
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
    title: 'Videochamada HD',
    text: 'Atendimento remoto integrado, sem depender de apps externos.',
  },
  {
    icon: CalendarDays,
    title: 'Agenda inteligente',
    text: 'Disponibilidade, recorrência, lembretes e sincronização de fuso horário.',
  },
  {
    icon: Search,
    title: 'Clientes qualificados',
    text: 'Quem te encontra já sabe o que precisa. Menos conversa, mais agendamento.',
  },
  {
    icon: MessageCircle,
    title: 'Chat integrado',
    text: 'Troque mensagens com clientes antes e depois das sessões.',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança garantida',
    text: 'Pagamento protegido, verificação de identidade e avaliações verificadas.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Dra. Fernanda Lima',
    role: 'Psicóloga Clínica',
    text: 'Em 3 meses na Muuday, passei a atender 12 brasileiros em Lisboa e Londres. A plataforma cuida de toda a parte burocrática e eu foco no que sei fazer.',
    flag: '🇵🇹',
  },
  {
    name: 'Ricardo Mendes',
    role: 'Nutricionista Esportivo',
    text: 'O fuso horário automático é um sonho. Meus clientes no Japão marcam sessões enquanto dormo, e eu acordo com a agenda do dia pronta.',
    flag: '🇯🇵',
  },
  {
    name: 'Carolina Dias',
    role: 'Advogada Trabalhista',
    text: 'Receber em reais com conversão automática me deu segurança. Não preciso mais me preocupar com transferência internacional.',
    flag: '🇩🇪',
  },
]

const COMPARISON = [
  { label: 'Alcance geográfico', old: 'Limitado à sua cidade', muu: 'Brasileiros em 50+ países' },
  { label: 'Agendamento', old: 'WhatsApp e ligação', muu: 'Automático, com confirmação' },
  { label: 'Pagamento', old: 'Boleto, depósito, atraso', muu: 'Cartão, Pix, protegido' },
  { label: 'Sessões', old: 'Presencial ou Zoom pessoal', muu: 'Videochamada integrada' },
  { label: 'Visibilidade', old: 'Indicação boca a boca', muu: 'Busca pública e filtros' },
  { label: 'Fuso horário', old: 'Cálculo manual', muu: 'Conversão automática' },
]

const FAQ_ITEMS = [
  {
    question: 'Quanto custa para começar?',
    answer: 'O cadastro é gratuito. Você só paga uma taxa por transação quando recebe um pagamento. Não há mensalidade obrigatória.',
  },
  {
    question: 'Quais especialidades são aceitas?',
    answer: 'Psicologia, nutrição, direito, contabilidade, coaching, fisioterapia, mentoria educacional e outras áreas com aprovação da equipe.',
  },
  {
    question: 'Como funciona o pagamento?',
    answer: 'O cliente paga pelo cartão ou Pix na plataforma. O valor é liberado para você após a sessão, descontada a taxa de processamento.',
  },
  {
    question: 'Preciso ter CNPJ?',
    answer: 'Não é obrigatório para começar. Você pode atender como pessoa física. Quando quiser emitir nota fiscal, recomendamos abrir o CNPJ.',
  },
  {
    question: 'Como é a aprovação do perfil?',
    answer: 'Nossa equipe revisa seus dados e certificados em até 48 horas. O foco é garantir clareza no perfil e segurança para os clientes.',
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

        <Sparkle className="absolute top-20 left-[15%]" size={16} delay={0} />
        <Sparkle className="absolute top-32 right-[20%]" size={12} delay={1.2} color="#2563eb" />
        <Sparkle className="absolute bottom-32 left-[25%]" size={14} delay={0.8} />

        <div className="mu-shell relative py-16 md:py-24 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <FadeIn direction="up">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 backdrop-blur-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  Para profissionais brasileiros
                </span>
                <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
                  Sua expertise no mundo todo
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-800 md:text-xl">
                  Atenda brasileiros em 50+ países sem sair de casa. Agenda automatizada, pagamento
                  garantido e videochamada integrada. Você cuida do atendimento, a Muuday cuida do resto.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/cadastro?role=profissional"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20"
                  >
                    Criar perfil grátis
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="#como-funciona"
                    className="inline-flex items-center justify-center gap-2 text-base font-bold text-slate-900 underline underline-offset-4 transition hover:text-slate-700"
                  >
                    Ver como funciona
                  </Link>
                </div>

                <div className="mt-8 flex items-center gap-3">
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
                    <span className="font-bold text-slate-900">+200 profissionais</span> já atendendo
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="up" delay={0.15}>
              <div className="relative">
                <Image
                  src="/assets/marketing/professionals/hero-main.webp"
                  alt="Profissional em atendimento remoto"
                  width={1200}
                  height={800}
                  className="w-full rounded-2xl border border-slate-900/10 bg-white p-2 shadow-xl"
                  priority
                />
                <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9FE870]">
                      <CheckCircle2 className="h-4 w-4 text-slate-900" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">Perfil aprovado</span>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">4.9 média</span>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <div className="grid gap-6 sm:grid-cols-3">
            {STATS.map((stat, i) => (
              <ScrollReveal key={stat.label} variant="scale" delay={i * 0.1}>
                <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10">
                  <stat.icon className="h-8 w-8 text-[#9FE870]" />
                  <p className="mt-4 font-display text-4xl font-black text-slate-900">
                    <AnimatedCounter
                      target={stat.value}
                      prefix={stat.prefix || ''}
                      suffix={stat.suffix}
                      duration={2}
                    />
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHY MUUDAY ========== */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                Por que ser profissional na Muuday
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Tudo o que você precisa para expandir sua carreira sem burocracia.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_ITEMS.map((item, i) => (
              <ScrollReveal key={item.title} variant="scale" delay={i * 0.05}>
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10 hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9FE870]/20">
                    <item.icon className="h-6 w-6 text-slate-900" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="mu-section bg-white" id="como-funciona">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                Comece em 3 passos
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Do cadastro ao primeiro cliente em menos de 48 horas.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {HOW_STEPS.map((step, i) => (
              <ScrollReveal key={step.step} variant="slideUp" delay={i * 0.1}>
                <div className="relative rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-[#9FE870] hover:shadow-xl hover:shadow-[#9FE870]/10">
                  <span className="font-display text-5xl font-black text-[#9FE870]">{step.step}</span>
                  <h3 className="mt-4 text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
                  {i < HOW_STEPS.length - 1 && (
                    <div className="absolute top-1/2 -right-3 hidden h-6 w-6 -translate-y-1/2 lg:block">
                      <ArrowRight className="h-6 w-6 text-slate-300" />
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TOOLS ========== */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                Ferramentas que trabalham por você
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Tecnologia para você focar no que realmente importa: seus clientes.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool, i) => (
              <ScrollReveal key={tool.title} variant="scale" delay={i * 0.05}>
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9FE870]/20">
                    <tool.icon className="h-6 w-6 text-slate-900" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{tool.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{tool.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                O que dizem quem atende
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <ScrollReveal key={t.name} variant="scale" delay={i * 0.1}>
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-[#9FE870] p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.flag}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-700">{t.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-sm font-medium leading-6 text-slate-800">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="mt-4 inline-flex items-center self-start rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                    {t.name.split(' ')[0]} na Muuday
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
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
                Ainda com dúvida? Fale com a gente.
              </p>
              <Link
                href="/ajuda"
                className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-[#9FE870] hover:text-slate-700 hover:shadow-md"
              >
                Central de ajuda
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
                Cadastre-se grátis, monte seu perfil e comece a atender brasileiros no mundo todo em poucos dias.
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
                  href="/ajuda"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  Falar com a equipe
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicPageLayout>
  )
}
