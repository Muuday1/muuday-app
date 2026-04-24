'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth, assertCallerCanEmailRecipient } from './email/shared'
import {
  addUserToResendService,
  sendWelcomeEmailService,
  sendCompleteAccountEmailService,
  sendBookingConfirmationEmailService,
  sendNewBookingToProfessionalEmailService,
  sendBookingCancelledEmailService,
  sendPaymentConfirmationEmailService,
  sendPaymentFailedEmailService,
  sendRefundEmailService,
  sendNewReviewEmailService,
  sendIncompleteProfileReminderEmailService,
  sendSessionReminder24hEmailService,
  sendSessionReminder1hEmailService,
  sendProfessionalReminder24hEmailService,
  sendRequestReviewEmailService,
  sendRescheduledEmailService,
  sendNewsletterEmailService,
  sendWaitlistConfirmationEmailService,
  sendWelcomeSeries1EmailService,
  sendWelcomeSeries2EmailService,
  sendWelcomeSeries3EmailService,
  sendReferralInviteEmailService,
  sendFirstBookingNudgeEmailService,
  sendReengagementEmailService,
  sendLaunchEmailService,
} from '@/lib/email/email-action-service'

// --- Audience management --------------------------------------------------
export async function addUserToResendAction(email: string, firstName: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  const supabase = await createClient()
  return addUserToResendService(supabase, callerId, email, firstName)
}

// --- Transactional: Auth --------------------------------------------------
export async function sendWelcomeEmailAction(to: string, name: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  const supabase = await createClient()
  return sendWelcomeEmailService(supabase, callerId, to, name)
}

export async function sendCompleteAccountEmailAction(to: string, name: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  const supabase = await createClient()
  return sendCompleteAccountEmailService(supabase, callerId, to, name)
}

// --- Transactional: Booking -----------------------------------------------
export async function sendBookingConfirmationEmailAction(
  to: string, name: string, professionalName: string, service: string,
  date: string, time: string, timezone: string,
  userId?: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  const supabase = await createClient()
  return sendBookingConfirmationEmailService(supabase, callerId, to, name, professionalName, service, date, time, timezone, userId)
}

export async function sendNewBookingToProfessionalEmailAction(
  to: string, professionalName: string, clientName: string,
  service: string, date: string, time: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  const supabase = await createClient()
  return sendNewBookingToProfessionalEmailService(supabase, callerId, to, professionalName, clientName, service, date, time)
}

export async function sendBookingCancelledEmailAction(
  to: string, name: string, professionalName: string,
  date: string, time: string, cancelledBy: 'user' | 'professional',
  userId?: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  const supabase = await createClient()
  return sendBookingCancelledEmailService(supabase, callerId, to, name, professionalName, date, time, cancelledBy, userId)
}

// --- Transactional: Payment -----------------------------------------------
export async function sendPaymentConfirmationEmailAction(
  to: string, name: string, professionalName: string,
  service: string, amount: string, date: string,
  userId?: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  const supabase = await createClient()
  return sendPaymentConfirmationEmailService(supabase, callerId, to, name, professionalName, service, amount, date, userId)
}

export async function sendPaymentFailedEmailAction(to: string, name: string, service: string, userId?: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  const supabase = await createClient()
  return sendPaymentFailedEmailService(supabase, callerId, to, name, service, userId)
}

export async function sendRefundEmailAction(to: string, name: string, amount: string, service: string, userId?: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  const supabase = await createClient()
  return sendRefundEmailService(supabase, callerId, to, name, amount, service, userId)
}

// --- Transactional: Profile & Reviews -------------------------------------
export async function sendNewReviewEmailAction(
  to: string, professionalName: string,
  clientName: string, rating: number, comment: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendNewReviewEmailService(supabase, callerId, to, professionalName, clientName, rating, comment)
}

export async function sendIncompleteProfileReminderEmailAction(
  to: string, professionalName: string, missingItems: string[],
) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendIncompleteProfileReminderEmailService(supabase, callerId, to, professionalName, missingItems)
}

// --- Reminders ------------------------------------------------------------
export async function sendSessionReminder24hEmailAction(
  to: string, name: string, professionalName: string, service: string,
  date: string, time: string, timezone: string,
  userId?: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendSessionReminder24hEmailService(supabase, callerId, to, name, professionalName, service, date, time, timezone, userId)
}

export async function sendSessionReminder1hEmailAction(
  to: string, name: string, professionalName: string, time: string, timezone: string,
  userId?: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendSessionReminder1hEmailService(supabase, callerId, to, name, professionalName, time, timezone, userId)
}

export async function sendProfessionalReminder24hEmailAction(
  to: string, professionalName: string, clientName: string,
  service: string, date: string, time: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendProfessionalReminder24hEmailService(supabase, callerId, to, professionalName, clientName, service, date, time)
}

export async function sendRequestReviewEmailAction(
  to: string, name: string, professionalName: string, service: string,
  userId?: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendRequestReviewEmailService(supabase, callerId, to, name, professionalName, service, userId)
}

// --- Reschedule -----------------------------------------------------------
export async function sendRescheduledEmailAction(
  to: string, name: string, professionalName: string, service: string,
  oldDate: string, oldTime: string, newDate: string, newTime: string,
  timezone: string, rescheduledBy: 'user' | 'professional',
  userId?: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendRescheduledEmailService(supabase, callerId, to, name, professionalName, service, oldDate, oldTime, newDate, newTime, timezone, rescheduledBy, userId)
}

// --- Marketing & Lifecycle (news_promotions) ------------------------------
export async function sendNewsletterEmailAction(
  to: string, name: string, subject: string, badge: string,
  headline: string, body: string, ctaLabel: string, ctaUrl: string, ctaSub?: string,
  userId?: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendNewsletterEmailService(supabase, callerId, to, name, subject, badge, headline, body, ctaLabel, ctaUrl, ctaSub, userId)
}

export async function sendWaitlistConfirmationEmailAction(to: string, name: string) {
  return sendWaitlistConfirmationEmailService(to, name)
}

export async function sendWelcomeSeries1EmailAction(to: string, name: string, userId?: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendWelcomeSeries1EmailService(supabase, callerId, to, name, userId)
}

export async function sendWelcomeSeries2EmailAction(to: string, name: string, userId?: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendWelcomeSeries2EmailService(supabase, callerId, to, name, userId)
}

export async function sendWelcomeSeries3EmailAction(to: string, name: string, userId?: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendWelcomeSeries3EmailService(supabase, callerId, to, name, userId)
}

export async function sendReferralInviteEmailAction(
  to: string, inviterName: string, referralLink: string,
) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendReferralInviteEmailService(supabase, callerId, to, inviterName, referralLink)
}

export async function sendFirstBookingNudgeEmailAction(to: string, name: string, userId?: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendFirstBookingNudgeEmailService(supabase, callerId, to, name, userId)
}

export async function sendReengagementEmailAction(to: string, name: string, userId?: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendReengagementEmailService(supabase, callerId, to, name, userId)
}

export async function sendLaunchEmailAction(to: string, name: string, userId?: string) {
  const callerId = await requireAuth()
  if (!callerId) return
  if (!await assertCallerCanEmailRecipient(callerId, to)) return
  const supabase = await createClient()
  return sendLaunchEmailService(supabase, callerId, to, name, userId)
}
