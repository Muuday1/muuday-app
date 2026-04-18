import { describe, it, expect } from 'vitest'
import { canTransitionBookingStatus, assertBookingTransition } from './state-machine'
import type { BookingStatus } from './types'

describe('canTransitionBookingStatus', () => {
  it('allows valid transitions', () => {
    expect(canTransitionBookingStatus('pending', 'confirmed')).toBe(true)
    expect(canTransitionBookingStatus('pending', 'cancelled')).toBe(true)
    expect(canTransitionBookingStatus('confirmed', 'completed')).toBe(true)
    expect(canTransitionBookingStatus('confirmed', 'cancelled')).toBe(true)
    expect(canTransitionBookingStatus('confirmed', 'no_show')).toBe(true)
  })

  it('blocks invalid transitions', () => {
    expect(canTransitionBookingStatus('cancelled', 'confirmed')).toBe(false)
    expect(canTransitionBookingStatus('completed', 'cancelled')).toBe(false)
    expect(canTransitionBookingStatus('draft', 'confirmed')).toBe(false)
  })

  it('does not allow same-status in canTransition (assertBookingTransition handles that)', () => {
    expect(canTransitionBookingStatus('confirmed', 'confirmed')).toBe(false)
  })
})

describe('assertBookingTransition', () => {
  it('returns ok for valid transition', () => {
    const result = assertBookingTransition('pending', 'confirmed')
    expect(result.ok).toBe(true)
  })

  it('returns ok for same status', () => {
    const result = assertBookingTransition('confirmed', 'confirmed')
    expect(result.ok).toBe(true)
  })

  it('returns error for invalid transition', () => {
    const result = assertBookingTransition('completed', 'cancelled')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toContain('Transicao de status invalida')
    }
  })

  it('covers all status pairs in ALLOWED_TRANSITIONS', () => {
    const statuses: BookingStatus[] = [
      'draft',
      'pending_payment',
      'pending_confirmation',
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'no_show',
      'rescheduled',
    ]

    for (const from of statuses) {
      for (const to of statuses) {
        const result = assertBookingTransition(from, to)
        // Should not throw and should return a valid shape
        expect(typeof result.ok).toBe('boolean')
      }
    }
  })
})
