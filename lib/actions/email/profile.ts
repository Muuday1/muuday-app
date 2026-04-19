'use server'

import { z } from 'zod'
import { sendNewReviewEmail, sendIncompleteProfileReminderEmail } from '@/lib/email/resend'
import {
  emailSchema,
  personNameSchema,
  shortOptionalMessageSchema,
  ratingSchema,
  missingItemsSchema,
  parsePayload,
  safe,
  requireAuth,
} from './shared'

export async function sendNewReviewEmailAction(
  to: string, professionalName: string,
  clientName: string, rating: number, comment: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      professionalName: personNameSchema,
      clientName: personNameSchema,
      rating: ratingSchema,
      comment: shortOptionalMessageSchema,
    }),
    { to, professionalName, clientName, rating, comment },
  )
  if (!payload) return
  if (!await requireAuth()) return
  return safe(() => sendNewReviewEmail(payload.to, payload.professionalName, payload.clientName, payload.rating, payload.comment), 'newReview')
}

export async function sendIncompleteProfileReminderEmailAction(
  to: string, professionalName: string, missingItems: string[],
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      professionalName: personNameSchema,
      missingItems: missingItemsSchema,
    }),
    { to, professionalName, missingItems },
  )
  if (!payload) return
  if (!await requireAuth()) return
  return safe(() => sendIncompleteProfileReminderEmail(payload.to, payload.professionalName, payload.missingItems), 'incompleteProfile')
}
