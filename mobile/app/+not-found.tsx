import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'

export default function NotFoundScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 items-center justify-center bg-surface-page px-6">
      <Text className="text-text-primary text-4xl font-bold mb-2">404</Text>
      <Text className="text-text-muted text-base mb-6">Página não encontrada</Text>
      <Pressable
        onPress={() => router.replace('/')}
        className="bg-primary px-6 py-3 rounded-lg active:bg-primary-dark"
      >
        <Text className="text-white font-semibold">Voltar ao início</Text>
      </Pressable>
    </View>
  )
}
