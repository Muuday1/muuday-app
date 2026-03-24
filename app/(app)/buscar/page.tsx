import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, Star, Clock, MapPin } from 'lucide-react'
import { CATEGORIES } from '@/types'
import { formatCurrency } from '@/lib/utils'

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: { categoria?: string; q?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('professionals')
    .select('*, profiles(*)')
    .eq('status', 'approved')

  if (searchParams.categoria) {
    query = query.eq('category', searchParams.categoria)
  }

  if (searchParams.q) {
    query = query.or(`bio.ilike.%${searchParams.q}%,tags.cs.{${searchParams.q}},category.ilike.%${searchParams.q}%`)
  }

  const { data: professionals } = await query.order('rating', { ascending: false })

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">Buscar profissionais</h1>
        <p className="text-neutral-500">Especialistas brasileiros verificados, prontos para te atender</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <form>
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar por nome ou especialidade..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </form>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <Link
          href="/buscar"
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !searchParams.categoria
              ? 'bg-brand-500 text-white'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
          }`}
        >
          Todos
        </Link>
        {CATEGORIES.map(cat => (
          <Link
            key={cat.id}
            href={`/buscar?categoria=${cat.slug}`}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              searchParams.categoria === cat.slug
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Results */}
      {!professionals || professionals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-semibold text-neutral-900 mb-2">Nenhum profissional encontrado</p>
          <p className="text-neutral-500 text-sm">Tente outra categoria ou busca</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionals.map((pro: any) => (
            <Link
              key={pro.id}
              href={`/profissional/${pro.id}`}
              className="bg-white rounded-2xl border border-neutral-100 hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Avatar */}
              <div className="bg-gradient-to-br from-brand-50 to-brand-100 h-24 flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-display font-bold text-2xl">
                  {pro.profiles?.full_name?.charAt(0) || 'P'}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors">
                  {pro.profiles?.full_name}
                </h3>
                <p className="text-sm text-neutral-500 mt-0.5 capitalize">
                  {CATEGORIES.find(c => c.slug === pro.category)?.name || pro.category}
                </p>

                <div className="flex items-center gap-3 mt-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-accent-500 fill-accent-500" />
                    {pro.rating > 0 ? pro.rating.toFixed(1) : 'Novo'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {pro.session_duration_minutes}min
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span className="font-semibold text-neutral-900">
                    {formatCurrency(pro.session_price_brl)}
                  </span>
                  <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2.5 py-1 rounded-full">
                    Ver perfil
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
