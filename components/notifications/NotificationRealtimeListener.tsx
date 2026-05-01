'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function NotificationRealtimeListener() {
  const router = useRouter()
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastRefresh = useRef<number>(0)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications-list-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          // Debounce + rate-limit to prevent refresh storms
          // See AGENTS.md: "Debounce realtime listeners: router.refresh() from
          // Supabase realtime must be debounced (750ms) and rate-limited
          // (max 1/5s, 10/min)"
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current)
          }

          debounceTimer.current = setTimeout(() => {
            const now = Date.now()
            if (now - lastRefresh.current > 5000) {
              router.refresh()
              lastRefresh.current = now
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
  }, [router])

  return null
}
