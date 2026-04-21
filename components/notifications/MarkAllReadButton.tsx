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
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#9FE870]/40 hover:text-[#3d6b1f] disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
      Marcar todas lidas
    </button>
  )
}
