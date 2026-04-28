import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type AdminActionResult,
  adminUpdateProfessionalStatusInputSchema,
  adminUpdateFirstBookingGateInputSchema,
  adminReviewActionInputSchema,
  adminRestoreProfessionalAdjustmentsInputSchema,
  adminProfessionalDecisionInputSchema,
  adminToggleReviewVisibilityInputSchema,
  getFirstValidationError,
} from '../actions/admin/shared'
import { recomputeProfessionalVisibility } from '@/lib/professional/public-visibility'
import {
  sendProfileApprovedEmail,
  sendProfileNeedsChangesEmail,
  sendProfileRejectedEmail,
} from '@/lib/email/resend'
import { emitProfessionalProfileApproved } from '@/lib/email/resend-events'
import type { ReviewAdjustmentItemInput } from '@/lib/professional/review-adjustments'
import { createProfessionalSubscription } from '@/lib/payments/subscription/manager'
import {
  REVIEW_ADJUSTMENT_STAGE_LABELS,
  SUPPORTED_REVIEW_ADJUSTMENT_KEYS,
} from '@/lib/professional/review-adjustments'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

type AdminAuditInsert = {
  adminUserId: string
  action: string
  targetTable: string
  targetId: string
  oldValue?: JsonValue | null
  newValue?: JsonValue | null
  metadata?: JsonValue | null
}

export type AdminAuditWriteResult =
  | { success: true }
  | { success: false; error: string }

const FAIL_ON_AUDIT_ERROR = process.env.ADMIN_AUDIT_FAIL_ON_ERROR === 'true'

function toJsonValue(input: unknown): JsonValue | null {
  if (input === null || input === undefined) return null
  try {
    return JSON.parse(JSON.stringify(input)) as JsonValue
  } catch {
    return null
  }
}

export async function writeAdminAuditLog(
  supabase: SupabaseClient,
  payload: AdminAuditInsert,
): Promise<AdminAuditWriteResult> {
  const { error } = await supabase.from('admin_audit_log').insert({
    admin_user_id: payload.adminUserId,
    action: payload.action,
    target_table: payload.targetTable,
    target_id: payload.targetId,
    old_value: toJsonValue(payload.oldValue),
    new_value: toJsonValue(payload.newValue),
    metadata: toJsonValue(payload.metadata),
  })

  if (!error) return { success: true }

  const message = `Falha ao gravar audit log administrativo: ${error.message}`
  if (FAIL_ON_AUDIT_ERROR) {
    return { success: false, error: message }
  }

  console.error('[admin-audit-log]', message)
  return { success: true }
}

export interface AdminDashboardData {
  stats: {
    totalUsers: number
    totalProfessionals: number
    totalBookings: number
    totalReviews: number
    pendingProfessionals: number
    pendingReviews: number
  }
  professionals: Array<{
    id: string
    public_code?: number | null
    user_id: string
    status: string
    first_booking_enabled: boolean
    first_booking_gate_note?: string | null
    first_booking_gate_updated_at?: string | null
    bio: string
    category: string
    tags: string[]
    languages: string[]
    years_experience: number
    session_price_brl: number
    session_duration_minutes: number
    rating: number
    total_reviews: number
    total_bookings: number
    created_at: string
    admin_review_notes?: string | null
    reviewed_at?: string | null
    profiles: {
      full_name: string
      email: string
      country: string
      timezone: string
      avatar_url?: string | null
    }
  }>
  professionalSpecialties: Record<string, string[]>
  professionalCredentialCounts: Record<string, number>
  professionalMinServicePrice: Record<string, number>
  reviews: Array<{
    id: string
    rating: number
    comment: string
    is_visible: boolean
    created_at: string
    profiles: { full_name: string }
    professionals: { id: string; profiles: { full_name: string } }
  }>
  bookings: Array<{
    id: string
    scheduled_at: string
    status: string
    price_brl: number
    duration_minutes: number
    user_profile: { full_name: string; email: string }
    professional_profile: { full_name: string }
  }>
}

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

