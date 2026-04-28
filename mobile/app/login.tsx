import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/components/AuthProvider'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const { error: signInError } = await signIn(email.trim(), password.trim())

    setIsSubmitting(false)

    if (signInError) {
      setError(signInError.message || 'Erro ao entrar. Tente novamente.')
      return
    }

    // Auth state change will trigger redirect in _layout.tsx
    router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface-page"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo / Brand */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-primary rounded-xl items-center justify-center mb-4">
            <Text className="text-white font-bold text-2xl">M</Text>
          </View>
          <Text className="text-2xl font-bold text-text-primary">muuday</Text>
          <Text className="text-text-muted mt-2 text-base">Bem-vindo de volta</Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-text-primary mb-1.5">E-mail</Text>
            <View className="flex-row items-center bg-white border border-border rounded-lg px-3 h-12">
              <View className="mr-2">
                <Mail color="#64748B" size={20} />
              </View>
              <TextInput
                className="flex-1 text-text-primary text-base"
                placeholder="seu@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-text-primary mb-1.5">Senha</Text>
            <View className="flex-row items-center bg-white border border-border rounded-lg px-3 h-12">
              <View className="mr-2">
                <Lock color="#64748B" size={20} />
              </View>
              <TextInput
                className="flex-1 text-text-primary text-base"
                placeholder="Sua senha"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff color="#64748B" size={20} />
                ) : (
                  <Eye color="#64748B" size={20} />
                )}
              </Pressable>
            </View>
          </View>

          {error && (
            <View className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleLogin}
            disabled={isSubmitting}
            className="bg-primary rounded-lg h-12 items-center justify-center active:bg-primary-dark disabled:opacity-50"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Entrar</Text>
            )}
          </Pressable>

          <Pressable className="items-center py-2">
            <Text className="text-primary text-sm font-medium">Esqueceu a senha?</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="text-text-muted text-sm">
            Não tem conta?{' '}
            <Text className="text-primary font-medium">Cadastre-se</Text>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
