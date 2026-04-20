import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import {
  getArticleBySlug,
  getArticleCollection,
  getAllArticles,
  HELP_COLLECTIONS,
} from '@/lib/help-data'

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug)
  if (!article) return { title: 'Ajuda | Muuday' }
  return { title: `${article.title} | Central de Ajuda | Muuday` }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug)
  if (!article) return notFound()

  const collection = getArticleCollection(params.slug)!
  const collectionArticles = collection.articles
  const currentIndex = collectionArticles.findIndex((a) => a.slug === params.slug)
  const prev = currentIndex > 0 ? collectionArticles[currentIndex - 1] : null
  const next = currentIndex < collectionArticles.length - 1 ? collectionArticles[currentIndex + 1] : null

  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <div className="mu-shell relative py-10 md:py-14">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
            <Link href="/ajuda" className="transition hover:text-slate-900">
              Ajuda
            </Link>
            <span>/</span>
            <Link href={`/ajuda/c/${collection.slug}`} className="transition hover:text-slate-900">
              {collection.title}
            </Link>
          </div>
          <h1 className="mt-4 font-display text-2xl font-black uppercase tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
            {article.title}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_280px]">
            <ScrollReveal variant="slideUp">
              <article
                className="prose prose-slate max-w-none prose-h2:font-display prose-h2:text-xl prose-h2:font-bold prose-h2:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-900"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </ScrollReveal>

            {/* Sidebar */}
            <aside className="space-y-6">
              <ScrollReveal variant="slideLeft" delay={0.1}>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nesta coleção
                  </p>
                  <ul className="mt-3 space-y-2">
                    {collectionArticles.slice(0, 8).map((a) => (
                      <li key={a.slug}>
                        <Link
                          href={`/ajuda/a/${a.slug}`}
                          className={`block rounded-lg px-3 py-2 text-sm transition ${
                            a.slug === params.slug
                              ? 'bg-[#9FE870]/20 font-bold text-slate-900'
                              : 'text-slate-600 hover:bg-white hover:text-slate-900'
                          }`}
                        >
                          {a.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {collectionArticles.length > 8 && (
                    <Link
                      href={`/ajuda/c/${collection.slug}`}
                      className="mt-2 inline-block text-sm font-bold text-brand-600 transition hover:text-slate-900"
                    >
                      Ver todos ({collectionArticles.length})
                    </Link>
                  )}
                </div>
              </ScrollReveal>
            </aside>
          </div>
        </div>
      </section>

      {/* Prev / Next */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row">
            {prev ? (
              <ScrollReveal variant="slideRight" className="flex-1">
                <Link
                  href={`/ajuda/a/${prev.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Anterior
                  </span>
                  <span className="mt-1 text-sm font-bold text-slate-900">{prev.title}</span>
                </Link>
              </ScrollReveal>
            ) : (
              <div className="flex-1" />
            )}
            {next ? (
              <ScrollReveal variant="slideLeft" className="flex-1">
                <Link
                  href={`/ajuda/a/${next.slug}`}
                  className="group flex flex-col items-end rounded-2xl border border-slate-200 bg-white p-5 text-right transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Próximo
                  </span>
                  <span className="mt-1 text-sm font-bold text-slate-900">{next.title}</span>
                </Link>
              </ScrollReveal>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
