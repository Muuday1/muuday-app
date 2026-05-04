/**
 * Revolut Business API Client — Muuday Payments Engine
 *
 * Revolut is used as the treasury/settlement account.
 * Stripe settlements land here. Payout batches are funded from here.
 *
 * API Docs: https://developer.revolut.com/docs/business/
 * Environment vars: REVOLUT_CLIENT_ID, REVOLUT_API_KEY, REVOLUT_REFRESH_TOKEN,
 *                   REVOLUT_ACCOUNT_ID, REVOLUT_WEBHOOK_SECRET
 *
 * Auth: OAuth 2.0 with JWT client assertion (private key + X509 certificate).
 * The access token expires in ~40 minutes and auto-refreshes using the
 * refresh token when a 401 is received.
 */

import crypto from 'crypto'
import * as Sentry from '@sentry/nextjs'
import { env } from '@/lib/config/env'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevolutAccount {
  id: string
  name: string
  currency: string
  balance: bigint // minor units
}

export interface RevolutTransaction {
  id: string
  type: 'transfer' | 'card_payment' | 'exchange' | 'fee' | 'refund'
  amount: bigint // minor units
  currency: string
  state: 'pending' | 'completed' | 'reverted' | 'declined'
  createdAt: string
  reference?: string
  counterparty?: {
    type: 'self' | 'revolut' | 'external'
    accountId?: string
  }
}

// ---------------------------------------------------------------------------
// Token management (in-memory cache + refresh)
// ---------------------------------------------------------------------------

let cachedAccessToken = env.REVOLUT_API_KEY || ''
let cachedRefreshToken = env.REVOLUT_REFRESH_TOKEN || ''

function getAuthHeaders(): Record<string, string> {
  if (!cachedAccessToken) {
    throw new Error('Revolut API key not configured')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cachedAccessToken}`,
  }
}

/**
 * Generate a client_assertion JWT signed with the private key.
 * Revolut requires this for token refresh.
 *
 * The private key must be provided via the REVOLUT_PRIVATE_KEY env var.
 * Never store private key files in the repository or working directory.
 */
function generateClientAssertion(): string {
  const clientId = env.REVOLUT_CLIENT_ID
  if (!clientId) {
    throw new Error('REVOLUT_CLIENT_ID not configured')
  }

  const privateKey = env.REVOLUT_PRIVATE_KEY
  if (!privateKey) {
    throw new Error(
      'REVOLUT_PRIVATE_KEY not configured. ' +
        'Set REVOLUT_PRIVATE_KEY env var with the PEM content (replace newlines with \\n).'
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const jti = crypto.randomUUID()

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      iss: 'app.muuday.com',
      sub: clientId,
      aud: 'https://revolut.com',
      jti,
      exp: now + 300,
      iat: now,
    })
  ).toString('base64url')

  const signature = crypto
    .createSign('RSA-SHA256')
    .update(header + '.' + payload)
    .sign(privateKey, 'base64url')

  return header + '.' + payload + '.' + signature
}

/**
 * Refresh the access token using the refresh token.
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = cachedRefreshToken || env.REVOLUT_REFRESH_TOKEN
  const clientId = env.REVOLUT_CLIENT_ID

  if (!refreshToken || !clientId) {
    Sentry.captureMessage('[revolut] Cannot refresh: missing refresh_token or client_id', { level: 'warning', tags: { area: 'payments/revolut', context: 'token-refresh' } })
    return false
  }

  try {
    const clientAssertion = generateClientAssertion()

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion,
    })

    const response = await fetch(`${REVOLUT_API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok || !data.access_token) {
      Sentry.captureMessage(`[revolut] Token refresh failed: ${JSON.stringify(data)}`, 'error')
      return false
    }

    cachedAccessToken = data.access_token
    if (data.refresh_token) {
      cachedRefreshToken = data.refresh_token
    }

    Sentry.captureMessage(
      `[revolut] Token refreshed! Update your env vars:\n` +
        `REVOLUT_API_KEY=${cachedAccessToken}\n` +
        (data.refresh_token ? `REVOLUT_REFRESH_TOKEN=${cachedRefreshToken}` : ''),
      { level: 'warning', tags: { area: 'payments/revolut', context: 'token-refresh' } }
    )

    return true
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { area: 'revolut_client', subArea: 'token_refresh' } })
    return false
  }
}

const REVOLUT_API_BASE = 'https://b2b.revolut.com/api/1.0'

