import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FavoritesList from '@/components/favorites/FavoritesList'

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
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency')
    .eq('id', user.id)
    .single()

  const userCurrency = profile?.currency || 'BRL'

  const { data: favs } = await supabase
    .from('favorites')
    .select('professional_id')
    .eq('user_id', user.id)

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
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">Favoritos</h1>
        <p className="text-neutral-500">Seus profissionais salvos</p>
      </div>

      <FavoritesList initialProfessionals={professionals} userCurrency={userCurrency} />
    </div>
  )
}
