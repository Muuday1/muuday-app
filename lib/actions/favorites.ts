'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addFavorite as addFavoriteService, removeFavorite as removeFavoriteService } from '@/lib/favorites/favorites-service'

export async function addFavorite(professionalId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const result = await addFavoriteService(supabase, user.id, professionalId)

  if (result.success) {
    revalidatePath('/favoritos')
  }

  return result
}

export async function removeFavorite(professionalId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const result = await removeFavoriteService(supabase, user.id, professionalId)

  if (result.success) {
    revalidatePath('/favoritos')
  }

  return result
}
