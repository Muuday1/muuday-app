import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'

export async function getFavoriteIds(): Promise<string[]> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    Sentry.captureException(authError, { tags: { area: 'favorites' } })
  }
  if (!user) return []

  const { data, error } = await supabase
    .from('favorites')
    .select('professional_id')
    .eq('user_id', user.id)

  if (error) {
    Sentry.captureException(error, { tags: { area: 'favorites' } })
  }

  return data?.map(f => f.professional_id) || []
}

export async function toggleFavorite(professionalId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    Sentry.captureException(authError, { tags: { area: 'favorites' } })
  }
  if (!user) return false

  const { data: existing, error: existingError } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('professional_id', professionalId)
    .single()

  if (existingError && !existingError.message?.includes('0 rows')) {
    Sentry.captureException(existingError, { tags: { area: 'favorites' } })
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)
    if (deleteError) {
      Sentry.captureException(deleteError, { tags: { area: 'favorites' } })
    }
    return false // removed
  } else {
    const { error: insertError } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, professional_id: professionalId })
    if (insertError) {
      Sentry.captureException(insertError, { tags: { area: 'favorites' } })
    }
    return true // added
  }
}

export async function isFavorited(professionalId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    Sentry.captureException(authError, { tags: { area: 'favorites' } })
  }
  if (!user) return false

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('professional_id', professionalId)
    .single()

  if (error && !error.message?.includes('0 rows')) {
    Sentry.captureException(error, { tags: { area: 'favorites' } })
  }

  return !!data
}
