import { useQuery } from '@tanstack/react-query'
import { apiV1 } from '@/lib/api'

export function useBookings(query?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['bookings', 'list', query],
    queryFn: () => apiV1.bookings.list(query),
  })
}
