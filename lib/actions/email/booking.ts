'use server'

import { z } from 'zod'
import {
  sendBookingConfirmationEmail,
  sendNewBookingToProfessionalEmail,
  sendBookingCancelledEmail,
  sendRescheduledEmail,
} from '@/lib/email/resend'
import {
  emailSchema,
  personNameSchema,
  displayTextSchema,
  dateSchema,
  timeSchema,
  timezoneSchema,
  optionalUserIdSchema,
  cancelledBySchema,
  rescheduledBySchema,
  parsePayload,
  safe,
  requireAuth,
  assertCallerCanEmailRecipient,
  canSend,
} from './shared'

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
