import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
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

// --- Schemas ----------------------------------------------------------------
export const emailSchema = z.string().trim().email('E-mail inválido.')
export const personNameSchema = z.string().trim().min(1, 'Nome obrigatório.').max(120, 'Nome muito longo.')
export const displayTextSchema = z.string().trim().min(1, 'Campo obrigatório.').max(200, 'Texto muito longo.')
export const messageSchema = z.string().trim().min(1, 'Campo obrigatório.').max(1200, 'Texto muito longo.')
export const shortOptionalMessageSchema = z.string().trim().max(1200, 'Texto muito longo.')
export const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
export const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido.')
export const timezoneSchema = z.string().trim().min(2, 'Fuso horário inválido.').max(80, 'Fuso horário inválido.')
export const amountSchema = z
  .string()
  .trim()
  .regex(/^\d+([.,]\d{1,2})?$/, 'Valor monetário inválido.')
export const urlSchema = z.string().trim().url('URL inválida.').max(500, 'URL muito longa.')
export const optionalUserIdSchema = z.string().uuid('Identificador de usuário inválido.').optional()
export const optionalCallToActionSubSchema = z.string().trim().max(240, 'Texto muito longo.').optional()
export const cancelledBySchema = z.enum(['user', 'professional'])
export const rescheduledBySchema = z.enum(['user', 'professional'])
export const ratingSchema = z.number().int().min(1).max(5)
export const missingItemsSchema = z.array(displayTextSchema).min(1, 'Lista de itens obrigatória.').max(20)

// --- Helpers ----------------------------------------------------------------
export function getValidationError(error: z.ZodError) {
  return error.issues[0]?.message || 'Dados inválidos.'
}

// helper - swallows errors so a failed email never breaks the main flow
export async function safe<T>(fn: () => Promise<T>, label: string) {
  try { return await fn() } catch (e) { console.error(`[email] ${label}`, e) }
}

export function parsePayload<T>(schema: z.ZodSchema<T>, payload: unknown): T | null {
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    console.warn('[email] invalid payload', getValidationError(parsed.error))
    return null
  }
  return parsed.data
}

// --- Security / Permissions -------------------------------------------------

/**
 * Security: Verify the caller has a legitimate relationship with the recipient.
 * Prevents IDOR where an authenticated user sends Muuday-branded emails to arbitrary addresses.
 * Returns true if the email is allowed, false otherwise.
 */
export async function assertCallerCanEmailRecipientService(
  supabase: SupabaseClient,
  callerId: string,
  recipientEmail: string,
): Promise<boolean> {
  // 1. Caller can always email themselves
  const { data: callerProfile, error: callerError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', callerId)
    .single()

  if (callerError) {
    console.error('[email/shared] caller profile query error:', callerError.message)
  }

  if (callerProfile?.email === recipientEmail) return true

  // 2. Caller has a booking relationship with the recipient
  const { data: recipientProfile, error: recipientError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', recipientEmail)
    .maybeSingle()

  if (recipientError) {
    console.error('[email/shared] recipient profile query error:', recipientError.message)
  }

  if (!recipientProfile) return false

  // Check if there's any booking between caller and recipient (as user<->professional)
  const { count: bookingCount, error: bookingError } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .or(`and(user_id.eq.${callerId},professional_id.in.(select id from professionals where user_id='${recipientProfile.id}')),and(user_id.eq.${recipientProfile.id},professional_id.in.(select id from professionals where user_id='${callerId}'))`)
    .limit(1)

  if (bookingError) {
    console.error('[email/shared] booking relationship query error:', bookingError.message)
  }

  return (bookingCount || 0) > 0
}

export type NotifKey = 'booking_emails' | 'session_reminders' | 'news_promotions'

// Returns false if the user has explicitly disabled this category
export async function canSendService(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  key: NotifKey,
): Promise<boolean> {
  if (!userId) return true // no user context -> always send (e.g. professional notifications)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('[email/shared] notification preferences query error:', error.message)
      return true // on error -> send anyway
    }
    const prefs = data?.notification_preferences as Record<string, boolean> | null
    if (!prefs) return true // no prefs saved -> default opt-in
    return prefs[key] !== false
  } catch (e) {
    console.error('[email/shared] canSend unexpected error:', e instanceof Error ? e.message : String(e))
    return true // on error -> send anyway
  }
}

// --- Audience management ----------------------------------------------------
export async function addUserToResendService(
  _supabase: SupabaseClient,
  _callerId: string,
  email: string,
  firstName: string,
) {
  const payload = parsePayload(
    z.object({
      email: emailSchema,
      firstName: personNameSchema,
    }),
    { email, firstName },
  )
  if (!payload) return
  return safe(() => addContactToResend(payload.email, payload.firstName, SEGMENTS.usuarios), 'addContact')
}

