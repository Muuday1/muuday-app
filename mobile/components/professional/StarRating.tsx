import { View, Text } from 'react-native'
import { Star } from 'lucide-react-native'

type StarRatingProps = {
  rating: number
  reviewCount?: number
  size?: number
}

export function StarRating({ rating, reviewCount, size = 14 }: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <View className="flex-row items-center">
      <View className="flex-row">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} size={size} fill="#F59E0B" color="#F59E0B" />
        ))}
        {hasHalfStar && (
          <View style={{ width: size, height: size, overflow: 'hidden' }}>
            <Star size={size} fill="#F59E0B" color="#F59E0B" />
          </View>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={size} color="#D1D5DB" />
        ))}
      </View>
      {reviewCount !== undefined && (
        <Text className="text-text-muted text-xs ml-1.5">
          ({reviewCount})
        </Text>
      )}
    </View>
  )
}
