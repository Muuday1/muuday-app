'use server'

import { z } from 'zod'
import {
  sendWelcomeEmail,
  sendCompleteAccountEmail,
  addContactToResend,
  SEGMENTS,
  sendBookingConfirmationEmail,
  sendNewBookingToProfessionalEmail,
  sendSessionReminder24hEmail,
  sendSessionReminder1hEmail,
  sendProfessionalReminder24hEmail,
  sendBookingCancelledEmail,
  sendPaymentConfirmationEmail,
  sendPaymentFailedEmail,
  sendRefundEmail,
  sendNewReviewEmail,
  sendNewsletterEmail,
  sendRequestReviewEmail,
  sendRescheduledEmail,
  sendIncompleteProfileReminderEmail,
  sendWaitlistConfirmationEmail,
  sendWelcomeSeries1Email,
  sendWelcomeSeries2Email,
  sendWelcomeSeries3Email,
  sendReferralInviteEmail,
  sendFirstBookingNudgeEmail,
  sendReengagementEmail,
  sendLaunchEmail,
} from '@/lib/email/resend'
import {
  emailSchema,
  personNameSchema,
  displayTextSchema,
  dateSchema,
  timeSchema,
  timezoneSchema,
  amountSchema,
  optionalUserIdSchema,
  optionalCallToActionSubSchema,
  cancelledBySchema,
  rescheduledBySchema,
  ratingSchema,
  missingItemsSchema,
  parsePayload,
  safe,
  requireAuth,
  assertCallerCanEmailRecipient,
  canSend,
} from './email/shared'

// --- Audience management --------------------------------------------------
export async function addUserToResendAction(email: string, firstName: string) {
  const payload = parsePayload(
    z.object({
      email: emailSchema,
      firstName: personNameSchema,
    }),
    { email, firstName },
  )
  if (!payload) return
  if (!await requireAuth()) return
  return safe(() => addContactToResend(payload.email, payload.firstName, SEGMENTS.usuarios), 'addContact')
}

// --- Transactional: Auth --------------------------------------------------
export async function sendWelcomeEmailAction(to: string, name: string) {
  const payload = parsePayload(z.object({ to: emailSchema, name: personNameSchema }), { to, name })
  if (!payload) return
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, payload.to)) return
  void safe(() => addContactToResend(payload.to, payload.name, SEGMENTS.usuarios), 'addContact')
  return safe(() => sendWelcomeEmail(payload.to, payload.name), 'welcome')
}

export async function sendCompleteAccountEmailAction(to: string, name: string) {
  const payload = parsePayload(z.object({ to: emailSchema, name: personNameSchema }), { to, name })
  if (!payload) return
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, payload.to)) return
  return safe(() => sendCompleteAccountEmail(payload.to, payload.name), 'completeAccount')
}

// --- Transactional: Booking -----------------------------------------------
export async function sendBookingConfirmationEmailAction(
  to: string, name: string, professionalName: string, service: string,
  date: string, time: string, timezone: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      professionalName: personNameSchema,
      service: displayTextSchema,
      date: dateSchema,
      time: timeSchema,
      timezone: timezoneSchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, professionalName, service, date, time, timezone, userId },
  )
  if (!payload) return
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, payload.to)) return
  if (!await canSend(payload.userId, 'booking_emails')) return
  return safe(() => sendBookingConfirmationEmail(payload.to, payload.name, payload.professionalName, payload.service, payload.date, payload.time, payload.timezone), 'bookingConfirmation')
}

export async function sendNewBookingToProfessionalEmailAction(
  to: string, professionalName: string, clientName: string,
  service: string, date: string, time: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      professionalName: personNameSchema,
      clientName: personNameSchema,
      service: displayTextSchema,
      date: dateSchema,
      time: timeSchema,
    }),
    { to, professionalName, clientName, service, date, time },
  )
  if (!payload) return
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, payload.to)) return
  return safe(() => sendNewBookingToProfessionalEmail(payload.to, payload.professionalName, payload.clientName, payload.service, payload.date, payload.time), 'newBookingProfessional')
}

