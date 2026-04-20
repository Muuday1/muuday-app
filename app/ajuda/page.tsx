import Link from 'next/link'
import { ArrowRight, Search, UserCircle, BadgeCheck } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { ScrollReveal } from '@/components/landing/ScrollReveal'
import { HELP_COLLECTIONS, getAllArticles } from '@/lib/help-data'

export const metadata = { title: 'Central de Ajuda | Muuday' }

const POPULAR_ARTICLES = [
  'como-buscar-profissionais',
  'como-agendar-uma-sessao',
  'pagamentos-e-reembolsos',
  'como-criar-seu-perfil',
  'como-funciona-o-pagamento',
  'configurar-servicos-e-precos',
]

export default async function AjudaPage() {
  const allArticles = getAllArticles()
  const popular = POPULAR_ARTICLES.map((slug) => allArticles.find((a) => a.slug === slug)).filter(Boolean)

  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#9FE870]">
        <div className="mu-shell relative py-16 md:py-24">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-4xl font-black uppercase leading-[0.92] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                Central de ajuda
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-800">
                Encontre respostas, tutoriais e guias para usar a Muuday como usuário ou profissional.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Collections */}
      <section className="mu-section bg-white">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Escolha seu perfil
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Selecione a área que melhor descreve você para ver os artigos relevantes.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {HELP_COLLECTIONS.map((collection, i) => (
              <ScrollReveal key={collection.slug} variant="scale" delay={i * 0.1}>
                <Link
                  href={`/ajuda/c/${collection.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-8 transition hover:border-[#9FE870] hover:shadow-xl hover:shadow-[#9FE870]/10 hover:-translate-y-1"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9FE870]/20">
                    <collection.icon className="h-7 w-7 text-slate-900" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{collection.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{collection.description}</p>
                  <div className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-900">
                    {collection.articles.length} artigos
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Popular articles */}
      <section className="mu-section bg-[#f2f4f7]">
        <div className="mu-shell">
          <ScrollReveal variant="slideUp">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-slate-900 md:text-4xl">
                Artigos populares
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((article, i) => (
              <ScrollReveal key={article!.slug} variant="scale" delay={i * 0.05}>
                <Link
                  href={`/ajuda/a/${article!.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-[#9FE870] hover:shadow-lg hover:shadow-[#9FE870]/10"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {article!.collectionTitle}
                  </span>
                  <h3 className="mt-3 text-base font-bold text-slate-900">{article!.title}</h3>
                  <span className="mt-auto pt-4 text-sm font-bold text-brand-600 transition group-hover:text-slate-900">
                    Ler artigo
                    <ArrowRight className="ml-1 inline-block h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
