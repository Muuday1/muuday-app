import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { getCollectionBySlug, HELP_COLLECTIONS } from '@/lib/help-data'

export function generateStaticParams() {
  return HELP_COLLECTIONS.map((c) => ({ slug: c.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const collection = getCollectionBySlug(params.slug)
  if (!collection) return { title: 'Ajuda | Muuday' }
  return { title: `${collection.title} | Central de Ajuda | Muuday` }
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = getCollectionBySlug(params.slug)
  if (!collection) return notFound()

  const other = HELP_COLLECTIONS.find((c) => c.slug !== params.slug)!

  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <div className="mu-shell relative py-12 md:py-16">
          <Link
            href="/ajuda"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Central de ajuda
          </Link>
          <h1 className="mt-4 font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
            {collection.title}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-slate-800">{collection.description}</p>
        </div>
      </section>

      {/* Articles */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <div className="grid gap-4">
            {collection.articles.map((article, i) => (
              <ScrollReveal key={article.slug} variant="slideUp" delay={i * 0.03}>
                <Link
                  href={`/ajuda/a/${article.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9FE870]/20 text-sm font-black text-slate-900">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-900">{article.title}</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600" />
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Switch to other collection */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="scale">
            <Link
              href={`/ajuda/c/${other.slug}`}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10 md:p-8"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ver também
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{other.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{other.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </PublicPageLayout>
  )
}