export async function sendBookingCancelledEmailAction(
  to: string, name: string, professionalName: string,
  date: string, time: string, cancelledBy: 'user' | 'professional',
  userId?: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      professionalName: personNameSchema,
      date: dateSchema,
      time: timeSchema,
      cancelledBy: cancelledBySchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, professionalName, date, time, cancelledBy, userId },
  )
  if (!payload) return
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, payload.to)) return
  if (!await canSend(payload.userId, 'booking_emails')) return
  return safe(() => sendBookingCancelledEmail(payload.to, payload.name, payload.professionalName, payload.date, payload.time, payload.cancelledBy), 'bookingCancelled')
}

// --- Transactional: Payment -----------------------------------------------
export async function sendPaymentConfirmationEmailAction(
  to: string, name: string, professionalName: string,
  service: string, amount: string, date: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      professionalName: personNameSchema,
      service: displayTextSchema,
      amount: amountSchema,
      date: dateSchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, professionalName, service, amount, date, userId },
  )
  if (!payload) return
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, payload.to)) return
  if (!await canSend(payload.userId, 'booking_emails')) return
  return safe(() => sendPaymentConfirmationEmail(payload.to, payload.name, payload.professionalName, payload.service, payload.amount, payload.date), 'paymentConfirmation')
}

export async function sendPaymentFailedEmailAction(to: string, name: string, service: string, userId?: string) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      service: displayTextSchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, service, userId },
  )
  if (!payload) return
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, payload.to)) return
  return safe(() => sendPaymentFailedEmail(payload.to, payload.name, payload.service), 'paymentFailed')
}

export async function sendRefundEmailAction(to: string, name: string, amount: string, service: string, userId?: string) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      amount: amountSchema,
      service: displayTextSchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, amount, service, userId },
  )
  if (!payload) return
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, payload.to)) return
  if (!await canSend(payload.userId, 'booking_emails')) return
  return safe(() => sendRefundEmail(payload.to, payload.name, payload.amount, payload.service), 'refund')
}

// --- Transactional: Profile & Reviews -------------------------------------
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
      comment: z.string().trim().max(1200, 'Texto muito longo.'),
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

// --- Reminders ------------------------------------------------------------
export async function sendSessionReminder24hEmailAction(
  to: string, name: string, professionalName: string, service: string,
  date: string, time: string, timezone: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      professionalName: personNameSchema,
      service: displayTextSchema,
      date: dateSchema,
      time: timeSchema,
      timezone: timezoneSchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, professionalName, service, date, time, timezone, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'session_reminders')) return
  return safe(() => sendSessionReminder24hEmail(payload.to, payload.name, payload.professionalName, payload.service, payload.date, payload.time, payload.timezone), 'reminder24h')
}

export async function sendSessionReminder1hEmailAction(
  to: string, name: string, professionalName: string, time: string, timezone: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      professionalName: personNameSchema,
      time: timeSchema,
      timezone: timezoneSchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, professionalName, time, timezone, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'session_reminders')) return
  return safe(() => sendSessionReminder1hEmail(payload.to, payload.name, payload.professionalName, payload.time, payload.timezone), 'reminder1h')
}

export async function sendProfessionalReminder24hEmailAction(
  to: string, professionalName: string, clientName: string,
  service: string, date: string, time: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      professionalName: personNameSchema,
      clientName: personNameSchema,
      service: displayTextSchema,
      date: dateSchema,
      time: timeSchema,
    }),
    { to, professionalName, clientName, service, date, time },
  )
  if (!payload) return
  if (!await requireAuth()) return
  return safe(() => sendProfessionalReminder24hEmail(payload.to, payload.professionalName, payload.clientName, payload.service, payload.date, payload.time), 'professionalReminder24h')
}

export async function sendRequestReviewEmailAction(
  to: string, name: string, professionalName: string, service: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      professionalName: personNameSchema,
      service: displayTextSchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, professionalName, service, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'session_reminders')) return
  return safe(() => sendRequestReviewEmail(payload.to, payload.name, payload.professionalName, payload.service), 'requestReview')
}

