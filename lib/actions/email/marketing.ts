'use server'

import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  sendNewsletterEmail,
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
  messageSchema,
  urlSchema,
  optionalUserIdSchema,
  optionalCallToActionSubSchema,
  parsePayload,
  safe,
  requireAuth,
  canSend,
} from './shared'

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
  const supabase = await createClient()
  const { data: callerProfile, error: callerError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', callerId)
    .single()

  if (callerError) {
    Sentry.captureException(callerError, { tags: { area: 'email_marketing' } })
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
