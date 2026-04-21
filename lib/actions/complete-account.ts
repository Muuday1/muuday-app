'use server'

import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmailAction } from './email'
import { revalidatePath } from 'next/cache'

function normalizeRole(value: unknown): string | null {
  const normalized = String(value || '').toLowerCase().trim()
  if (normalized === 'admin' || normalized === 'profissional' || normalized === 'usuario') {
    return normalized
  }
  return null
}

export interface CompleteAccountInput {
  country: string
  timezone: string
  currency: string
  roleHint: string
}

export interface CompleteAccountResult {
  success: boolean
  error?: string
  redirectTo?: string
}

export async function completeAccount(
  input: CompleteAccountInput,
): Promise<CompleteAccountResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Sessão expirada', redirectTo: '/login' }
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const currentRole = normalizeRole(currentProfile?.role)
  const metadataRole =
    normalizeRole(user.app_metadata?.role) ||
    normalizeRole((user as { raw_app_meta_data?: Record<string, unknown> } | null)?.raw_app_meta_data?.role) ||
    normalizeRole(user.user_metadata?.role)

  const finalRole =
    currentRole === 'admin' || currentRole === 'profissional'
      ? currentRole
      : metadataRole || input.roleHint

  const { error } = await supabase
    .from('profiles')
    .update({
      role: finalRole,
      country: input.country,
      timezone: input.timezone,
      currency: input.currency,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: 'Erro ao salvar. Tente novamente.' }
  }

  // Send welcome email (non-blocking)
  if (user.email) {
    const displayName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      'por aí'
    sendWelcomeEmailAction(user.email, displayName)
  }

  revalidatePath('/')
  revalidatePath('/perfil')

  return { success: true }
}
