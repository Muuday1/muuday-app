'use server'

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

// ─── Audience management ──────────────────────────────────────────────────
export async function addUserToResendAction(email: string, firstName: string) {
  return safe(() => addContactToResend(email, firstName, SEGMENTS.usuarios), 'addContact')
}

// ─── Transactional ────────────────────────────────────────────────────────
export async function sendWelcomeEmailAction(to: string, name: string) {
  // Add to Resend audience at the same time
  void safe(() => addContactToResend(to, name, SEGMENTS.usuarios), 'addContact')
  return safe(() => sendWelcomeEmail(to, name), 'welcome')
}
export async function sendCompleteAccountEmailAction(to: string, name: string) {
  return safe(() => sendCompleteAccountEmail(to, name), 'completeAccount')
}
export async function sendBookingConfirmationEmailAction(
  to: string, name: string, professionalName: string, service: string,
  date: string, time: string, timezone: string,
) {
  return safe(() => sendBookingConfirmationEmail(to, name, professionalName, service, date, time, timezone), 'bookingConfirmation')
}
export async function sendNewBookingToProfessionalEmailAction(
  to: string, professionalName: string, clientName: string,
  service: string, date: string, time: string,
) {
  return safe(() => sendNewBookingToProfessionalEmail(to, professionalName, clientName, service, date, time), 'newBookingProfessional')
}
export async function sendSessionReminder24hEmailAction(
  to: string, name: string, professionalName: string, service: string,
  date: string, time: string, timezone: string,
) {
  return safe(() => sendSessionReminder24hEmail(to, name, professionalName, service, date, time, timezone), 'reminder24h')
}
export async function sendSessionReminder1hEmailAction(
  to: string, name: string, professionalName: string, time: string, timezone: string,
) {
  return safe(() => sendSessionReminder1hEmail(to, name, professionalName, time, timezone), 'reminder1h')
}
export async function sendProfessionalReminder24hEmailAction(
  to: string, professionalName: string, clientName: string,
  service: string, date: string, time: string,
) {
  return safe(() => sendProfessionalReminder24hEmail(to, professionalName, clientName, service, date, time), 'professionalReminder24h')
}
export async function sendBookingCancelledEmailAction(
  to: string, name: string, professionalName: string,
  date: string, time: string, cancelledBy: 'user' | 'professional',
) {
  return safe(() => sendBookingCancelledEmail(to, name, professionalName, date, time, cancelledBy), 'bookingCancelled')
}
export async function sendPaymentConfirmationEmailAction(
  to: string, name: string, professionalName: string,
  service: string, amount: string, date: string,
) {
  return safe(() => sendPaymentConfirmationEmail(to, name, professionalName, service, amount, date), 'paymentConfirmation')
}
export async function sendPaymentFailedEmailAction(to: string, name: string, service: string) {
  return safe(() => sendPaymentFailedEmail(to, name, service), 'paymentFailed')
}
export async function sendRefundEmailAction(to: string, name: string, amount: string, service: string) {
  return safe(() => sendRefundEmail(to, name, amount, service), 'refund')
}
export async function sendNewReviewEmailAction(
  to: string, professionalName: string,
  clientName: string, rating: number, comment: string,
) {
  return safe(() => sendNewReviewEmail(to, professionalName, clientName, rating, comment), 'newReview')
}
export async function sendProfileApprovedEmailAction(to: string, professionalName: string) {
  return safe(() => sendProfileApprovedEmail(to, professionalName), 'profileApproved')
}
export async function sendProfileRejectedEmailAction(to: string, professionalName: string, reason: string) {
  return safe(() => sendProfileRejectedEmail(to, professionalName, reason), 'profileRejected')
}
export async function sendNewsletterEmailAction(
  to: string, name: string, subject: string, badge: string,
  headline: string, body: string, ctaLabel: string, ctaUrl: string, ctaSub?: string,
) {
  return safe(() => sendNewsletterEmail(to, name, subject, badge, headline, body, ctaLabel, ctaUrl, ctaSub), 'newsletter')
}
export async function sendRequestReviewEmailAction(
  to: string, name: string, professionalName: string, service: string,
) {
  return safe(() => sendRequestReviewEmail(to, name, professionalName, service), 'requestReview')
}
export async function sendRescheduledEmailAction(
  to: string, name: string, professionalName: string, service: string,
  oldDate: string, oldTime: string, newDate: string, newTime: string,
  timezone: string, rescheduledBy: 'user' | 'professional',
) {
  return safe(() => sendRescheduledEmail(to, name, professionalName, service, oldDate, oldTime, newDate, newTime, timezone, rescheduledBy), 'rescheduled')
}
export async function sendIncompleteProfileReminderEmailAction(
  to: string, professionalName: string, missingItems: string[],
) {
  return safe(() => sendIncompleteProfileReminderEmail(to, professionalName, missingItems), 'incompleteProfile')
}

// ─── Marketing & Lifecycle ────────────────────────────────────────────────
export async function sendWaitlistConfirmationEmailAction(to: string, name: string) {
  return safe(() => sendWaitlistConfirmationEmail(to, name), 'waitlistConfirmation')
}
export async function sendWelcomeSeries1EmailAction(to: string, name: string) {
  return safe(() => sendWelcomeSeries1Email(to, name), 'welcomeSeries1')
}
export async function sendWelcomeSeries2EmailAction(to: string, name: string) {
  return safe(() => sendWelcomeSeries2Email(to, name), 'welcomeSeries2')
}
export async function sendWelcomeSeries3EmailAction(to: string, name: string) {
  return safe(() => sendWelcomeSeries3Email(to, name), 'welcomeSeries3')
}
export async function sendReferralInviteEmailAction(
  to: string, inviterName: string, referralLink: string,
) {
  return safe(() => sendReferralInviteEmail(to, inviterName, referralLink), 'referralInvite')
}
export async function sendFirstBookingNudgeEmailAction(to: string, name: string) {
  return safe(() => sendFirstBookingNudgeEmail(to, name), 'firstBookingNudge')
}
export async function sendReengagementEmailAction(to: string, name: string) {
  return safe(() => sendReengagementEmail(to, name), 'reengagement')
}
export async function sendLaunchEmailAction(to: string, name: string) {
  return safe(() => sendLaunchEmail(to, name), 'launch')
}
