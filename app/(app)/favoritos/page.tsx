import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FavoritesList from '@/components/favorites/FavoritesList'
import { PageHeader, PageContainer } from '@/components/ui/AppShell'

type Professional = {
  id: string
  public_code?: number | null
  category: string
  rating: number
  total_reviews: number
  session_price_brl: number
  session_duration_minutes: number
  profiles: Record<string, unknown> | Record<string, unknown>[] | null
}

export default async function FavoritosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: favs }] = await Promise.all([
    supabase.from('profiles').select('currency').eq('id', user.id).single(),
    supabase.from('favorites').select('professional_id').eq('user_id', user.id),
  ])

  const userCurrency = profile?.currency || 'BRL'

  const ids = favs?.map(f => f.professional_id) || []

  let professionals: Professional[] = []

  if (ids.length > 0) {
    const { data } = await supabase
      .from('professionals')
      .select('*, profiles(*)')
      .in('id', ids)
      .eq('status', 'approved')

    professionals = (data as unknown as Professional[]) || []
  }

  return (
    <PageContainer>
      <PageHeader
        title="Favoritos"
        subtitle="Seus profissionais salvos"
      />

      <FavoritesList initialProfessionals={professionals} userCurrency={userCurrency} />
    </PageContainer>
  )
}
