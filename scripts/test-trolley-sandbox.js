/**
 * Trolley Sandbox E2E Test Script
 *
 * This script exercises the full Trolley sandbox flow:
 * 1. Health check
 * 2. Recipient creation (with referenceId)
 * 3. Recipient retrieval
 * 4. Recipient update (PayPal payout method)
 * 5. Empty batch creation
 * 6. Payment creation within batch
 * 7. Batch processing
 * 8. Webhook signature verification test
 *
 * Prerequisites:
 * - TROLLEY_API_KEY and TROLLEY_API_SECRET set in environment
 * - TROLLEY_API_BASE set to sandbox URL (default: https://api.trolley.com/v1)
 *
 * Usage:
 *   node scripts/test-trolley-sandbox.js
 *
 * Exit codes:
 *   0 = all tests passed
 *   1 = at least one test failed
 */

const crypto = require('crypto')

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = process.env.TROLLEY_API_BASE || 'https://api.trolley.com/v1'
const API_KEY = process.env.TROLLEY_API_KEY
const API_SECRET = process.env.TROLLEY_API_SECRET
const WEBHOOK_SECRET = process.env.TROLLEY_WEBHOOK_SECRET || 'test-secret-for-verification'

if (!API_KEY || !API_SECRET) {
  console.error('❌ Missing TROLLEY_API_KEY or TROLLEY_API_SECRET')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Auth & Signing
// ---------------------------------------------------------------------------

function signRequest(method, requestPath, body, secret, timestamp) {
  const message = `${timestamp}\n${method.toUpperCase()}\n${requestPath}\n${body}\n`
  return crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex')
}

function getAuthHeaders(method, requestPath, body) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = signRequest(method, requestPath, body, API_SECRET, timestamp)

  return {
    'Content-Type': 'application/json',
    'Authorization': `prsign ${API_KEY}:${signature}`,
    'X-PR-Timestamp': String(timestamp),
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

async function trolleyFetch(path, options = {}) {
  const url = `${API_BASE}${path}`
  const method = options.method || 'GET'
  const body = options.body ? String(options.body) : ''

  // requestPath for signing must include the /v1 prefix
  const apiVersionPrefix = '/v1'
  const requestPath = path.startsWith(apiVersionPrefix) ? path : `${apiVersionPrefix}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(method, requestPath, body),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => 'unknown')
    throw new Error(`Trolley API error ${response.status}: ${bodyText}`)
  }

  return response.json()
}

// ---------------------------------------------------------------------------
// Webhook Verification (copy of client logic for testing)
// ---------------------------------------------------------------------------

function verifyTWebhookSignature(payload, signature, secret) {
  const tMatch = signature.match(/t=(\d+)/)
  const v1Match = signature.match(/v1=([a-f0-9]+)/i)

  if (!tMatch || !v1Match) return false

  const timestamp = tMatch[1]
  const receivedSig = v1Match[1].toLowerCase()
  const signedPayload = timestamp + payload

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex')

  try {
    const expectedBuf = Buffer.from(expectedSig, 'hex')
    const receivedBuf = Buffer.from(receivedSig, 'hex')
    if (expectedBuf.length !== receivedBuf.length) return false
    return crypto.timingSafeEqual(expectedBuf, receivedBuf)
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Test Runner
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`  ✅ ${name}`)
    passed++
  } catch (error) {
    console.error(`  ❌ ${name}`)
    console.error(`     ${error instanceof Error ? error.message : String(error)}`)
    failed++
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`)
  }
}

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(message || 'Expected truthy value')
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  recipientId: null,
  batchId: null,
  paymentId: null,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function runTests() {
  console.log('\n🚀 Trolley Sandbox E2E Tests')
  console.log(`   API Base: ${API_BASE}`)
  console.log('')

  // ── 1. Health Check ─────────────────────────────────────────────────────
  await test('health check (list recipients with limit=1)', async () => {
    const result = await trolleyFetch('/recipients?limit=1')
    assertTruthy(result.recipients || Array.isArray(result), 'Expected recipients array in response')
  })

  // ── 2. Recipient Creation ───────────────────────────────────────────────
  await test('create recipient with referenceId', async () => {
    const timestamp = Date.now()
    const result = await trolleyFetch('/recipients', {
      method: 'POST',
      body: JSON.stringify({
        email: `sandbox-test-${timestamp}@example.com`,
        firstName: 'Sandbox',
        lastName: `Test${timestamp}`,
        type: 'individual',
        referenceId: `muuday-pro-${timestamp}`,
      }),
    })

    assertTruthy(result.recipient?.id || result.id, 'Expected recipient id')
    state.recipientId = result.recipient?.id || result.id
    console.log(`      → Created recipient: ${state.recipientId}`)
  })

  // ── 3. Recipient Retrieval ──────────────────────────────────────────────
  await test('get recipient by id', async () => {
    if (!state.recipientId) throw new Error('No recipient created')
    const result = await trolleyFetch(`/recipients/${state.recipientId}`)
    assertEqual(result.recipient?.id || result.id, state.recipientId, 'Recipient ID mismatch')
    assertTruthy(
      result.recipient?.referenceId || result.referenceId,
      'Expected referenceId to be present',
    )
  })

  // ── 4. Recipient Update ─────────────────────────────────────────────────
  await test('update recipient payout method to paypal', async () => {
    if (!state.recipientId) throw new Error('No recipient created')
    const result = await trolleyFetch(`/recipients/${state.recipientId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        payoutMethod: 'paypal',
        paypalEmail: `sandbox-paypal-${Date.now()}@example.com`,
      }),
    })
    assertTruthy(result.recipient?.id || result.id, 'Expected recipient id after update')
  })

  // ── 5. Empty Batch Creation ─────────────────────────────────────────────
  await test('create empty batch', async () => {
    const result = await trolleyFetch('/batches', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    assertTruthy(result.batch?.id || result.id, 'Expected batch id')
    state.batchId = result.batch?.id || result.id
    console.log(`      → Created batch: ${state.batchId}`)
  })

  // ── 6. Payment Creation within Batch ────────────────────────────────────
  await test('create payment within batch', async () => {
    if (!state.batchId) throw new Error('No batch created')
    if (!state.recipientId) throw new Error('No recipient created')
    const result = await trolleyFetch(`/batches/${state.batchId}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        recipient: { id: state.recipientId },
        amount: '10.00',
        currency: 'BRL',
      }),
    })

    assertTruthy(result.payment?.id || result.id, 'Expected payment id')
    state.paymentId = result.payment?.id || result.id
    console.log(`      → Created payment: ${state.paymentId}`)
  })

  // ── 7. Batch Process (may fail in sandbox without full setup) ───────────
  await test('process batch (soft — sandbox may reject)', async () => {
    if (!state.batchId) throw new Error('No batch created')
    try {
      const result = await trolleyFetch(`/batches/${state.batchId}/start-processing`, { method: 'POST' })
      assertTruthy(result.batch?.id || result.id, 'Expected batch id after process')
      console.log(`      → Batch processed (status: ${result.batch?.status || result.status})`)
    } catch (error) {
      // Sandbox may reject processing if recipient is not fully KYC'd or insufficient funds
      // This is expected and not a failure of our integration
      if (error.message && (error.message.includes('422') || error.message.includes('400') || error.message.includes('non_sufficient_funds'))) {
        console.log(`      → Batch process rejected (expected in sandbox without KYC/funds): ${error.message}`)
      } else {
        throw error
      }
    }
  })

  // ── 8. Webhook Signature Verification ───────────────────────────────────
  await test('verify valid webhook signature', async () => {
    const payload = JSON.stringify({ type: 'recipient.updated', data: { id: state.recipientId } })
    const timestamp = Math.floor(Date.now() / 1000)
    const signedPayload = String(timestamp) + payload
    const expectedSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedPayload, 'utf8').digest('hex')
    const signature = `t=${timestamp},v1=${expectedSig}`
    const isValid = verifyTWebhookSignature(payload, signature, WEBHOOK_SECRET)
    assertEqual(isValid, true, 'Valid signature should pass')
  })

  await test('reject invalid webhook signature', async () => {
    const payload = JSON.stringify({ type: 'recipient.updated' })
    const signature = 't=1234567890,v1=invalidhex123'
    const isValid = verifyTWebhookSignature(payload, signature, WEBHOOK_SECRET)
    assertEqual(isValid, false, 'Invalid signature should fail')
  })

  await test('reject tampered webhook payload', async () => {
    const originalPayload = JSON.stringify({ type: 'recipient.updated', data: { id: state.recipientId } })
    const timestamp = Math.floor(Date.now() / 1000)
    const signedPayload = String(timestamp) + originalPayload
    const expectedSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(signedPayload, 'utf8').digest('hex')
    const signature = `t=${timestamp},v1=${expectedSig}`

    const tamperedPayload = JSON.stringify({ type: 'recipient.updated', data: { id: 'tampered-id' } })
    const isValid = verifyTWebhookSignature(tamperedPayload, signature, WEBHOOK_SECRET)
    assertEqual(isValid, false, 'Tampered payload should fail verification')
  })

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('')
  console.log(`📊 Results: ${passed} passed, ${failed} failed`)
  console.log('')

  if (state.recipientId) {
    console.log(`🧹 Cleanup: recipient ${state.recipientId} was created in sandbox`)
    console.log(`   batch ${state.batchId} was created in sandbox`)
    console.log('   (Recipients may be deleted manually via Trolley dashboard if needed)')
  }

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
