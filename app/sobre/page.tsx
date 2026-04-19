import Link from 'next/link'
import { ArrowRight, Globe, HeartHandshake, Target, Users } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'

export const metadata = { title: 'Sobre nós | Muuday' }

const VALUES = [
  {
    icon: Target,
    title: 'Missão',
    text: 'Facilitar o acesso a suporte profissional em português para quem vive fora do Brasil.',
  },
  {
    icon: HeartHandshake,
    title: 'Confiança',
    text: 'Profissionais verificados, avaliações transparentes e pagamento seguro.',
  },
  {
    icon: Globe,
    title: 'Alcance',
    text: 'Brasileiros em mais de 50 países já usam a plataforma para encontrar especialistas.',
  },
  {
    icon: Users,
    title: 'Comunidade',
    text: 'Uma rede de psicólogos, advogados, contadores, nutricionistas e outros especialistas.',
  },
]

export default async function SobrePage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <div className="mu-shell relative py-16 md:py-24">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Sobre a Muuday
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800">
                Conectamos brasileiros no exterior a profissionais de confiança no Brasil.
                Nosso objetivo é facilitar demandas reais do dia a dia com busca clara,
                agendamento simples e atendimento em português.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Nossos valores
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <ScrollReveal key={v.title} variant="scale" delay={0.05}>
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9FE870]/20">
                    <v.icon className="h-6 w-6 text-slate-900" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{v.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{v.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Como funciona
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Você compara perfis, vê avaliações, escolhe o horário e agenda em poucos passos.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Busque', text: 'Filtre por especialidade, idioma e disponibilidade.' },
              { step: '02', title: 'Agende', text: 'Escolha dia, horário e tipo de sessão. Confirmação instantânea.' },
              { step: '03', title: 'Conecte', text: 'Videochamada integrada. Sem Zoom, Teams ou WhatsApp.' },
            ].map((item) => (
              <ScrollReveal key={item.step} variant="slideUp" delay={0.1}>
                <div className="relative rounded-2xl border border-slate-200 bg-white p-8">
                  <span className="font-display text-5xl font-black text-[#9FE870]">{item.step}</span>
                  <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="scale">
            <div className="mx-auto max-w-3xl rounded-[2rem] bg-slate-900 px-8 py-14 text-center md:px-16 md:py-20">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white md:text-4xl">
                Faça parte da Muuday
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-lg text-slate-300">
                Seja para encontrar um profissional ou para expandir sua clientela.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE870] px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-lg hover:shadow-[#9FE870]/25"
                >
                  Buscar profissionais
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/registrar-profissional"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  Registrar como profissional
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicPageLayout>
  )
}
