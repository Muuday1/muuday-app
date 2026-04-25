/**
 * Payout Eligibility Engine — Muuday Payments Engine
 *
 * Determines which bookings are eligible for payout and which professionals
 * can receive payouts. This is the GATEKEEPER of all money leaving Muuday.
 *
 * ALL criteria must be met for a booking to be eligible.
 * ALL criteria must be met for a professional to receive payouts.
 *
 * Eligibility is checked at batch creation time AND at batch submission time.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { getProfessionalBalance, canReceivePayouts } from '../ledger/balance'
import { THRESHOLDS } from '../bigint-constants'
import type { PayoutPeriodicity } from '../fees/calculator'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface EligibilityConfig {
  payoutCooldownHours: number
  maxProfessionalDebt: bigint
  minPayoutAmount: bigint
}

export const DEFAULT_ELIGIBILITY_CONFIG: EligibilityConfig = {
  payoutCooldownHours: 48,
  maxProfessionalDebt: THRESHOLDS.MAX_PRO_DEBT,
  minPayoutAmount: BigInt(500), // R$ 5.00 minimum payout
}

// ---------------------------------------------------------------------------
// Booking Eligibility
// ---------------------------------------------------------------------------

export interface BookingEligibilityResult {
  eligible: boolean
  bookingId: string
  reason?: string
  eligibleAmount: bigint
}

/**
 * Check if a single booking is eligible for payout.
 *
 * ALL of these must be true:
 * 1. Booking status = 'completed'
 * 2. Payment status = 'captured'
 * 3. Cooldown period has passed
 * 4. No open dispute
 * 5. Not already included in a submitted/completed batch
 * 6. Professional is active and KYC-approved
 */
