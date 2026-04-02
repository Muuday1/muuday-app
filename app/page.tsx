import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { SEARCH_CATEGORIES } from '@/lib/search-config'

export default async function RootPage() {
  return (
    <PublicPageLayout>
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-[#f6f4ef] via-[#f2efe8] to-[#e9f4ee]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.55]">
          <div className="absolute -left-24 -top-20 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl" />
          <div className="absolute -bottom-24 right-[-10%] h-96 w-96 rounded-full bg-emerald-200/50 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-8 md:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-800">
                <Sparkles className="h-3.5 w-3.5" />
                Para brasileiros no exterior
              </span>

              <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-neutral-900 md:text-5xl">
                Encontre profissionais brasileiros e faça tudo online — do jeito mais simples.
              </h1>
              <p className="mt-4 max-w-xl text-base text-neutral-700 md:text-lg">
                A Muuday conecta você a especialistas brasileiros (psicologia, nutrição, direito, contabilidade e mais),
                com horários no seu fuso e agendamento sem enrolação.
              </p>

              <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/buscar"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
                >
                  Encontrar profissional
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/registrar-profissional"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:border-brand-300 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
                >
                  Sou profissional
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-2 text-sm text-neutral-700 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-brand-700 ring-1 ring-neutral-200">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <p>
                    <span className="font-semibold text-neutral-900">Explore sem conta.</span> Você só faz login para agendar.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-brand-700 ring-1 ring-neutral-200">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <p>
                    <span className="font-semibold text-neutral-900">Horário no seu fuso.</span> Disponibilidade clara.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Como a Muuday ajuda
                    </p>
                    <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                      100% online
                    </span>
                  </div>

                  <div className="mt-4">
                    <Image
                      src="/illustrations/home-hero.svg"
                      alt="Ilustração abstrata representando conexão, agenda e atendimento online."
                      width={920}
                      height={720}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 460px"
                      quality={80}
                      priority
                      className="h-auto w-full"
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
                      <p className="text-sm font-semibold text-neutral-900">Atendimento em português</p>
                      <p className="mt-1 text-sm text-neutral-600">
                        Contexto cultural importa — e aqui você não precisa “traduzir a vida”.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4">
                      <p className="text-sm font-semibold text-neutral-900">Profissionais verificados</p>
                      <p className="mt-1 text-sm text-neutral-600">
                        Perfis revisados antes de aparecerem na plataforma.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
        <div className="mb-7 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-900 md:text-3xl">
              Comece por uma categoria
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Escolha um tipo de atendimento e veja profissionais disponíveis.
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
              className="group rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
            >
              <p className="text-base font-semibold text-neutral-900">
                {category.icon} {category.name}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Veja opções, compare perfis e agende online.
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                Ver profissionais <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Por que Muuday</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-neutral-900 md:text-3xl">
                Clareza, confiança e atendimento em português.
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Você escolhe com calma e agenda sem ruído. A plataforma foi pensada para quem mora fora e precisa de um
                profissional brasileiro com facilidade.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <UsersRound className="h-5 w-5 text-brand-600" />
                  <p className="mt-3 text-sm font-semibold text-neutral-900">Perfis completos</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Experiência, especialidades e avaliações — tudo no mesmo lugar.
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <ShieldCheck className="h-5 w-5 text-brand-600" />
                  <p className="mt-3 text-sm font-semibold text-neutral-900">Dados protegidos</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Seus dados ficam seguros e você controla quando compartilhar.
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <Globe2 className="h-5 w-5 text-brand-600" />
                  <p className="mt-3 text-sm font-semibold text-neutral-900">No seu fuso e na sua moeda</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Disponibilidade convertida e preços claros para decidir melhor.
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <CheckCircle2 className="h-5 w-5 text-brand-600" />
                  <p className="mt-3 text-sm font-semibold text-neutral-900">Agendamento simples</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Explore sem conta e faça login apenas na hora de confirmar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Como funciona</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-neutral-900 md:text-3xl">
              Três passos e você resolve.
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Sem “vai e volta” de mensagens para descobrir preço e agenda.
            </p>
          </div>
          <ol className="lg:col-span-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <li className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold text-neutral-500">01</p>
              <p className="mt-2 text-base font-semibold text-neutral-900">Busque</p>
              <p className="mt-1 text-sm text-neutral-600">
                Filtre por categoria, preço e especialidade.
              </p>
            </li>
            <li className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold text-neutral-500">02</p>
              <p className="mt-2 text-base font-semibold text-neutral-900">Compare</p>
              <p className="mt-1 text-sm text-neutral-600">
                Leia perfis, veja avaliações e escolha com confiança.
              </p>
            </li>
            <li className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold text-neutral-500">03</p>
              <p className="mt-2 text-base font-semibold text-neutral-900">Agende</p>
              <p className="mt-1 text-sm text-neutral-600">
                Faça login e confirme o melhor horário para você.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-8">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-white to-brand-50 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 className="font-display text-2xl font-bold text-neutral-900 md:text-3xl">
                Você é profissional e atende brasileiros fora do país?
              </h2>
              <p className="mt-2 text-sm text-neutral-700 md:text-base">
                Crie seu perfil, seja encontrado por quem precisa e organize seus agendamentos em um só lugar.
              </p>
            </div>
            <div className="lg:col-span-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/registrar-profissional"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
              >
                Registrar como profissional
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20"
              >
                Ver profissionais
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  )
}
