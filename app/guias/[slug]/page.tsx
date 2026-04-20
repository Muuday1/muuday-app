import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  Clock,
  CalendarDays,
  FileText,
  Calculator,
  Banknote,
  ShieldCheck,
  HeartPulse,
  GraduationCap,
  Users,
  Home,
  Briefcase,
  Truck,
  Car,
  Flag,
  Package,
  Phone,
  MapPin,
} from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { FadeIn } from '@/components/landing/FadeIn'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { BlurBlob } from '@/components/landing/BlurBlob'
import { Sparkle } from '@/components/landing/Sparkle'
import { GUIDES, GUIDE_CATEGORIES } from '@/lib/guides-data'
import { GuideFeedback } from '@/components/guias/GuideFeedback'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Calculator,
  Banknote,
  ShieldCheck,
  HeartPulse,
  GraduationCap,
  Users,
  Home,
  Briefcase,
  Truck,
  Car,
  Flag,
  Package,
  Phone,
}

export async function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = GUIDES.find((g) => g.slug === slug)
  if (!guide) return { title: 'Guia | Muuday' }
  return {
    title: `${guide.title} | Guia Muuday`,
    description: guide.excerpt,
  }
}

function formatContent(text: string): React.ReactNode {
  if (text.startsWith('## ')) {
    return (
      <h2 className="mt-10 text-2xl font-bold text-slate-900">
        {text.replace('## ', '')}
      </h2>
    )
  }
  return <p className="mt-4 text-base leading-7 text-slate-600">{text}</p>
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = GUIDES.find((g) => g.slug === slug)
  if (!guide) return notFound()

  const category = GUIDE_CATEGORIES.find((c) => c.id === guide.category)
  const CatIcon = category ? ICON_MAP[category.icon] || FileText : FileText

  const related = GUIDES.filter(
    (g) => guide.relatedGuides.includes(g.slug) && g.slug !== guide.slug
  ).slice(0, 3)

  return (
    <PublicPageLayout>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <BlurBlob className="-top-20 -right-20 h-96 w-96" color="bg-white/30" delay={0} duration={10} />
        <BlurBlob className="bottom-0 left-0 h-72 w-72" color="bg-[#4a7c2f]/15" delay={1} duration={12} />
        <Sparkle className="absolute top-20 left-[15%]" size={16} delay={0} />
        <Sparkle className="absolute top-32 right-[20%]" size={12} delay={1.2} color="#4a7c2f" />

        <div className="mu-shell relative py-14 md:py-20">
          <FadeIn direction="up">
            <Link
              href="/guias"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para guias
            </Link>

            <div className="mt-6 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 backdrop-blur-sm">
                <CatIcon className="h-3.5 w-3.5" />
                {category?.label || 'Guia'}
              </div>
              <h1 className="mt-4 font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                {guide.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-800">
                {guide.excerpt}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {guide.readTime} de leitura
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Atualizado em {guide.date}
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ========== STEPS ========== */}
      {guide.steps.length > 0 && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mu-shell py-10 md:py-14">
            <ScrollReveal>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-slate-900 md:text-2xl">
                Passo a passo
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {guide.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9FE870] text-sm font-bold text-slate-900">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ========== CONTENT ========== */}
      <section className="bg-white">
        <div className="mu-shell py-10 md:py-14">
          <div className="mx-auto max-w-3xl">
            <FadeIn direction="up">
              <article className="prose prose-slate max-w-none">
                {guide.content.map((paragraph, i) => (
                  <div key={i}>{formatContent(paragraph)}</div>
                ))}
              </article>
            </FadeIn>

            {/* Tips */}
            {guide.tips.length > 0 && (
              <FadeIn direction="up" delay={0.1}>
                <div className="mt-12 rounded-3xl border border-[#9FE870]/40 bg-[#9FE870]/10 p-6 md:p-8">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-[#4a7c2f]" />
                    <h3 className="font-display text-lg font-bold uppercase tracking-tight text-slate-900">
                      Dicas importantes
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-4">
                    {guide.tips.map((tip, i) => (
                      <li key={i} className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#4a7c2f]" />
                        <div>
                          <strong className="text-sm font-bold text-slate-900">{tip.title}</strong>
                          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{tip.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            )}

            <GuideFeedback guideSlug={guide.slug} />
          </div>
        </div>
      </section>

      {/* ========== RELATED GUIDES ========== */}
      {related.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mu-shell py-10 md:py-14">
            <ScrollReveal>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-slate-900 md:text-2xl">
                Guias relacionados
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((g) => {
                  const rc = GUIDE_CATEGORIES.find((c) => c.id === g.category)
                  const RIcon = rc ? ICON_MAP[rc.icon] || FileText : FileText
                  return (
                    <Link
                      key={g.slug}
                      href={`/guias/${g.slug}`}
                      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#9FE870] hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9FE870]/20 text-slate-900">
                        <RIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 transition group-hover:text-[#4a7c2f]">
                          {g.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {g.excerpt}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ========== CTA ========== */}
      <section className="bg-slate-50">
        <div className="mu-shell pb-16 md:pb-24">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#9FE870] px-6 py-14 text-center md:px-12 md:py-20">
              <BlurBlob className="-right-20 -top-20 h-72 w-72" color="bg-white/30" delay={0} />
              <BlurBlob className="-bottom-16 -left-16 h-56 w-56" color="bg-[#4a7c2f]/15" delay={1} />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                  Precisa de ajuda pessoal?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-800">
                  Nossos profissionais podem te orientar de forma personalizada no que voce precisa.
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
