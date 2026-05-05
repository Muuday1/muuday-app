'use client'

import { Filter, Loader2 } from 'lucide-react'
import type { ReviewModerationStatus } from '@/lib/admin/review-moderation-types'

const statusFilters: { key: ReviewModerationStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'flagged', label: 'Sinalizadas' },
  { key: 'approved', label: 'Aprovadas' },
  { key: 'rejected', label: 'Rejeitadas' },
]

const sortOptions: { key: 'newest' | 'lowest_rating' | 'longest_comment' | 'flagged'; label: string }[] = [
  { key: 'newest', label: 'Mais recentes' },
  { key: 'lowest_rating', label: 'Menor nota' },
  { key: 'longest_comment', label: 'Maior comentário' },
  { key: 'flagged', label: 'Sinalizadas primeiro' },
]

interface ReviewModerationFiltersProps {
  statusFilter: ReviewModerationStatus | 'all'
  sort: 'newest' | 'lowest_rating' | 'longest_comment' | 'flagged'
  isPending: boolean
  onFilterChange: (status: ReviewModerationStatus | 'all', sort: typeof sortOptions[number]['key']) => void
}

export function ReviewModerationFilters({
  statusFilter,
  sort,
  isPending,
  onFilterChange,
}: ReviewModerationFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(f => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key, sort)}
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
          onChange={e => onFilterChange(statusFilter, e.target.value as typeof sort)}
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
  )
}
