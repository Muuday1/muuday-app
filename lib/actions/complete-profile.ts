'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  completeProfessionalProfileService,
  type CompleteProfileInput,
  type CompleteProfileResult,
} from '@/lib/onboarding/complete-profile-service'

export type { CompleteProfileInput, CompleteProfileResult }

export async function completeProfessionalProfile(
  input: CompleteProfileInput,
): Promise<CompleteProfileResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  const result = await completeProfessionalProfileService(supabase, user.id, input)

  if (result.success) {
    // Trigger visibility recompute (non-blocking)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10_000)
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL || ''}/api/professional/recompute-visibility`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        },
      )
      clearTimeout(timeoutId)
    } catch {
      // Non-critical: visibility will be recomputed eventually
    }

    revalidatePath('/perfil')
    revalidatePath('/profissional/[id]')
  }

  return result
}
