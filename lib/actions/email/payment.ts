'use server'

import { z } from 'zod'
import { sendPaymentConfirmationEmail, sendPaymentFailedEmail, sendRefundEmail } from '@/lib/email/resend'
import {
  emailSchema,
  personNameSchema,
  displayTextSchema,
  amountSchema,
  dateSchema,
  optionalUserIdSchema,
  parsePayload,
  safe,
  requireAuth,
  assertCallerCanEmailRecipient,
  canSend,
} from './shared'

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