// --- Reschedule -----------------------------------------------------------
export async function sendRescheduledEmailAction(
  to: string, name: string, professionalName: string, service: string,
  oldDate: string, oldTime: string, newDate: string, newTime: string,
  timezone: string, rescheduledBy: 'user' | 'professional',
  userId?: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      professionalName: personNameSchema,
      service: displayTextSchema,
      oldDate: dateSchema,
      oldTime: timeSchema,
      newDate: dateSchema,
      newTime: timeSchema,
      timezone: timezoneSchema,
      rescheduledBy: rescheduledBySchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, professionalName, service, oldDate, oldTime, newDate, newTime, timezone, rescheduledBy, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'booking_emails')) return
  return safe(() => sendRescheduledEmail(payload.to, payload.name, payload.professionalName, payload.service, payload.oldDate, payload.oldTime, payload.newDate, payload.newTime, payload.timezone, payload.rescheduledBy), 'rescheduled')
}

// --- Marketing & Lifecycle (news_promotions) ------------------------------
export async function sendNewsletterEmailAction(
  to: string, name: string, subject: string, badge: string,
  headline: string, body: string, ctaLabel: string, ctaUrl: string, ctaSub?: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      name: personNameSchema,
      subject: displayTextSchema,
      badge: z.string().trim().min(1).max(40),
      headline: z.string().trim().min(1).max(180),
      body: z.string().trim().min(1).max(1200, 'Texto muito longo.'),
      ctaLabel: z.string().trim().min(1).max(80),
      ctaUrl: z.string().trim().url('URL inválida.').max(500, 'URL muito longa.'),
      ctaSub: optionalCallToActionSubSchema,
      userId: optionalUserIdSchema,
    }),
    { to, name, subject, badge, headline, body, ctaLabel, ctaUrl, ctaSub, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'news_promotions')) return
  return safe(() => sendNewsletterEmail(payload.to, payload.name, payload.subject, payload.badge, payload.headline, payload.body, payload.ctaLabel, payload.ctaUrl, payload.ctaSub), 'newsletter')
}

export async function sendWaitlistConfirmationEmailAction(to: string, name: string) {
  const payload = parsePayload(z.object({ to: emailSchema, name: personNameSchema }), { to, name })
  if (!payload) return
  // No auth required - called from public waitlist API route (which has its own rate limiting)
  return safe(() => sendWaitlistConfirmationEmail(payload.to, payload.name), 'waitlistConfirmation')
}

export async function sendWelcomeSeries1EmailAction(to: string, name: string, userId?: string) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'news_promotions')) return
  return safe(() => sendWelcomeSeries1Email(payload.to, payload.name), 'welcomeSeries1')
}

export async function sendWelcomeSeries2EmailAction(to: string, name: string, userId?: string) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'news_promotions')) return
  return safe(() => sendWelcomeSeries2Email(payload.to, payload.name), 'welcomeSeries2')
}

export async function sendWelcomeSeries3EmailAction(to: string, name: string, userId?: string) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'news_promotions')) return
  return safe(() => sendWelcomeSeries3Email(payload.to, payload.name), 'welcomeSeries3')
}

export async function sendReferralInviteEmailAction(
  to: string, inviterName: string, referralLink: string,
) {
  const payload = parsePayload(
    z.object({
      to: emailSchema,
      inviterName: personNameSchema,
      referralLink: z.string().trim().url('URL inválida.').max(500, 'URL muito longa.'),
    }),
    { to, inviterName, referralLink },
  )
  if (!payload) return

  const callerId = await requireAuth()
  if (!callerId) return

  // Referral invites are intentionally sent to external emails, but we verify
  // the inviterName matches the caller's profile to prevent impersonation
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: callerProfile, error: callerError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', callerId)
    .single()

  if (callerError) {
    console.error('[email] caller profile query error:', callerError.message)
  }

  if (!callerProfile || callerProfile.full_name !== payload.inviterName) return
  return safe(() => sendReferralInviteEmail(payload.to, payload.inviterName, payload.referralLink), 'referralInvite')
}

export async function sendFirstBookingNudgeEmailAction(to: string, name: string, userId?: string) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'news_promotions')) return
  return safe(() => sendFirstBookingNudgeEmail(payload.to, payload.name), 'firstBookingNudge')
}

export async function sendReengagementEmailAction(to: string, name: string, userId?: string) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'news_promotions')) return
  return safe(() => sendReengagementEmail(payload.to, payload.name), 'reengagement')
}

export async function sendLaunchEmailAction(to: string, name: string, userId?: string) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await requireAuth()) return
  if (!await canSend(payload.userId, 'news_promotions')) return
  return safe(() => sendLaunchEmail(payload.to, payload.name), 'launch')
}