export async function toggleReviewVisibilityService(
  supabase: SupabaseClient,
  adminUserId: string,
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
    const { data: previousReview, error: previousReviewError } = await supabase
      .from('reviews')
      .select('id, user_id, professional_id, is_visible, rating')
      .eq('id', parsed.data.reviewId)
      .maybeSingle()

    if (previousReviewError) {
      return { success: false, error: previousReviewError.message }
    }
    if (!previousReview) {
      return { success: false, error: 'Avaliação não encontrada.' }
    }

    const { error } = await supabase
      .from('reviews')
      .update({ is_visible: parsed.data.visible })
      .eq('id', parsed.data.reviewId)

    if (error) {
      return { success: false, error: error.message }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId,
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

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}

export async function deleteReviewService(
  supabase: SupabaseClient,
  adminUserId: string,
  reviewId: string,
): Promise<AdminActionResult> {
  const parsed = adminReviewActionInputSchema.safeParse({ reviewId })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { data: previousReview, error: previousReviewError } = await supabase
      .from('reviews')
      .select('id, user_id, professional_id, is_visible, rating, comment')
      .eq('id', parsed.data.reviewId)
      .maybeSingle()

    if (previousReviewError) {
      return { success: false, error: previousReviewError.message }
    }
    if (!previousReview) {
      return { success: false, error: 'Avaliação não encontrada.' }
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', parsed.data.reviewId)

    if (error) {
      return { success: false, error: error.message }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId,
      action: 'review.deleted',
      targetTable: 'reviews',
      targetId: parsed.data.reviewId,
      oldValue: previousReview,
      newValue: null,
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}

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
            console.error('[admin/reviewDecision] subscription creation failed:', result.error)
          }
        })
        .catch((err) => {
          console.error('[admin/reviewDecision] subscription creation exception:', err)
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
      console.error('[admin/reviewDecision] professional owner query error:', ownerError.message)
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

export async function loadAdminDashboardDataService(
  supabase: SupabaseClient,
): Promise<{ success: boolean; data?: AdminDashboardData; error?: string }> {
  try {
    const [usersRes, prosRes, bookingsRes, reviewsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('professionals').select('id, status'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id, is_visible'),
    ])

    if (usersRes.error) console.error('[admin/dashboard] users query error:', usersRes.error.message)
    if (prosRes.error) console.error('[admin/dashboard] professionals query error:', prosRes.error.message)
    if (bookingsRes.error) console.error('[admin/dashboard] bookings query error:', bookingsRes.error.message)
    if (reviewsRes.error) console.error('[admin/dashboard] reviews query error:', reviewsRes.error.message)

    const allPros = prosRes.data || []
    const allRevs = reviewsRes.data || []

    const stats = {
      totalUsers: usersRes.count || 0,
      totalProfessionals: allPros.length,
      totalBookings: bookingsRes.count || 0,
      totalReviews: allRevs.length,
      pendingProfessionals: allPros.filter(p => p.status === 'pending_review').length,
      pendingReviews: allRevs.filter(r => !r.is_visible).length,
    }

    const { data: professionalsData, error: professionalsError } = await supabase
      .from('professionals')
      .select('*, profiles!professionals_user_id_fkey(*)')
      .order('created_at', { ascending: false })

    if (professionalsError) {
      console.error('[admin/dashboard] professionals detail query error:', professionalsError.message)
    }

    const resolvedProfessionals = (professionalsData as unknown as AdminDashboardData['professionals']) || []
    const professionalIds = resolvedProfessionals.map(p => p.id).filter(Boolean)

    let professionalSpecialties: Record<string, string[]> = {}
    let professionalCredentialCounts: Record<string, number> = {}
    let professionalMinServicePrice: Record<string, number> = {}

    if (professionalIds.length > 0) {
      const { data: credentialRows, error: credentialError } = await supabase
        .from('professional_credentials')
        .select('professional_id')
        .in('professional_id', professionalIds)

      if (credentialError) {
        console.error('[admin/dashboard] credentials query error:', credentialError.message)
      }

      professionalCredentialCounts = (credentialRows || []).reduce((acc, row: any) => {
        const pid = String(row.professional_id || '').trim()
        if (!pid) return acc
        acc[pid] = (acc[pid] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const { data: serviceRows, error: serviceError } = await supabase
        .from('professional_services')
        .select('professional_id,price_brl,is_active')
        .in('professional_id', professionalIds)
        .eq('is_active', true)

      if (serviceError) {
        console.error('[admin/dashboard] services query error:', serviceError.message)
      }

      professionalMinServicePrice = (serviceRows || []).reduce((acc, row: any) => {
        const pid = String(row.professional_id || '').trim()
        const price = Number(row.price_brl || 0)
        if (!pid || !Number.isFinite(price) || price <= 0) return acc
        if (!(pid in acc) || price < acc[pid]!) {
          acc[pid] = price
        }
        return acc
      }, {} as Record<string, number>)

      const { data: linkRows, error: linkError } = await supabase
        .from('professional_specialties')
        .select('professional_id,specialty_id')
        .in('professional_id', professionalIds)

      if (linkError) {
        console.error('[admin/dashboard] specialties link query error:', linkError.message)
      }

      const specialtyIds = Array.from(
        new Set((linkRows || []).map((row: any) => String(row.specialty_id || '').trim()).filter(Boolean)),
      )

      if (specialtyIds.length > 0) {
        const { data: specialtyRows, error: specialtyError } = await supabase
          .from('specialties')
          .select('id,name_pt')
          .in('id', specialtyIds)
          .eq('is_active', true)

        if (specialtyError) {
          console.error('[admin/dashboard] specialties query error:', specialtyError.message)
        }

        const specialtyById = new Map(
          (specialtyRows || []).map((row: any) => [String(row.id), String(row.name_pt || '').trim()]),
        )

        const mapped = (linkRows || []).reduce((acc, row: any) => {
          const pid = String(row.professional_id || '').trim()
          const name = specialtyById.get(String(row.specialty_id || '').trim()) || ''
          if (!pid || !name) return acc
          if (!acc[pid]) acc[pid] = []
          if (!acc[pid].includes(name)) {
            acc[pid].push(name)
          }
          return acc
        }, {} as Record<string, string[]>)

        Object.keys(mapped).forEach(pid => {
          mapped[pid].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
        })

        professionalSpecialties = mapped
      }
    }

    const { data: reviewsData, error: reviewsDataError } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_user_id_fkey(full_name), professionals!reviews_professional_id_fkey(id, profiles!professionals_user_id_fkey(full_name))')
      .order('created_at', { ascending: false })

    if (reviewsDataError) {
      console.error('[admin/dashboard] reviews detail query error:', reviewsDataError.message)
    }

    const { data: bookingsData, error: bookingsDataError } = await supabase
      .from('bookings')
      .select('id, scheduled_at, status, price_brl, duration_minutes, profiles!bookings_user_id_fkey(full_name, email), professionals!bookings_professional_id_fkey(profiles!professionals_user_id_fkey(full_name))')
      .order('scheduled_at', { ascending: false })
      .limit(50)

    if (bookingsDataError) {
      console.error('[admin/dashboard] bookings detail query error:', bookingsDataError.message)
    }

    const mappedBookings = (bookingsData || []).map((b: Record<string, unknown>) => {
      const pro = b.professionals as Record<string, unknown> | null
      return {
        id: b.id as string,
        scheduled_at: b.scheduled_at as string,
        status: b.status as string,
        price_brl: b.price_brl as number,
        duration_minutes: b.duration_minutes as number,
        user_profile: (b.profiles as { full_name: string; email: string }) || { full_name: '-', email: '' },
        professional_profile: (pro?.profiles as { full_name: string }) || { full_name: '-' },
      }
    })

    return {
      success: true,
      data: {
        stats,
        professionals: resolvedProfessionals,
        professionalSpecialties,
        professionalCredentialCounts,
        professionalMinServicePrice,
        reviews: (reviewsData as unknown as AdminDashboardData['reviews']) || [],
        bookings: mappedBookings,
      },
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}

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
