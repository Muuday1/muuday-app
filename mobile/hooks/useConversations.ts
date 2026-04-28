import { useQuery } from '@tanstack/react-query'
import { apiV1 } from '@/lib/api'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations', 'list'],
    queryFn: () => apiV1.conversations.list(),
  })
}

export function useMessages(conversationId: string, query?: { limit?: number; cursor?: string }) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages', query],
    queryFn: () => apiV1.conversations.getMessages(conversationId, query),
    enabled: !!conversationId,
  })
}
