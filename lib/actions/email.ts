'use server'

import { createClient } from '@/lib/supabase/server'
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
  sendProfileApprovedEmail,
  sendProfileRejectedEmail,
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

// helper — swallows errors so a failed email never breaks the main flow
async function safe<T>(fn: () => Promise<T>, label: string) {
  try { return await fn() } catch (e) { console.error(`[email] ${label}`, e) }
}

type NotifKey = 'booking_emails' | 'session_reminders' | 'news_promotions'

// Returns false if the user has explicitly disabled this category
async function canSend(userId: string | null | undefined, key: NotifKey): Promise<boolean> {
  if (!userId) return true // no user context → always send (e.g. professional notifications)
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single()
    const prefs = data?.notification_preferences as Record<string, boolean> | null
    if (!prefs) return true // no prefs saved → default opt-in
    return prefs[key] !== false
  } catch {
    return true // on error → send anyway
  }
}

// ─── Audience management ──────────────────────────────────────────────────
export async function addUserToResendAction(email: string, firstName: string) {
  return safe(() => addContactToResend(email, firstName, SEGMENTS.usuarios), 'addContact')
}

// ─── Transactional ────────────────────────────────────────────────────────
// Welcome & account setup — always send (no preference check)
export async function sendWelcomeEmailAction(to: string, name: string) {
  void safe(() => addContactToResend(to, name, SEGMENTS.usuarios), 'addContact')
  return safe(() => sendWelcomeEmail(to, name), 'welcome')
}
export async function sendCompleteAccountEmailAction(to: string, name: string) {
  return safe(() => sendCompleteAccountEmail(to, name), 'completeAccount')
}

// booking_emails category
export async function sendBookingConfirmationEmailAction(
  to: string, name: string, professionalName: string, service: string,
  date: string, time: string, timezone: string,
  userId?: string,
) {
  if (!await canSend(userId, 'booking_emails')) return
  return safe(() => sendBookingConfirmationEmail(to, name, professionalName, service, date, time, timezone), 'bookingConfirmation')
}
export async function sendNewBookingToProfessionalEmailAction(
  to: string, professionalName: string, clientName: string,
  service: string, date: string, time: string,
) {
  // Professional notifications always send (no user preference)
  return safe(() => sendNewBookingToProfessionalEmail(to, professionalName, clientName, service, date, time), 'newBookingProfessional')
}
export async function sendBookingCancelledEmailAction(
  to: string, name: string, professionalName: string,
  date: string, time: string, cancelledBy: 'user' | 'professional',
  userId?: string,
) {
  if (!await canSend(userId, 'booking_emails')) return
  return safe(() => sendBookingCancelledEmail(to, name, professionalName, date, time, cancelledBy), 'bookingCancelled')
}
export async function sendPaymentConfirmationEmailAction(
  to: string, name: string, professionalName: string,
  service: string, amount: string, date: string,
  userId?: string,
) {
  if (!await canSend(userId, 'booking_emails')) return
  return safe(() => sendPaymentConfirmationEmail(to, name, professionalName, service, amount, date), 'paymentConfirmation')
}
export async function sendPaymentFailedEmailAction(to: string, name: string, service: string, userId?: string) {
  // Payment failures always send regardless of preferences
  return safe(() => sendPaymentFailedEmail(to, name, service), 'paymentFailed')
}
export async function sendRefundEmailAction(to: string, name: string, amount: string, service: string, userId?: string) {
  if (!await canSend(userId, 'booking_emails')) return
  return safe(() => sendRefundEmail(to, name, amount, service), 'refund')
}
export async function sendNewReviewEmailAction(
  to: string, professionalName: string,
  clientName: string, rating: number, comment: string,
) {
  // Professional notifications always send
  return safe(() => sendNewReviewEmail(to, professionalName, clientName, rating, comment), 'newReview')
}

