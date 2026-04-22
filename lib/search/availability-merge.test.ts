import { describe, it, expect } from 'vitest'
import { mergeAvailabilitySources } from './availability-merge'

describe('mergeAvailabilitySources', () => {
  it('returns empty when both sources are empty', () => {
    const result = mergeAvailabilitySources([], [])
    expect(result).toEqual([])
  })

  it('uses modern rows when present', () => {
    const modern = [
      { professional_id: 'p1', weekday: 1, start_time_local: '09:00', end_time_local: '17:00' },
    ]
    const legacy = [
      { professional_id: 'p1', day_of_week: 1, start_time: '08:00', end_time: '16:00' },
    ]
    const result = mergeAvailabilitySources(modern, legacy)
    expect(result).toEqual([
      { professional_id: 'p1', day_of_week: 1, start_time: '09:00', end_time: '17:00' },
    ])
  })

  it('falls back to legacy when no modern rows', () => {
    const modern: Array<{ professional_id: string; weekday: number; start_time_local: string; end_time_local: string }> = []
    const legacy = [
      { professional_id: 'p1', day_of_week: 2, start_time: '10:00', end_time: '18:00' },
    ]
    const result = mergeAvailabilitySources(modern, legacy)
    expect(result).toEqual([
      { professional_id: 'p1', day_of_week: 2, start_time: '10:00', end_time: '18:00' },
    ])
  })

  it('handles mixed professionals', () => {
    const modern = [
      { professional_id: 'p1', weekday: 1, start_time_local: '09:00', end_time_local: '17:00' },
    ]
    const legacy = [
      { professional_id: 'p2', day_of_week: 3, start_time: '10:00', end_time: '18:00' },
    ]
    const result = mergeAvailabilitySources(modern, legacy)
    expect(result).toEqual([
      { professional_id: 'p1', day_of_week: 1, start_time: '09:00', end_time: '17:00' },
      { professional_id: 'p2', day_of_week: 3, start_time: '10:00', end_time: '18:00' },
    ])
  })

  it('ignores legacy for professionals that have modern rows', () => {
    const modern = [
      { professional_id: 'p1', weekday: 1, start_time_local: '09:00', end_time_local: '17:00' },
    ]
    const legacy = [
      { professional_id: 'p1', day_of_week: 1, start_time: '08:00', end_time: '16:00' },
      { professional_id: 'p1', day_of_week: 2, start_time: '10:00', end_time: '18:00' },
    ]
    const result = mergeAvailabilitySources(modern, legacy)
    expect(result).toEqual([
      { professional_id: 'p1', day_of_week: 1, start_time: '09:00', end_time: '17:00' },
    ])
  })

  it('preserves multiple modern rows per professional', () => {
    const modern = [
      { professional_id: 'p1', weekday: 1, start_time_local: '09:00', end_time_local: '12:00' },
      { professional_id: 'p1', weekday: 1, start_time_local: '14:00', end_time_local: '18:00' },
    ]
    const legacy: Array<{ professional_id: string; day_of_week: number; start_time: string; end_time: string }> = []
    const result = mergeAvailabilitySources(modern, legacy)
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({
      professional_id: 'p1',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '12:00',
    })
    expect(result).toContainEqual({
      professional_id: 'p1',
      day_of_week: 1,
      start_time: '14:00',
      end_time: '18:00',
    })
  })
})
