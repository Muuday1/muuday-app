/**
 * Trolley API Client — Muuday Payments Engine
 *
 * Trolley is used for professional onboarding and payouts.
 * Muuday backend is the SOLE ORCHESTRATOR — Trolley never decides amounts.
 *
 * API Docs: https://trolley.com/docs/api
 * Environment vars: TROLLEY_API_KEY, TROLLEY_API_SECRET, TROLLEY_WEBHOOK_SECRET
 *
 * Authentication: HMAC-SHA256 request signing (prsign scheme)
 *   Message = timestamp + '\n' + METHOD + '\n' + requestPath + '\n' + body + '\n'
 *   Signature = HMAC-SHA256(secret, message)
 *   Authorization: prsign <ACCESS_KEY>:<SIGNATURE>
 *   X-PR-Timestamp: <timestamp>
 */

import crypto from 'crypto'
import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/config/env'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrolleyRecipient {
  id: string
  email: string
  name?: string
  status: 'pending' | 'incomplete' | 'active' | 'inactive'
  payoutMethod?: 'paypal' | 'bank_transfer'
  paypalEmail?: string
}

export interface TrolleyPayment {
  id: string
  recipientId: string
  amount: string
  currency: string
  status: 'pending' | 'in_transit' | 'completed' | 'failed' | 'returned'
}

export interface TrolleyBatch {
  id: string
  status: 'open' | 'pending' | 'processing' | 'completed' | 'failed'
  payments: TrolleyPayment[]
}

// ---------------------------------------------------------------------------
// Auth & Signing
// ---------------------------------------------------------------------------

const TROLLEY_API_BASE = env.TROLLEY_API_BASE

function getCredentials(): { key: string; secret: string } {
  const key = env.TROLLEY_API_KEY
  const secret = env.TROLLEY_API_SECRET

  if (!key || !secret) {
    throw new Error('Trolley API credentials not configured')
  }

  return { key, secret }
}

/**
 * Build the HMAC-SHA256 signature for a Trolley API request.
 *
 * Docs: https://developers.trolley.com/api/
 * Message format: timestamp + '\n' + method + '\n' + requestPath + '\n' + body + '\n'
 */
function signRequest(
  method: string,
  requestPath: string,
  body: string,
  secret: string,
  timestamp: number,
): string {
  const message = `${timestamp}\n${method.toUpperCase()}\n${requestPath}\n${body}\n`
  return crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex')
}

function buildAuthHeaders(
  method: string,
  requestPath: string,
  body: string,
): Record<string, string> {
  const { key, secret } = getCredentials()
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = signRequest(method, requestPath, body, secret, timestamp)

  return {
    'Content-Type': 'application/json',
    'Authorization': `prsign ${key}:${signature}`,
    'X-PR-Timestamp': String(timestamp),
  }
}

// ---------------------------------------------------------------------------
// HTTP Client
// ---------------------------------------------------------------------------

async function trolleyFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${TROLLEY_API_BASE}${path}`
  const method = options.method || 'GET'
  const body = options.body ? String(options.body) : ''

  // requestPath for signing must include the /v1 prefix
  const apiVersionPrefix = '/v1'
  const requestPath = path.startsWith(apiVersionPrefix) ? path : `${apiVersionPrefix}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...buildAuthHeaders(method, requestPath, body),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => 'unknown')
    throw new Error(`Trolley API error ${response.status}: ${bodyText}`)
  }

  return response.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Recipients
// ---------------------------------------------------------------------------

export async function createTrolleyRecipient(params: {
  email: string
  firstName: string
  lastName: string
  referenceId?: string
}): Promise<TrolleyRecipient> {
  return trolleyFetch('/recipients', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      type: 'individual',
      referenceId: params.referenceId,
    }),
  })
}

export async function getTrolleyRecipient(recipientId: string): Promise<TrolleyRecipient> {
  return trolleyFetch(`/recipients/${recipientId}`)
}

