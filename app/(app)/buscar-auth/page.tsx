import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BuscarPageContent } from '@/app/buscar/page'

type BuscarSearchParams = {
  q?: string
  categoria?: string
  subcategoria?: string
  especialidade?: string
  precoMin?: string
  precoMax?: string
  horario?: string
  localizacao?: string
  idioma?: string
  ordenar?: string
  pagina?: string
  moeda?: string
}

export default async function BuscarAuthPage({
  searchParams,
}: {
  searchParams: Promise<BuscarSearchParams>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const resolvedSearchParams = await searchParams
  if (!user) {
    const query = new URLSearchParams(
      Object.entries(resolvedSearchParams).filter(([, value]) => Boolean(value)) as [string, string][],
    ).toString()
    redirect(query ? `/buscar?${query}` : '/buscar')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', user.id)
    .maybeSingle()

  const effectiveParams: BuscarSearchParams = { ...resolvedSearchParams }
  if (!effectiveParams.moeda && profile?.currency) {
    effectiveParams.moeda = String(profile.currency).toUpperCase()
  }

  return await BuscarPageContent({
    searchParams: Promise.resolve(effectiveParams),
    isLoggedIn: true,
    basePath: '/buscar-auth',
    defaultCurrency: 'BRL',
  })
}
