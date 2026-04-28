'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  adminModerateReview,
  adminBatchModerateReviews,
  adminListReviewsForModeration,
} from '@/lib/actions/admin'
import type { ReviewForModeration, ReviewModerationStatus } from '@/lib/admin/review-moderation-types'
import { REVIEW_REJECTION_REASONS } from '@/lib/admin/review-moderation-types'
import {
  Star,
  CheckCircle,
  XCircle,
  Flag,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Filter,
  ChevronDown,
  Eye,
  Clock,
  Users,
  UserCheck,
  Ban,
  ShieldAlert,
  Loader2,
} from 'lucide-react'

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

const statusFilters: { key: ReviewModerationStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'Todas', color: 'bg-slate-100 text-slate-700' },
  { key: 'pending', label: 'Pendentes', color: 'bg-amber-50 text-amber-700' },
  { key: 'flagged', label: 'Sinalizadas', color: 'bg-orange-50 text-orange-700' },
  { key: 'approved', label: 'Aprovadas', color: 'bg-green-50 text-green-700' },
  { key: 'rejected', label: 'Rejeitadas', color: 'bg-red-50 text-red-700' },
]

const sortOptions: { key: ReviewModerationClientProps['initialFilters']['sort']; label: string }[] = [
  { key: 'newest', label: 'Mais recentes' },
  { key: 'lowest_rating', label: 'Menor nota' },
  { key: 'longest_comment', label: 'Maior comentário' },
  { key: 'flagged', label: 'Sinalizadas primeiro' },
]

const flagLabels: Record<string, string> = {
  profanity: 'Linguagem inadequada',
  suspected_fake: 'Suspeita de falsa',
  conflicts_with_outcome: 'Conflita com sessão',
  repeated_rejections: 'Rejeições repetidas',
}

