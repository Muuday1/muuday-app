import { describe, it, expect } from 'vitest'
import { calculateProfessionalRating } from './rating'

describe('calculateProfessionalRating', () => {
  it('returns 0 rating and 0 total when no reviews exist', () => {
    const result = calculateProfessionalRating([])
    expect(result).toEqual({ rating: 0, totalReviews: 0 })
  })

  it('ignores non-visible reviews', () => {
    const result = calculateProfessionalRating([
      { rating: 5, isVisible: false },
      { rating: 1, isVisible: false },
    ])
    expect(result).toEqual({ rating: 0, totalReviews: 0 })
  })

  it('calculates average of visible reviews only', () => {
    const result = calculateProfessionalRating([
      { rating: 5, isVisible: true },
      { rating: 3, isVisible: true },
      { rating: 1, isVisible: false },
    ])
    expect(result.rating).toBe(4)
    expect(result.totalReviews).toBe(2)
  })

  it('handles a single visible review', () => {
    const result = calculateProfessionalRating([{ rating: 4, isVisible: true }])
    expect(result).toEqual({ rating: 4, totalReviews: 1 })
  })

  it('rounds to 2 decimal places', () => {
    const result = calculateProfessionalRating([
      { rating: 5, isVisible: true },
      { rating: 4, isVisible: true },
      { rating: 4, isVisible: true },
    ])
    expect(result.rating).toBe(4.33)
    expect(result.totalReviews).toBe(3)
  })
})
