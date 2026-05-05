import * as Sentry from '@sentry/nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type AdminActionResult,
  adminReviewActionInputSchema,
  adminToggleReviewVisibilityInputSchema,
  getFirstValidationError,
} from '@/lib/actions/admin/shared'
import {
  REVIEW_REJECTION_REASONS,
  type ReviewRejectionReason,
  type ReviewModerationStatus,
  type ReviewForModeration,
} from '@/lib/admin/review-moderation-types'
import { writeAdminAuditLog, toJsonValue } from './audit'

export {
  REVIEW_REJECTION_REASONS,
  type ReviewRejectionReason,
  type ReviewModerationStatus,
  type ReviewForModeration,
}

// Simple profanity list (PT-BR + EN) — expand via config or external service as needed
const PROFANITY_WORDS = new Set([
  'merda','porra','caralho','puta','bosta','cu','pau','viado','fdp','filho da puta',
  'desgraçado','arrombado','buceta','pinto','rola','boiola','viadinho','cretino',
  'idiota','imbecil','retardado','cuzão','fuck','shit','bitch','asshole','cunt',
  'dick','cock','motherfucker','bastard','damn',
])

function computeAutoFlags(review: {
  comment: string | null
  rating: number
  booking_status?: string | null
  reviewer_created_at?: string
  reviewer_review_count?: number
}): string[] {
  const flags: string[] = []
  const comment = (review.comment || '').toLowerCase()

  // Profanity filter
  const words = comment.split(/\s+/)
  if (words.some(w => PROFANITY_WORDS.has(w.replace(/[^a-zAç-ú]/g, '')))) {
    flags.push('profanity')
  }

  // Conflicts with session outcome: no-show + positive rating
  if (review.booking_status === 'no_show' && review.rating >= 4) {
    flags.push('conflicts_with_outcome')
  }

  // Suspected fake: very short/generic + new account
  const isGeneric = comment.length > 0 && comment.length < 15 && /^[a-zAç-ú\s]+$/.test(comment)
  const isNewAccount = review.reviewer_created_at
    ? Date.now() - new Date(review.reviewer_created_at).getTime() < 7 * 24 * 60 * 60 * 1000
    : false
  if (isGeneric && isNewAccount && (review.reviewer_review_count || 0) <= 1) {
    flags.push('suspected_fake')
  }

  return flags
}

