import { describe, it, expect } from 'vitest'
import { isFeatureEnabled, DEFAULT_FEATURE_FLAGS, FEATURE_FLAGS } from './feature-flags'

describe('isFeatureEnabled', () => {
  it('returns false when flags are missing', () => {
    expect(isFeatureEnabled('chatEnabled')).toBe(false)
  })

  it('returns false when flag is not in map', () => {
    expect(isFeatureEnabled('chatEnabled', {})).toBe(false)
  })

  it('returns true when flag is enabled', () => {
    expect(
      isFeatureEnabled('chatEnabled', { [FEATURE_FLAGS.chatEnabled]: true }),
    ).toBe(true)
  })

  it('returns false when flag is disabled', () => {
    expect(
      isFeatureEnabled('chatEnabled', { [FEATURE_FLAGS.chatEnabled]: false }),
    ).toBe(false)
  })

  it('handles string "true" values', () => {
    expect(
      isFeatureEnabled('chatEnabled', { [FEATURE_FLAGS.chatEnabled]: 'true' }),
    ).toBe(true)
  })
})

describe('DEFAULT_FEATURE_FLAGS', () => {
  it('has sensible defaults for core features', () => {
    expect(DEFAULT_FEATURE_FLAGS[FEATURE_FLAGS.bookingRecurringEnabled]).toBe(true)
    expect(DEFAULT_FEATURE_FLAGS[FEATURE_FLAGS.chatEnabled]).toBe(false)
    expect(DEFAULT_FEATURE_FLAGS[FEATURE_FLAGS.ledgerEnabled]).toBe(false)
  })
})
