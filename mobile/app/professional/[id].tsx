import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Briefcase,
  Star,
  MessageCircle,
  Calendar,
  Globe,
} from 'lucide-react-native'
import { apiV1 } from '@/lib/api'
import { StarRating } from '@/components/professional/StarRating'
import { getSearchCategoryLabel } from '@/lib/search-config'

function formatPrice(priceBrl: number, currency: string | null): string {
  if (!priceBrl || priceBrl <= 0) return 'Preço sob consulta'
  const symbol = currency === 'BRL' ? 'R$' : currency || 'R$'
  return `${symbol} ${priceBrl.toFixed(2).replace('.', ',')}`
}

function getCountryDisplayName(countryCodeOrName?: string | null) {
  if (!countryCodeOrName) return 'Online'
  const normalized = countryCodeOrName.trim()
  if (!normalized) return 'Online'
  if (/^[A-Za-z]{2}$/.test(normalized)) {
    try {
      const displayNames = new Intl.DisplayNames(['pt-BR', 'en'], { type: 'region' })
      const resolved = displayNames.of(normalized.toUpperCase())
      if (resolved) return resolved
    } catch {
      return normalized
    }
  }
  return normalized
}

export default function ProfessionalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [showAllReviews, setShowAllReviews] = useState(false)

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['professional', 'detail', id],
    queryFn: () => apiV1.professionals.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-page">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-page px-6">
        <Text className="text-error text-sm text-center">
          {error instanceof Error ? error.message : 'Erro ao carregar perfil.'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary rounded-lg px-6 py-2.5"
        >
          <Text className="text-text-primary font-medium text-sm">Voltar</Text>
        </Pressable>
      </View>
    )
  }

  const { professional, reviews } = data.data
  const profile = professional.profiles
  const displayName = profile?.full_name || 'Profissional'
  const avatarUrl = profile?.avatar_url
  const categoryLabel = getSearchCategoryLabel(professional.category)
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3)

  return (
    <View className="flex-1 bg-surface-page">
      {/* Header */}
      <View className="pt-12 pb-4 px-4 bg-white border-b border-border flex-row items-center">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="text-text-primary text-lg font-bold ml-2 flex-1" numberOfLines={1}>
          Perfil do profissional
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        {professional.cover_photo_url ? (
          <Image
            source={{ uri: professional.cover_photo_url }}
            style={{ width, height: width * 0.4 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width, height: width * 0.3 }} className="bg-primary/10 items-center justify-center">
            <Text className="text-primary text-4xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Profile Info */}
        <View className="px-4 -mt-8">
          <View className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <View className="flex-row items-start">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-20 h-20 rounded-full border-4 border-white -mt-12"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-20 h-20 rounded-full border-4 border-white -mt-12 bg-primary/20 items-center justify-center">
                  <Text className="text-primary font-bold text-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="ml-3 flex-1 pt-1">
                <Text className="text-text-primary text-lg font-bold" numberOfLines={1}>
                  {displayName}
                </Text>
                <Text className="text-text-muted text-sm">{categoryLabel}</Text>
              </View>
            </View>

            <View className="flex-row items-center mt-3">
              <StarRating
                rating={professional.rating || 0}
                reviewCount={professional.total_reviews || 0}
                size={16}
              />
            </View>

            <View className="flex-row flex-wrap mt-3 gap-y-2">
              {professional.years_experience > 0 && (
                <View className="flex-row items-center mr-4">
                  <Briefcase size={14} color="#64748B" />
                  <Text className="text-text-muted text-sm ml-1">
                    {professional.years_experience} anos de experiência
                  </Text>
                </View>
              )}
              {professional.session_duration_minutes > 0 && (
                <View className="flex-row items-center mr-4">
                  <Clock size={14} color="#64748B" />
                  <Text className="text-text-muted text-sm ml-1">
                    {professional.session_duration_minutes} min/sessão
                  </Text>
                </View>
              )}
              {profile?.country && (
                <View className="flex-row items-center mr-4">
                  <MapPin size={14} color="#64748B" />
                  <Text className="text-text-muted text-sm ml-1">
                    {getCountryDisplayName(profile.country)}
                  </Text>
                </View>
              )}
              {professional.languages && professional.languages.length > 0 && (
                <View className="flex-row items-center">
                  <Globe size={14} color="#64748B" />
                  <Text className="text-text-muted text-sm ml-1">
                    {professional.languages.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bio */}
        {professional.bio && (
          <View className="px-4 mt-4">
            <View className="bg-white rounded-xl border border-border p-4">
              <Text className="text-text-primary font-semibold text-base mb-2">Sobre</Text>
              <Text className="text-text-muted text-sm leading-5">{professional.bio}</Text>
            </View>
          </View>
        )}

        {/* Specialties */}
        {professional.subcategories && professional.subcategories.length > 0 && (
          <View className="px-4 mt-4">
            <View className="bg-white rounded-xl border border-border p-4">
              <Text className="text-text-primary font-semibold text-base mb-2">Especialidades</Text>
              <View className="flex-row flex-wrap gap-2">
                {professional.subcategories.map((spec, i) => (
                  <View key={i} className="bg-surface-page rounded-full px-3 py-1.5 border border-border">
                    <Text className="text-text-muted text-xs">{spec}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Tags */}
        {professional.tags && professional.tags.length > 0 && (
          <View className="px-4 mt-4">
            <View className="bg-white rounded-xl border border-border p-4">
              <Text className="text-text-primary font-semibold text-base mb-2">Tags</Text>
              <View className="flex-row flex-wrap gap-2">
                {professional.tags.map((tag, i) => (
                  <View key={i} className="bg-primary/10 rounded-full px-3 py-1.5">
                    <Text className="text-text-primary text-xs">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <View className="px-4 mt-4">
            <View className="bg-white rounded-xl border border-border p-4">
              <Text className="text-text-primary font-semibold text-base mb-3">
                Avaliações ({reviews.length})
              </Text>
              {displayedReviews.map((review) => (
                <View key={review.id} className="mb-3 pb-3 border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-text-primary text-sm font-medium">
                      {review.profiles?.full_name || 'Cliente'}
                    </Text>
                    <StarRating rating={review.rating} size={12} />
                  </View>
                  {review.comment && (
                    <Text className="text-text-muted text-sm mt-1 leading-4">{review.comment}</Text>
                  )}
                  {review.professional_response && (
                    <View className="bg-surface-page rounded-lg p-2 mt-2">
                      <Text className="text-text-muted text-xs font-medium">Resposta do profissional:</Text>
                      <Text className="text-text-muted text-xs mt-0.5">{review.professional_response}</Text>
                    </View>
                  )}
                </View>
              ))}
              {reviews.length > 3 && (
                <Pressable
                  onPress={() => setShowAllReviews(!showAllReviews)}
                  className="mt-2 items-center"
                >
                  <Text className="text-primary text-sm font-medium">
                    {showAllReviews ? 'Ver menos' : `Ver todas (${reviews.length})`}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Bottom spacing for CTA */}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-text-muted text-xs">Valor da sessão</Text>
            <Text className="text-text-primary font-bold text-lg">
              {formatPrice(professional.session_price_brl, professional.session_price_currency)}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                // Navigate to chat - will be implemented in messaging flow
                router.push(`/(tabs)/messages`)
              }}
              className="w-12 h-12 rounded-xl bg-surface-page border border-border items-center justify-center"
            >
              <MessageCircle size={20} color="#0F172A" />
            </Pressable>
            <Pressable
              onPress={() => {
                // Navigate to booking flow
                router.push(`/booking/${professional.id}`)
              }}
              className="bg-primary rounded-xl px-6 h-12 items-center justify-center"
            >
              <View className="flex-row items-center">
                <Calendar size={18} color="#0F172A" />
                <Text className="text-text-primary font-semibold text-sm ml-2">Agendar</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  )
}
