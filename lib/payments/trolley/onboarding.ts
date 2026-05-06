/**
 * Trolley Onboarding — Muuday Payments Engine
 *
 * Handles professional onboarding to Trolley for receiving payouts.
 * Muuday backend is the SOLE ORCHESTRATOR.
 *
 * Flow:
 * 1. Professional clicks "Configurar Pagamento" in dashboard
 * 2. Server action creates Trolley recipient via API
 * 3. Recipient record inserted into trolley_recipients table
 * 4. Professional completes KYC in Trolley portal
 * 5. Webhook updates kyc_status → approved → is_active = true
 *
 * MVP: PayPal-only.
 * IMPORTANT: Trolley is currently configured for PayPal payouts only.
 * Bank transfer is supported in the schema (trolley_recipients.payout_method CHECK)
 * but NOT enabled in the Trolley account. When enabled, update:
 *   - createProfessionalTrolleyRecipient() to accept payoutMethod param
 *   - PayoutStatusCard to show bank transfer option
 *   - This comment to reflect the new default
 */

import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createTrolleyRecipient, getTrolleyRecipient } from './client'

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export interface OnboardingResult {
  success: boolean
  recipientId?: string
  kycStatus?: string
  isActive?: boolean
  error?: string
  alreadyExists?: boolean
}

/**
 * Create a Trolley recipient for a professional.
 *
 * Idempotent: if recipient already exists, returns existing record.
 */
export async function createProfessionalTrolleyRecipient(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<OnboardingResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured' }
  }

  // Check if professional already has a trolley recipient
  const { data: existing } = await admin
    .from('trolley_recipients')
    .select('id, trolley_recipient_id, kyc_status, is_active')
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (existing) {
    return {
      success: true,
      recipientId: existing.trolley_recipient_id,
      kycStatus: existing.kyc_status,
      isActive: existing.is_active,
      alreadyExists: true,
    }
  }

  // Get professional with profile for email and name
  const { data: professional, error: proError } = await admin
    .from('professionals')
    .select('id, user_id, profiles!professionals_user_id_fkey(email, full_name, first_name, last_name)')
    .eq('id', professionalId)
    .maybeSingle()

  if (proError || !professional) {
    return { success: false, error: `Professional not found: ${proError?.message}` }
  }

  // Extract profile data — profiles comes as an array or object depending on Supabase version
  const profiles = (professional as Record<string, unknown>).profiles
  const profile = Array.isArray(profiles) ? profiles[0] : profiles
  const email = asString((profile as Record<string, unknown>)?.email)
  const fullName = asString((profile as Record<string, unknown>)?.full_name)
  const firstName = asString((profile as Record<string, unknown>)?.first_name)
  const lastName = asString((profile as Record<string, unknown>)?.last_name)

  if (!email) {
    return { success: false, error: 'Professional has no email address' }
  }

  try {
    // Create recipient in Trolley
    const recipient = await createTrolleyRecipient({
      email,
      firstName: firstName || fullName?.split(' ')[0] || 'Profissional',
      lastName: lastName || fullName?.split(' ').slice(1).join(' ') || 'Muuday',
      referenceId: professionalId,
    })

    // Insert into local database
    const { error: insertError } = await admin.from('trolley_recipients').insert({
      professional_id: professionalId,
      trolley_recipient_id: recipient.id,
      email,
      payout_method: 'paypal',
      kyc_status: 'pending',
      is_active: false,
      metadata: {
        source: 'onboarding_api',
        trolley_response: recipient,
      },
    })

    if (insertError) {
      // Try to clean up Trolley recipient? (best effort)
      Sentry.captureException(insertError, { tags: { area: 'trolley_onboarding', subArea: 'insert_recipient' } })
      return {
        success: false,
        error: `Failed to save recipient locally: ${insertError.message}`,
      }
    }

    return {
      success: true,
      recipientId: recipient.id,
      kycStatus: 'pending',
      isActive: false,
      alreadyExists: false,
    }
  } catch (apiError) {
    const errorMsg = apiError instanceof Error ? apiError.message : String(apiError)
    Sentry.captureException(apiError instanceof Error ? apiError : new Error(errorMsg), { tags: { area: 'trolley_onboarding', subArea: 'api' } })
    return { success: false, error: `Trolley API error: ${errorMsg}` }
  }
}

/**
 * Get the onboarding status for a professional.
 */
export async function getProfessionalPayoutStatus(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<{
  hasRecipient: boolean
  kycStatus?: string
  isActive?: boolean
  payoutMethod?: string
  paypalEmail?: string
}> {
  const { data } = await supabase
    .from('trolley_recipients')
    .select('kyc_status, is_active, payout_method, paypal_email')
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (!data) {
    return { hasRecipient: false }
  }

  return {
    hasRecipient: true,
    kycStatus: data.kyc_status,
    isActive: data.is_active,
    payoutMethod: data.payout_method,
    paypalEmail: data.paypal_email,
  }
}

/**
 * Refresh a professional's Trolley recipient status from the Trolley API.
 * Useful for manual sync or polling.
 */
export async function syncTrolleyRecipientStatus(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<OnboardingResult> {
  const admin = createAdminClient()
  if (!admin) {
    return { success: false, error: 'Admin client not configured' }
  }

  const { data: localRecipient } = await admin
    .from('trolley_recipients')
    .select('trolley_recipient_id')
    .eq('professional_id', professionalId)
    .maybeSingle()

  if (!localRecipient?.trolley_recipient_id) {
    return { success: false, error: 'No Trolley recipient found for this professional' }
  }

  try {
    const remote = await getTrolleyRecipient(localRecipient.trolley_recipient_id)

    // Map Trolley status to our KYC status
    let kycStatus: 'pending' | 'in_review' | 'approved' | 'rejected' = 'pending'
    let isActive = false

    switch (remote.status) {
      case 'active':
        kycStatus = 'approved'
        isActive = true
        break
      case 'incomplete':
        kycStatus = 'in_review'
        break
      case 'inactive':
        kycStatus = 'rejected'
        break
      default:
        kycStatus = 'pending'
    }

    const { error: updateError } = await admin
      .from('trolley_recipients')
      .update({
        kyc_status: kycStatus,
        is_active: isActive,
        payout_method: remote.payoutMethod || 'paypal',
        paypal_email: remote.paypalEmail,
        updated_at: new Date().toISOString(),
        ...(isActive ? { activated_at: new Date().toISOString() } : {}),
      })
      .eq('professional_id', professionalId)

    if (updateError) {
      return { success: false, error: `Failed to update local record: ${updateError.message}` }
    }

    // Sync KYC completion to professional_settings so onboarding gates recognize it
    if (isActive) {
      try {
        await admin
          .from('professional_settings')
          .update({ payout_kyc_completed: true, updated_at: new Date().toISOString() })
          .eq('professional_id', professionalId)
      } catch (settingsErr) {
        // Log but don't fail sync — the trolley_recipients update already succeeded
        Sentry.captureException(settingsErr instanceof Error ? settingsErr : new Error(String(settingsErr)), {
          tags: { area: 'trolley', context: 'payout_kyc_sync' },
          extra: { professionalId },
        })
      }
    }

    return {
      success: true,
      recipientId: remote.id,
      kycStatus,
      isActive,
    }
  } catch (apiError) {
    const errorMsg = apiError instanceof Error ? apiError.message : String(apiError)
    return { success: false, error: `Failed to sync: ${errorMsg}` }
  }
}
