export type RefundRule = 'full' | 'partial' | 'none'

export type RefundDecision = {
  refundPercentage: number
  rule: RefundRule
}

export function getHoursUntilSession(sessionStartIso: string, nowMs = Date.now()) {
  const startMs = new Date(sessionStartIso).getTime()
  if (Number.isNaN(startMs)) return -1
  return (startMs - nowMs) / (1000 * 60 * 60)
}

export function getUserCancellationRefundDecision(hoursUntilSession: number): RefundDecision {
  if (hoursUntilSession >= 48) {
    return { refundPercentage: 100, rule: 'full' }
  }
  if (hoursUntilSession >= 24) {
    return { refundPercentage: 50, rule: 'partial' }
  }
  return { refundPercentage: 0, rule: 'none' }
}

export function getProfessionalCancellationRefundDecision(): RefundDecision {
  return { refundPercentage: 100, rule: 'full' }
}

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export function buildCancellationPolicySnapshot(code: string) {
  return {
    code,
    refund_48h_or_more: 100,
    refund_24h_to_48h: 50,
    refund_under_24h: 0,
  }
}