// session_reminders category
export async function sendSessionReminder24hEmailAction(
  to: string, name: string, professionalName: string, service: string,
  date: string, time: string, timezone: string,
  userId?: string,
) {
  if (!await canSend(userId, 'session_reminders')) return
  return safe(() => sendSessionReminder24hEmail(to, name, professionalName, service, date, time, timezone), 'reminder24h')
}
export async function sendSessionReminder1hEmailAction(
  to: string, name: string, professionalName: string, time: string, timezone: string,
  userId?: string,
) {
  if (!await canSend(userId, 'session_reminders')) return
  return safe(() => sendSessionReminder1hEmail(to, name, professionalName, time, timezone), 'reminder1h')
}
export async function sendProfessionalReminder24hEmailAction(
  to: string, professionalName: string, clientName: string,
  service: string, date: string, time: string,
) {
  return safe(() => sendProfessionalReminder24hEmail(to, professionalName, clientName, service, date, time), 'professionalReminder24h')
}
export async function sendRequestReviewEmailAction(
  to: string, name: string, professionalName: string, service: string,
  userId?: string,
) {
  if (!await canSend(userId, 'session_reminders')) return
  return safe(() => sendRequestReviewEmail(to, name, professionalName, service), 'requestReview')
}
export async function sendRescheduledEmailAction(
  to: string, name: string, professionalName: string, service: string,
  oldDate: string, oldTime: string, newDate: string, newTime: string,
  timezone: string, rescheduledBy: 'user' | 'professional',
  userId?: string,
) {
  if (!await canSend(userId, 'booking_emails')) return
  return safe(() => sendRescheduledEmail(to, name, professionalName, service, oldDate, oldTime, newDate, newTime, timezone, rescheduledBy), 'rescheduled')
}

// news_promotions category
export async function sendNewsletterEmailAction(
  to: string, name: string, subject: string, badge: string,
  headline: string, body: string, ctaLabel: string, ctaUrl: string, ctaSub?: string,
  userId?: string,
) {
  if (!await canSend(userId, 'news_promotions')) return
  return safe(() => sendNewsletterEmail(to, name, subject, badge, headline, body, ctaLabel, ctaUrl, ctaSub), 'newsletter')
}
export async function sendIncompleteProfileReminderEmailAction(
  to: string, professionalName: string, missingItems: string[],
) {
  return safe(() => sendIncompleteProfileReminderEmail(to, professionalName, missingItems), 'incompleteProfile')
}

// ─── Marketing & Lifecycle (news_promotions) ──────────────────────────────
export async function sendWaitlistConfirmationEmailAction(to: string, name: string) {
  return safe(() => sendWaitlistConfirmationEmail(to, name), 'waitlistConfirmation')
}
export async function sendWelcomeSeries1EmailAction(to: string, name: string, userId?: string) {
  if (!await canSend(userId, 'news_promotions')) return
  return safe(() => sendWelcomeSeries1Email(to, name), 'welcomeSeries1')
}
export async function sendWelcomeSeries2EmailAction(to: string, name: string, userId?: string) {
  if (!await canSend(userId, 'news_promotions')) return
  return safe(() => sendWelcomeSeries2Email(to, name), 'welcomeSeries2')
}
export async function sendWelcomeSeries3EmailAction(to: string, name: string, userId?: string) {
  if (!await canSend(userId, 'news_promotions')) return
  return safe(() => sendWelcomeSeries3Email(to, name), 'welcomeSeries3')
}
export async function sendReferralInviteEmailAction(
  to: string, inviterName: string, referralLink: string,
) {
  return safe(() => sendReferralInviteEmail(to, inviterName, referralLink), 'referralInvite')
}
export async function sendFirstBookingNudgeEmailAction(to: string, name: string, userId?: string) {
  if (!await canSend(userId, 'news_promotions')) return
  return safe(() => sendFirstBookingNudgeEmail(to, name), 'firstBookingNudge')
}
export async function sendReengagementEmailAction(to: string, name: string, userId?: string) {
  if (!await canSend(userId, 'news_promotions')) return
  return safe(() => sendReengagementEmail(to, name), 'reengagement')
}
export async function sendLaunchEmailAction(to: string, name: string, userId?: string) {
  if (!await canSend(userId, 'news_promotions')) return
  return safe(() => sendLaunchEmail(to, name), 'launch')
}
