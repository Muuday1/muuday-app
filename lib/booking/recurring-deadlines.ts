export const RECURRING_RELEASE_DEADLINE_DAYS = 7
export const RECURRING_CHANGE_DEADLINE_DAYS = 7
export const RECURRING_PAUSE_DEADLINE_DAYS = 7

export type RecurringDeadlineReasonCode =
  | 'allowed'
  | 'missing_reference_time'
  | 'outside_release_deadline'
  | 'outside_change_deadline'
  | 'outside_pause_deadline'

export type RecurringDeadlineDecision = {
  allowed: boolean
  reason_code: RecurringDeadlineReasonCode
  deadline_at_utc: string | null
  reference_at_utc: string | null
}

function parseReferenceUtc(referenceStartUtc: string | null | undefined) {
  if (!referenceStartUtc) return null
  const parsed = new Date(referenceStartUtc)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function calculateDeadline(reference: Date, daysBefore: number) {
  return new Date(reference.getTime() - daysBefore * 24 * 60 * 60 * 1000)
}

function evaluateDeadline(
  referenceStartUtc: string | null | undefined,
  daysBefore: number,
  outsideReasonCode:
    | 'outside_release_deadline'
    | 'outside_change_deadline'
    | 'outside_pause_deadline',
  now = new Date(),
): RecurringDeadlineDecision {
  const reference = parseReferenceUtc(referenceStartUtc)
  if (!reference) {
    return {
      allowed: false,
      reason_code: 'missing_reference_time',
      deadline_at_utc: null,
      reference_at_utc: null,
    }
  }

  const deadline = calculateDeadline(reference, daysBefore)
  const allowed = now.getTime() <= deadline.getTime()
  return {
    allowed,
    reason_code: allowed ? 'allowed' : outsideReasonCode,
    deadline_at_utc: deadline.toISOString(),
    reference_at_utc: reference.toISOString(),
  }
}

export function evaluateRecurringChangeDeadline(
  referenceStartUtc: string | null | undefined,
  now = new Date(),
): RecurringDeadlineDecision {
  return evaluateDeadline(
    referenceStartUtc,
    RECURRING_CHANGE_DEADLINE_DAYS,
    'outside_change_deadline',
    now,
  )
}

export function evaluateRecurringPauseDeadline(
  referenceStartUtc: string | null | undefined,
  now = new Date(),
): RecurringDeadlineDecision {
  return evaluateDeadline(
    referenceStartUtc,
    RECURRING_PAUSE_DEADLINE_DAYS,
    'outside_pause_deadline',
    now,
  )
}

export function evaluateRecurringReleaseDeadline(
  referenceStartUtc: string | null | undefined,
  now = new Date(),
): RecurringDeadlineDecision {
  return evaluateDeadline(
    referenceStartUtc,
    RECURRING_RELEASE_DEADLINE_DAYS,
    'outside_release_deadline',
    now,
  )
}
