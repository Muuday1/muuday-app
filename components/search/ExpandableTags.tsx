'use client'

import { useMemo, useState } from 'react'

type ExpandableTagsProps = {
  tags: string[]
  maxVisible?: number
}

function truncateTag(value: string, limit = 22) {
  if (value.length <= limit) return value
  return `${value.slice(0, limit - 3)}...`
}

export function ExpandableTags({ tags, maxVisible = 3 }: ExpandableTagsProps) {
  const [expanded, setExpanded] = useState(false)

  const cleaned = useMemo(
    () => tags.map(tag => String(tag || '').trim()).filter(Boolean),
    [tags],
  )

  if (cleaned.length === 0) return null

  const visible = expanded ? cleaned : cleaned.slice(0, maxVisible)
  const hiddenCount = Math.max(0, cleaned.length - visible.length)

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      {visible.map(tag => (
        <span
          key={tag}
          title={tag}
          className="inline-block max-w-[170px] truncate rounded-full bg-slate-100 px-2 py-0.5"
        >
          {truncateTag(tag)}
        </span>
      ))}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
          aria-label={`Mostrar mais ${hiddenCount} tags`}
        >
          +{hiddenCount}
        </button>
      ) : null}

      {expanded && cleaned.length > maxVisible ? (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/20"
          aria-label="Mostrar menos tags"
        >
          Ver menos
        </button>
      ) : null}
    </div>
  )
}
