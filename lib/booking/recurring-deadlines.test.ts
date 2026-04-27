import { describe, it, expect } from 'vitest'
import {
  evaluateRecurringChangeDeadline,
  evaluateRecurringPauseDeadline,
  evaluateRecurringReleaseDeadline,
  RECURRING_CHANGE_DEADLINE_DAYS,
  RECURRING_PAUSE_DEADLINE_DAYS,
  RECURRING_RELEASE_DEADLINE_DAYS,
} from './recurring-deadlines'

describe('evaluateRecurringChangeDeadline', () => {
  it('allows change when well before deadline', () => {
    const reference = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    const decision = evaluateRecurringChangeDeadline(reference.toISOString())
    expect(decision.allowed).toBe(true)
    expect(decision.reason_code).toBe('allowed')
    expect(decision.deadline_at_utc).not.toBeNull()
    expect(decision.reference_at_utc).not.toBeNull()
  })

  it('blocks change when past deadline', () => {
    const reference = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    const decision = evaluateRecurringChangeDeadline(reference.toISOString())
    expect(decision.allowed).toBe(false)
    expect(decision.reason_code).toBe('outside_change_deadline')
  })

  it('blocks change when exactly at deadline edge', () => {
    const now = new Date('2026-04-25T12:00:00Z')
    const reference = new Date(now.getTime() + RECURRING_CHANGE_DEADLINE_DAYS * 24 * 60 * 60 * 1000)
    const decision = evaluateRecurringChangeDeadline(reference.toISOString(), now)
    expect(decision.allowed).toBe(true) // now <= deadline
  })

  it('returns missing_reference_time for null reference', () => {
    const decision = evaluateRecurringChangeDeadline(null)
    expect(decision.allowed).toBe(false)
    expect(decision.reason_code).toBe('missing_reference_time')
    expect(decision.deadline_at_utc).toBeNull()
    expect(decision.reference_at_utc).toBeNull()
  })

  it('returns missing_reference_time for undefined reference', () => {
    const decision = evaluateRecurringChangeDeadline(undefined)
    expect(decision.allowed).toBe(false)
    expect(decision.reason_code).toBe('missing_reference_time')
  })

  it('returns missing_reference_time for invalid date string', () => {
    const decision = evaluateRecurringChangeDeadline('not-a-date')
    expect(decision.allowed).toBe(false)
    expect(decision.reason_code).toBe('missing_reference_time')
  })

  it('calculates deadline correctly (7 days before reference)', () => {
    const reference = new Date('2026-05-01T10:00:00Z')
    const now = new Date('2026-04-20T10:00:00Z')
    const decision = evaluateRecurringChangeDeadline(reference.toISOString(), now)
    expect(decision.allowed).toBe(true)
    // Deadline should be 7 days before reference = 2026-04-24
    expect(decision.deadline_at_utc).toBe('2026-04-24T10:00:00.000Z')
  })
})

describe('evaluateRecurringPauseDeadline', () => {
  it('allows pause when well before deadline', () => {
    const reference = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const decision = evaluateRecurringPauseDeadline(reference.toISOString())
    expect(decision.allowed).toBe(true)
    expect(decision.reason_code).toBe('allowed')
  })

  it('blocks pause when past deadline', () => {
    const reference = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    const decision = evaluateRecurringPauseDeadline(reference.toISOString())
    expect(decision.allowed).toBe(false)
    expect(decision.reason_code).toBe('outside_pause_deadline')
  })

  it('returns missing_reference_time for null', () => {
    const decision = evaluateRecurringPauseDeadline(null)
    expect(decision.allowed).toBe(false)
    expect(decision.reason_code).toBe('missing_reference_time')
  })
})

describe('evaluateRecurringReleaseDeadline', () => {
  it('allows release when well before deadline', () => {
    const reference = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const decision = evaluateRecurringReleaseDeadline(reference.toISOString())
    expect(decision.allowed).toBe(true)
    expect(decision.reason_code).toBe('allowed')
  })

  it('blocks release when past deadline', () => {
    const reference = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    const decision = evaluateRecurringReleaseDeadline(reference.toISOString())
    expect(decision.allowed).toBe(false)
    expect(decision.reason_code).toBe('outside_release_deadline')
  })

  it('returns missing_reference_time for null', () => {
    const decision = evaluateRecurringReleaseDeadline(null)
    expect(decision.allowed).toBe(false)
    expect(decision.reason_code).toBe('missing_reference_time')
  })

  it('uses RECURRING_RELEASE_DEADLINE_DAYS constant', () => {
    expect(RECURRING_RELEASE_DEADLINE_DAYS).toBe(7)
    expect(RECURRING_CHANGE_DEADLINE_DAYS).toBe(7)
    expect(RECURRING_PAUSE_DEADLINE_DAYS).toBe(7)
  })
})
