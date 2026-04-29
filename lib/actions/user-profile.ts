'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/lib/security/rate-limit'
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

const EDITABLE_PROFILE_FIELDS = new Set([
  'currency',
  'timezone',
  'notification_preferences',
  'full_name',
  'country',
])

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

export async function updateProfileField(
  field: string,
  value: unknown,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sessão expirada. Faça login novamente.' }
  }

  const rl = await rateLimit('profileUpdate', user.id)
  if (!rl.allowed) {
    return { error: 'Muitas tentativas. Tente novamente em breve.' }
  }

  if (!EDITABLE_PROFILE_FIELDS.has(field)) {
    console.error(`[updateProfileField] Blocked attempt to update restricted field: ${field}`)
    return { error: 'Campo não permitido.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ [field]: value })
    .eq('id', user.id)

  if (error) {
    console.error('[updateProfileField] update error:', error.message)
    return { error: 'Erro ao salvar alteração. Tente novamente.' }
  }

  revalidatePath('/perfil')
  revalidatePath('/editar-perfil')
  revalidatePath('/configuracoes')

  return { success: true }
}
