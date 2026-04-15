import { createHmac, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'

const DEFAULT_MIN_VIEW_SECONDS = 3
const DEFAULT_MAX_AGE_SECONDS = 30 * 60

function getSecret() {
  const secret =
    process.env.PROFESSIONAL_TERMS_PROOF_SECRET ||
    process.env.CALENDAR_OAUTH_STATE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ''
  return String(secret || '')
}

function toBase64Url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url')
}

function fromBase64Url(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function extractIpFromHeaderValue(headerValue: string | null): string | null {
  if (!headerValue) return null
  const tokens = String(headerValue)
    .split(',')
    .map(token => token.trim())
    .filter(Boolean)

  for (const token of tokens) {
    let value = token

    const forMatch = value.match(/for="?([^;"\s]+)"?/i)
    if (forMatch?.[1]) {
      value = forMatch[1]
    }

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).trim()
    }

    if (value.startsWith('[') && value.includes(']')) {
      const endBracket = value.indexOf(']')
      value = value.slice(1, endBracket)
    } else if (/:\d{1,5}$/.test(value) && value.split(':').length === 2) {
      value = value.replace(/:\d{1,5}$/, '')
    } else if (value.startsWith('::') && value.includes(':') && value.endsWith(']')) {
      // noop guard for malformed bracket-like IPv6 fragments.
      value = value.replace(/^\[|\]$/g, '')
    }

    if (isIP(value)) {
      return value
    }
  }

  return null
}

export function extractRequestIp(headers: Headers) {
  const trustedForwardedFor = extractIpFromHeaderValue(headers.get('x-vercel-forwarded-for'))
  if (trustedForwardedFor) return trustedForwardedFor

  const cfIp = extractIpFromHeaderValue(headers.get('cf-connecting-ip'))
  if (cfIp) return cfIp

  const trueClientIp = extractIpFromHeaderValue(headers.get('true-client-ip'))
  if (trueClientIp) return trueClientIp

  const realIp = extractIpFromHeaderValue(headers.get('x-real-ip'))
  if (realIp) return realIp

  return null
}

export function createTermViewProofToken(payload: {
  userId: string
  professionalId: string
  termKey: string
  termVersion: string
  viewEventId: string
  ip: string | null
  userAgent: string
  issuedAtMs?: number
}) {
  const secret = getSecret()
  if (!secret) {
    throw new Error('PROFESSIONAL_TERMS_PROOF_SECRET não configurada.')
  }

  const data = {
    userId: String(payload.userId || ''),
    professionalId: String(payload.professionalId || ''),
    termKey: String(payload.termKey || ''),
    termVersion: String(payload.termVersion || ''),
    veid: String(payload.viewEventId || ''),
    ip: String(payload.ip || ''),
    ua: String(payload.userAgent || ''),
    iat: Number(payload.issuedAtMs || Date.now()),
  }

  const body = toBase64Url(JSON.stringify(data))
  const signature = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function verifyTermViewProofToken(params: {
  token: string
  expectedUserId: string
  expectedProfessionalId: string
  expectedTermKey: string
  expectedTermVersion: string
  expectedViewEventId?: string
  currentIp: string | null
  currentUserAgent: string
  minViewSeconds?: number
  maxAgeSeconds?: number
}) {
  const secret = getSecret()
  if (!secret) {
    return { ok: false as const, reason: 'missing_secret' as const }
  }

  const [encodedBody, signature] = String(params.token || '').split('.', 2)
  if (!encodedBody || !signature) {
    return { ok: false as const, reason: 'invalid_format' as const }
  }

  const expectedSignature = createHmac('sha256', secret).update(encodedBody).digest('base64url')
  const left = Buffer.from(signature)
  const right = Buffer.from(expectedSignature)
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false as const, reason: 'invalid_signature' as const }
  }

  let body: {
    userId: string
    professionalId: string
    termKey: string
    termVersion: string
    veid?: string
    ip: string
    ua: string
    iat: number
  }
  try {
    body = JSON.parse(fromBase64Url(encodedBody))
  } catch {
    return { ok: false as const, reason: 'invalid_payload' as const }
  }

  if (
    body.userId !== params.expectedUserId ||
    body.professionalId !== params.expectedProfessionalId ||
    body.termKey !== params.expectedTermKey ||
    body.termVersion !== params.expectedTermVersion
  ) {
    return { ok: false as const, reason: 'mismatch' as const }
  }
  const viewEventId = String(body.veid || '').trim()
  if (!viewEventId) {
    return { ok: false as const, reason: 'missing_view_event' as const }
  }
  if (params.expectedViewEventId && params.expectedViewEventId !== viewEventId) {
    return { ok: false as const, reason: 'view_event_mismatch' as const }
  }

  const currentIp = String(params.currentIp || '')
  if (body.ip && currentIp && body.ip !== currentIp) {
    return { ok: false as const, reason: 'ip_mismatch' as const }
  }

  const currentUa = String(params.currentUserAgent || '')
  if (body.ua && currentUa && body.ua !== currentUa) {
    return { ok: false as const, reason: 'ua_mismatch' as const }
  }

  const minViewMs = Number(params.minViewSeconds ?? DEFAULT_MIN_VIEW_SECONDS) * 1000
  const maxAgeMs = Number(params.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS) * 1000
  const elapsed = Date.now() - Number(body.iat || 0)
  if (!Number.isFinite(elapsed) || elapsed < minViewMs) {
    return { ok: false as const, reason: 'too_fast' as const }
  }
  if (elapsed > maxAgeMs) {
    return { ok: false as const, reason: 'expired' as const }
  }

  return { ok: true as const, viewEventId }
}