export async function checkBookingEligibility(
  admin: SupabaseClient,
  bookingId: string,
  config: EligibilityConfig = DEFAULT_ELIGIBILITY_CONFIG,
): Promise<BookingEligibilityResult> {
  const { data: booking, error } = await admin
    .from('bookings')
    .select(`
      id,
      status,
      scheduled_end_at,
      professional_id,
      payments!inner(status, amount_total_minor)
    `)
    .eq('id', bookingId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load booking ${bookingId}: ${error.message}`)
  }

  if (!booking) {
    return { eligible: false, bookingId, reason: 'Booking not found', eligibleAmount: BigInt(0) }
  }

  // Criterion 1: Booking must be completed
  if (booking.status !== 'completed') {
    return {
      eligible: false,
      bookingId,
      reason: `Booking status is '${booking.status}', expected 'completed'`,
      eligibleAmount: BigInt(0),
    }
  }

  // Criterion 2: Payment must be captured
  const payment = Array.isArray(booking.payments) ? booking.payments[0] : booking.payments
  if (!payment || payment.status !== 'captured') {
    return {
      eligible: false,
      bookingId,
      reason: `Payment status is '${payment?.status}', expected 'captured'`,
      eligibleAmount: BigInt(0),
    }
  }

  // Criterion 3: Cooldown period must have passed
  const scheduledEnd = new Date(booking.scheduled_end_at)
  const cooldownMs = config.payoutCooldownHours * 60 * 60 * 1000
  const eligibleAfter = new Date(scheduledEnd.getTime() + cooldownMs)
  const now = new Date()

  if (now < eligibleAfter) {
    return {
      eligible: false,
      bookingId,
      reason: `Cooldown not complete. Eligible after ${eligibleAfter.toISOString()}`,
      eligibleAmount: BigInt(0),
    }
  }

  // Criterion 4: No open dispute
  const { data: openDispute } = await admin
    .from('dispute_resolutions')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('status', 'open')
    .maybeSingle()

  if (openDispute) {
    return {
      eligible: false,
      bookingId,
      reason: 'Booking has an open dispute',
      eligibleAmount: BigInt(0),
    }
  }

  // Criterion 5: Not already in a submitted/completed batch
  // First, find all booking_payout_items for this booking
  const { data: bookingPayoutLinks } = await admin
    .from('booking_payout_items')
    .select('payout_batch_item_id')
    .eq('booking_id', bookingId)

  if (bookingPayoutLinks && bookingPayoutLinks.length > 0) {
    const itemIds = bookingPayoutLinks.map((link) => link.payout_batch_item_id).filter(Boolean)
    if (itemIds.length > 0) {
      const { data: batchItems } = await admin
        .from('payout_batch_items')
        .select('id, batch_id, payout_batches!inner(status)')
        .in('id', itemIds)

      const hasActiveBatch = batchItems?.some((item) => {
        const batch = Array.isArray(item.payout_batches)
          ? item.payout_batches[0]
          : item.payout_batches
        return ['submitted', 'processing', 'completed'].includes(batch?.status)
      })

      if (hasActiveBatch) {
        return {
          eligible: false,
          bookingId,
          reason: 'Booking already included in a submitted/completed payout batch',
          eligibleAmount: BigInt(0),
        }
      }
    }
  }

  // Criterion 6: Professional must be active
  const professionalId = booking.professional_id
  const { data: trolleyRecipient } = await admin
    .from('trolley_recipients')
    .select('is_active, kyc_status')
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (!trolleyRecipient || !trolleyRecipient.is_active) {
    return {
      eligible: false,
      bookingId,
      reason: 'Professional has no active Trolley recipient profile',
      eligibleAmount: BigInt(0),
    }
  }

  if (trolleyRecipient.kyc_status !== 'approved') {
    return {
      eligible: false,
      bookingId,
      reason: `Professional KYC status is '${trolleyRecipient.kyc_status}', expected 'approved'`,
      eligibleAmount: BigInt(0),
    }
  }

  // All criteria met
  return {
    eligible: true,
    bookingId,
    eligibleAmount: BigInt(payment.amount_total_minor ?? 0),
  }
}

// ---------------------------------------------------------------------------
// Professional Eligibility
// ---------------------------------------------------------------------------

export interface ProfessionalEligibilityResult {
  eligible: boolean
  professionalId: string
  reason?: string
  totalEligibleAmount: bigint
  bookingIds: string[]
}

// ---------------------------------------------------------------------------
// Periodicity check
// ---------------------------------------------------------------------------

/**
 * Determine if a professional should receive a payout now based on their
 * chosen periodicity and last payout date.
 *
 * - weekly:  eligible if last payout was >= 7 days ago (or never)
 * - biweekly: eligible if last payout was >= 14 days ago (or never)
 * - monthly:  eligible if last payout was >= 30 days ago (or never)
 */
export function shouldProfessionalReceivePayoutNow(
  periodicity: PayoutPeriodicity,
  lastPayoutAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!lastPayoutAt) {
    return true // First payout — always eligible
  }

  const last = new Date(lastPayoutAt)
  const msSince = now.getTime() - last.getTime()

  switch (periodicity) {
    case 'weekly':
      return msSince >= 7 * 24 * 60 * 60 * 1000
    case 'biweekly':
      return msSince >= 14 * 24 * 60 * 60 * 1000
    case 'monthly':
      return msSince >= 30 * 24 * 60 * 60 * 1000
    default:
      // Unknown periodicity — default to weekly behavior
      return msSince >= 7 * 24 * 60 * 60 * 1000
  }
}

/**
 * Check if a professional is eligible to receive payouts.
 *
 * This checks:
 * 1. Professional has active Trolley profile
 * 2. Professional balance debt is below threshold
 * 3. Professional has eligible bookings
 */
export async function checkProfessionalEligibility(
  admin: SupabaseClient,
  professionalId: string,
  config: EligibilityConfig = DEFAULT_ELIGIBILITY_CONFIG,
  now: Date = new Date(),
): Promise<ProfessionalEligibilityResult> {
  // Check balance/debt
  const balance = await getProfessionalBalance(admin, professionalId)
  if (balance) {
    const payoutCheck = canReceivePayouts(balance, config.maxProfessionalDebt)
    if (!payoutCheck.eligible) {
      return {
        eligible: false,
        professionalId,
        reason: payoutCheck.reason,
        totalEligibleAmount: BigInt(0),
        bookingIds: [],
      }
    }
  }

  // Check payout periodicity
  const { data: settings } = await admin
    .from('professional_settings')
    .select('payout_periodicity')
    .eq('professional_id', professionalId)
    .maybeSingle()

  const periodicity = (settings?.payout_periodicity || 'weekly') as PayoutPeriodicity
  const lastPayoutAt = balance?.lastPayoutAt

  if (!shouldProfessionalReceivePayoutNow(periodicity, lastPayoutAt, now)) {
    const nextPayout = new Date(
      new Date(lastPayoutAt!).getTime() +
        (periodicity === 'biweekly' ? 14 : periodicity === 'monthly' ? 30 : 7) *
          24 * 60 * 60 * 1000,
    )
    return {
      eligible: false,
      professionalId,
      reason: `Payout periodicity is '${periodicity}'. Next eligible payout: ${nextPayout.toISOString()}`,
      totalEligibleAmount: BigInt(0),
      bookingIds: [],
    }
  }

  // Find all eligible bookings for this professional
  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id')
    .eq('professional_id', professionalId)
    .eq('status', 'completed')
    .order('scheduled_end_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to load bookings for professional ${professionalId}: ${error.message}`)
  }

  const eligibleBookings: string[] = []
  let totalAmount = BigInt(0)

  for (const booking of bookings ?? []) {
    const result = await checkBookingEligibility(admin, booking.id, config)
    if (result.eligible) {
      eligibleBookings.push(booking.id)
      totalAmount = totalAmount + result.eligibleAmount
    }
  }

  if (eligibleBookings.length === 0) {
    return {
      eligible: false,
      professionalId,
      reason: 'No eligible bookings found',
      totalEligibleAmount: BigInt(0),
      bookingIds: [],
    }
  }

  if (totalAmount < config.minPayoutAmount) {
    return {
      eligible: false,
      professionalId,
      reason: `Total eligible amount (${totalAmount}) is below minimum payout (${config.minPayoutAmount})`,
      totalEligibleAmount: totalAmount,
      bookingIds: eligibleBookings,
    }
  }

  return {
    eligible: true,
    professionalId,
    totalEligibleAmount: totalAmount,
    bookingIds: eligibleBookings,
  }
}

