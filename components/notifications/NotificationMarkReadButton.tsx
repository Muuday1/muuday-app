'use client'

import { useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { markNotificationAsReadAction } from '@/lib/actions/notifications'

export function NotificationMarkReadButton({ notificationId }: { notificationId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        await markNotificationAsReadAction(notificationId)
      } catch {
        // Fail silently — marking read is non-critical
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-[#9FE870]/40 hover:text-[#3d6b1f] disabled:opacity-50"
      aria-label="Marcar como lida"
      title="Marcar como lida"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
    </button>
  )
}
