import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type AdminActionResult,
  adminProfessionalDecisionInputSchema,
  getFirstValidationError,
} from '@/lib/actions/admin/shared'
import {
  sendProfileApprovedEmail,
  sendProfileNeedsChangesEmail,
  sendProfileRejectedEmail,
} from '@/lib/email/resend'
import { emitProfessionalProfileApproved } from '@/lib/email/resend-events'
import { createProfessionalSubscription } from '@/lib/payments/subscription/manager'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'
import type { ReviewAdjustmentItemInput } from '@/lib/professional/review-adjustments'
import {
  REVIEW_ADJUSTMENT_STAGE_LABELS,
  SUPPORTED_REVIEW_ADJUSTMENT_KEYS,
} from '@/lib/professional/review-adjustments'
import { writeAdminAuditLog } from './audit'

export async function reviewProfessionalDecisionService(
  supabase: SupabaseClient,
  adminUserId: string,
  professionalId: string,
  decision: 'approved' | 'rejected' | 'needs_changes',
  note?: string,
  adjustments?: ReviewAdjustmentItemInput[],
): Promise<AdminActionResult> {
  const parsed = adminProfessionalDecisionInputSchema.safeParse({
    professionalId,
    decision,
    notes: note,
    adjustments,
  })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { data: currentProfessional, error: currentProfessionalError } = await supabase
      .from('professionals')
      .select(
        'id,user_id,status,admin_review_notes,reviewed_by,reviewed_at,first_booking_enabled,first_booking_gate_note,first_booking_gate_updated_at,updated_at',
      )
      .eq('id', parsed.data.professionalId)
      .maybeSingle()

    if (currentProfessionalError) {
      return { success: false, error: currentProfessionalError.message }
    }
    if (!currentProfessional) {
      return { success: false, error: 'Profissional não encontrado.' }
    }

    const structuredAdjustments = parsed.data.adjustments || []
    const decisionRequiresAdjustments =
      parsed.data.decision === 'needs_changes' || parsed.data.decision === 'rejected'
    if (decisionRequiresAdjustments && structuredAdjustments.length === 0) {
      return { success: false, error: 'Selecione pelo menos um ajuste estruturado para continuar.' }
    }
    const invalidAdjustment = structuredAdjustments.find(
      item => !SUPPORTED_REVIEW_ADJUSTMENT_KEYS.has(`${String(item.stageId)}::${String(item.fieldKey)}`),
    )
    if (invalidAdjustment) {
      return { success: false, error: 'Foi enviado um ajuste inválido para uma etapa indisponível no tracker.' }
    }

    const targetStatus = parsed.data.decision
    const nowIso = new Date().toISOString()
    const professionalUpdatePayload: Record<string, unknown> = {
      status: targetStatus,
      admin_review_notes: parsed.data.notes || null,
      reviewed_by: adminUserId,
      reviewed_at: nowIso,
      updated_at: nowIso,
    }
    if (targetStatus === 'approved') {
      professionalUpdatePayload.first_booking_enabled = true
      professionalUpdatePayload.first_booking_gate_note = 'admin_enabled_by_approval'
      professionalUpdatePayload.first_booking_gate_updated_at = nowIso
    }

    const rollbackProfessionalUpdate = async () => {
      await supabase
        .from('professionals')
        .update({
          status: currentProfessional.status,
          admin_review_notes: currentProfessional.admin_review_notes ?? null,
          reviewed_by: currentProfessional.reviewed_by ?? null,
          reviewed_at: currentProfessional.reviewed_at ?? null,
          first_booking_enabled: Boolean(currentProfessional.first_booking_enabled),
          first_booking_gate_note: currentProfessional.first_booking_gate_note ?? null,
          first_booking_gate_updated_at: currentProfessional.first_booking_gate_updated_at ?? null,
          updated_at: currentProfessional.updated_at ?? nowIso,
        })
        .eq('id', parsed.data.professionalId)
    }

    const { error: updateError } = await supabase
      .from('professionals')
      .update(professionalUpdatePayload)
      .eq('id', parsed.data.professionalId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    if (targetStatus === 'approved') {
      const { error: closeAdjustmentsError } = await supabase
        .from('professional_review_adjustments')
        .update({
          status: 'resolved_by_admin',
          resolved_at: nowIso,
          resolved_by: adminUserId,
          resolution_note: 'approved',
        })
        .eq('professional_id', parsed.data.professionalId)
        .in('status', ['open', 'reopened', 'resolved_by_professional'])

      if (closeAdjustmentsError) {
        await rollbackProfessionalUpdate()
        return { success: false, error: 'Não foi possível concluir os ajustes antes da aprovação.' }
      }

      // Create Stripe subscription for monthly fee (non-blocking)
      // If this fails, the approval still succeeds — admin can retry later
      createProfessionalSubscription(supabase, parsed.data.professionalId)
        .then((result) => {
          if (!result.success) {
            Sentry.captureMessage(`[admin/reviewDecision] subscription creation failed: ${result.error}`, 'error')
          }
        })
        .catch((err) => {
          Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { area: 'admin_review_decision_subscription' } })
        })
    } else {
      const { error: closeExistingError } = await supabase
        .from('professional_review_adjustments')
        .update({
          status: 'resolved_by_admin',
          resolved_at: nowIso,
          resolved_by: adminUserId,
          resolution_note: targetStatus === 'rejected' ? 'replaced_by_rejection_round' : 'replaced_by_new_round',
        })
        .eq('professional_id', parsed.data.professionalId)
        .in('status', ['open', 'reopened', 'resolved_by_professional'])

      if (closeExistingError) {
        await rollbackProfessionalUpdate()
        return { success: false, error: 'Não foi possível atualizar os ajustes anteriores.' }
      }

      const uniqueAdjustments = new Map<string, (typeof structuredAdjustments)[number]>()
      for (const item of structuredAdjustments) {
        uniqueAdjustments.set(`${String(item.stageId)}::${String(item.fieldKey)}`, item)
      }

      const rowsToInsert: Array<{
        professional_id: string
        stage_id: string
        field_key: string
        message: string
        severity: 'low' | 'medium' | 'high'
        status: 'open'
        created_by: string
      }> = Array.from(uniqueAdjustments.values()).map(item => ({
        professional_id: parsed.data.professionalId,
        stage_id: item.stageId,
        field_key: item.fieldKey,
        message: item.message,
        severity: item.severity,
        status: 'open',
        created_by: adminUserId,
      }))

      const { error: insertAdjustmentsError } = await supabase
        .from('professional_review_adjustments')
        .insert(rowsToInsert)

      if (insertAdjustmentsError) {
        await rollbackProfessionalUpdate()
        return { success: false, error: 'Não foi possível registrar os ajustes estruturados.' }
      }
    }

    const { data: professionalOwner, error: ownerError } = await supabase
      .from('profiles')
      .select('email,full_name')
      .eq('id', currentProfessional.user_id)
      .maybeSingle()

    if (ownerError) {
      Sentry.captureException(ownerError, { tags: { area: 'admin_review_decision_owner_query' } })
    }

    if (professionalOwner?.email) {
      try {
        if (targetStatus === 'approved') {
          await sendProfileApprovedEmail(
            professionalOwner.email,
            professionalOwner.full_name || 'Profissional',
          )
          emitProfessionalProfileApproved(professionalOwner.email, {
            professional_id: parsed.data.professionalId,
          })
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
          await sendProfileRejectedEmail(
            professionalOwner.email,
            professionalOwner.full_name || 'Profissional',
            [parsed.data.notes || '', structuredMessage]
              .map(item => item.trim())
              .filter(Boolean)
              .join('\n\n') || 'Seu perfil precisa de ajustes para publicacao.',
          )
        }
      } catch {
        // keep admin decision successful even if email provider is unavailable
      }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId,
      action: 'professional.review.decision',
      targetTable: 'professionals',
      targetId: parsed.data.professionalId,
      oldValue: currentProfessional,
      newValue: {
        ...currentProfessional,
        ...professionalUpdatePayload,
      },
      metadata: {
        decision: targetStatus,
      },
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

    await recomputeProfessionalVisibility(supabase, parsed.data.professionalId)

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}
