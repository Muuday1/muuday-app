'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  adminModerateReview,
  adminBatchModerateReviews,
  adminListReviewsForModeration,
} from '@/lib/actions/admin'
import type { ReviewForModeration, ReviewModerationStatus } from '@/lib/admin/review-moderation-types'

export interface UseReviewModerationProps {
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

export function useReviewModeration({
  initialReviews,
  initialStats,
  initialFilters,
}: UseReviewModerationProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [stats, setStats] = useState(initialStats)
  const [statusFilter, setStatusFilter] = useState<ReviewModerationStatus | 'all'>(initialFilters.status)
  const [sort, setSort] = useState(initialFilters.sort)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [rejectModalReview, setRejectModalReview] = useState<ReviewForModeration | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [rejectNote, setRejectNote] = useState('')
  const [isPending, startTransition] = useTransition()

  const filteredReviews = useMemo(() => {
    let list = reviews
    if (statusFilter !== 'all') {
      list = list.filter(r => r.moderation_status === statusFilter)
    }
    return list
  }, [reviews, statusFilter])

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  function updateLocalReview(reviewId: string, newStatus: ReviewModerationStatus) {
    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, moderation_status: newStatus } : r)),
    )
    setStats(prev => {
      const old = reviews.find(r => r.id === reviewId)?.moderation_status
      const next = { ...prev }
      if (old && old !== 'flagged') next[old] = Math.max(0, next[old] - 1)
      if (newStatus !== 'flagged') next[newStatus] = (next[newStatus] || 0) + 1
      return next
    })
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(reviewId)
      return next
    })
  }

  async function handleApprove(reviewId: string) {
    setLoadingId(reviewId)
    const result = await adminModerateReview(reviewId, 'approve')
    if (result.success) {
      updateLocalReview(reviewId, 'approved')
      showSuccess('Avaliação aprovada!')
    }
    setLoadingId(null)
  }

  async function handleReject(reviewId: string, reason: string, note: string) {
    setLoadingId(reviewId)
    const result = await adminModerateReview(reviewId, 'reject', {
      rejectionReason: reason,
      adminNotes: note || undefined,
    })
    if (result.success) {
      updateLocalReview(reviewId, 'rejected')
      showSuccess('Avaliação rejeitada.')
    }
    setLoadingId(null)
    setRejectModalReview(null)
    setRejectReason('')
    setRejectNote('')
  }

  async function handleFlag(reviewId: string) {
    setLoadingId(reviewId)
    const result = await adminModerateReview(reviewId, 'flag')
    if (result.success) {
      updateLocalReview(reviewId, 'flagged')
      showSuccess('Avaliação sinalizada.')
    }
    setLoadingId(null)
  }

  async function handleBatchApprove() {
    if (selectedIds.size === 0) return
    setBatchLoading(true)
    const result = await adminBatchModerateReviews(Array.from(selectedIds), 'approve')
    if (result.success) {
      const ids = Array.from(selectedIds)
      setReviews(prev => prev.map(r => (ids.includes(r.id) ? { ...r, moderation_status: 'approved' as const } : r)))
      setSelectedIds(new Set())
      showSuccess(`${ids.length} avaliação(ões) aprovada(s)!`)
    }
    setBatchLoading(false)
  }

  const batchReviewStub: ReviewForModeration = {
    id: 'batch',
    rating: 0,
    comment: null,
    moderation_status: 'pending',
    is_visible: false,
    created_at: '',
    flag_reasons: [],
    reviewer: { id: '', full_name: '', email: '', created_at: '', review_count: 0, approved_count: 0, rejected_count: 0 },
    professional: { id: '', full_name: '', total_reviews: 0, avg_rating: 0 },
    booking: null,
  } as ReviewForModeration

  async function handleBatchReject() {
    if (selectedIds.size === 0) return
    if (!rejectReason) {
      setRejectModalReview(batchReviewStub)
      return
    }
    setBatchLoading(true)
    const result = await adminBatchModerateReviews(Array.from(selectedIds), 'reject', {
      rejectionReason: rejectReason,
      adminNotes: rejectNote || undefined,
    })
    if (result.success) {
      const ids = Array.from(selectedIds)
      setReviews(prev => prev.map(r => (ids.includes(r.id) ? { ...r, moderation_status: 'rejected' as const } : r)))
      setSelectedIds(new Set())
      setRejectModalReview(null)
      setRejectReason('')
      setRejectNote('')
      showSuccess(`${ids.length} avaliação(ões) rejeitada(s).`)
    }
    setBatchLoading(false)
  }

  function toggleSelect(reviewId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(reviewId)) next.delete(reviewId)
      else next.add(reviewId)
      return next
    })
  }

  function toggleSelectAll() {
    const visibleIds = filteredReviews.map(r => r.id)
    const allSelected = visibleIds.every(id => selectedIds.has(id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        visibleIds.forEach(id => next.delete(id))
      } else {
        visibleIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  function reloadWithFilters(newStatus: ReviewModerationStatus | 'all', newSort: typeof sort) {
    startTransition(async () => {
      const result = await adminListReviewsForModeration({ status: newStatus, sort: newSort, limit: 50 })
      if (result.success && result.data) {
        setReviews(result.data)
        setStatusFilter(newStatus)
        setSort(newSort)
        setSelectedIds(new Set())
      }
    })
  }

  function openRejectModal(review: ReviewForModeration) {
    setRejectModalReview(review)
    setRejectReason('')
    setRejectNote('')
  }

  function closeRejectModal() {
    setRejectModalReview(null)
    setRejectReason('')
    setRejectNote('')
  }

  const selectedCount = selectedIds.size

  return {
    reviews,
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
  }
}
