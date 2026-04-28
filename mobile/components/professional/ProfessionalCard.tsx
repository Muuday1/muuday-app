import { View, Text, Pressable, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { MapPin, Clock, Briefcase } from 'lucide-react-native'
import { StarRating } from './StarRating'
import type { ProfessionalSearchResult } from '@/lib/api'
import { getSearchCategoryLabel } from '@/lib/search-config'

function formatPrice(priceBrl: number, currency: string | null): string {
  if (!priceBrl || priceBrl <= 0) return 'Preço sob consulta'
  const symbol = currency === 'BRL' ? 'R$' : currency || 'R$'
  return `${symbol} ${priceBrl.toFixed(2).replace('.', ',')}`
}

type ProfessionalCardProps = {
  professional: ProfessionalSearchResult
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const router = useRouter()
  const profile = professional.profiles
  const displayName = profile?.full_name || 'Profissional'
  const avatarUrl = profile?.avatar_url
  const categoryLabel = getSearchCategoryLabel(professional.category)

  return (
    <Pressable
      onPress={() => router.push(`/professional/${professional.id}`)}
      className="bg-white rounded-xl border border-border p-4 mb-3 active:bg-surface-page"
    >
      <View className="flex-row">
        {/* Avatar */}
        <View className="mr-3">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="w-16 h-16 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center">
              <Text className="text-primary font-bold text-xl">
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-base" numberOfLines={1}>
            {displayName}
          </Text>

          <Text className="text-text-muted text-sm mt-0.5" numberOfLines={1}>
            {categoryLabel}
          </Text>

          <View className="flex-row items-center mt-1.5">
            <StarRating
              rating={professional.rating || 0}
              reviewCount={professional.total_reviews || 0}
              size={13}
            />
          </View>

          <View className="flex-row items-center mt-2 flex-wrap gap-y-1">
            {professional.years_experience > 0 && (
              <View className="flex-row items-center mr-3">
                <Briefcase size={12} color="#64748B" />
                <Text className="text-text-muted text-xs ml-1">
                  {professional.years_experience} anos
                </Text>
              </View>
            )}
            {professional.session_duration_minutes > 0 && (
              <View className="flex-row items-center mr-3">
                <Clock size={12} color="#64748B" />
                <Text className="text-text-muted text-xs ml-1">
                  {professional.session_duration_minutes} min
                </Text>
              </View>
            )}
            {profile?.country && (
              <View className="flex-row items-center">
                <MapPin size={12} color="#64748B" />
                <Text className="text-text-muted text-xs ml-1">
                  {profile.country}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Price & CTA */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
        <Text className="text-text-primary font-semibold text-base">
          {formatPrice(professional.session_price_brl, professional.session_price_currency)}
        </Text>
        <Text className="text-primary text-sm font-medium">
          Ver perfil
        </Text>
      </View>
    </Pressable>
  )
}
