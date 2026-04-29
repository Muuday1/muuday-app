import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StripeProvider } from '@stripe/stripe-react-native'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import { queryClient } from '@/lib/query-client'
import '@/global.css'

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(tabs)'
    const onLoginPage = segments[0] === 'login'

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated and trying to access protected routes
      router.replace('/login')
    } else if (isAuthenticated && onLoginPage) {
      // Redirect to home if authenticated and on login page
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, isLoading, segments, router])

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-page">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StripeProvider
          publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
          merchantIdentifier="merchant.com.muuday.app"
          urlScheme="muuday"
        >
          <AuthProvider>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </AuthProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
