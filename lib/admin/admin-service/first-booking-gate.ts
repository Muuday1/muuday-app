import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type AdminActionResult,
  adminUpdateFirstBookingGateInputSchema,
  getFirstValidationError,
} from '@/lib/actions/admin/shared'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'
import { writeAdminAuditLog } from './audit'

export async function updateFirstBookingGateService(
  supabase: SupabaseClient,
  adminUserId: string,
  professionalId: string,
  enabled: boolean,
  _note?: string,
): Promise<AdminActionResult> {
  const parsed = adminUpdateFirstBookingGateInputSchema.safeParse({
    professionalId,
    enabled,
  })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
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
      return { success: false, error: 'Profissional não encontrado.' }
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
      adminUserId,
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

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}
