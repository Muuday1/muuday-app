import type { BookingStatus } from './types'

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['pending_confirmation', 'confirmed', 'cancelled'],
  pending_confirmation: ['confirmed', 'cancelled', 'rescheduled'],
  pending: ['confirmed', 'cancelled', 'rescheduled'], // legacy compatibility
  confirmed: ['completed', 'cancelled', 'no_show', 'rescheduled'],
  cancelled: [],
  completed: [],
  no_show: ['cancelled'],
  rescheduled: ['pending_confirmation', 'confirmed', 'cancelled'],
}

export function canTransitionBookingStatus(from: BookingStatus, to: BookingStatus) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertBookingTransition(
  from: BookingStatus,
  to: BookingStatus,
): { ok: true } | { ok: false; reason: string } {
  if (from === to) return { ok: true }
  if (canTransitionBookingStatus(from, to)) return { ok: true }
  return {
    ok: false,
    reason: `Transicao de status invalida: ${from} -> ${to}.`,
  }
}
