import { createClient } from '@/lib/supabase/client'

export async function getFavoriteIds(): Promise<string[]> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.error('[favorites] auth error:', authError.message)
  }
  if (!user) return []

  const { data, error } = await supabase
    .from('favorites')
    .select('professional_id')
    .eq('user_id', user.id)

  if (error) {
    console.error('[favorites] getFavoriteIds query error:', error.message)
  }

  return data?.map(f => f.professional_id) || []
}

export async function toggleFavorite(professionalId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.error('[favorites] auth error:', authError.message)
  }
  if (!user) return false

  const { data: existing, error: existingError } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('professional_id', professionalId)
    .single()

  if (existingError && !existingError.message?.includes('0 rows')) {
    console.error('[favorites] toggleFavorite query error:', existingError.message)
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)
    if (deleteError) {
      console.error('[favorites] delete error:', deleteError.message)
    }
    return false // removed
  } else {
    const { error: insertError } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, professional_id: professionalId })
    if (insertError) {
      console.error('[favorites] insert error:', insertError.message)
    }
    return true // added
  }
}

export async function isFavorited(professionalId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.error('[favorites] auth error:', authError.message)
  }
  if (!user) return false

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('professional_id', professionalId)
    .single()

  if (error && !error.message?.includes('0 rows')) {
    console.error('[favorites] isFavorited query error:', error.message)
  }

  return !!data
}
