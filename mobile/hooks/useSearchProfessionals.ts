import { useInfiniteQuery } from '@tanstack/react-query'
import { apiV1 } from '@/lib/api'

export type SearchFilters = {
  q?: string
  category?: string
  specialty?: string
  language?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  market?: string
}

const PAGE_SIZE = 20

export function useSearchProfessionals(filters: SearchFilters) {
  return useInfiniteQuery({
    queryKey: ['professionals', 'search', filters],
    queryFn: async ({ pageParam }) => {
      const response = await apiV1.professionals.search({
        ...filters,
        cursor: pageParam as string | undefined,
        limit: PAGE_SIZE,
      })
      return response
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}
