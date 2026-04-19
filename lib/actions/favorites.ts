'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function removeFavorite(professionalId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('professional_id', professionalId)

  if (error) {
    return { success: false, error: 'Não foi possível remover dos favoritos. Tente novamente.' }
  }

  revalidatePath('/favoritos')
  return { success: true }
}
