'use client'

import { Star, MessageSquare, Calendar, AlertTriangle, CheckCircle, XCircle, Flag } from 'lucide-react'
import type { ReviewForModeration, ReviewModerationStatus } from '@/lib/admin/review-moderation-types'

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

function StatusBadge({ status }: { status: ReviewModerationStatus }) {
  const config = {
    approved: { class: 'bg-green-50 text-green-700', label: 'Aprovada' },
    rejected: { class: 'bg-red-50 text-red-700', label: 'Rejeitada' },
    flagged: { class: 'bg-orange-50 text-orange-700', label: 'Sinalizada' },
    pending: { class: 'bg-amber-50 text-amber-700', label: 'Pendente' },
  }
  const c = config[status]
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.class}`}>{c.label}</span>
}

interface ReviewModerationListProps {
  reviews: ReviewForModeration[]
  selectedIds: Set<string>
  loadingId: string | null
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onApprove: (id: string) => void
  onReject: (review: ReviewForModeration) => void
  onFlag: (id: string) => void
}

export function ReviewModerationList({
  reviews,
  selectedIds,
  loadingId,
  onToggleSelect,
  onToggleSelectAll,
  onApprove,
  onReject,
  onFlag,
}: ReviewModerationListProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200/80 p-12 text-center">
        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">Nenhuma avaliação encontrada com este filtro.</p>
      </div>
    )
  }

  const allSelected = reviews.length > 0 && reviews.every(r => selectedIds.has(r.id))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          className="w-4 h-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/30"
        />
        <span className="text-xs text-slate-500">Selecionar todas visíveis</span>
      </div>

      {reviews.map(review => (
        <ReviewCard
          key={review.id}
          review={review}
          isSelected={selectedIds.has(review.id)}
          isLoading={loadingId === review.id}
          onToggleSelect={() => onToggleSelect(review.id)}
          onApprove={() => onApprove(review.id)}
          onReject={() => onReject(review)}
          onFlag={() => onFlag(review.id)}
        />
      ))}
    </div>
  )
}

interface ReviewCardProps {
  review: ReviewForModeration
  isSelected: boolean
  isLoading: boolean
  onToggleSelect: () => void
  onApprove: () => void
  onReject: () => void
  onFlag: () => void
}

function ReviewCard({ review, isSelected, isLoading, onToggleSelect, onApprove, onReject, onFlag }: ReviewCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border transition-all ${
        isSelected ? 'border-[#9FE870] ring-1 ring-[#9FE870]/20' : 'border-slate-200/80'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
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
                <StatusBadge status={review.moderation_status} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {review.moderation_status !== 'approved' && (
              <ActionButton
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                label={isLoading ? '...' : 'Aprovar'}
                color="green"
                onClick={onApprove}
                disabled={isLoading}
              />
            )}
            {review.moderation_status !== 'rejected' && (
              <ActionButton
                icon={<XCircle className="w-3.5 h-3.5" />}
                label={isLoading ? '...' : 'Rejeitar'}
                color="red"
                onClick={onReject}
                disabled={isLoading}
              />
            )}
            {review.moderation_status !== 'flagged' && review.moderation_status !== 'rejected' && (
              <ActionButton
                icon={<Flag className="w-3.5 h-3.5" />}
                label={isLoading ? '...' : 'Sinalizar'}
                color="orange"
                onClick={onFlag}
                disabled={isLoading}
              />
            )}
            {review.moderation_status === 'approved' && (
              <ActionButton
                icon={<Flag className="w-3.5 h-3.5" />}
                label={isLoading ? '...' : 'Re-sinalizar'}
                color="slate"
                onClick={onFlag}
                disabled={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  color,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  color: string
  onClick: () => void
  disabled: boolean
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    slate: 'bg-slate-500 hover:bg-slate-600',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 ${colorMap[color]} text-white rounded-md text-xs font-medium transition-all disabled:opacity-50`}
    >
      {icon}
      {label}
    </button>
  )
}
