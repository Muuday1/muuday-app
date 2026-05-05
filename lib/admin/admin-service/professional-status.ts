import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type AdminActionResult,
  adminUpdateProfessionalStatusInputSchema,
  getFirstValidationError,
} from '@/lib/actions/admin/shared'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'
import { writeAdminAuditLog } from './audit'

export async function updateProfessionalStatusService(
  supabase: SupabaseClient,
  adminUserId: string,
  professionalId: string,
  status: string,
  _note?: string,
): Promise<AdminActionResult> {
  const parsed = adminUpdateProfessionalStatusInputSchema.safeParse({
    professionalId,
    newStatus: status,
  })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }
  if (parsed.data.newStatus === 'needs_changes') {
    return {
      success: false,
      error: 'Use "Revisar detalhes" para solicitar ajustes com itens estruturados.',
    }
  }
  if (parsed.data.newStatus === 'rejected') {
    return {
      success: false,
      error: 'Use "Revisar detalhes" para rejeitar com ajustes estruturados.',
    }
  }

  try {
    const { data: previousProfessional, error: previousProfessionalError } = await supabase
      .from('professionals')
      .select('id, status, first_booking_enabled, updated_at')
      .eq('id', parsed.data.professionalId)
      .maybeSingle()

    if (previousProfessionalError) {
      return { success: false, error: previousProfessionalError.message }
    }
    if (!previousProfessional) {
      return { success: false, error: 'Profissional não encontrado.' }
    }

    const nowIso = new Date().toISOString()
    const updatePayload: Record<string, unknown> = {
      status: parsed.data.newStatus,
      updated_at: nowIso,
    }
    if (parsed.data.newStatus === 'approved') {
      updatePayload.first_booking_enabled = true
      updatePayload.first_booking_gate_note = 'admin_enabled_by_approval'
      updatePayload.first_booking_gate_updated_at = nowIso
    }

    const { error } = await supabase
      .from('professionals')
      .update(updatePayload)
      .eq('id', parsed.data.professionalId)

    if (error) {
      return { success: false, error: error.message }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId,
      action: 'professional.status.updated',
      targetTable: 'professionals',
      targetId: parsed.data.professionalId,
      oldValue: previousProfessional,
      newValue: {
        ...previousProfessional,
        ...updatePayload,
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
