'use client'

import { useTransition } from 'react'
import { CheckCheck, Loader2 } from 'lucide-react'
import { markAllNotificationsAsRead } from '@/lib/actions/notifications'

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await markAllNotificationsAsRead()
      window.location.reload()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
      Marcar todas lidas
    </button>
  )
}
