import { View, Text, ScrollView, Pressable } from 'react-native'
import { useAuth } from '@/components/AuthProvider'
import { User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  const menuItems = [
    { icon: User, label: 'Editar perfil', onPress: () => {} },
    { icon: Settings, label: 'Configurações', onPress: () => {} },
    { icon: Bell, label: 'Notificações', onPress: () => {} },
    { icon: Shield, label: 'Privacidade e segurança', onPress: () => {} },
    { icon: HelpCircle, label: 'Ajuda e suporte', onPress: () => {} },
  ]

  return (
    <ScrollView className="flex-1 bg-surface-page">
      {/* Header */}
      <View className="px-4 pt-12 pb-6 bg-white border-b border-border items-center">
        <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-3">
          <Text className="text-primary text-2xl font-bold">
            {(user?.email?.[0] || 'U').toUpperCase()}
          </Text>
        </View>
        <Text className="text-text-primary text-lg font-bold">
          {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuário'}
        </Text>
        <Text className="text-text-muted text-sm mt-0.5">{user?.email}</Text>
      </View>

      {/* Menu */}
      <View className="px-4 mt-4">
        <View className="bg-white rounded-xl border border-border overflow-hidden">
          {menuItems.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center px-4 py-3.5 active:bg-surface-page ${
                index < menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <View className="mr-3">
                <item.icon size={20} color="#64748B" />
              </View>
              <Text className="flex-1 text-text-primary text-base">{item.label}</Text>
              <ChevronRight size={18} color="#64748B" />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Logout */}
      <View className="px-4 mt-4 mb-8">
        <Pressable
          onPress={signOut}
          className="bg-white rounded-xl border border-border flex-row items-center px-4 py-3.5 active:bg-surface-page"
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="flex-1 text-red-500 text-base font-medium">Sair da conta</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
