import { useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native'
import { Search, SlidersHorizontal } from 'lucide-react-native'

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    { id: '1', name: 'Psicologia', icon: '🧠' },
    { id: '2', name: 'Nutrição', icon: '🥗' },
    { id: '3', name: 'Fisioterapia', icon: '🏥' },
    { id: '4', name: 'Personal', icon: '💪' },
    { id: '5', name: 'Yoga', icon: '🧘' },
    { id: '6', name: 'Coach', icon: '🎯' },
  ]

  return (
    <ScrollView className="flex-1 bg-surface-page">
      {/* Search Header */}
      <View className="px-4 pt-12 pb-4 bg-white border-b border-border">
        <Text className="text-text-primary text-xl font-bold mb-3">Explorar</Text>
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-surface-page rounded-lg px-3 h-11">
            <Search size={18} color="#64748B" />
            <TextInput
              className="flex-1 text-text-primary text-base"
              placeholder="Buscar profissionais..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable className="w-11 h-11 bg-surface-page rounded-lg items-center justify-center border border-border">
            <SlidersHorizontal size={18} color="#0F172A" />
          </Pressable>
        </View>
      </View>

      {/* Categories */}
      <View className="px-4 mt-4">
        <Text className="text-text-primary text-lg font-bold mb-3">Categorias</Text>
        <View className="flex-row flex-wrap gap-3">
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              className="bg-white border border-border rounded-xl px-4 py-3 flex-row items-center active:bg-surface-page"
            >
              <Text className="text-lg mr-2">{cat.icon}</Text>
              <Text className="text-text-primary font-medium text-sm">{cat.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Results placeholder */}
      <View className="px-4 mt-6 mb-8">
        <Text className="text-text-primary text-lg font-bold mb-3">Resultados</Text>
        <View className="bg-white rounded-xl border border-border p-8 items-center">
          <Text className="text-text-muted text-sm">Use a busca para encontrar profissionais</Text>
        </View>
      </View>
    </ScrollView>
  )
}
