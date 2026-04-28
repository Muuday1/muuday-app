import { View, ActivityIndicator } from 'react-native'

export function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center bg-surface-page">
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  )
}
