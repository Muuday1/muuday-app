'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { writeAdminAuditLog } from '@/lib/admin/audit-log'

type AdminActionResult =
  | { success: true }
  | { success: false; error: string }

const professionalStatusSchema = z.enum([
  'approved',
  'rejected',
  'suspended',
  'pending_review',
])

const adminUpdateProfessionalStatusInputSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional invalido.'),
  newStatus: professionalStatusSchema,
})

const adminUpdateFirstBookingGateInputSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional invalido.'),
  enabled: z.boolean(),
})

const adminReviewActionInputSchema = z.object({
  reviewId: z.string().uuid('Identificador de avaliacao invalido.'),
})

const adminToggleReviewVisibilityInputSchema = adminReviewActionInputSchema.extend({
  visible: z.boolean(),
})

function getFirstValidationError(error: z.ZodError) {
  return error.issues[0]?.message || 'Dados invalidos.'
}

/**
 * Server-side admin role check. Returns the authenticated user ID or throws.
 * This ensures admin mutations are never reliant on client-side RLS alone.
 */
async function requireAdmin() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Nao autenticado.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem executar esta acao.')
  }

  return { supabase, userId: user.id }
}

export async function adminUpdateProfessionalStatus(
  professionalId: string,
  newStatus: string,
): Promise<AdminActionResult> {
  const parsed = adminUpdateProfessionalStatusInputSchema.safeParse({
    professionalId,
    newStatus,
  })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { supabase, userId } = await requireAdmin()

    const { data: previousProfessional, error: previousProfessionalError } = await supabase
      .from('professionals')
      .select('id, status, first_booking_enabled, updated_at')
      .eq('id', parsed.data.professionalId)
      .maybeSingle()

    if (previousProfessionalError) {
      return { success: false, error: previousProfessionalError.message }
    }
    if (!previousProfessional) {
      return { success: false, error: 'Profissional nao encontrado.' }
    }

    const { error } = await supabase
      .from('professionals')
      .update({ status: parsed.data.newStatus, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.professionalId)

    if (error) {
      return { success: false, error: error.message }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId: userId,
      action: 'professional.status.updated',
      targetTable: 'professionals',
      targetId: parsed.data.professionalId,
      oldValue: previousProfessional,
      newValue: {
        ...previousProfessional,
        status: parsed.data.newStatus,
      },
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

    revalidatePath('/admin')
    revalidateTag('public-profiles')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}

export async function adminUpdateFirstBookingGate(
  professionalId: string,
  enabled: boolean,
): Promise<AdminActionResult> {
  const parsed = adminUpdateFirstBookingGateInputSchema.safeParse({
    professionalId,
    enabled,
  })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { supabase, userId } = await requireAdmin()

    const { data: previousProfessional, error: previousProfessionalError } = await supabase
      .from('professionals')
      .select(
        'id, first_booking_enabled, first_booking_gate_note, first_booking_gate_updated_at, updated_at',
      )
      .eq('id', parsed.data.professionalId)
      .maybeSingle()

    if (previousProfessionalError) {
      return { success: false, error: previousProfessionalError.message }
    }
    if (!previousProfessional) {
      return { success: false, error: 'Profissional nao encontrado.' }
    }

    const { error } = await supabase
      .from('professionals')
      .update({
        first_booking_enabled: parsed.data.enabled,
        first_booking_gate_note: parsed.data.enabled ? 'admin_enabled' : 'admin_blocked',
        first_booking_gate_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.professionalId)

    if (error) {
      return { success: false, error: error.message }
    }

    const nowIso = new Date().toISOString()
    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId: userId,
      action: 'professional.first_booking_gate.updated',
      targetTable: 'professionals',
      targetId: parsed.data.professionalId,
      oldValue: previousProfessional,
      newValue: {
        ...previousProfessional,
        first_booking_enabled: parsed.data.enabled,
        first_booking_gate_note: parsed.data.enabled ? 'admin_enabled' : 'admin_blocked',
        first_booking_gate_updated_at: nowIso,
        updated_at: nowIso,
      },
      metadata: {
        enabled: parsed.data.enabled,
      },
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

    revalidatePath('/admin')
    revalidateTag('public-profiles')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}

export async function adminToggleReviewVisibility(
  reviewId: string,
  visible: boolean,
): Promise<AdminActionResult> {
  const parsed = adminToggleReviewVisibilityInputSchema.safeParse({
    reviewId,
    visible,
  })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { supabase, userId } = await requireAdmin()

    const { data: previousReview, error: previousReviewError } = await supabase
      .from('reviews')
      .select('id, user_id, professional_id, is_visible, rating')
      .eq('id', parsed.data.reviewId)
      .maybeSingle()

    if (previousReviewError) {
      return { success: false, error: previousReviewError.message }
    }
    if (!previousReview) {
      return { success: false, error: 'Avaliacao nao encontrada.' }
    }

    const { error } = await supabase
      .from('reviews')
      .update({ is_visible: parsed.data.visible })
      .eq('id', parsed.data.reviewId)

    if (error) {
      return { success: false, error: error.message }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId: userId,
      action: 'review.visibility.updated',
      targetTable: 'reviews',
      targetId: parsed.data.reviewId,
      oldValue: previousReview,
      newValue: {
        ...previousReview,
        is_visible: parsed.data.visible,
      },
      metadata: {
        visible: parsed.data.visible,
      },
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

    revalidatePath('/admin')
    revalidateTag('public-profiles')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}

export async function adminDeleteReview(reviewId: string): Promise<AdminActionResult> {
  const parsed = adminReviewActionInputSchema.safeParse({ reviewId })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { supabase, userId } = await requireAdmin()

    const { data: previousReview, error: previousReviewError } = await supabase
      .from('reviews')
      .select('id, user_id, professional_id, is_visible, rating, comment')
      .eq('id', parsed.data.reviewId)
      .maybeSingle()

    if (previousReviewError) {
      return { success: false, error: previousReviewError.message }
    }
    if (!previousReview) {
      return { success: false, error: 'Avaliacao nao encontrada.' }
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', parsed.data.reviewId)

    if (error) {
      return { success: false, error: error.message }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId: userId,
      action: 'review.deleted',
      targetTable: 'reviews',
      targetId: parsed.data.reviewId,
      oldValue: previousReview,
      newValue: null,
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

    revalidatePath('/admin')
    revalidateTag('public-profiles')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}
