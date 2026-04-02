export type BatchBookingInput = {
  dates: Array<{ startUtc: Date; endUtc: Date }>
}

export type BatchBookingDecision = {
  batchBookingGroupId: string
  slots: Array<{ startUtc: Date; endUtc: Date; batchIndex: number }>
}

export function createBatchBookingGroup(input: BatchBookingInput): BatchBookingDecision {
  const batchBookingGroupId = crypto.randomUUID()

  const deduplicated = new Map<string, { startUtc: Date; endUtc: Date }>()
  for (const item of input.dates) {
    const key = `${item.startUtc.toISOString()}|${item.endUtc.toISOString()}`
    if (!deduplicated.has(key)) {
      deduplicated.set(key, item)
    }
  }

  const sorted = Array.from(deduplicated.values()).sort(
    (a, b) => a.startUtc.getTime() - b.startUtc.getTime(),
  )

  const slots = sorted.map((slot, idx) => ({
    startUtc: slot.startUtc,
    endUtc: slot.endUtc,
    batchIndex: idx + 1,
  }))

  return {
    batchBookingGroupId,
    slots,
  }
}
