'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
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

const emailSchema = z.string().trim().email('E-mail invalido.')
const personNameSchema = z.string().trim().min(1, 'Nome obrigatorio.').max(120, 'Nome muito longo.')
const displayTextSchema = z.string().trim().min(1, 'Campo obrigatorio.').max(200, 'Texto muito longo.')
const messageSchema = z.string().trim().min(1, 'Campo obrigatorio.').max(1200, 'Texto muito longo.')
const shortOptionalMessageSchema = z.string().trim().max(1200, 'Texto muito longo.')
const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida.')
const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horario invalido.')
const timezoneSchema = z.string().trim().min(2, 'Fuso horario invalido.').max(80, 'Fuso horario invalido.')
const amountSchema = z
  .string()
  .trim()
  .regex(/^\d+([.,]\d{1,2})?$/, 'Valor monetario invalido.')
const urlSchema = z.string().trim().url('URL invalida.').max(500, 'URL muito longa.')
const optionalUserIdSchema = z.string().uuid('Identificador de usuario invalido.').optional()
const optionalCallToActionSubSchema = z.string().trim().max(240, 'Texto muito longo.').optional()
const cancelledBySchema = z.enum(['user', 'professional'])
const rescheduledBySchema = z.enum(['user', 'professional'])
const ratingSchema = z.number().int().min(1).max(5)
const missingItemsSchema = z.array(displayTextSchema).min(1, 'Lista de itens obrigatoria.').max(20)

function getValidationError(error: z.ZodError) {
  return error.issues[0]?.message || 'Dados invalidos.'
}

// helper - swallows errors so a failed email never breaks the main flow
async function safe<T>(fn: () => Promise<T>, label: string) {
  try { return await fn() } catch (e) { console.error(`[email] ${label}`, e) }
}

// Auth guard - ensures only authenticated users can trigger emails + rate limit
async function requireAuth(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const rl = await rateLimit('email', user.id)
  if (!rl.allowed) return null

  return user.id
}

function parsePayload<T>(schema: z.ZodSchema<T>, payload: unknown): T | null {
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    console.warn('[email] invalid payload', getValidationError(parsed.error))
    return null
  }
  return parsed.data
}

/**
 * Security: Verify the caller has a legitimate relationship with the recipient.
 * Prevents IDOR where an authenticated user sends Muuday-branded emails to arbitrary addresses.
 * Returns true if the email is allowed, false otherwise.
 */
async function assertCallerCanEmailRecipient(callerId: string, recipientEmail: string): Promise<boolean> {
  const supabase = createClient()

  // 1. Caller can always email themselves
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', callerId)
    .single()

  if (callerProfile?.email === recipientEmail) return true

  // 2. Caller has a booking relationship with the recipient
  const { data: recipientProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', recipientEmail)
    .maybeSingle()

  if (!recipientProfile) return false

  // Check if there's any booking between caller and recipient (as user<->professional)
  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .or(`and(user_id.eq.${callerId},professional_id.in.(select id from professionals where user_id='${recipientProfile.id}')),and(user_id.eq.${recipientProfile.id},professional_id.in.(select id from professionals where user_id='${callerId}'))`)
    .limit(1)

  return (bookingCount || 0) > 0
}

type NotifKey = 'booking_emails' | 'session_reminders' | 'news_promotions'

// Returns false if the user has explicitly disabled this category
async function canSend(userId: string | null | undefined, key: NotifKey): Promise<boolean> {
  if (!userId) return true // no user context -> always send (e.g. professional notifications)
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single()
    const prefs = data?.notification_preferences as Record<string, boolean> | null
    if (!prefs) return true // no prefs saved -> default opt-in
    return prefs[key] !== false
  } catch {
    return true // on error -> send anyway
  }
}

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

// --- Transactional --------------------------------------------------------
// Welcome & account setup - only caller can send to their own email
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

// booking_emails category
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

// session_reminders category
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

// news_promotions category
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
      body: messageSchema,
      ctaLabel: z.string().trim().min(1).max(80),
      ctaUrl: urlSchema,
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

// â”€â”€â”€ Marketing & Lifecycle (news_promotions) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      referralLink: urlSchema,
    }),
    { to, inviterName, referralLink },
  )
  if (!payload) return

  const callerId = await requireAuth()
  if (!callerId) return

  // Referral invites are intentionally sent to external emails, but we verify
  // the inviterName matches the caller's profile to prevent impersonation
  const supabase = createClient()
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', callerId)
    .single()

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
