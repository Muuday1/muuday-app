import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type BuscarSearchParams = {
  q?: string
  categoria?: string
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

export const dynamic = 'force-dynamic'

export default async function BuscarAuthPage({
  searchParams,
}: {
  searchParams: BuscarSearchParams
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const query = new URLSearchParams(
      Object.entries(searchParams).filter(([, value]) => Boolean(value)) as [string, string][],
    ).toString()
    redirect(query ? `/buscar?${query}` : '/buscar')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', user.id)
    .maybeSingle()

  const params = new URLSearchParams(
    Object.entries(searchParams).filter(([, value]) => Boolean(value)) as [string, string][],
  )

  if (!params.get('moeda') && profile?.currency) {
    params.set('moeda', String(profile.currency).toUpperCase())
  }

  const query = params.toString()
  redirect(query ? `/buscar?${query}` : '/buscar')
}

