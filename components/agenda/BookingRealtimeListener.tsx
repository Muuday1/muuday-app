'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REFRESH_DEBOUNCE_MS = 3000
const MIN_REFRESH_INTERVAL_MS = 10000

export default function BookingRealtimeListener() {
  const router = useRouter()
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastRefreshRef = useRef<number>(0)
  const pendingEventRef = useRef<boolean>(false)

  useEffect(() => {
    const supabase = createClient()

    function scheduleRefresh() {
      // If a refresh is already pending, just mark that we have a newer event
      if (refreshTimerRef.current) {
        pendingEventRef.current = true
        return
      }

      const now = Date.now()
      const timeSinceLastRefresh = now - lastRefreshRef.current
      const delay = Math.max(0, MIN_REFRESH_INTERVAL_MS - timeSinceLastRefresh, REFRESH_DEBOUNCE_MS)

      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null
        lastRefreshRef.current = Date.now()
        pendingEventRef.current = false
        router.refresh()
      }, delay)
    }

    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Realtime] Booking change detected:', payload.eventType, payload.new)
          }
          scheduleRefresh()
        },
      )
      .subscribe()

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      supabase.removeChannel(channel)
    }
  }, [router])

  return null
}
