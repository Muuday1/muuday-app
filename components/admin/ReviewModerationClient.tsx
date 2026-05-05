'use client'

import Link from 'next/link'
import { Eye, CheckCircle } from 'lucide-react'
import type { ReviewForModeration, ReviewModerationStatus } from '@/lib/admin/review-moderation-types'
import { useReviewModeration } from './review-moderation/hooks/use-review-moderation'
import { ReviewModerationStats } from './review-moderation/ReviewModerationStats'
import { ReviewModerationFilters } from './review-moderation/ReviewModerationFilters'
import { ReviewModerationBatchActions } from './review-moderation/ReviewModerationBatchActions'
import { ReviewModerationList } from './review-moderation/ReviewModerationList'
import { RejectModal } from './review-moderation/RejectModal'

interface ReviewModerationClientProps {
  initialReviews: ReviewForModeration[]
  initialStats: {
    pending: number
    approved: number
    rejected: number
    flagged: number
  }
  initialFilters: {
    status: ReviewModerationStatus | 'all'
    sort: 'newest' | 'lowest_rating' | 'longest_comment' | 'flagged'
  }
}

export function ReviewModerationClient({
  initialReviews,
  initialStats,
  initialFilters,
}: ReviewModerationClientProps) {
  const {
    filteredReviews,
    stats,
    statusFilter,
    sort,
    selectedIds,
    selectedCount,
    loadingId,
    batchLoading,
    successMsg,
    rejectModalReview,
    rejectReason,
    rejectNote,
    isPending,
    setRejectReason,
    setRejectNote,
    setSelectedIds,
    handleApprove,
    handleReject,
    handleFlag,
    handleBatchApprove,
    handleBatchReject,
    toggleSelect,
    toggleSelectAll,
    reloadWithFilters,
    openRejectModal,
    closeRejectModal,
  } = useReviewModeration({ initialReviews, initialStats, initialFilters })

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Moderação de Avaliações</h1>
          <p className="text-sm text-slate-500 mt-1">Aprove, rejeite ou sinalize avaliações com contexto completo</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50/70 transition-all"
        >
          <Eye className="w-4 h-4" /> Painel
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      <ReviewModerationStats
        pending={stats.pending}
        approved={stats.approved}
        rejected={stats.rejected}
        flagged={stats.flagged}
      />

      <ReviewModerationFilters
        statusFilter={statusFilter}
        sort={sort}
        isPending={isPending}
        onFilterChange={reloadWithFilters}
      />

      <ReviewModerationBatchActions
        selectedCount={selectedCount}
        batchLoading={batchLoading}
        onBatchApprove={handleBatchApprove}
        onBatchReject={() => openRejectModal({ id: 'batch', rating: 0, comment: null, moderation_status: 'pending', is_visible: false, created_at: '', flag_reasons: [], reviewer: { id: '', full_name: '', email: '', created_at: '', review_count: 0, approved_count: 0, rejected_count: 0 }, professional: { id: '', full_name: '', total_reviews: 0, avg_rating: 0 }, booking: null } as ReviewForModeration)}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <ReviewModerationList
        reviews={filteredReviews}
        selectedIds={selectedIds}
        loadingId={loadingId}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onApprove={handleApprove}
        onReject={openRejectModal}
        onFlag={handleFlag}
      />

      <RejectModal
        review={rejectModalReview}
        rejectReason={rejectReason}
        rejectNote={rejectNote}
        loadingId={loadingId}
        onReasonChange={setRejectReason}
        onNoteChange={setRejectNote}
        onConfirm={() => {
          if (rejectModalReview?.id === 'batch') {
            handleBatchReject()
          } else if (rejectModalReview) {
            handleReject(rejectModalReview.id, rejectReason, rejectNote)
          }
        }}
        onCancel={closeRejectModal}
      />
    </div>
  )
}
