import { useQuery } from '@tanstack/react-query'
import { apiV1 } from '@/lib/api'

export function useAvailability(professionalId: string) {
  return useQuery({
    queryKey: ['availability', professionalId],
    queryFn: () => apiV1.professionals.getAvailability(professionalId),
    enabled: !!professionalId,
    staleTime: 1000 * 60 * 2,
  })
}
