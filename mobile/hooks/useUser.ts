import { useQuery } from '@tanstack/react-query'
import { apiV1 } from '@/lib/api'

export function useUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => apiV1.users.me(),
  })
}
