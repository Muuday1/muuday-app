import { createClient } from '@/lib/supabase/server'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

export async function resolveAuthenticatedProfessionalContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, status: 401, error: 'Not authenticated.' }
  }

  const { data: professional } = await getPrimaryProfessionalForUser(
    supabase,
    user.id,
    'id,user_id,status,tier',
  )

  if (!professional?.id) {
    return { ok: false as const, status: 403, error: 'Professional profile not found.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email,full_name')
    .eq('id', user.id)
    .maybeSingle()

  return {
    ok: true as const,
    user,
    professionalId: String(professional.id),
    email: String(profile?.email || user.email || ''),
    fullName: String(profile?.full_name || ''),
  }
}
