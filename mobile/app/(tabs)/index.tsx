import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useAuth } from '@/components/AuthProvider'
import { useUser } from '@/hooks/useUser'
import { useBookings } from '@/hooks/useBookings'
import { Bell, ChevronRight } from 'lucide-react-native'

export default function HomeScreen() {
  const { user } = useAuth()
  const { data: userData, isLoading: userLoading } = useUser()
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings({ status: 'upcoming', limit: 3 })

  const firstName = userData?.user?.full_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Você'

  return (
    <ScrollView className="flex-1 bg-surface-page">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white border-b border-border">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-text-muted text-sm">Bom dia,</Text>
            <Text className="text-text-primary text-xl font-bold">{firstName}</Text>
          </View>
          <Pressable className="w-10 h-10 rounded-full bg-surface-page items-center justify-center">
            <Bell size={20} color="#0F172A" />
          </Pressable>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-4 mt-4">
        <Text className="text-text-primary text-lg font-bold mb-3">Ações rápidas</Text>
        <View className="flex-row gap-3">
          <QuickActionCard
            label="Agendar"
            color="bg-primary"
            onPress={() => {}}
          />
          <QuickActionCard
            label="Explorar"
            color="bg-orange-500"
            onPress={() => {}}
          />
          <QuickActionCard
            label="Mensagens"
            color="bg-purple-500"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Upcoming Bookings */}
      <View className="px-4 mt-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-text-primary text-lg font-bold">Próximos agendamentos</Text>
          <Pressable className="flex-row items-center">
            <Text className="text-primary text-sm font-medium">Ver todos</Text>
            <ChevronRight size={16} color="#007AFF" />
          </Pressable>
        </View>
        {bookingsLoading ? (
          <View className="bg-white rounded-xl border border-border p-6 items-center">
            <ActivityIndicator color="#007AFF" />
          </View>
        ) : bookingsData?.data?.bookings && bookingsData.data.bookings.length > 0 ? (
          bookingsData.data.bookings.map((booking) => (
            <View key={booking.id} className="bg-white rounded-xl border border-border p-4 mb-2">
              <Text className="text-text-primary font-semibold">{booking.professional_name || 'Profissional'}</Text>
              <Text className="text-text-muted text-sm mt-1">{new Date(booking.scheduled_at).toLocaleDateString('pt-BR')}</Text>
            </View>
          ))
        ) : (
          <EmptyState message="Nenhum agendamento próximo" />
        )}
      </View>

      {/* Popular Professionals */}
      <View className="px-4 mt-6 mb-8">
        <Text className="text-text-primary text-lg font-bold mb-3">Profissionais populares</Text>
        <EmptyState message="Explore profissionais na aba Explorar" />
      </View>
    </ScrollView>
  )
}

function QuickActionCard({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`${color} flex-1 rounded-xl p-4 items-center justify-center active:opacity-80`}
    >
      <Text className="text-white font-semibold text-sm">{label}</Text>
    </Pressable>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <View className="bg-white rounded-xl border border-border p-6 items-center">
      <Text className="text-text-muted text-sm">{message}</Text>
    </View>
  )
}
