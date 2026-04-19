'use server'

import { z } from 'zod'
import {
  sendSessionReminder24hEmail,
  sendSessionReminder1hEmail,
  sendProfessionalReminder24hEmail,
  sendRequestReviewEmail,
} from '@/lib/email/resend'
import {
  emailSchema,
  personNameSchema,
  displayTextSchema,
  dateSchema,
  timeSchema,
  timezoneSchema,
  optionalUserIdSchema,
  parsePayload,
  safe,
  requireAuth,
  canSend,
} from './shared'

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
