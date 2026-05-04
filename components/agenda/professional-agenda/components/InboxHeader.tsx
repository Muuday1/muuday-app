'use client'

import Link from 'next/link'
import type { InboxFilter } from '../types'

interface InboxHeaderProps {
  inboxFilter: InboxFilter
}

export function InboxHeader({ inboxFilter }: InboxHeaderProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Pendências
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">
            Inbox única de confirmações e solicitações
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/agenda?view=inbox&filter=all"
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
              inboxFilter === 'all'
                ? 'border-[#9FE870] bg-[#9FE870] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
            }`}
          >
            Todas
          </Link>
          <Link
            href="/agenda?view=inbox&filter=confirmations"
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
              inboxFilter === 'confirmations'
                ? 'border-[#9FE870] bg-[#9FE870] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
            }`}
          >
            Confirmações
          </Link>
          <Link
            href="/agenda?view=inbox&filter=requests"
            className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
              inboxFilter === 'requests'
                ? 'border-[#9FE870] bg-[#9FE870] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
            }`}
          >
            Solicitações
          </Link>
        </div>
      </div>
    </section>
  )
}
