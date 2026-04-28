/**
 * Create PayPal Sandbox Webhook for Trolley
 *
 * This script:
 * 1. Obtains an OAuth2 access token from PayPal Sandbox
 * 2. Creates a webhook pointing to https://api.trolley.com/hook/paypal/app
 * 3. Outputs the Webhook ID needed for Trolley configuration
 *
 * Usage:
 *   node scripts/create-paypal-webhook-for-trolley.js
 */

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || ''
const PAYPAL_API_SECRET = process.env.PAYPAL_API_SECRET || ''
const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com'
const TROLLEY_WEBHOOK_URL = 'https://api.trolley.com/hook/paypal/app'

if (!PAYPAL_CLIENT_ID || !PAYPAL_API_SECRET) {
  console.error('❌ Missing PAYPAL_CLIENT_ID or PAYPAL_API_SECRET environment variables')
  process.exit(1)
}

async function getAccessToken() {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_API_SECRET}`).toString('base64')

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`PayPal auth error ${response.status}: ${body}`)
  }

  const data = await response.json()
  return data.access_token
}

async function createWebhook(accessToken) {
  // Event types relevant for Trolley payment tracking
  // Core PayPal payment events that are available in all sandbox accounts
  const eventTypes = [
    { name: 'PAYMENT.CAPTURE.COMPLETED' },
    { name: 'PAYMENT.CAPTURE.DENIED' },
    { name: 'PAYMENT.CAPTURE.PENDING' },
    { name: 'PAYMENT.CAPTURE.REFUNDED' },
    { name: 'PAYMENT.CAPTURE.REVERSED' },
    { name: 'CHECKOUT.ORDER.APPROVED' },
    { name: 'CHECKOUT.ORDER.COMPLETED' },
    { name: 'PAYMENT.AUTHORIZATION.CREATED' },
    { name: 'PAYMENT.AUTHORIZATION.VOIDED' },
    { name: 'BILLING.SUBSCRIPTION.CREATED' },
    { name: 'BILLING.SUBSCRIPTION.ACTIVATED' },
    { name: 'BILLING.SUBSCRIPTION.CANCELLED' },
    { name: 'BILLING.SUBSCRIPTION.SUSPENDED' },
    { name: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED' },
  ]

  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/webhooks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: TROLLEY_WEBHOOK_URL,
      event_types: eventTypes,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`PayPal webhook creation error ${response.status}: ${JSON.stringify(data, null, 2)}`)
  }

  return data
}

async function listWebhooks(accessToken) {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/webhooks`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`PayPal list webhooks error ${response.status}: ${body}`)
  }

  return response.json()
}

async function main() {
  console.log('🔐 Step 1: Obtaining PayPal Sandbox access token...\n')
  const accessToken = await getAccessToken()
  console.log('✅ Access token obtained\n')

  // Check if webhook already exists
  console.log('🔍 Step 2: Checking existing webhooks...\n')
  const existing = await listWebhooks(accessToken)
  const existingWebhook = existing.webhooks?.find(
    (w) => w.url === TROLLEY_WEBHOOK_URL
  )

  if (existingWebhook) {
    console.log('⚠️  Webhook already exists for Trolley:')
    console.log(`   URL: ${existingWebhook.url}`)
    console.log(`   ID:  ${existingWebhook.id}`)
    console.log('')
    console.log('👉 Use this Webhook ID in your Trolley dashboard configuration.')
    return
  }

  console.log('📝 Step 3: Creating webhook for Trolley...\n')
  const webhook = await createWebhook(accessToken)

  console.log('✅ Webhook created successfully!\n')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  SANDBOX WEBHOOK ID (save this for Trolley):')
  console.log(`  ${webhook.id}`)
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log('Details:')
  console.log(`  URL:         ${webhook.url}`)
  console.log(`  Status:      Active`)
  console.log(`  Event types: ${webhook.event_types?.length || 0} subscribed`)
  console.log('')
  console.log('👉 Paste the Webhook ID above into your Trolley dashboard')
  console.log('   under Settings → Webhooks → PayPal Sandbox Webhook ID.')
}

main().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
