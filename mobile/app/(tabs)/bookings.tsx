import { useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useBookings } from '@/hooks/useBookings'
import { Plus, Calendar } from 'lucide-react-native'

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const { data, isLoading } = useBookings({ status: activeTab === 'upcoming' ? 'upcoming' : 'past' })

  return (
    <ScrollView className="flex-1 bg-surface-page">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 bg-white border-b border-border">
        <View className="flex-row justify-between items-center">
          <Text className="text-text-primary text-xl font-bold">Meus Agendamentos</Text>
          <Pressable className="w-10 h-10 bg-primary rounded-full items-center justify-center active:opacity-80">
            <Plus size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mt-4 mb-4">
        <Pressable
          onPress={() => setActiveTab('upcoming')}
          className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'upcoming' ? 'bg-primary' : 'bg-white border border-border'}`}
        >
          <Text className={`font-semibold text-sm ${activeTab === 'upcoming' ? 'text-white' : 'text-text-muted'}`}>
            Próximos
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('past')}
          className={`flex-1 py-2.5 rounded-lg items-center ml-2 ${activeTab === 'past' ? 'bg-primary' : 'bg-white border border-border'}`}
        >
          <Text className={`font-semibold text-sm ${activeTab === 'past' ? 'text-white' : 'text-text-muted'}`}>
            Anteriores
          </Text>
        </Pressable>
      </View>

      {/* Bookings List */}
      <View className="px-4 mt-4">
        {isLoading ? (
          <View className="bg-white rounded-xl border border-border p-8 items-center">
            <ActivityIndicator color="#007AFF" />
          </View>
        ) : data?.data?.bookings && data.data.bookings.length > 0 ? (
          data.data.bookings.map((booking) => (
            <View key={booking.id} className="bg-white rounded-xl border border-border p-4 mb-2">
              <Text className="text-text-primary font-semibold">{booking.professional_name || 'Profissional'}</Text>
              <Text className="text-text-muted text-sm mt-1">{new Date(booking.scheduled_at).toLocaleDateString('pt-BR')}</Text>
              <View className="mt-2">
                <View className={`self-start px-2.5 py-1 rounded-full ${
                  booking.status === 'confirmed' ? 'bg-green-100' :
                  booking.status === 'pending' ? 'bg-yellow-100' :
                  'bg-gray-100'
                }`}>
                  <Text className={`text-xs font-medium capitalize ${
                    booking.status === 'confirmed' ? 'text-green-700' :
                    booking.status === 'pending' ? 'text-yellow-700' :
                    'text-gray-700'
                  }`}>{booking.status}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View className="bg-white rounded-xl border border-border p-8 items-center">
            <View className="mb-3">
              <Calendar size={40} color="#64748B" />
            </View>
            <Text className="text-text-primary font-semibold text-base mb-1">
              {activeTab === 'upcoming' ? 'Nenhum agendamento próximo' : 'Nenhum agendamento anterior'}
            </Text>
            <Text className="text-text-muted text-sm text-center mt-1">
              {activeTab === 'upcoming'
                ? 'Agende uma sessão com um profissional'
                : 'Seus agendamentos passados aparecerão aqui'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
