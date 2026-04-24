import type { SupabaseClient } from '@supabase/supabase-js'

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
  supabase: SupabaseClient,
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UpdateUserProfileResult> {
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
    .eq('id', userId)

  if (error) {
    return { success: false, error: 'Erro ao salvar alterações. Tente novamente.' }
  }

  return { success: true }
}
