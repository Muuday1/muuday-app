'use client'

import { useMemo } from 'react'
import { getConfirmationDeadline } from '../helpers'
import type { BookingRecord, RequestRecord, InboxFilter } from '../types'

interface InboxItem {
  kind: 'confirmation' | 'request'
  sortAt: number
  booking?: BookingRecord
  request?: RequestRecord
}

interface UseInboxItemsOptions {
  pendingConfirmations: BookingRecord[]
  activeRequests: RequestRecord[]
  inboxFilter: InboxFilter
}

interface UseInboxItemsReturn {
  filteredInboxItems: InboxItem[]
}

export function useInboxItems(options: UseInboxItemsOptions): UseInboxItemsReturn {
  const { pendingConfirmations, activeRequests, inboxFilter } = options

  const inboxItems = useMemo(() => {
    const items: InboxItem[] = [
      ...pendingConfirmations.map((booking) => ({
        kind: 'confirmation' as const,
        sortAt:
          getConfirmationDeadline(booking)?.getTime() ||
          new Date(String(booking.scheduled_at || new Date().toISOString())).getTime(),
        booking,
      })),
      ...activeRequests.map((request) => ({
        kind: 'request' as const,
        sortAt: new Date(
          String(
            request.proposal_expires_at ||
              request.preferred_start_utc ||
              request.created_at ||
              new Date().toISOString(),
          ),
        ).getTime(),
        request,
      })),
    ]
    return items.sort((left, right) => left.sortAt - right.sortAt)
  }, [pendingConfirmations, activeRequests])

  const filteredInboxItems = useMemo(() => {
    return inboxItems.filter(item => {
      if (inboxFilter === 'all') return true
      if (inboxFilter === 'confirmations') return item.kind === 'confirmation'
      return item.kind === 'request'
    })
  }, [inboxItems, inboxFilter])

  return { filteredInboxItems }
}