// --- Transactional: Auth ----------------------------------------------------
export async function sendWelcomeEmailService(
  supabase: SupabaseClient,
  callerId: string,
  to: string,
  name: string,
) {
  const payload = parsePayload(z.object({ to: emailSchema, name: personNameSchema }), { to, name })
  if (!payload) return
  if (!await assertCallerCanEmailRecipientService(supabase, callerId, payload.to)) return
  void safe(() => addContactToResend(payload.to, payload.name, SEGMENTS.usuarios), 'addContact')
  return safe(() => sendWelcomeEmail(payload.to, payload.name), 'welcome')
}

export async function sendCompleteAccountEmailService(
  supabase: SupabaseClient,
  callerId: string,
  to: string,
  name: string,
) {
  const payload = parsePayload(z.object({ to: emailSchema, name: personNameSchema }), { to, name })
  if (!payload) return
  if (!await assertCallerCanEmailRecipientService(supabase, callerId, payload.to)) return
  return safe(() => sendCompleteAccountEmail(payload.to, payload.name), 'completeAccount')
}

// --- Transactional: Booking -------------------------------------------------
export async function sendBookingConfirmationEmailService(
  supabase: SupabaseClient,
  callerId: string,
  to: string,
  name: string,
  professionalName: string,
  service: string,
  date: string,
  time: string,
  timezone: string,
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
  if (!await assertCallerCanEmailRecipientService(supabase, callerId, payload.to)) return
  if (!await canSendService(supabase, payload.userId, 'booking_emails')) return
  return safe(() => sendBookingConfirmationEmail(payload.to, payload.name, payload.professionalName, payload.service, payload.date, payload.time, payload.timezone), 'bookingConfirmation')
}

export async function sendNewBookingToProfessionalEmailService(
  supabase: SupabaseClient,
  callerId: string,
  to: string,
  professionalName: string,
  clientName: string,
  service: string,
  date: string,
  time: string,
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
  if (!await assertCallerCanEmailRecipientService(supabase, callerId, payload.to)) return
  return safe(() => sendNewBookingToProfessionalEmail(payload.to, payload.professionalName, payload.clientName, payload.service, payload.date, payload.time), 'newBookingProfessional')
}

export async function sendBookingCancelledEmailService(
  supabase: SupabaseClient,
  callerId: string,
  to: string,
  name: string,
  professionalName: string,
  date: string,
  time: string,
  cancelledBy: 'user' | 'professional',
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
  if (!await assertCallerCanEmailRecipientService(supabase, callerId, payload.to)) return
  if (!await canSendService(supabase, payload.userId, 'booking_emails')) return
  return safe(() => sendBookingCancelledEmail(payload.to, payload.name, payload.professionalName, payload.date, payload.time, payload.cancelledBy), 'bookingCancelled')
}

// --- Transactional: Payment -------------------------------------------------
export async function sendPaymentConfirmationEmailService(
  supabase: SupabaseClient,
  callerId: string,
  to: string,
  name: string,
  professionalName: string,
  service: string,
  amount: string,
  date: string,
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
  if (!await assertCallerCanEmailRecipientService(supabase, callerId, payload.to)) return
  if (!await canSendService(supabase, payload.userId, 'booking_emails')) return
  return safe(() => sendPaymentConfirmationEmail(payload.to, payload.name, payload.professionalName, payload.service, payload.amount, payload.date), 'paymentConfirmation')
}

export async function sendPaymentFailedEmailService(
  supabase: SupabaseClient,
  callerId: string,
  to: string,
  name: string,
  service: string,
  userId?: string,
) {
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
  if (!await assertCallerCanEmailRecipientService(supabase, callerId, payload.to)) return
  return safe(() => sendPaymentFailedEmail(payload.to, payload.name, payload.service), 'paymentFailed')
}

export async function sendRefundEmailService(
  supabase: SupabaseClient,
  callerId: string,
  to: string,
  name: string,
  amount: string,
  service: string,
  userId?: string,
) {
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
  if (!await assertCallerCanEmailRecipientService(supabase, callerId, payload.to)) return
  if (!await canSendService(supabase, payload.userId, 'booking_emails')) return
  return safe(() => sendRefundEmail(payload.to, payload.name, payload.amount, payload.service), 'refund')
}

// --- Transactional: Profile & Reviews ---------------------------------------
export async function sendNewReviewEmailService(
  _supabase: SupabaseClient,
  _callerId: string,
  to: string,
  professionalName: string,
  clientName: string,
  rating: number,
  comment: string,
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
  return safe(() => sendNewReviewEmail(payload.to, payload.professionalName, payload.clientName, payload.rating, payload.comment), 'newReview')
}

export async function sendIncompleteProfileReminderEmailService(
  _supabase: SupabaseClient,
  _callerId: string,
  to: string,
  professionalName: string,
  missingItems: string[],
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
  return safe(() => sendIncompleteProfileReminderEmail(payload.to, payload.professionalName, payload.missingItems), 'incompleteProfile')
}

