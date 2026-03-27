import { createClient } from '@/lib/supabase/client'

export async function getFavoriteIds(): Promise<string[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('favorites')
    .select('professional_id')
    .eq('user_id', user.id)

  return data?.map(f => f.professional_id) || []
}

export async function toggleFavorite(professionalId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('professional_id', professionalId)
    .single()

  if (existing) {
    await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)
    return false // removed
  } else {
    await supabase
      .from('favorites')
      .insert({ user_id: user.id, professional_id: professionalId })
    return true // added
  }
}

export async function isFavorited(professionalId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('professional_id', professionalId)
    .single()

  return !!data
}
