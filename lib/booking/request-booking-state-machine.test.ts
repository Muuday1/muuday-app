import { describe, it, expect } from 'vitest'
import {
  canTransitionRequestBookingStatus,
  assertRequestBookingTransition,
  REQUEST_BOOKING_STATUSES,
} from './request-booking-state-machine'

describe('canTransitionRequestBookingStatus', () => {
  it('allows open -> offered', () => {
    expect(canTransitionRequestBookingStatus('open', 'offered')).toBe(true)
  })

  it('allows open -> declined', () => {
    expect(canTransitionRequestBookingStatus('open', 'declined')).toBe(true)
  })

  it('allows open -> cancelled', () => {
    expect(canTransitionRequestBookingStatus('open', 'cancelled')).toBe(true)
  })

  it('allows open -> expired', () => {
    expect(canTransitionRequestBookingStatus('open', 'expired')).toBe(true)
  })

  it('disallows open -> accepted', () => {
    expect(canTransitionRequestBookingStatus('open', 'accepted')).toBe(false)
  })

  it('allows offered -> accepted', () => {
    expect(canTransitionRequestBookingStatus('offered', 'accepted')).toBe(true)
  })

  it('allows offered -> converted', () => {
    expect(canTransitionRequestBookingStatus('offered', 'converted')).toBe(true)
  })

  it('allows offered -> open (rollback)', () => {
    expect(canTransitionRequestBookingStatus('offered', 'open')).toBe(true)
  })

  it('disallows offered -> offered (same state)', () => {
    expect(canTransitionRequestBookingStatus('offered', 'offered')).toBe(false)
  })

  it('allows accepted -> converted', () => {
    expect(canTransitionRequestBookingStatus('accepted', 'converted')).toBe(true)
  })

  it('allows accepted -> cancelled', () => {
    expect(canTransitionRequestBookingStatus('accepted', 'cancelled')).toBe(true)
  })

  it('disallows accepted -> open', () => {
    expect(canTransitionRequestBookingStatus('accepted', 'open')).toBe(false)
  })

  it('blocks all transitions from terminal states', () => {
    const terminalStates = ['declined', 'expired', 'cancelled', 'converted'] as const
    for (const from of terminalStates) {
      for (const to of REQUEST_BOOKING_STATUSES) {
        if (from !== to) {
          expect(canTransitionRequestBookingStatus(from, to)).toBe(false)
        }
      }
    }
  })

  it('returns false for unknown states', () => {
    expect(canTransitionRequestBookingStatus('unknown' as any, 'open')).toBe(false)
  })
})

describe('assertRequestBookingTransition', () => {
  it('returns ok=true for valid transition', () => {
    const result = assertRequestBookingTransition('open', 'offered')
    expect(result.ok).toBe(true)
  })

  it('returns ok=true for same state', () => {
    const result = assertRequestBookingTransition('offered', 'offered')
    expect(result.ok).toBe(true)
  })

  it('returns ok=false with reason for invalid transition', () => {
    const result = assertRequestBookingTransition('converted', 'open')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain('converted')
      expect(result.reason).toContain('open')
    }
  })
})
