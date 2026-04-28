import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useConversations } from '@/hooks/useConversations'
import { MessageCircle } from 'lucide-react-native'

export default function MessagesScreen() {
  const { data, isLoading } = useConversations()
  const conversations = data?.data?.conversations ?? []

  return (
    <ScrollView className="flex-1 bg-surface-page">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white border-b border-border">
        <Text className="text-text-primary text-xl font-bold">Mensagens</Text>
      </View>

      {/* Conversations List */}
      <View className="px-4 mt-4">
        {isLoading ? (
          <View className="bg-white rounded-xl border border-border p-8 items-center">
            <ActivityIndicator color="#007AFF" />
          </View>
        ) : conversations.length > 0 ? (
          conversations.map((conv) => (
            <Pressable
              key={conv.id}
              className="bg-white rounded-xl border border-border p-4 mb-2 active:bg-surface-page"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-text-primary font-semibold text-base">{conv.otherParticipantName}</Text>
                  <Text className="text-text-muted text-sm mt-1" numberOfLines={1}>
                    {conv.lastMessageContent || 'Nenhuma mensagem'}
                  </Text>
                </View>
                {conv.unreadCount > 0 && (
                  <View className="bg-primary min-w-[22px] h-[22px] rounded-full items-center justify-center px-1.5">
                    <Text className="text-white text-xs font-bold">{conv.unreadCount}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))
        ) : (
          <View className="bg-white rounded-xl border border-border p-8 items-center">
            <View className="mb-3">
              <MessageCircle size={40} color="#64748B" />
            </View>
            <Text className="text-text-primary font-semibold text-base mb-1">Nenhuma conversa</Text>
            <Text className="text-text-muted text-sm text-center mt-1">
              Suas conversas com profissionais aparecerão aqui
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