// --- Reminders --------------------------------------------------------------
export async function sendSessionReminder24hEmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  professionalName: string,
  service: string,
  date: string,
  time: string,
  timezone: string,
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
  if (!await canSendService(supabase, payload.userId, 'session_reminders')) return
  return safe(() => sendSessionReminder24hEmail(payload.to, payload.name, payload.professionalName, payload.service, payload.date, payload.time, payload.timezone), 'reminder24h')
}

export async function sendSessionReminder1hEmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  professionalName: string,
  time: string,
  timezone: string,
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
  if (!await canSendService(supabase, payload.userId, 'session_reminders')) return
  return safe(() => sendSessionReminder1hEmail(payload.to, payload.name, payload.professionalName, payload.time, payload.timezone), 'reminder1h')
}

export async function sendProfessionalReminder24hEmailService(
  _supabase: SupabaseClient,
  _callerId: string,
  to: string,
  professionalName: string,
  clientName: string,
  service: string,
  date: string,
  time: string,
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
  return safe(() => sendProfessionalReminder24hEmail(payload.to, payload.professionalName, payload.clientName, payload.service, payload.date, payload.time), 'professionalReminder24h')
}

export async function sendRequestReviewEmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  professionalName: string,
  service: string,
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
  if (!await canSendService(supabase, payload.userId, 'session_reminders')) return
  return safe(() => sendRequestReviewEmail(payload.to, payload.name, payload.professionalName, payload.service), 'requestReview')
}

// --- Reschedule -------------------------------------------------------------
export async function sendRescheduledEmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  professionalName: string,
  service: string,
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string,
  timezone: string,
  rescheduledBy: 'user' | 'professional',
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
  if (!await canSendService(supabase, payload.userId, 'booking_emails')) return
  return safe(() => sendRescheduledEmail(payload.to, payload.name, payload.professionalName, payload.service, payload.oldDate, payload.oldTime, payload.newDate, payload.newTime, payload.timezone, payload.rescheduledBy), 'rescheduled')
}

// --- Marketing & Lifecycle (news_promotions) --------------------------------
export async function sendNewsletterEmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  subject: string,
  badge: string,
  headline: string,
  body: string,
  ctaLabel: string,
  ctaUrl: string,
  ctaSub?: string,
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
  if (!await canSendService(supabase, payload.userId, 'news_promotions')) return
  return safe(() => sendNewsletterEmail(payload.to, payload.name, payload.subject, payload.badge, payload.headline, payload.body, payload.ctaLabel, payload.ctaUrl, payload.ctaSub), 'newsletter')
}

export async function sendWaitlistConfirmationEmailService(
  to: string,
  name: string,
) {
  const payload = parsePayload(z.object({ to: emailSchema, name: personNameSchema }), { to, name })
  if (!payload) return
  return safe(() => sendWaitlistConfirmationEmail(payload.to, payload.name), 'waitlistConfirmation')
}

export async function sendWelcomeSeries1EmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await canSendService(supabase, payload.userId, 'news_promotions')) return
  return safe(() => sendWelcomeSeries1Email(payload.to, payload.name), 'welcomeSeries1')
}

export async function sendWelcomeSeries2EmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await canSendService(supabase, payload.userId, 'news_promotions')) return
  return safe(() => sendWelcomeSeries2Email(payload.to, payload.name), 'welcomeSeries2')
}

export async function sendWelcomeSeries3EmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await canSendService(supabase, payload.userId, 'news_promotions')) return
  return safe(() => sendWelcomeSeries3Email(payload.to, payload.name), 'welcomeSeries3')
}

export async function sendReferralInviteEmailService(
  supabase: SupabaseClient,
  callerId: string,
  to: string,
  inviterName: string,
  referralLink: string,
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

export async function sendFirstBookingNudgeEmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await canSendService(supabase, payload.userId, 'news_promotions')) return
  return safe(() => sendFirstBookingNudgeEmail(payload.to, payload.name), 'firstBookingNudge')
}

export async function sendReengagementEmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await canSendService(supabase, payload.userId, 'news_promotions')) return
  return safe(() => sendReengagementEmail(payload.to, payload.name), 'reengagement')
}

export async function sendLaunchEmailService(
  supabase: SupabaseClient,
  _callerId: string,
  to: string,
  name: string,
  userId?: string,
) {
  const payload = parsePayload(
    z.object({ to: emailSchema, name: personNameSchema, userId: optionalUserIdSchema }),
    { to, name, userId },
  )
  if (!payload) return
  if (!await canSendService(supabase, payload.userId, 'news_promotions')) return
  return safe(() => sendLaunchEmail(payload.to, payload.name), 'launch')
}
