import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type AdminActionResult,
  adminRestoreProfessionalAdjustmentsInputSchema,
  getFirstValidationError,
} from '@/lib/actions/admin/shared'
import { SUPPORTED_REVIEW_ADJUSTMENT_KEYS } from '@/lib/professional/review-adjustments'
import { writeAdminAuditLog } from './audit'

export async function restoreLatestReviewAdjustmentsService(
  supabase: SupabaseClient,
  adminUserId: string,
  professionalId: string,
): Promise<AdminActionResult> {
  const parsed = adminRestoreProfessionalAdjustmentsInputSchema.safeParse({ professionalId })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .select('id,status,updated_at')
      .eq('id', professionalId)
      .maybeSingle()

    if (professionalError) {
      return { success: false, error: professionalError.message }
    }
    if (!professional) {
      return { success: false, error: 'Profissional não encontrado.' }
    }

    const normalizedStatus = String(professional.status || '').toLowerCase()
    if (!['needs_changes', 'rejected'].includes(normalizedStatus)) {
      return {
        success: false,
        error: 'A restauração de ajustes só está disponível para perfis com revisão devolvida.',
      }
    }

    const { data: openRows, error: openRowsError } = await supabase
      .from('professional_review_adjustments')
      .select('id')
      .eq('professional_id', professionalId)
      .in('status', ['open', 'reopened'])
      .limit(1)

    if (openRowsError) {
      return { success: false, error: openRowsError.message }
    }
    if ((openRows || []).length > 0) {
      return { success: false, error: 'Este perfil já possui ajustes estruturados abertos.' }
    }

    const { data: historicalRows, error: historicalRowsError } = await supabase
      .from('professional_review_adjustments')
      .select('id,stage_id,field_key,status,created_at')
      .eq('professional_id', professionalId)
      .in('status', ['resolved_by_admin', 'resolved_by_professional'])
      .order('created_at', { ascending: false })

    if (historicalRowsError) {
      return { success: false, error: historicalRowsError.message }
    }

    const latestByKey = new Map<string, string>()
    for (const row of historicalRows || []) {
      const key = `${String(row.stage_id)}::${String(row.field_key)}`
      if (!SUPPORTED_REVIEW_ADJUSTMENT_KEYS.has(key)) continue
      if (!latestByKey.has(key)) {
        latestByKey.set(key, String(row.id || ''))
      }
    }

    const adjustmentIds = Array.from(latestByKey.values()).filter(Boolean)
    if (adjustmentIds.length === 0) {
      return {
        success: false,
        error: 'Não há uma rodada anterior de ajustes suportados para restaurar. Crie uma nova revisão estruturada.',
      }
    }

    const nowIso = new Date().toISOString()
    const { error: reopenError } = await supabase
      .from('professional_review_adjustments')
      .update({
        status: 'reopened',
        resolved_at: null,
        resolved_by: null,
        resolution_note: 'restored_missing_open_adjustments',
      })
      .eq('professional_id', professionalId)
      .in('id', adjustmentIds)

    if (reopenError) {
      return { success: false, error: reopenError.message }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId,
      action: 'professional.review.adjustments.restored',
      targetTable: 'professional_review_adjustments',
      targetId: professionalId,
      oldValue: {
        status: professional.status,
      },
      newValue: {
        status: professional.status,
        restoredAdjustmentIds: adjustmentIds,
        restoredAt: nowIso,
      },
      metadata: {
        professionalId,
        adjustmentCount: adjustmentIds.length,
      },
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}
