import { randomUUID } from 'node:crypto'
import { signCalendarState, verifyCalendarStateSignature } from './token-crypto'
import type { CalendarProvider } from './types'

export type CalendarOAuthStatePayload = {
  provider: CalendarProvider
  professionalId: string
  userId: string
  nonce: string
  redirectPath: string
  exp: number
}

const DEFAULT_TTL_SECONDS = 10 * 60

export function createCalendarOAuthState(input: {
  provider: CalendarProvider
  professionalId: string
  userId: string
  redirectPath?: string
  ttlSeconds?: number
}) {
  const payload: CalendarOAuthStatePayload = {
    provider: input.provider,
    professionalId: input.professionalId,
    userId: input.userId,
    nonce: randomUUID(),
    redirectPath: input.redirectPath || '/dashboard',
    exp: Math.floor(Date.now() / 1000) + (input.ttlSeconds || DEFAULT_TTL_SECONDS),
  }

  const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = signCalendarState(payloadBase64)

  return {
    state: `${payloadBase64}.${signature}`,
    nonce: payload.nonce,
    payload,
  }
}

export function parseAndValidateCalendarOAuthState(state: string): CalendarOAuthStatePayload | null {
  if (!state || !state.includes('.')) return null
  const [payloadBase64, signature] = state.split('.', 2)
  if (!payloadBase64 || !signature) return null
  if (!verifyCalendarStateSignature(payloadBase64, signature)) return null

  let payload: CalendarOAuthStatePayload
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8')) as CalendarOAuthStatePayload
  } catch {
    return null
  }

  if (!payload.provider || !payload.professionalId || !payload.userId || !payload.nonce || !payload.exp) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now) return null

  return payload
}
