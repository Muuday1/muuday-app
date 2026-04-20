import Link from 'next/link'
import {
  BookOpen,
  Clock,
  MapPin,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { FadeIn } from '@/components/landing/FadeIn'
import { BlurBlob } from '@/components/landing/BlurBlob'
import { Sparkle } from '@/components/landing/Sparkle'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { GUIDES } from '@/lib/guides-data'
import GuiasList from '@/components/guias/GuiasList'

export const metadata = { title: 'Guias | Muuday' }

export default function GuiasPage() {
  return (
    <PublicPageLayout>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <BlurBlob className="-top-20 -right-20 h-96 w-96" color="bg-white/30" delay={0} duration={10} />
        <BlurBlob className="bottom-0 left-0 h-72 w-72" color="bg-[#4a7c2f]/15" delay={1} duration={12} />

        <Sparkle className="absolute top-20 left-[15%]" size={16} delay={0} />
        <Sparkle className="absolute top-32 right-[20%]" size={12} delay={1.2} color="#4a7c2f" />
        <Sparkle className="absolute bottom-20 left-[30%]" size={14} delay={0.6} color="#2563eb" />

        <div className="mu-shell relative py-16 md:py-24">
          <FadeIn direction="up">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 backdrop-blur-sm">
                <BookOpen className="h-3.5 w-3.5" />
                Base de conhecimento
              </span>
              <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
                Guias Muuday
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800">
                Tudo o que voce precisa saber para resolver burocracias, manter documentos em dia
                e viver bem no exterior. Guias praticos escritos por e para brasileiros.
              </p>
            </div>
          </FadeIn>

          <GuiasList />
        </div>
      </section>

      {/* ========== STATS / TRUST BAR ========== */}
      <section className="bg-white">
        <div className="mu-shell py-12 md:py-16">
          <ScrollReveal>
            <div className="grid gap-8 rounded-3xl bg-slate-900 px-6 py-10 text-center sm:grid-cols-3 sm:px-10 md:py-14">
              <div>
                <div className="font-display text-3xl font-black text-[#9FE870] md:text-4xl">
                  {GUIDES.length}+
                </div>
                <p className="mt-2 text-sm font-medium text-slate-400">Guias completos</p>
              </div>
              <div>
                <div className="font-display text-3xl font-black text-[#9FE870] md:text-4xl">
                  14
                </div>
                <p className="mt-2 text-sm font-medium text-slate-400">Categorias</p>
              </div>
              <div>
                <div className="font-display text-3xl font-black text-[#9FE870] md:text-4xl">
                  100%
                </div>
                <p className="mt-2 text-sm font-medium text-slate-400">Gratuito</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="bg-white">
        <div className="mu-shell pb-16 md:pb-24">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#9FE870] px-6 py-14 text-center md:px-12 md:py-20">
              <BlurBlob className="-right-20 -top-20 h-72 w-72" color="bg-white/30" delay={0} />
              <BlurBlob className="-bottom-16 -left-16 h-56 w-56" color="bg-[#4a7c2f]/15" delay={1} />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                  Nao encontrou o que precisava?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-800">
                  Fale com um dos nossos profissionais especializados. Eles podem te orientar
                  de forma personalizada no que voce precisa.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/buscar"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-slate-800"
                  >
                    <MapPin className="h-4 w-4" />
                    Encontrar profissional
                  </Link>
                  <Link
                    href="/ajuda"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 px-8 py-4 text-sm font-bold uppercase tracking-wide text-slate-900 transition hover:bg-slate-900 hover:text-white"
                  >
                    Central de ajuda
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
