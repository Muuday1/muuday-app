import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

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
  user?: {
    id: string
    email: string
    displayName: string
    firstName: string
    country: string
    role: string
    specialty?: string
  }
}

export async function completeAccountService(
  supabase: SupabaseClient,
  userId: string,
  input: CompleteAccountInput,
): Promise<CompleteAccountResult> {
  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    Sentry.captureException(profileError, { tags: { area: 'complete_account' } })
  }

  const currentRole = normalizeRole(currentProfile?.role)

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
  if (userError || !userData?.user) {
    return { success: false, error: 'Usuário não encontrado.' }
  }

  const user = userData.user
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
    .eq('id', userId)

  if (error) {
    return { success: false, error: 'Erro ao salvar. Tente novamente.' }
  }

  const displayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    'por aí'
  const firstName = displayName.split(' ')[0] || 'por aí'
  const specialty = (user.user_metadata?.professional_specialty_name as string) || ''

  return {
    success: true,
    user: {
      id: userId,
      email: user.email || '',
      displayName,
      firstName,
      country: input.country,
      role: finalRole || input.roleHint,
      specialty,
    },
  }
}
