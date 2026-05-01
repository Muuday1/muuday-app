'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function NotificationBell() {
  const [count, setCount] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetch = useRef<number>(0)

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

    // Initial fetch
    fetchCount()

    // Supabase Realtime for instant updates
    // Debounced + rate-limited to prevent fetch storms
    // See AGENTS.md: "Debounce realtime listeners: router.refresh() from
    // Supabase realtime must be debounced (750ms) and rate-limited (max 1/5s, 10/min)"
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
          }

          debounceTimer.current = setTimeout(() => {
            const now = Date.now()
            if (now - lastFetch.current > 5000) {
              void fetchCount()
              lastFetch.current = now
            }
          }, 750)
        },
      )
      .subscribe()

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Link
      href="/notificacoes"
      className="relative flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50/70 transition-all"
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
