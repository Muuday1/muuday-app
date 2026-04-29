import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminAuthError'
  }
}

/**
 * Server-side admin role check. Returns the authenticated user ID or throws AdminAuthError.
 * This ensures admin mutations are never reliant on client-side RLS alone.
 */
export async function requireAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new AdminAuthError('Não autenticado.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    Sentry.captureException(profileError, { tags: { area: 'admin_auth_helper' } })
  }

  if (profile?.role !== 'admin') {
    throw new AdminAuthError('Acesso negado. Apenas administradores podem executar esta ação.')
  }

  return { userId: user.id }
}
