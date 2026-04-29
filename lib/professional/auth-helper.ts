import * as Sentry from '@sentry/nextjs'
import { getPrimaryProfessionalForUser } from './current-professional'
import type { SupabaseClient } from '@supabase/supabase-js'

export class ProfessionalAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfessionalAuthError'
  }
}

/**
 * Resolves the primary professional profile for the currently authenticated user.
 * Throws ProfessionalAuthError if not authenticated or not a professional.
 */
export async function requireProfessional(supabase: SupabaseClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new ProfessionalAuthError('Não autenticado.')
  }

  const { data: professional, error: profError } = await getPrimaryProfessionalForUser(
    supabase,
    user.id,
    'id',
  )

  if (profError) {
    Sentry.captureException(profError, { tags: { area: 'professional_auth_helper' } })
  }

  if (!professional) {
    throw new ProfessionalAuthError('Apenas profissionais podem executar esta ação.')
  }

  return { userId: user.id, professionalId: professional.id }
}
