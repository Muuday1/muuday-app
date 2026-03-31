export const REQUEST_BOOKING_STATUSES = [
  'open',
  'offered',
  'accepted',
  'declined',
  'expired',
  'cancelled',
  'converted',
] as const

export type RequestBookingStatus = (typeof REQUEST_BOOKING_STATUSES)[number]

const ALLOWED_REQUEST_BOOKING_TRANSITIONS: Record<RequestBookingStatus, RequestBookingStatus[]> = {
  open: ['offered', 'declined', 'cancelled', 'expired'],
  offered: ['open', 'accepted', 'declined', 'cancelled', 'expired', 'converted'],
  accepted: ['converted', 'cancelled'],
  declined: [],
  expired: [],
  cancelled: [],
  converted: [],
}

export function canTransitionRequestBookingStatus(
  from: RequestBookingStatus,
  to: RequestBookingStatus,
) {
  return ALLOWED_REQUEST_BOOKING_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertRequestBookingTransition(
  from: RequestBookingStatus,
  to: RequestBookingStatus,
): { ok: true } | { ok: false; reason: string } {
  if (from === to) return { ok: true }
  if (canTransitionRequestBookingStatus(from, to)) return { ok: true }
  return {
    ok: false,
    reason: `Transi??o de solicita??o invalida: ${from} -> ${to}.`,
  }
}

