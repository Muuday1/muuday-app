import Link from 'next/link'
import { ArrowRight, BookOpen, Newspaper } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { FadeIn } from '@/components/landing/FadeIn'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { BlurBlob } from '@/components/landing/BlurBlob'
import { Sparkle } from '@/components/landing/Sparkle'

export const metadata = { title: 'Recursos para quem mora fora | Muuday' }

export default function RecursosPage() {
  return (
    <PublicPageLayout>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <BlurBlob className="-top-20 -right-20 h-96 w-96" color="bg-white/30" delay={0} duration={10} />
        <BlurBlob className="bottom-0 left-0 h-72 w-72" color="bg-[#2563eb]/15" delay={1} duration={12} />

        <Sparkle className="absolute top-20 left-[15%]" size={16} delay={0} />
        <Sparkle className="absolute top-32 right-[20%]" size={12} delay={1.2} color="#2563eb" />
        <Sparkle className="absolute bottom-20 left-[30%]" size={14} delay={0.6} color="#2563eb" />

        <div className="mu-shell relative py-16 md:py-24">
          <FadeIn direction="up">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
                Recursos para quem mora fora
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800">
                Conteúdo prático e gratuito para brasileiros no exterior.
                Escolha o formato que funciona para você.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ========== CHOICE CARDS ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              {/* Guides card */}
              <Link
                href="/guias"
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1 md:p-10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9FE870] to-emerald-500 shadow-lg transition group-hover:scale-110">
                  <BookOpen className="h-6 w-6 text-slate-900" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-black text-slate-900 md:text-3xl">
                  Guias práticos
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Passo a passo para resolver burocracias: CPF, passaporte, impostos,
                  INSS, vistos e muito mais. Tudo gratuito.
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-[#4a7c2f] transition group-hover:gap-2">
                  Explorar guias
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              {/* Blog card */}
              <Link
                href="/blog"
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1 md:p-10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg transition group-hover:scale-110">
                  <Newspaper className="h-6 w-6 text-white" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-black text-slate-900 md:text-3xl">
                  Blog Muuday
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Histórias, reflexões e dicas sobre viver fora, cuidar de si e construir
                  uma carreira global. Escrito por e para brasileiros no exterior.
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-blue-600 transition group-hover:gap-2">
                  Ler o blog
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </PublicPageLayout>
  )
}
