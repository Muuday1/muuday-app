import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Search, SlidersHorizontal, X } from 'lucide-react-native'
import { useSearchProfessionals } from '@/hooks/useSearchProfessionals'
import { ProfessionalCard } from '@/components/professional/ProfessionalCard'
import { SEARCH_CATEGORIES, getSearchCategoryBySlug } from '@/lib/search-config'
import type { SearchFilters } from '@/hooks/useSearchProfessionals'

export default function ExploreScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useSearchProfessionals(filters)

  const professionals = data?.pages.flatMap((page) => page.data) ?? []
  const totalResults = data?.pages[0]?.total ?? 0

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      q: searchQuery.trim() || undefined,
    }))
  }, [searchQuery])

  const handleCategoryPress = useCallback((slug: string) => {
    setActiveCategory((prev) => {
      const next = prev === slug ? null : slug
      setFilters((f) => ({ ...f, category: next || undefined }))
      return next
    })
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setActiveCategory(null)
    setFilters({})
  }, [])

  const renderFooter = () => {
    if (!hasNextPage) return null
    return (
      <View className="py-4 items-center">
        {isFetchingNextPage ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <Pressable
            onPress={() => fetchNextPage()}
            className="bg-primary rounded-lg px-6 py-2.5"
          >
            <Text className="text-text-primary font-medium text-sm">Carregar mais</Text>
          </Pressable>
        )}
      </View>
    )
  }

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View className="py-12 items-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="text-text-muted text-sm mt-4">Buscando profissionais...</Text>
        </View>
      )
    }

    if (isError) {
      return (
        <View className="py-12 px-6 items-center">
          <Text className="text-error text-sm text-center">
            {error instanceof Error ? error.message : 'Erro ao buscar profissionais.'}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-4 bg-primary rounded-lg px-6 py-2.5"
          >
            <Text className="text-text-primary font-medium text-sm">Tentar novamente</Text>
          </Pressable>
        </View>
      )
    }

    if (professionals.length === 0 && (filters.q || filters.category)) {
      return (
        <View className="py-12 px-6 items-center">
          <Text className="text-text-muted text-sm text-center">
            Nenhum profissional encontrado para essa busca.
          </Text>
          <Pressable
            onPress={handleClearFilters}
            className="mt-4 bg-primary rounded-lg px-6 py-2.5"
          >
            <Text className="text-text-primary font-medium text-sm">Limpar filtros</Text>
          </Pressable>
        </View>
      )
    }

    return (
      <View className="py-12 px-6 items-center">
        <Text className="text-text-muted text-sm text-center">
          Escolha uma categoria ou use a busca para encontrar profissionais.
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-surface-page">
      {/* Search Header */}
      <View className="px-4 pt-12 pb-4 bg-white border-b border-border">
        <Text className="text-text-primary text-xl font-bold mb-3">Explorar</Text>
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-surface-page rounded-lg px-3 h-11 border border-border">
            <Search size={18} color="#64748B" />
            <TextInput
              className="flex-1 text-text-primary text-base ml-2"
              placeholder="Buscar profissionais..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} className="p-1">
                <X size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            className={`w-11 h-11 rounded-lg items-center justify-center border ${
              showFilters || activeCategory
                ? 'bg-primary border-primary'
                : 'bg-surface-page border-border'
            }`}
          >
            <SlidersHorizontal
              size={18}
              color={showFilters || activeCategory ? '#0F172A' : '#0F172A'}
            />
          </Pressable>
        </View>

        {/* Active filters indicator */}
        {(filters.q || filters.category) && (
          <View className="flex-row items-center mt-2">
            <Text className="text-text-muted text-xs mr-2">
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </Text>
            <Pressable onPress={handleClearFilters} className="flex-row items-center">
              <X size={12} color="#EF4444" />
              <Text className="text-error text-xs ml-0.5">Limpar</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Categories */}
      {!showFilters && (
        <View className="px-4 py-3 bg-white border-b border-border">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={SEARCH_CATEGORIES}
            keyExtractor={(item) => item.slug}
            renderItem={({ item }) => {
              const isActive = activeCategory === item.slug
              return (
                <Pressable
                  onPress={() => handleCategoryPress(item.slug)}
                  className={`mr-2 px-4 py-2 rounded-full border flex-row items-center ${
                    isActive
                      ? 'bg-primary border-primary'
                      : 'bg-surface-page border-border'
                  }`}
                >
                  <Text className="text-base mr-1.5">{item.icon}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      isActive ? 'text-text-primary' : 'text-text-muted'
                    }`}
                    numberOfLines={1}
                  >
                    {item.name.split(' ').slice(0, 2).join(' ')}
                  </Text>
                </Pressable>
              )
            }}
            contentContainerStyle={{ paddingRight: 16 }}
          />
        </View>
      )}

      {/* Results */}
      <FlatList
        data={professionals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProfessionalCard professional={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#007AFF" />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
