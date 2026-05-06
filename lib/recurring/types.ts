/**
 * Types for recurring booking auto-renewal engine
 */

export type RecurringBillingMode = 'package' | 'per_session'

export type RecurringPaymentSettings = {
  id: string
  user_id: string
  professional_id: string
  recurrence_group_id: string
  stripe_payment_method_id: string | null
  stripe_customer_id: string | null
  auto_renew: boolean
  status: 'active' | 'paused' | 'payment_failed' | 'cancelled'
  next_renewal_at: string | null
  last_renewal_at: string | null
  last_payment_intent_id: string | null
  price_total: number
  currency: string
  billing_mode: RecurringBillingMode
  created_at: string
  updated_at: string
}

export type RenewalCandidate = {
  settingsId: string
  userId: string
  professionalId: string
  recurrenceGroupId: string
  stripePaymentMethodId: string
  stripeCustomerId: string
  priceTotal: number
  currency: string
  nextRenewalAt: string
}

export type RenewalChargeResult =
  | { success: true; paymentIntentId: string; status: string }
  | { success: false; reason: string; paymentIntentId?: string }

export type RenewalCycleResult =
  | { success: true; newParentBookingId: string; paymentId: string }
  | { success: false; reason: string }
