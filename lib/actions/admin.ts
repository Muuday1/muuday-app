'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { writeAdminAuditLog } from '@/lib/admin/audit-log'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'
import {
  sendProfileApprovedEmail,
  sendProfileNeedsChangesEmail,
  sendProfileRejectedEmail,
} from '@/lib/email/resend'
import type { ReviewAdjustmentItemInput } from '@/lib/professional/review-adjustments'
import { REVIEW_ADJUSTMENT_STAGE_LABELS } from '@/lib/professional/review-adjustments'

type AdminActionResult =
  | { success: true }
  | { success: false; error: string }

const professionalStatusSchema = z.enum([
  'approved',
  'rejected',
  'suspended',
  'pending_review',
  'needs_changes',
  'draft',
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

const adminProfessionalDecisionInputSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional invalido.'),
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

    await recomputeProfessionalVisibility(supabase, parsed.data.professionalId)
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

    await recomputeProfessionalVisibility(supabase, parsed.data.professionalId)
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

export async function adminReviewProfessionalDecision(
  professionalId: string,
  decision: 'approved' | 'rejected' | 'needs_changes',
  notes?: string,
  adjustments?: ReviewAdjustmentItemInput[],
): Promise<AdminActionResult> {
  const parsed = adminProfessionalDecisionInputSchema.safeParse({
    professionalId,
    decision,
    notes,
    adjustments,
  })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { supabase, userId } = await requireAdmin()
    const { data: currentProfessional, error: currentProfessionalError } = await supabase
      .from('professionals')
      .select('id,user_id,status,updated_at')
      .eq('id', parsed.data.professionalId)
      .maybeSingle()

    if (currentProfessionalError) {
      return { success: false, error: currentProfessionalError.message }
    }
    if (!currentProfessional) {
      return { success: false, error: 'Profissional nao encontrado.' }
    }

    const structuredAdjustments = parsed.data.adjustments || []
    if (parsed.data.decision === 'needs_changes' && structuredAdjustments.length === 0) {
      return { success: false, error: 'Selecione pelo menos um ajuste obrigatório para solicitar alterações.' }
    }

    const targetStatus = parsed.data.decision
    const nowIso = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('professionals')
      .update({
        status: targetStatus,
        admin_review_notes: parsed.data.notes || null,
        reviewed_by: userId,
        reviewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', parsed.data.professionalId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    if (targetStatus === 'needs_changes') {
      await supabase
        .from('professional_review_adjustments')
        .update({
          status: 'reopened',
          resolved_at: null,
          resolved_by: null,
          resolution_note: 'new_adjustments_requested',
        })
        .eq('professional_id', parsed.data.professionalId)
        .in('status', ['open', 'resolved_by_professional'])

      const adjustmentsPayload = structuredAdjustments.map(item => ({
        professional_id: parsed.data.professionalId,
        stage_id: item.stageId,
        field_key: item.fieldKey,
        message: item.message,
        severity: item.severity,
        status: 'open',
        created_by: userId,
      }))

      const { error: insertAdjustmentsError } = await supabase
        .from('professional_review_adjustments')
        .insert(adjustmentsPayload)

      if (insertAdjustmentsError) {
        return { success: false, error: 'Não foi possível registrar os ajustes estruturados.' }
      }
    } else {
      await supabase
        .from('professional_review_adjustments')
        .update({
          status: 'resolved_by_admin',
          resolved_at: nowIso,
          resolved_by: userId,
          resolution_note: targetStatus === 'approved' ? 'approved' : 'closed_by_rejection',
        })
        .eq('professional_id', parsed.data.professionalId)
        .in('status', ['open', 'reopened', 'resolved_by_professional'])
    }

    const { data: professionalOwner } = await supabase
      .from('profiles')
      .select('email,full_name')
      .eq('id', currentProfessional.user_id)
      .maybeSingle()

    if (professionalOwner?.email) {
      try {
        if (targetStatus === 'approved') {
          await sendProfileApprovedEmail(
            professionalOwner.email,
            professionalOwner.full_name || 'Profissional',
          )
        } else if (targetStatus === 'needs_changes') {
          const structuredMessage =
            structuredAdjustments.length > 0
              ? structuredAdjustments
                  .map(item => {
                    const stageLabel =
                      REVIEW_ADJUSTMENT_STAGE_LABELS[item.stageId as keyof typeof REVIEW_ADJUSTMENT_STAGE_LABELS] ||
                      item.stageId
                    return `• ${stageLabel} (${item.fieldKey}): ${item.message}`
                  })
                  .join('\n')
              : ''
          await sendProfileNeedsChangesEmail(
            professionalOwner.email,
            professionalOwner.full_name || 'Profissional',
            [parsed.data.notes || '', structuredMessage]
              .map(item => item.trim())
              .filter(Boolean)
              .join('\n\n') || 'Revise os dados enviados e atualize seu perfil.',
          )
        } else {
          await sendProfileRejectedEmail(
            professionalOwner.email,
            professionalOwner.full_name || 'Profissional',
            parsed.data.notes || 'Seu perfil precisa de ajustes para publicação.',
          )
        }
      } catch {
        // keep admin decision successful even if email provider is unavailable
      }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId: userId,
      action: 'professional.review.decision',
      targetTable: 'professionals',
      targetId: parsed.data.professionalId,
      oldValue: currentProfessional,
      newValue: {
        ...currentProfessional,
        status: targetStatus,
        admin_review_notes: parsed.data.notes || null,
        reviewed_by: userId,
        reviewed_at: nowIso,
      },
      metadata: {
        decision: targetStatus,
      },
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

    await recomputeProfessionalVisibility(supabase, parsed.data.professionalId)
    revalidatePath('/admin')
    revalidatePath(`/admin/revisao/${parsed.data.professionalId}`)
    revalidateTag('public-profiles')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}
