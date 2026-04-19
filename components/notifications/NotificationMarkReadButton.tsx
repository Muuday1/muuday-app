'use client'

import { useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { markNotificationAsRead } from '@/lib/actions/notifications'

export function NotificationMarkReadButton({ notificationId }: { notificationId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await markNotificationAsRead(notificationId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50"
      aria-label="Marcar como lida"
      title="Marcar como lida"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
    </button>
  )
}