export async function listReviewsForModerationService(
  supabase: SupabaseClient,
  filters: {
    status?: ReviewModerationStatus | 'all'
    sort?: 'newest' | 'lowest_rating' | 'longest_comment' | 'flagged'
    limit?: number
    cursor?: string | null
  } = {},
): Promise<{ success: boolean; data?: ReviewForModeration[]; error?: string }> {
  try {
    const limit = Math.min(Math.max(filters.limit || 50, 1), 200)
    let query = supabase
      .from('reviews')
      .select(
        `id, rating, comment, moderation_status, is_visible, created_at, flag_reasons,
         booking_id, professional_id,
         profiles!reviews_user_id_fkey(id, full_name, email, created_at),
         professionals!reviews_professional_id_fkey(id, rating, total_reviews, profiles!professionals_user_id_fkey(full_name))`,
        { count: 'exact' },
      )

    if (filters.status && filters.status !== 'all') {
      query = query.eq('moderation_status', filters.status)
    }

    // Sorting
    const sort = filters.sort || 'newest'
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sort === 'lowest_rating') {
      query = query.order('rating', { ascending: true })
    } else if (sort === 'longest_comment') {
      // Supabase doesn't support length() in order; we'll sort in-memory
      query = query.order('created_at', { ascending: false })
    }

    query = query.limit(limit)

    if (filters.cursor) {
      query = query.lt('created_at', filters.cursor)
    }

    const { data: rawRows, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    type RawModerationRow = {
      id: string
      booking_id: string
      profiles?: { id: string; full_name?: string; email?: string; created_at?: string } | null
      professionals?: { id: string; rating?: number; total_reviews?: number; profiles?: { full_name?: string } | null } | null
      comment: string
      rating: number
      moderation_status: string
      is_visible: boolean
      created_at: string
      flag_reasons: string[] | null
    }

    const rows = (rawRows || []) as unknown as RawModerationRow[]

    const reviewIds = rows.map((r) => r.id).filter(Boolean)

    // Batch load booking statuses for conflict detection
    const bookingIds = rows.map((r) => r.booking_id).filter(Boolean)
    let bookingsMap = new Map<string, { status: string; scheduled_at: string; duration_minutes: number }>()
    if (bookingIds.length > 0) {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, status, scheduled_at, duration_minutes')
        .in('id', bookingIds)
      for (const b of bookingsData || []) {
        bookingsMap.set(b.id, b)
      }
    }

    // Batch load reviewer review counts
    const reviewerIds = Array.from(new Set(rows.map((r) => r.profiles?.id).filter(Boolean)))
    let reviewerStatsMap = new Map<string, { review_count: number; approved_count: number; rejected_count: number }>()
    if (reviewerIds.length > 0) {
      const { data: statsData } = await supabase
        .from('reviews')
        .select('user_id, moderation_status')
        .in('user_id', reviewerIds)
      for (const row of statsData || []) {
        const existing = reviewerStatsMap.get(row.user_id) || { review_count: 0, approved_count: 0, rejected_count: 0 }
        existing.review_count++
        if (row.moderation_status === 'approved') existing.approved_count++
        if (row.moderation_status === 'rejected') existing.rejected_count++
        reviewerStatsMap.set(row.user_id, existing)
      }
    }

    let mapped = rows.map((row) => {
      const profile = (row.profiles || {}) as { id?: string; full_name?: string; email?: string; created_at?: string }
      const pro = (row.professionals || {}) as { id?: string; rating?: number; total_reviews?: number; profiles?: { full_name?: string } | null }
      const proProfile = (pro.profiles || {}) as { full_name?: string }
      const booking = bookingsMap.get(row.booking_id) || null
      const reviewerStats = reviewerStatsMap.get(profile.id || '') || { review_count: 0, approved_count: 0, rejected_count: 0 }

      const autoFlags = computeAutoFlags({
        comment: row.comment,
        rating: row.rating,
        booking_status: booking?.status,
        reviewer_created_at: profile.created_at,
        reviewer_review_count: reviewerStats.review_count,
      })

      // Merge stored flag_reasons with computed auto-flags
      const storedFlags = Array.isArray(row.flag_reasons) ? row.flag_reasons : []
      const allFlags = Array.from(new Set([...storedFlags, ...autoFlags]))

      return {
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        moderation_status: row.moderation_status as ReviewModerationStatus,
        is_visible: row.is_visible,
        created_at: row.created_at,
        flag_reasons: allFlags,
        reviewer: {
          id: profile.id || '',
          full_name: profile.full_name || 'Usuário',
          email: profile.email || '',
          created_at: profile.created_at || '',
          review_count: reviewerStats.review_count,
          approved_count: reviewerStats.approved_count,
          rejected_count: reviewerStats.rejected_count,
        },
        professional: {
          id: pro.id || '',
          full_name: proProfile.full_name || 'Profissional',
          total_reviews: pro.total_reviews || 0,
          avg_rating: pro.rating || 0,
        },
        booking: booking
          ? {
              id: row.booking_id,
              status: booking.status,
              scheduled_at: booking.scheduled_at,
              duration_minutes: booking.duration_minutes,
            }
          : null,
      }
    })

    // In-memory sort for longest_comment
    if (sort === 'longest_comment') {
      mapped = mapped.sort((a: ReviewForModeration, b: ReviewForModeration) => {
        const lenA = (a.comment || '').length
        const lenB = (b.comment || '').length
        return lenB - lenA
      })
    }

    // If sort is flagged, bubble flagged items to top (already sorted by created_at otherwise)
    if (sort === 'flagged') {
      mapped = mapped.sort((a: ReviewForModeration, b: ReviewForModeration) => {
        const aFlagged = a.flag_reasons.length > 0 ? 1 : 0
        const bFlagged = b.flag_reasons.length > 0 ? 1 : 0
        if (aFlagged !== bFlagged) return bFlagged - aFlagged
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }

    return { success: true, data: mapped }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}

export async function moderateReviewService(
  supabase: SupabaseClient,
  adminUserId: string,
  reviewId: string,
  action: 'approve' | 'reject' | 'flag',
  options: {
    rejectionReason?: ReviewRejectionReason
    adminNotes?: string
  } = {},
): Promise<AdminActionResult> {
  try {
    const { data: previousReview, error: previousError } = await supabase
      .from('reviews')
      .select('id, user_id, professional_id, rating, comment, moderation_status, is_visible')
      .eq('id', reviewId)
      .maybeSingle()

    if (previousError) {
      return { success: false, error: previousError.message }
    }
    if (!previousReview) {
      return { success: false, error: 'Avaliação não encontrada.' }
    }

    const nowIso = new Date().toISOString()
    const newStatus: ReviewModerationStatus =
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged'

    const updatePayload: Record<string, unknown> = {
      moderation_status: newStatus,
      is_visible: newStatus === 'approved',
      moderated_by: adminUserId,
      moderated_at: nowIso,
      admin_notes: options.adminNotes || null,
      updated_at: nowIso,
    }

    if (action === 'reject') {
      updatePayload.rejection_reason = options.rejectionReason || 'custom'
    } else {
      updatePayload.rejection_reason = null
    }

    const { error: updateError } = await supabase
      .from('reviews')
      .update(updatePayload)
      .eq('id', reviewId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId,
      action: `review.moderated.${action}`,
      targetTable: 'reviews',
      targetId: reviewId,
      oldValue: previousReview,
      newValue: { ...previousReview, ...updatePayload },
      metadata: toJsonValue({
        action,
        rejectionReason: options.rejectionReason,
        adminNotes: options.adminNotes,
      }),
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }
  }
}

export async function batchModerateReviewsService(
  supabase: SupabaseClient,
  adminUserId: string,
  reviewIds: string[],
  action: 'approve' | 'reject',
  options: {
    rejectionReason?: ReviewRejectionReason
    adminNotes?: string
  } = {},
): Promise<AdminActionResult> {
  if (!reviewIds.length) {
    return { success: false, error: 'Nenhuma avaliação selecionada.' }
  }
  if (reviewIds.length > 100) {
    return { success: false, error: 'Máximo de 100 avaliações por lote.' }
  }

  try {
    const nowIso = new Date().toISOString()
    const newStatus: ReviewModerationStatus = action === 'approve' ? 'approved' : 'rejected'

    const updatePayload: Record<string, unknown> = {
      moderation_status: newStatus,
      is_visible: newStatus === 'approved',
      moderated_by: adminUserId,
      moderated_at: nowIso,
      admin_notes: options.adminNotes || null,
      updated_at: nowIso,
    }

    if (action === 'reject') {
      updatePayload.rejection_reason = options.rejectionReason || 'custom'
    } else {
      updatePayload.rejection_reason = null
    }

    const { error: updateError } = await supabase
      .from('reviews')
      .update(updatePayload)
      .in('id', reviewIds)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    const auditResult = await writeAdminAuditLog(supabase, {
      adminUserId,
      action: `review.moderated.batch_${action}`,
      targetTable: 'reviews',
      targetId: reviewIds[0]!,
      oldValue: { reviewIds, previousStatus: 'varied' },
      newValue: { reviewIds, newStatus, ...updatePayload },
      metadata: toJsonValue({
        batchSize: reviewIds.length,
        action,
        rejectionReason: options.rejectionReason,
        adminNotes: options.adminNotes,
      }),
    })
    if (!auditResult.success) {
      return { success: false, error: auditResult.error }
    }

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
