/**
 * Trolley API Client — Muuday Payments Engine
 *
 * Trolley is used for professional onboarding and payouts.
 * Muuday backend is the SOLE ORCHESTRATOR — Trolley never decides amounts.
 *
 * API Docs: https://trolley.com/docs/api
 * Environment vars: TROLLEY_API_KEY, TROLLEY_API_SECRET, TROLLEY_WEBHOOK_SECRET
 */

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
// Client
// ---------------------------------------------------------------------------

const TROLLEY_API_BASE = 'https://api.trolley.com/v1'

function getAuthHeaders(): Record<string, string> {
  const key = env.TROLLEY_API_KEY
  const secret = env.TROLLEY_API_SECRET

  if (!key || !secret) {
    throw new Error('Trolley API credentials not configured')
  }

  // Trolley uses Access-Key + Secret-Key headers
  return {
    'Content-Type': 'application/json',
    'Access-Key': key,
    'Secret-Key': secret,
  }
}

async function trolleyFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${TROLLEY_API_BASE}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => 'unknown')
    throw new Error(`Trolley API error ${response.status}: ${body}`)
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
}): Promise<TrolleyRecipient> {
  return trolleyFetch('/recipients', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      type: 'individual',
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
  recipientId: string
  amount: string
  currency: string
  sourceAmount?: string
  sourceCurrency?: string
}): Promise<TrolleyPayment> {
  return trolleyFetch('/payments', {
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

export async function createTrolleyBatch(paymentIds: string[]): Promise<TrolleyBatch> {
  return trolleyFetch('/batches', {
    method: 'POST',
    body: JSON.stringify({
      payments: paymentIds.map((id) => ({ id })),
    }),
  })
}

export async function getTrolleyBatch(batchId: string): Promise<TrolleyBatch> {
  return trolleyFetch(`/batches/${batchId}`)
}

export async function processTrolleyBatch(batchId: string): Promise<TrolleyBatch> {
  return trolleyFetch(`/batches/${batchId}/process`, {
    method: 'POST',
  })
}

// ---------------------------------------------------------------------------
// Webhook Verification
// ---------------------------------------------------------------------------

/**
 * Verify a Trolley webhook signature.
 *
 * Trolley webhooks include a signature header that should be verified
 * to ensure the request came from Trolley.
 *
 * TODO: Implement actual signature verification based on Trolley docs.
 */
export function verifyTWebhookSignature(payload: string, signature: string): boolean {
  const secret = env.TROLLEY_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[trolley] TROLLEY_WEBHOOK_SECRET not configured, skipping signature verification')
    return true
  }

  // TODO: Implement HMAC verification
  // Trolley webhook signature format to be confirmed from docs
  console.warn('[trolley] Webhook signature verification not yet implemented')
  return true
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

export async function isTrolleyHealthy(): Promise<boolean> {
  try {
    // Lightweight check: fetch recipients list with limit 1
    await trolleyFetch('/recipients?limit=1')
    return true
  } catch {
    return false
  }
}
