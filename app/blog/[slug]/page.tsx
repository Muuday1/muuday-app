import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Clock, Tag } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { FadeIn } from '@/components/landing/FadeIn'
import { MagneticButton } from '@/components/landing/MagneticButton'
import { Sparkle } from '@/components/landing/Sparkle'
import { DotPattern } from '@/components/landing/DotPattern'
import { BLOG_ARTICLES, getArticleBySlug, type BlogCategory } from '@/lib/blog-data'
import { BlogEngagement } from '@/components/blog/BlogEngagement'

export const metadata = { title: 'Blog | Muuday' }

const CATEGORY_LABELS: Record<BlogCategory, string> = {
  expats: 'Vida no exterior',
  profissionais: 'Para profissionais',
}

const CATEGORY_COLORS: Record<BlogCategory, string> = {
  expats: 'bg-[#9FE870] text-slate-900',
  profissionais: 'bg-slate-900 text-white',
}

export async function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ slug: article.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return (
      <PublicPageLayout>
        <div className="mu-shell py-24 text-center">
          <h1 className="font-display text-4xl font-black text-slate-900">Artigo não encontrado</h1>
          <Link
            href="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#9FE870] px-6 py-3 text-sm font-bold text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao blog
          </Link>
        </div>
      </PublicPageLayout>
    )
  }

  const related = BLOG_ARTICLES.filter(
    (a) => a.category === article.category && a.slug !== article.slug
  ).slice(0, 3)

  return (
    <PublicPageLayout>
      {/* ========== HERO COVER ========== */}
      <section className="relative overflow-hidden">
        <div className="relative aspect-[21/9] w-full md:aspect-[21/8]">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <div className="mu-shell pb-8 pt-16 md:pb-12">
            <FadeIn direction="up">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[article.category]}`}
                >
                  {CATEGORY_LABELS[article.category]}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/70">
                  <Clock className="h-3 w-3" />
                  {article.readTime} de leitura
                </span>
                <span className="text-xs text-white/70">{article.date}</span>
              </div>
              <h1 className="mt-4 max-w-3xl font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                {article.title}
              </h1>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ========== ARTICLE CONTENT ========== */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <div className="mx-auto max-w-3xl">
            <ScrollReveal variant="slideUp">
              <div className="prose prose-slate max-w-none">
                {article.content.map((block, i) => {
                  if (block.startsWith('<h2>')) {
                    const text = block.replace(/<\/?h2>/g, '')
                    return (
                      <h2
                        key={i}
                        className="mt-12 mb-4 font-display text-2xl font-black uppercase tracking-tight text-slate-900 md:text-3xl"
                      >
                        {text}
                      </h2>
                    )
                  }
                  if (block.startsWith('<h3>')) {
                    const text = block.replace(/<\/?h3>/g, '')
                    return (
                      <h3
                        key={i}
                        className="mt-8 mb-3 text-lg font-bold text-slate-900"
                      >
                        {text}
                      </h3>
                    )
                  }
                  if (block.startsWith('<ul>')) {
                    const items = block.match(/<li>(.*?)<\/li>/g) || []
                    return (
                      <ul key={i} className="mt-4 space-y-3">
                        {items.map((item, j) => {
                          const text = item.replace(/<\/?li>/g, '')
                          const parts = text.split(/<strong>(.*?)<\/strong>/)
                          return (
                            <li key={j} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9FE870]" />
                              <span>
                                {parts.map((part, k) =>
                                  k % 2 === 1 ? (
                                    <strong key={k} className="text-slate-900">{part}</strong>
                                  ) : (
                                    <span key={k}>{part}</span>
                                  )
                                )}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    )
                  }
                  return (
                    <p key={i} className="mt-4 text-base leading-7 text-slate-600">
                      {block}
                    </p>
                  )
                })}
              </div>
            </ScrollReveal>

            <BlogEngagement articleSlug={article.slug} />

            {/* Author / CTA box */}
            <ScrollReveal variant="scale" delay={0.1}>
              <div className="mt-12 rounded-2xl border border-slate-200 bg-[#f2f4f7] p-6 md:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9FE870]">
                    <Tag className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Muuday</p>
                    <p className="text-xs text-slate-500">Conectando brasileiros no mundo</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Gostou deste artigo? Compartilhe com quem também está longe de casa. E se
                  precisar de apoio profissional, saiba que há brasileiros prontos para te ajudar.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <MagneticButton strength={0.15}>
                    <Link
                      href="/buscar"
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                    >
                      Encontrar profissionais
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </MagneticButton>
                  <Link
                    href="/registrar-profissional"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:border-[#9FE870]"
                  >
                    Quero atender
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========== RELATED ARTICLES ========== */}
      {related.length > 0 && (
        <section className="mu-section bg-[#f2f4f7]">
          <div className="mu-shell">
            <ScrollReveal variant="slideUp">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Artigos relacionados
              </h2>
            </ScrollReveal>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((ra, i) => (
                <ScrollReveal key={ra.slug} variant="slideUp" delay={i * 0.05}>
                  <Link
                    href={`/blog/${ra.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg hover:shadow-slate-900/10 hover:-translate-y-1"
                  >
                    <div className="aspect-[16/9] overflow-hidden">
                      <Image
                        src={ra.coverImage}
                        alt={ra.title}
                        width={400}
                        height={225}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_COLORS[ra.category]}`}
                      >
                        {CATEGORY_LABELS[ra.category]}
                      </span>
                      <h3 className="mt-2 text-sm font-bold leading-snug text-slate-900">
                        {ra.title}
                      </h3>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== FINAL CTA ========== */}
      <section className="relative mu-section bg-[#9FE870] overflow-hidden">
        <DotPattern className="opacity-20" dotColor="#0f172a" spacing={48} dotSize={2} />

        <div className="mu-shell relative">
          <ScrollReveal variant="scale">
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-16 text-center md:px-16 md:py-24">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
                <div className="h-80 w-80 rounded-full border border-white/30" />
                <div className="absolute h-60 w-60 rounded-full border border-white/30" />
                <div className="absolute h-40 w-40 rounded-full border border-white/30" />
              </div>

              <Sparkle className="absolute top-16 left-[20%]" size={14} delay={0.3} color="#9FE870" />
              <Sparkle className="absolute bottom-20 right-[15%]" size={12} delay={1.5} color="#fff" />

              <div className="relative">
                <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-tight text-white md:text-4xl lg:text-5xl">
                  Continue acompanhando
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/70">
                  Volte sempre para novos artigos. E se precisar de ajuda, saiba que temos
                  profissionais brasileiros esperando por você.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/blog"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9FE870] px-8 py-4 text-base font-bold text-slate-900 transition hover:bg-[#8fd65f] hover:shadow-xl hover:shadow-[#9FE870]/25"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Todos os artigos
                  </Link>
                  <Link
                    href="/buscar"
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 px-8 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/5"
                  >
                    Encontrar ajuda
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