const flagColors: Record<string, string> = {
  profanity: 'bg-red-50 text-red-700 border-red-200',
  suspected_fake: 'bg-orange-50 text-orange-700 border-orange-200',
  conflicts_with_outcome: 'bg-amber-50 text-amber-700 border-amber-200',
  repeated_rejections: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function ReviewModerationClient({
  initialReviews,
  initialStats,
  initialFilters,
}: ReviewModerationClientProps) {
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

  async function handleBatchReject() {
    if (selectedIds.size === 0) return
    if (!rejectReason) {
      setRejectModalReview({ id: 'batch', rating: 0, comment: null, moderation_status: 'pending', is_visible: false, created_at: '', flag_reasons: [], reviewer: { id: '', full_name: '', email: '', created_at: '', review_count: 0, approved_count: 0, rejected_count: 0 }, professional: { id: '', full_name: '', total_reviews: 0, avg_rating: 0 }, booking: null } as any)
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

  const selectedCount = selectedIds.size

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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Clock className="w-5 h-5" />} label="Pendentes" value={stats.pending} color="amber" />
        <StatCard icon={<UserCheck className="w-5 h-5" />} label="Aprovadas" value={stats.approved} color="green" />
        <StatCard icon={<Ban className="w-5 h-5" />} label="Rejeitadas" value={stats.rejected} color="red" />
        <StatCard icon={<ShieldAlert className="w-5 h-5" />} label="Sinalizadas" value={stats.flagged} color="orange" />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => reloadWithFilters(f.key, sort)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === f.key
                  ? 'bg-[#9FE870] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#9FE870]/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={sort}
            onChange={e => reloadWithFilters(statusFilter, e.target.value as any)}
            disabled={isPending}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
          >
            {sortOptions.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          {isPending && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
      </div>

      {/* Batch actions */}
      {selectedCount > 0 && (
        <div className="mb-4 p-3 bg-[#9FE870]/8 border border-[#9FE870]/30 rounded-md flex items-center justify-between">
          <span className="text-sm font-medium text-[#3d6b1f]">
            {selectedCount} avaliação(ões) selecionada(s)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchApprove}
              disabled={batchLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Aprovar selecionadas
            </button>
            <button
              onClick={() => setRejectModalReview({ id: 'batch', rating: 0, comment: null, moderation_status: 'pending', is_visible: false, created_at: '', flag_reasons: [], reviewer: { id: '', full_name: '', email: '', created_at: '', review_count: 0, approved_count: 0, rejected_count: 0 }, professional: { id: '', full_name: '', total_reviews: 0, avg_rating: 0 }, booking: null } as any)}
              disabled={batchLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Rejeitar selecionadas
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-500 hover:text-slate-700 px-2"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200/80 p-12 text-center">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhuma avaliação encontrada com este filtro.</p>
          </div>
        ) : (
          <>
            {/* Select all row */}
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={filteredReviews.length > 0 && filteredReviews.every(r => selectedIds.has(r.id))}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/30"
              />
              <span className="text-xs text-slate-500">Selecionar todas visíveis</span>
            </div>

            {filteredReviews.map(review => (
              <div
                key={review.id}
                className={`bg-white rounded-lg border transition-all ${
                  selectedIds.has(review.id) ? 'border-[#9FE870] ring-1 ring-[#9FE870]/20' : 'border-slate-200/80'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(review.id)}
                        onChange={() => toggleSelect(review.id)}
                        className="w-4 h-4 mt-1 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/30"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Reviewer → Professional */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                          <span className="text-sm font-medium text-slate-900">{review.reviewer.full_name}</span>
                          <span className="text-xs text-slate-400">
                            {review.reviewer.review_count} avaliações ({review.reviewer.approved_count} aprovadas)
                          </span>
                          <span className="text-slate-300">→</span>
                          <span className="text-sm text-slate-600">{review.professional.full_name}</span>
                          <span className="text-xs text-slate-400">
                            ★ {review.professional.avg_rating.toFixed(1)} ({review.professional.total_reviews})
                          </span>
                        </div>

                        {/* Stars + Date */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(review.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {review.booking && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(review.booking.scheduled_at).toLocaleDateString('pt-BR')} · {review.booking.duration_minutes}min ·
                              <span className={`text-xs ${
                                review.booking.status === 'no_show' ? 'text-red-500 font-medium' : 'text-slate-400'
                              }`}>
                                {review.booking.status === 'completed' ? 'Concluído' : review.booking.status === 'no_show' ? 'Não compareceu' : review.booking.status}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Comment */}
                        {review.comment && (
                          <p className="text-sm text-slate-700 bg-slate-50/70 rounded-md p-3 mb-3">
                            &ldquo;{review.comment}&rdquo;
                          </p>
                        )}

                        {/* Auto-flags */}
                        {review.flag_reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {review.flag_reasons.map(flag => (
                              <span
                                key={flag}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${flagColors[flag] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                {flagLabels[flag] || flag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Status badge */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            review.moderation_status === 'approved' ? 'bg-green-50 text-green-700' :
                            review.moderation_status === 'rejected' ? 'bg-red-50 text-red-700' :
                            review.moderation_status === 'flagged' ? 'bg-orange-50 text-orange-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {review.moderation_status === 'approved' ? 'Aprovada' :
                             review.moderation_status === 'rejected' ? 'Rejeitada' :
                             review.moderation_status === 'flagged' ? 'Sinalizada' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {review.moderation_status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          disabled={loadingId === review.id}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {loadingId === review.id ? '...' : 'Aprovar'}
                        </button>
                      )}
                      {review.moderation_status !== 'rejected' && (
                        <button
                          onClick={() => {
                            setRejectModalReview(review)
                            setRejectReason('')
                            setRejectNote('')
                          }}
                          disabled={loadingId === review.id}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {loadingId === review.id ? '...' : 'Rejeitar'}
                        </button>
                      )}
                      {review.moderation_status !== 'flagged' && review.moderation_status !== 'rejected' && (
                        <button
                          onClick={() => handleFlag(review.id)}
                          disabled={loadingId === review.id}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          {loadingId === review.id ? '...' : 'Sinalizar'}
                        </button>
                      )}
                      {review.moderation_status === 'approved' && (
                        <button
                          onClick={() => handleFlag(review.id)}
                          disabled={loadingId === review.id}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white rounded-md text-xs font-medium transition-all disabled:opacity-50"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          {loadingId === review.id ? '...' : 'Re-sinalizar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="font-semibold text-slate-900 mb-1">
              {rejectModalReview.id === 'batch' ? 'Rejeitar avaliações selecionadas' : 'Rejeitar avaliação'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Selecione o motivo da rejeição. O usuário poderá editar e reenviar (exceto "Suspeita de falsa").
            </p>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {REVIEW_REJECTION_REASONS.map(reason => (
                <label
                  key={reason.key}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                    rejectReason === reason.key
                      ? 'border-[#9FE870] bg-[#9FE870]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason.key}
                    checked={rejectReason === reason.key}
                    onChange={e => setRejectReason(e.target.value)}
                    className="mt-0.5 w-4 h-4 text-[#9FE870] focus:ring-[#9FE870]/30"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">{reason.label}</span>
                    <span className="text-xs text-slate-400 block">
                      {reason.canEdit ? 'Usuário pode editar e reenviar' : 'Não permite reenvio'}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nota interna (opcional)</label>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Observações para o time de moderação..."
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setRejectModalReview(null)
                  setRejectReason('')
                  setRejectNote('')
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (rejectModalReview.id === 'batch') {
                    handleBatchReject()
                  } else {
                    handleReject(rejectModalReview.id, rejectReason, rejectNote)
                  }
                }}
                disabled={!rejectReason || loadingId === rejectModalReview.id}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-all disabled:opacity-50"
              >
                {loadingId === rejectModalReview.id ? 'Processando...' : 'Confirmar rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200/80 p-5">
      <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}
