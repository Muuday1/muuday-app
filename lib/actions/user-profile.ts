'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  if (!input.country.trim()) {
    return { success: false, error: 'Informe o país para continuar.' }
  }

  if (!input.timezone.trim()) {
    return { success: false, error: 'Informe o fuso horário para continuar.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      country: input.country,
      timezone: input.timezone,
      currency: input.currency.toUpperCase(),
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: 'Erro ao salvar alterações. Tente novamente.' }
  }

  revalidatePath('/perfil')
  revalidatePath('/editar-perfil')

  return { success: true }
}
