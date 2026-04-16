import type { SupabaseClient } from '@supabase/supabase-js'
import { PROFESSIONAL_REQUIRED_TERMS, PROFESSIONAL_TERMS_VERSION } from '@/lib/legal/professional-terms'
import type {
  ReviewAdjustmentItem,
  ReviewAdjustmentSeverity,
  ReviewAdjustmentStageId,
} from '@/lib/professional/review-adjustments'

type TermsAcceptanceMap = Record<string, boolean>

export async function loadProfessionalTrackerMeta(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<{
  reviewAdjustments: ReviewAdjustmentItem[]
  termsAcceptanceByKey: TermsAcceptanceMap
}> {
  const [adjustmentsResponse, termAcceptancesResponse] = await Promise.all([
    supabase
      .from('professional_review_adjustments')
      .select('id,stage_id,field_key,message,severity,status,created_at,resolved_at')
      .eq('professional_id', professionalId)
      .in('status', ['open', 'reopened'])
      .order('created_at', { ascending: false }),
    supabase
      .from('professional_term_acceptances')
      .select('term_key,term_version,accepted_at')
      .eq('professional_id', professionalId)
      .eq('term_version', PROFESSIONAL_TERMS_VERSION),
  ])

  const reviewAdjustments = (adjustmentsResponse.data || []).map(row => ({
    id: String(row.id || ''),
    stageId: String(row.stage_id || '') as ReviewAdjustmentStageId,
    fieldKey: String(row.field_key || ''),
    message: String(row.message || ''),
    severity: String(row.severity || 'medium') as ReviewAdjustmentSeverity,
    status: String(row.status || 'open') as ReviewAdjustmentItem['status'],
    createdAt: String(row.created_at || ''),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
  }))

  const acceptedTermKeys = new Set(
    (termAcceptancesResponse.data || [])
      .map(row => String(row.term_key || ''))
      .filter(Boolean),
  )

  const termsAcceptanceByKey = PROFESSIONAL_REQUIRED_TERMS.reduce<TermsAcceptanceMap>((acc, key) => {
    acc[key] = acceptedTermKeys.has(key)
    return acc
  }, {})

  return {
    reviewAdjustments,
    termsAcceptanceByKey,
  }
}
