import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  emailSchema,
  personNameSchema,
  displayTextSchema,
  messageSchema,
  shortOptionalMessageSchema,
  dateSchema,
  timeSchema,
  timezoneSchema,
  amountSchema,
  urlSchema,
  optionalUserIdSchema,
  optionalCallToActionSubSchema,
  cancelledBySchema,
  rescheduledBySchema,
  ratingSchema,
  missingItemsSchema,
  getValidationError,
  safe,
  parsePayload,
  assertCallerCanEmailRecipientService,
  canSendService,
  type NotifKey,
} from '@/lib/email/email-action-service'

export {
  emailSchema,
  personNameSchema,
  displayTextSchema,
  messageSchema,
  shortOptionalMessageSchema,
  dateSchema,
  timeSchema,
  timezoneSchema,
  amountSchema,
  urlSchema,
  optionalUserIdSchema,
  optionalCallToActionSubSchema,
  cancelledBySchema,
  rescheduledBySchema,
  ratingSchema,
  missingItemsSchema,
  getValidationError,
  safe,
  parsePayload,
  type NotifKey,
}

// Auth guard - ensures only authenticated users can trigger emails + rate limit
export async function requireAuth(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    Sentry.captureException(authError, { tags: { area: 'email_shared' } })
  }
  if (!user) return null

  const rl = await rateLimit('email', user.id)
  if (!rl.allowed) return null

  return user.id
}

/**
 * Security: Verify the caller has a legitimate relationship with the recipient.
 * Prevents IDOR where an authenticated user sends Muuday-branded emails to arbitrary addresses.
 * Returns true if the email is allowed, false otherwise.
 */
export async function assertCallerCanEmailRecipient(callerId: string, recipientEmail: string): Promise<boolean> {
  const supabase = await createClient()
  return assertCallerCanEmailRecipientService(supabase, callerId, recipientEmail)
}

// Returns false if the user has explicitly disabled this category
export async function canSend(userId: string | null | undefined, key: NotifKey): Promise<boolean> {
  const supabase = await createClient()
  return canSendService(supabase, userId, key)
}
