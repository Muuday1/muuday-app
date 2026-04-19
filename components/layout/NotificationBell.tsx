'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

export function NotificationBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setCount(data.count || 0)
        }
      } catch {
        // silently fail
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/notificacoes"
      className="relative flex items-center justify-center w-9 h-9 rounded-full border border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 transition-all"
      aria-label="Notificações"
    >
      <Bell className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
