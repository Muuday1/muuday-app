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
 * Priority: REVOLUT_PRIVATE_KEY env var → revolut_private.pem file (local dev)
 */
function generateClientAssertion(): string {
  const clientId = env.REVOLUT_CLIENT_ID
  if (!clientId) {
    throw new Error('REVOLUT_CLIENT_ID not configured')
  }

  let privateKey: string | undefined = env.REVOLUT_PRIVATE_KEY

  // Fallback: read from file for local development
  if (!privateKey) {
    try {
      const { readFileSync } = require('fs')
      const { join } = require('path')
      privateKey = readFileSync(join(process.cwd(), 'revolut_private.pem'), 'utf8')
    } catch {
      // Will throw below
    }
  }

  if (!privateKey) {
    throw new Error(
      'REVOLUT_PRIVATE_KEY not configured and revolut_private.pem not found. ' +
        'Set REVOLUT_PRIVATE_KEY env var with the PEM content (replace newlines with \\n).'
    )
  }

  const crypto = require('crypto')
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
    console.warn('[revolut] Cannot refresh: missing refresh_token or client_id')
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

    const response = await fetch('https://b2b.revolut.com/api/1.0/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok || !data.access_token) {
      console.error('[revolut] Token refresh failed:', data)
      return false
    }

    cachedAccessToken = data.access_token
    if (data.refresh_token) {
      cachedRefreshToken = data.refresh_token
    }

    console.warn(
      `[revolut] Token refreshed! Update your env vars:\n` +
        `REVOLUT_API_KEY=${cachedAccessToken}\n` +
        (data.refresh_token ? `REVOLUT_REFRESH_TOKEN=${cachedRefreshToken}` : '')
    )

    return true
  } catch (err) {
    console.error('[revolut] Token refresh error:', err)
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
    console.warn('[revolut] REVOLUT_ACCOUNT_ID not configured')
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

export function verifyRevolutWebhookSignature(payload: string, signature: string): boolean {
  const secret = env.REVOLUT_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[revolut] REVOLUT_WEBHOOK_SECRET not configured, skipping verification')
    return true
  }

  // Revolut webhooks are signed with JWT. The signature should be
  // verified using Revolut's public key.
  // TODO: Implement JWT verification based on Revolut docs.
  console.warn('[revolut] Webhook signature verification not yet implemented')
  return true
}

export async function isRevolutHealthy(): Promise<boolean> {
  try {
    await getRevolutAccounts()
    return true
  } catch {
    return false
  }
}
