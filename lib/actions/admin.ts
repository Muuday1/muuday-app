'use server'

import * as Sentry from '@sentry/nextjs'
import { revalidatePath, revalidateTag } from 'next/cache'
import {
  updateProfessionalStatusService,
  updateFirstBookingGateService,
  toggleReviewVisibilityService,
  deleteReviewService,
  reviewProfessionalDecisionService,
  loadAdminDashboardDataService,
  restoreLatestReviewAdjustmentsService,
  listReviewsForModerationService,
  moderateReviewService,
  batchModerateReviewsService,
} from '@/lib/admin/admin-service'
import type { AdminDashboardData } from '@/lib/admin/admin-service'
import {
  type AdminActionResult,
  requireAdmin,
  adminModerateReviewInputSchema,
  adminBatchModerateReviewsInputSchema,
  getFirstValidationError,
} from './admin/shared'
import type { ReviewAdjustmentItemInput } from '@/lib/professional/review-adjustments'
import { AdminAuthError } from '@/lib/admin/auth-helper'
import type { ReviewModerationStatus } from '@/lib/admin/review-moderation-types'

export type { AdminDashboardData } from '@/lib/admin/admin-service'
export type { AdminActionResult } from './admin/shared'

export async function adminUpdateProfessionalStatus(
  professionalId: string,
  newStatus: string,
): Promise<AdminActionResult> {
  try {
    const { supabase, userId } = await requireAdmin()
    const result = await updateProfessionalStatusService(supabase, userId, professionalId, newStatus)
    if (result.success) {
      revalidatePath('/admin')
      revalidatePath('/dashboard')
      revalidateTag('public-profiles', {})
    }
    return result
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'admin_update_professional_status' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

export async function adminUpdateFirstBookingGate(
  professionalId: string,
  enabled: boolean,
): Promise<AdminActionResult> {
  try {
    const { supabase, userId } = await requireAdmin()
    const result = await updateFirstBookingGateService(supabase, userId, professionalId, enabled)
    if (result.success) {
      revalidatePath('/admin')
      revalidatePath('/dashboard')
      revalidateTag('public-profiles', {})
    }
    return result
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'admin_update_first_booking_gate' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

export async function adminToggleReviewVisibility(
  reviewId: string,
  visible: boolean,
): Promise<AdminActionResult> {
  try {
    const { supabase, userId } = await requireAdmin()
    const result = await toggleReviewVisibilityService(supabase, userId, reviewId, visible)
    if (result.success) {
      revalidatePath('/admin')
      revalidateTag('public-profiles', {})
    }
    return result
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'admin_toggle_review_visibility' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

export async function adminDeleteReview(reviewId: string): Promise<AdminActionResult> {
  try {
    const { supabase, userId } = await requireAdmin()
    const result = await deleteReviewService(supabase, userId, reviewId)
    if (result.success) {
      revalidatePath('/admin')
      revalidateTag('public-profiles', {})
    }
    return result
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'admin_delete_review' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

export async function adminReviewProfessionalDecision(
  professionalId: string,
  decision: 'approved' | 'rejected' | 'needs_changes',
  notes?: string,
  adjustments?: ReviewAdjustmentItemInput[],
): Promise<AdminActionResult> {
  try {
    const { supabase, userId } = await requireAdmin()
    const result = await reviewProfessionalDecisionService(
      supabase,
      userId,
      professionalId,
      decision,
      notes,
      adjustments,
    )
    if (result.success) {
      revalidatePath('/admin')
      revalidatePath('/dashboard')
      revalidatePath(`/admin/revisao/${professionalId}`)
      revalidateTag('public-profiles', {})
    }
    return result
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'admin_review_professional_decision' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

export async function loadAdminDashboardData(): Promise<{
  success: boolean
  data?: AdminDashboardData
  error?: string
}> {
  try {
    const { supabase } = await requireAdmin()
    return loadAdminDashboardDataService(supabase)
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'load_admin_dashboard_data' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

export async function adminRestoreLatestReviewAdjustments(
  professionalId: string,
): Promise<AdminActionResult> {
  try {
    const { supabase, userId } = await requireAdmin()
    const result = await restoreLatestReviewAdjustmentsService(supabase, userId, professionalId)
    if (result.success) {
      revalidatePath('/admin')
      revalidatePath('/dashboard')
      revalidatePath(`/admin/revisao/${professionalId}`)
    }
    return result
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'admin_restore_latest_review_adjustments' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

// ─── Review Moderation Actions (REVIEW-01) ─────────────────────────────────

export async function adminListReviewsForModeration(filters?: {
  status?: ReviewModerationStatus | 'all'
  sort?: 'newest' | 'lowest_rating' | 'longest_comment' | 'flagged'
  limit?: number
  cursor?: string | null
}) {
  try {
    const { supabase } = await requireAdmin()
    return listReviewsForModerationService(supabase, filters)
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'admin_list_reviews_for_moderation' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

export async function adminModerateReview(
  reviewId: string,
  action: 'approve' | 'reject' | 'flag',
  options?: {
    rejectionReason?: string
    adminNotes?: string
  },
): Promise<AdminActionResult> {
  const parsed = adminModerateReviewInputSchema.safeParse({
    reviewId,
    action,
    rejectionReason: options?.rejectionReason,
    adminNotes: options?.adminNotes,
  })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { supabase, userId } = await requireAdmin()
    const result = await moderateReviewService(supabase, userId, reviewId, action, {
      rejectionReason: parsed.data.rejectionReason,
      adminNotes: parsed.data.adminNotes,
    })
    if (result.success) {
      revalidatePath('/admin')
      revalidatePath('/admin/avaliacoes')
      revalidateTag('public-profiles', {})
    }
    return result
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'admin_moderate_review' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}

export async function adminBatchModerateReviews(
  reviewIds: string[],
  action: 'approve' | 'reject',
  options?: {
    rejectionReason?: string
    adminNotes?: string
  },
): Promise<AdminActionResult> {
  const parsed = adminBatchModerateReviewsInputSchema.safeParse({
    reviewIds,
    action,
    rejectionReason: options?.rejectionReason,
    adminNotes: options?.adminNotes,
  })
  if (!parsed.success) {
    return { success: false, error: getFirstValidationError(parsed.error) }
  }

  try {
    const { supabase, userId } = await requireAdmin()
    const result = await batchModerateReviewsService(supabase, userId, reviewIds, action, {
      rejectionReason: parsed.data.rejectionReason,
      adminNotes: parsed.data.adminNotes,
    })
    if (result.success) {
      revalidatePath('/admin')
      revalidatePath('/admin/avaliacoes')
      revalidateTag('public-profiles', {})
    }
    return result
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { success: false, error: error.message }
    }
    Sentry.captureException(error, { tags: { area: 'admin_batch_moderate_reviews' } })
    return { success: false, error: 'Erro interno. Tente novamente mais tarde.' }
  }
}