export async function updateTrolleyRecipient(
  recipientId: string,
  updates: Partial<{ email: string; payoutMethod: string; paypalEmail: string }>,
): Promise<TrolleyRecipient> {
  return trolleyFetch(`/recipients/${recipientId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

// ---------------------------------------------------------------------------
// Payments / Batches
// ---------------------------------------------------------------------------

export async function createTrolleyPayment(params: {
  batchId: string
  recipientId: string
  amount: string
  currency: string
  sourceAmount?: string
  sourceCurrency?: string
}): Promise<TrolleyPayment> {
  return trolleyFetch(`/batches/${params.batchId}/payments`, {
    method: 'POST',
    body: JSON.stringify({
      recipient: { id: params.recipientId },
      amount: params.amount,
      currency: params.currency,
      sourceAmount: params.sourceAmount,
      sourceCurrency: params.sourceCurrency,
    }),
  })
}

export async function createTrolleyBatch(paymentIds?: string[]): Promise<TrolleyBatch> {
  const body: Record<string, unknown> = {}
  if (paymentIds && paymentIds.length > 0) {
    body.payments = paymentIds.map((id) => ({ id }))
  }
  return trolleyFetch('/batches', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getTrolleyBatch(batchId: string): Promise<TrolleyBatch> {
  return trolleyFetch(`/batches/${batchId}`)
}

export async function processTrolleyBatch(batchId: string): Promise<TrolleyBatch> {
  return trolleyFetch(`/batches/${batchId}/start-processing`, {
    method: 'POST',
  })
}

// ---------------------------------------------------------------------------
// Webhook Verification
// ---------------------------------------------------------------------------

/**
 * Verify a Trolley webhook signature.
 *
 * Trolley (formerly PaymentRails) webhooks include a signature header.
 * Format: `X-PaymentRails-Signature: t={timestamp},v1={hex_hmac}`
 *
 * Verification steps:
 * 1. Extract `t` (timestamp) and `v1` (signature) from header
 * 2. Concatenate: `${timestamp}${rawBody}`
 * 3. Compute HMAC-SHA256 with webhook secret
 * 4. Compare using timing-safe equality
 *
 * Docs: https://developers.trolley.com/docs/webhooks
 */
export function verifyTWebhookSignature(payload: string, signature: string): boolean {
  const secret = env.TROLLEY_WEBHOOK_SECRET
  if (!secret) {
    Sentry.captureMessage('[trolley] TROLLEY_WEBHOOK_SECRET not configured, skipping signature verification', { level: 'warning', tags: { area: 'payments/trolley' } })
    return true
  }

  // Parse signature header: t=1234567890,v1=abc123...
  const tMatch = signature.match(/t=(\d+)/)
  const v1Match = signature.match(/v1=([a-f0-9]+)/i)

  if (!tMatch || !v1Match) {
    Sentry.captureMessage('[trolley] Invalid signature format, expected t={timestamp},v1={hex}', { level: 'warning', tags: { area: 'payments/trolley' } })
    return false
  }

  const timestamp = tMatch[1]
  const receivedSig = v1Match[1].toLowerCase()

  // Trolley docs: concatenate timestamp with raw POST body
  const signedPayload = timestamp + payload

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  // Timing-safe comparison to prevent timing attacks
  try {
    const expectedBuf = Buffer.from(expectedSig, 'hex')
    const receivedBuf = Buffer.from(receivedSig, 'hex')

    if (expectedBuf.length !== receivedBuf.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf)
  } catch {
    // Buffer.from may throw on invalid hex
    return false
  }
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

export async function isTrolleyHealthy(): Promise<boolean> {
  try {
    // Lightweight check: fetch recipients list with limit 1
    await trolleyFetch('/recipients?limit=1')
    return true
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { area: 'trolley_client', subArea: 'health_check' } })
    return false
  }
}