async function revolutFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${REVOLUT_API_BASE}${path}`

  const makeRequest = async () =>
    fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    })

  let response = await makeRequest()

  // If 401, try refreshing the token once and retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await makeRequest()
    }
  }

  if (!response.ok) {
    const body = await response.text().catch(() => 'unknown')
    throw new Error(`Revolut API error ${response.status}: ${body}`)
  }

  return response.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function getRevolutAccounts(): Promise<RevolutAccount[]> {
  const response = await revolutFetch<
    Array<{
      id: string
      name: string
      currency: string
      balance: number
    }>
  >('/accounts')

  return response.map((acc) => ({
    id: acc.id,
    name: acc.name,
    currency: acc.currency,
    balance: BigInt(Math.round(acc.balance * 100)),
  }))
}

export async function getRevolutAccount(accountId: string): Promise<RevolutAccount> {
  const response = await revolutFetch<{
    id: string
    name: string
    currency: string
    balance: number
  }>(`/accounts/${accountId}`)

  return {
    id: response.id,
    name: response.name,
    currency: response.currency,
    balance: BigInt(Math.round(response.balance * 100)),
  }
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function getRevolutTransactions(params?: {
  accountId?: string
  from?: string // ISO date
  to?: string // ISO date
  limit?: number
}): Promise<RevolutTransaction[]> {
  const searchParams = new URLSearchParams()
  if (params?.from) searchParams.set('from', params.from)
  if (params?.to) searchParams.set('to', params.to)
  if (params?.limit) searchParams.set('limit', String(params.limit))

  const query = searchParams.toString()
  const path = query ? `/transactions?${query}` : '/transactions'

  const response = await revolutFetch<
    Array<{
      id: string
      type: string
      amount: number
      currency: string
      state: string
      created_at: string
      reference?: string
      counterparty?: Record<string, unknown>
    }>
  >(path)

  return response.map((tx) => ({
    id: tx.id,
    type: tx.type as RevolutTransaction['type'],
    amount: BigInt(Math.round(tx.amount * 100)),
    currency: tx.currency,
    state: tx.state as RevolutTransaction['state'],
    createdAt: tx.created_at,
    reference: tx.reference,
    counterparty: tx.counterparty
      ? {
          type: (tx.counterparty.type as 'self' | 'revolut' | 'external') || 'external',
          accountId: tx.counterparty.account_id as string | undefined,
        }
      : undefined,
  }))
}

// ---------------------------------------------------------------------------
// Treasury Balance (Convenience)
// ---------------------------------------------------------------------------

export async function getTreasuryBalance(): Promise<{
  accountId: string
  balance: bigint
  currency: string
} | null> {
  const accountId = env.REVOLUT_ACCOUNT_ID
  if (!accountId) {
    Sentry.captureMessage('[revolut] REVOLUT_ACCOUNT_ID not configured', { level: 'warning', tags: { area: 'payments/revolut', context: 'treasury-balance' } })
    return null
  }

  const account = await getRevolutAccount(accountId)
  return {
    accountId: account.id,
    balance: account.balance,
    currency: account.currency,
  }
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

/**
 * Verify a Revolut webhook signature.
 *
 * Revolut webhooks are signed with HMAC-SHA256 using a webhook signing secret.
 * Headers:
 *   - Revolut-Request-Timestamp: UNIX timestamp in milliseconds
 *   - Revolut-Signature: v1=hex_hmac (multiple signatures comma-separated during rotation)
 *
 * Verification steps:
 * 1. payload_to_sign = v1.{timestamp}.{raw_payload}
 * 2. HMAC-SHA256(payload_to_sign, signing_secret)
 * 3. Compare with v1 value(s) using timing-safe equality
 *
 * Docs: https://developer.revolut.com/docs/guides/manage-accounts/webhooks/verify-the-payload-signature
 */
export function verifyRevolutWebhookSignature(payload: string, signature: string, timestamp: string | null): boolean {
  const secret = env.REVOLUT_WEBHOOK_SECRET
  if (!secret) {
    Sentry.captureMessage('[revolut] REVOLUT_WEBHOOK_SECRET not configured, skipping verification', { level: 'warning', tags: { area: 'payments/revolut', context: 'webhook-verification' } })
    return true
  }

  if (!timestamp) {
    Sentry.captureMessage('[revolut] Missing Revolut-Request-Timestamp header', { level: 'warning', tags: { area: 'payments/revolut', context: 'webhook-verification' } })
    return false
  }

  // Build payload to sign: v1.{timestamp}.{raw_payload}
  const payloadToSign = `v1.${timestamp}.${payload}`

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadToSign, 'utf8')
    .digest('hex')

  // Revolut may send multiple signatures during secret rotation (comma-separated)
  const signatures = signature.split(',').map((s) => {
    const match = s.trim().match(/v1=([a-f0-9]+)/i)
    return match ? match[1].toLowerCase() : null
  }).filter(Boolean) as string[]

  if (signatures.length === 0) {
    Sentry.captureMessage('[revolut] Invalid signature format, expected v1=hex_hmac', { level: 'warning', tags: { area: 'payments/revolut', context: 'webhook-verification' } })
    return false
  }

  const expectedBuf = Buffer.from(expectedSig, 'hex')

  for (const receivedSig of signatures) {
    try {
      const receivedBuf = Buffer.from(receivedSig, 'hex')
      if (expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
        return true
      }
    } catch {
      // Buffer.from may throw on invalid hex, skip this signature
    }
  }

  return false
}

export async function isRevolutHealthy(): Promise<boolean> {
  try {
    await getRevolutAccounts()
    return true
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { tags: { area: 'revolut_client', subArea: 'health_check' } })
    return false
  }
}
