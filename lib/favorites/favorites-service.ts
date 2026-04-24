import type { SupabaseClient } from '@supabase/supabase-js'

export interface FavoriteResult {
  success: boolean
  error?: string
}

export async function addFavorite(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string,
): Promise<FavoriteResult> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, professional_id: professionalId })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Profissional já está nos favoritos.' }
    }
    return { success: false, error: 'Não foi possível adicionar aos favoritos. Tente novamente.' }
  }

  return { success: true }
}

export async function removeFavorite(
  supabase: SupabaseClient,
  userId: string,
  professionalId: string,
): Promise<FavoriteResult> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('professional_id', professionalId)

  if (error) {
    return { success: false, error: 'Não foi possível remover dos favoritos. Tente novamente.' }
  }

  return { success: true }
}
