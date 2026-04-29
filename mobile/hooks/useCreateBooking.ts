import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiV1 } from '@/lib/api'

export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: {
      professionalId: string
      scheduledAt: string
      notes?: string
      bookingType?: 'one_off' | 'recurring' | 'batch'
    }) => {
      const response = await apiV1.bookings.create(body)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}
