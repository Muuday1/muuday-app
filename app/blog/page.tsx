import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Clock, Star } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { FadeIn } from '@/components/landing/FadeIn'
import { StaggerContainer, StaggerItem } from '@/components/landing/StaggerContainer'
import { BlurBlob } from '@/components/landing/BlurBlob'
import { Sparkle } from '@/components/landing/Sparkle'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { BLOG_ARTICLES, type BlogCategory } from '@/lib/blog-data'

export const metadata = { title: 'Blog | Muuday' }

const CATEGORY_LABELS: Record<BlogCategory, string> = {
  expats: 'Vida no exterior',
  profissionais: 'Para profissionais',
}

const CATEGORY_COLORS: Record<BlogCategory, string> = {
  expats: 'bg-[#9FE870] text-slate-900',
  profissionais: 'bg-slate-900 text-white',
}

export default async function BlogPage() {
  return (
    <PublicPageLayout>
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <BlurBlob className="-top-20 -right-20 h-96 w-96" color="bg-white/30" delay={0} duration={10} />
        <BlurBlob className="bottom-0 left-0 h-72 w-72" color="bg-[#2563eb]/15" delay={1} duration={12} />

        <Sparkle className="absolute top-20 left-[15%]" size={16} delay={0} />
        <Sparkle className="absolute top-32 right-[20%]" size={12} delay={1.2} color="#2563eb" />

        <div className="mu-shell relative py-16 md:py-24">
          <FadeIn direction="up">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-900 backdrop-blur-sm">
                <Star className="h-3.5 w-3.5" />
                Conteúdo para brasileiros no mundo
              </span>
              <h1 className="mt-6 font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
                Blog Muuday
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800">
                Histórias, guias e reflexões sobre viver fora, cuidar de si e construir uma
                carreira global. Escrito por e para brasileiros no exterior.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ========== ARTICLES GRID ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <StaggerContainer className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" staggerDelay={0.1}>
            {BLOG_ARTICLES.map((article, i) => (
              <StaggerItem key={article.slug}>
                <ScrollReveal variant="slideUp" delay={i * 0.05}>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="group block overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        width={600}
                        height={375}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[article.category]}`}
                        >
                          {CATEGORY_LABELS[article.category]}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {article.readTime}
                        </span>
                      </div>
                      <h2 className="mt-3 text-lg font-bold leading-snug text-slate-900 transition group-hover:text-slate-700">
                        {article.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">
                        {article.excerpt}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{article.date}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 transition group-hover:gap-2">
                          Ler artigo
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PublicPageLayout>
  )
}
