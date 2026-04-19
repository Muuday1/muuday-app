'use server'

import { z } from 'zod'
import { sendWelcomeEmail, sendCompleteAccountEmail, addContactToResend, SEGMENTS } from '@/lib/email/resend'
import { emailSchema, personNameSchema, parsePayload, safe, requireAuth, assertCallerCanEmailRecipient } from './shared'

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