// ---------------------------------------------------------------------------
// Batch Eligibility Scan
// ---------------------------------------------------------------------------

export interface BatchEligibilityScanResult {
  eligibleProfessionals: ProfessionalEligibilityResult[]
  ineligibleProfessionals: ProfessionalEligibilityResult[]
  totalBatchAmount: bigint
}

/**
 * Scan all professionals and find those eligible for payout.
 *
 * This is called by the Inngest cron job that creates payout batches.
 */
export async function scanPayoutEligibility(
  admin: SupabaseClient,
  config: EligibilityConfig = DEFAULT_ELIGIBILITY_CONFIG,
): Promise<BatchEligibilityScanResult> {
  // Find all professionals with active Trolley profiles
  const { data: professionals, error } = await admin
    .from('trolley_recipients')
    .select('professional_id')
    .eq('is_active', true)
    .eq('kyc_status', 'approved')

  if (error) {
    throw new Error(`Failed to load active professionals: ${error.message}`)
  }

  const eligible: ProfessionalEligibilityResult[] = []
  const ineligible: ProfessionalEligibilityResult[] = []
  let totalAmount = BigInt(0)

  for (const row of professionals ?? []) {
    const result = await checkProfessionalEligibility(admin, row.professional_id, config)
    if (result.eligible) {
      eligible.push(result)
      totalAmount = totalAmount + result.totalEligibleAmount
    } else {
      ineligible.push(result)
    }
  }

  return {
    eligibleProfessionals: eligible,
    ineligibleProfessionals: ineligible,
    totalBatchAmount: totalAmount,
  }
}
