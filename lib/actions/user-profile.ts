'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { updateUserProfile as updateUserProfileService } from '@/lib/user/user-profile-service'

export interface UpdateUserProfileInput {
  fullName: string
  country: string
  timezone: string
  currency: string
}

export interface UpdateUserProfileResult {
  success: boolean
  error?: string
}

export async function updateUserProfile(
  input: UpdateUserProfileInput,
): Promise<UpdateUserProfileResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const result = await updateUserProfileService(supabase, user.id, input)

  if (result.success) {
    revalidatePath('/perfil')
    revalidatePath('/editar-perfil')
  }

  return result
}
