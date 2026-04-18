import { describe, it, expect } from 'vitest'
import { createBatchBookingGroup } from './batch-booking'

describe('createBatchBookingGroup', () => {
  it('creates a group with sorted slots', () => {
    const d1 = new Date('2024-06-15T10:00:00Z')
    const d2 = new Date('2024-06-16T10:00:00Z')
    const result = createBatchBookingGroup({
      dates: [
        { startUtc: d2, endUtc: new Date(d2.getTime() + 60 * 60 * 1000) },
        { startUtc: d1, endUtc: new Date(d1.getTime() + 60 * 60 * 1000) },
      ],
    })

    expect(result.slots).toHaveLength(2)
    expect(result.slots[0].startUtc.getTime()).toBe(d1.getTime())
    expect(result.slots[1].startUtc.getTime()).toBe(d2.getTime())
    expect(result.slots[0].batchIndex).toBe(1)
    expect(result.slots[1].batchIndex).toBe(2)
    expect(typeof result.batchBookingGroupId).toBe('string')
  })

  it('deduplicates identical slots', () => {
    const d1 = new Date('2024-06-15T10:00:00Z')
    const result = createBatchBookingGroup({
      dates: [
        { startUtc: d1, endUtc: new Date(d1.getTime() + 60 * 60 * 1000) },
        { startUtc: d1, endUtc: new Date(d1.getTime() + 60 * 60 * 1000) },
      ],
    })

    expect(result.slots).toHaveLength(1)
  })

  it('handles empty input', () => {
    const result = createBatchBookingGroup({ dates: [] })
    expect(result.slots).toHaveLength(0)
  })
})
