/**
 * Revolut Business API Client — Muuday Payments Engine
 *
 * Revolut is used as the treasury/settlement account.
 * Stripe settlements land here. Payout batches are funded from here.
 *
 * API Docs: https://developer.revolut.com/docs/business/
 * Environment vars: REVOLUT_API_KEY, REVOLUT_ACCOUNT_ID
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
// Client
// ---------------------------------------------------------------------------

const REVOLUT_API_BASE = 'https://b2b.revolut.com/api/1.0'

function getAuthHeaders(): Record<string, string> {
  const key = env.REVOLUT_API_KEY
  if (!key) {
    throw new Error('Revolut API key not configured')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  }
}

async function revolutFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${REVOLUT_API_BASE}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })

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
  const response = await revolutFetch<Array<{
    id: string
    name: string
    currency: string
    balance: number
  }>>('/accounts')

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

  const response = await revolutFetch<Array<{
    id: string
    type: string
    amount: number
    currency: string
    state: string
    created_at: string
    reference?: string
    counterparty?: Record<string, unknown>
  }>>(path)

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
// Webhook Verification
// ---------------------------------------------------------------------------

/**
 * Verify a Revolut webhook JWT signature.
 *
 * Revolut webhooks are signed with JWT. The signature should be
 * verified using Revolut's public key.
 *
 * TODO: Implement JWT verification based on Revolut docs.
 */
export function verifyRevolutWebhookSignature(payload: string, signature: string): boolean {
  const secret = env.REVOLUT_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[revolut] REVOLUT_WEBHOOK_SECRET not configured, skipping verification')
    return true
  }

  // TODO: Implement JWT signature verification
  console.warn('[revolut] Webhook signature verification not yet implemented')
  return true
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

export async function isRevolutHealthy(): Promise<boolean> {
  try {
    await getRevolutAccounts()
    return true
  } catch {
    return false
  }
}
