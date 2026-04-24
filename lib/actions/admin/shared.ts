import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { AdminAuthError } from '@/lib/admin/auth-helper'

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string }

export const professionalStatusSchema = z.enum([
  'approved',
  'rejected',
  'suspended',
  'pending_review',
  'needs_changes',
  'draft',
])

export const adminUpdateProfessionalStatusInputSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional inválido.'),
  newStatus: professionalStatusSchema,
})

export const adminUpdateFirstBookingGateInputSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional inválido.'),
  enabled: z.boolean(),
})

export const adminReviewActionInputSchema = z.object({
  reviewId: z.string().uuid('Identificador de avaliação inválido.'),
})

export const adminRestoreProfessionalAdjustmentsInputSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional inválido.'),
})

export const adminProfessionalDecisionInputSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional inválido.'),
  decision: z.enum(['approved', 'rejected', 'needs_changes']),
  notes: z.string().trim().max(1200, 'Notas muito longas.').optional(),
  adjustments: z
    .array(
      z.object({
        stageId: z.string().min(1),
        fieldKey: z.string().min(1),
        message: z.string().trim().min(3).max(600),
        severity: z.enum(['low', 'medium', 'high']),
      }),
    )
    .max(40)
    .optional(),
})

export const adminToggleReviewVisibilityInputSchema = adminReviewActionInputSchema.extend({
  visible: z.boolean(),
})

export function getFirstValidationError(error: z.ZodError) {
  return error.issues[0]?.message || 'Dados inválidos.'
}

/**
 * Server-side admin role check. Returns the authenticated user ID or throws.
 * This ensures admin mutations are never reliant on client-side RLS alone.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new AdminAuthError('Não autenticado.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[admin/shared] profile role query error:', profileError.message)
  }

  if (profile?.role !== 'admin') {
    throw new AdminAuthError('Acesso negado. Apenas administradores podem executar esta ação.')
  }

  return { supabase, userId: user.id }
}
