import Link from 'next/link'
import { CheckCircle2, Globe2, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { SEARCH_CATEGORIES } from '@/lib/search-config'

export default async function RootPage() {
  return (
    <PublicPageLayout>
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-[#f6f4ef] via-[#f3efe6] to-[#e9f4ee]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-16 md:px-8 md:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              Especialistas brasileiros para brasileiros no exterior
            </span>

            <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-neutral-900 md:text-5xl">
              Sua rede de profissionais confiaveis para viver melhor fora do Brasil.
            </h1>
            <p className="mt-4 max-w-xl text-base text-neutral-600 md:text-lg">
              Encontre especialistas em saude, educacao, carreira, financeiro e suporte documental.
              Compare perfis, veja disponibilidade e agende com seguranca.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/buscar"
                className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Buscar profissionais
              </Link>
              <Link
                href="/registrar-profissional"
                className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:border-brand-300 hover:text-brand-700"
              >
                Registrar como profissional
              </Link>
            </div>
          </div>

          <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">Descoberta aberta</p>
              <p className="mt-1 text-sm text-neutral-600">
                A busca de profissionais e publica. Login so e exigido ao iniciar um agendamento.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">Fuso horario seguro</p>
              <p className="mt-1 text-sm text-neutral-600">
                Horarios exibidos no fuso do usuario com transparencia do fuso do profissional.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">Controle de qualidade</p>
              <p className="mt-1 text-sm text-neutral-600">
                Perfis profissionais seguem trilha de onboarding, governanca e revisao.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
              <p className="text-sm font-semibold text-neutral-900">Marketplace escalavel</p>
              <p className="mt-1 text-sm text-neutral-600">
                Base pronta para request booking, recorrencia, pagamentos e operacao admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-900 md:text-3xl">
              Categorias em destaque
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Navegue pelas principais frentes de busca da Muuday.
            </p>
          </div>
          <Link href="/buscar" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {SEARCH_CATEGORIES.map(category => (
            <Link
              key={category.slug}
              href={`/buscar?categoria=${category.slug}`}
              className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
            >
              <p className="text-base font-semibold text-neutral-900">
                {category.icon} {category.name}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Explore especialistas desta categoria com filtros por disponibilidade, localizacao e idioma.
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white/70">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-10 md:grid-cols-2 md:px-8 lg:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <UsersRound className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-sm font-semibold text-neutral-900">Conta de usuario separada</p>
            <p className="mt-1 text-sm text-neutral-500">
              Perfis de usuario nao acessam area profissional e vice-versa.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-sm font-semibold text-neutral-900">Guardas de rota explicitas</p>
            <p className="mt-1 text-sm text-neutral-500">
              Rotas publicas, de usuario, profissional e admin com permissao definida.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <Globe2 className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-sm font-semibold text-neutral-900">Idioma e moeda no topo</p>
            <p className="mt-1 text-sm text-neutral-500">
              Visitantes podem ajustar idioma e moeda antes mesmo de criar conta.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <CheckCircle2 className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-sm font-semibold text-neutral-900">Fluxo orientado a booking</p>
            <p className="mt-1 text-sm text-neutral-500">
              Busca publica, perfil publico e onboarding guiado para converter em agendamento.
            </p>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
