'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendWelcomeEmail } from '@/lib/email/templates/user'
import {
  emitUserSignedUp,
  emitUserProfileCompleted,
  emitProfessionalSignedUp,
} from '@/lib/email/resend-events'
import {
  completeAccountService,
  type CompleteAccountInput,
  type CompleteAccountResult,
} from '@/lib/onboarding/complete-account-service'

export type { CompleteAccountInput, CompleteAccountResult }

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

  const result = await completeAccountService(supabase, user.id, input)

  if (!result.success || !result.user) {
    return result
  }

  const { user: userInfo } = result

  // Send welcome email (non-blocking)
  if (userInfo.email) {
    sendWelcomeEmail(userInfo.email, userInfo.displayName).catch(() => {
      // Non-critical
    })

    // Emit Resend automation events
    if (userInfo.role === 'profissional') {
      emitProfessionalSignedUp(userInfo.email, {
        first_name: userInfo.firstName,
        specialty: userInfo.specialty || '',
      })
    } else {
      emitUserSignedUp(userInfo.email, {
        first_name: userInfo.firstName,
        country: userInfo.country,
        user_type: userInfo.role === 'usuario' ? 'client' : 'unknown',
      })
      emitUserProfileCompleted(userInfo.email, { user_id: userInfo.id })
    }
  }

  revalidatePath('/')
  revalidatePath('/perfil')

  return { success: true }
}
