/**
 * Pure logic for calculating a professional's average rating.
 * Mirrors the PostgreSQL trigger recalc_professional_rating().
 */
export interface ReviewForRating {
  rating: number
  isVisible: boolean
}

export function calculateProfessionalRating(reviews: ReviewForRating[]): {
  rating: number
  totalReviews: number
} {
  const visible = reviews.filter((r) => r.isVisible)
  const totalReviews = visible.length

  if (totalReviews === 0) {
    return { rating: 0, totalReviews: 0 }
  }

  const sum = visible.reduce((acc, r) => acc + r.rating, 0)
  const rating = parseFloat((sum / totalReviews).toFixed(2))

  return { rating, totalReviews }
}
