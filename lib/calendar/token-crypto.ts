import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

type EncryptedPayloadV1 = {
  v: 1
  iv: string
  tag: string
  data: string
}

function parseKeyFromEnv(rawKey: string): Buffer {
  const trimmed = rawKey.trim()

  if (/^[a-f0-9]{64}$/i.test(trimmed)) {
    return Buffer.from(trimmed, 'hex')
  }

  try {
    const b64 = Buffer.from(trimmed, 'base64')
    if (b64.length === 32) return b64
  } catch {
    // no-op
  }

  const utf = Buffer.from(trimmed, 'utf8')
  if (utf.length === 32) return utf

  throw new Error('CALENDAR_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (base64/hex/utf8).')
}

function getEncryptionKey(): Buffer {
  const raw = process.env.CALENDAR_TOKEN_ENCRYPTION_KEY || ''
  if (!raw.trim()) {
    throw new Error('CALENDAR_TOKEN_ENCRYPTION_KEY is required for calendar token encryption.')
  }
  return parseKeyFromEnv(raw)
}

export function encryptCalendarSecret(plainText: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(12)

  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  const payload: EncryptedPayloadV1 = {
    v: 1,
    iv: iv.toString('base64url'),
    tag: tag.toString('base64url'),
    data: encrypted.toString('base64url'),
  }

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

export function decryptCalendarSecret(sealedText: string): string {
  const key = getEncryptionKey()
  const decoded = Buffer.from(sealedText, 'base64url').toString('utf8')
  const payload = JSON.parse(decoded) as EncryptedPayloadV1

  if (payload.v !== 1) {
    throw new Error('Unsupported encrypted payload version.')
  }

  const iv = Buffer.from(payload.iv, 'base64url')
  const tag = Buffer.from(payload.tag, 'base64url')
  const data = Buffer.from(payload.data, 'base64url')

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8')
}

export function encryptCalendarJson(value: Record<string, unknown>): string {
  return encryptCalendarSecret(JSON.stringify(value))
}

export function decryptCalendarJson<T>(sealedText: string | null | undefined): T | null {
  if (!sealedText) return null
  const text = decryptCalendarSecret(sealedText)
  return JSON.parse(text) as T
}

export function signCalendarState(base64Payload: string): string {
  const secret = process.env.CALENDAR_OAUTH_STATE_SECRET || ''
  if (!secret.trim()) {
    throw new Error('CALENDAR_OAUTH_STATE_SECRET is required for OAuth state signing.')
  }
  return createHmac('sha256', secret).update(base64Payload).digest('base64url')
}

export function verifyCalendarStateSignature(base64Payload: string, signature: string): boolean {
  const expected = signCalendarState(base64Payload)
  const expectedBuf = Buffer.from(expected)
  const receivedBuf = Buffer.from(signature)
  if (expectedBuf.length !== receivedBuf.length) return false
  return timingSafeEqual(expectedBuf, receivedBuf)
}
