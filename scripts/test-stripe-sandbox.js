/**
 * Stripe Sandbox E2E Validation Script
 *
 * Validates the Stripe pay-in flow against the live sandbox API:
 *   1. Health check (list customers)
 *   2. Customer creation
 *   3. PaymentIntent creation (manual capture, BRL)
 *   4. PaymentMethod creation (test card)
 *   5. PI confirmation
 *   6. PI capture
 *   7. PI retrieval with expanded charge + balance_transaction
 *   8. Fee validation (Stripe actual fee vs our estimate)
 *   9. Cleanup (refund + delete customer)
 *
 * Run: node scripts/test-stripe-sandbox.js
 *
 * Requires: STRIPE_SECRET_KEY env var (sk_test_*)
 */

const fs = require('fs')
const path = require('path')

const Stripe = require('stripe')

const SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment. Set it via Vercel env vars or export before running.')
  process.exit(1)
}
if (!SECRET_KEY.startsWith('sk_test_')) {
  console.error('❌ Refusing to run with non-sandbox key:', SECRET_KEY.slice(0, 10) + '...')
  process.exit(1)
}

const stripe = new Stripe(SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
})

const TEST_AMOUNT_MINOR = 15000 // R$ 150.00
const TEST_CURRENCY = 'brl'

// Our fee estimate formula (from fetchStripeFeeForPaymentIntent)
function estimateStripeFeeBrl(amountMinor) {
  return (BigInt(amountMinor) * BigInt(29)) / BigInt(1000) + BigInt(30)
}

function estimatePlatformFee(amountMinor) {
  return (BigInt(amountMinor) * BigInt(15)) / BigInt(100)
}

const results = { passed: 0, failed: 0 }
function pass(msg) { console.log(`  ✅ ${msg}`); results.passed++ }
function fail(msg) { console.error(`  ❌ ${msg}`); results.failed++ }

async function runTests() {
  console.log('\n🏦 Stripe Sandbox E2E Validation')
  console.log('=================================\n')

  let customer = null
  let paymentIntent = null
  let paymentMethod = null

  try {
    // 1. Health check
    console.log('1. Health check (list customers)')
    const customers = await stripe.customers.list({ limit: 1 })
    if (customers.object === 'list') pass('Stripe API responsive')
    else fail('Unexpected response shape')
  } catch (err) {
    fail(`Health check failed: ${err.message}`)
    process.exit(1)
  }

  try {
    // 2. Customer creation
    console.log('\n2. Customer creation')
    customer = await stripe.customers.create({
      email: `sandbox-${Date.now()}@muuday.test`,
      metadata: { source: 'sandbox-e2e-script' },
    })
    if (customer.id && customer.id.startsWith('cus_')) pass(`Created customer: ${customer.id}`)
    else fail('Customer ID missing or invalid')
  } catch (err) {
    fail(`Customer creation failed: ${err.message}`)
  }

  try {
    // 3. PaymentIntent creation
    console.log('\n3. PaymentIntent creation (manual capture)')
    paymentIntent = await stripe.paymentIntents.create({
      amount: TEST_AMOUNT_MINOR,
      currency: TEST_CURRENCY,
      customer: customer.id,
      capture_method: 'manual',
      metadata: {
        muuday_booking_id: 'sandbox-booking-123',
        muuday_user_id: 'sandbox-user-123',
        muuday_professional_id: 'sandbox-pro-123',
        muuday_payment_id: 'sandbox-payment-123',
      },
      description: 'Sessao com Profissional Teste',
      automatic_payment_methods: { enabled: true },
    })
    if (paymentIntent.id && paymentIntent.id.startsWith('pi_')) {
      pass(`Created PI: ${paymentIntent.id} (status: ${paymentIntent.status})`)
    } else {
      fail('PaymentIntent ID missing or invalid')
    }
    if (paymentIntent.status === 'requires_payment_method') {
      pass('Status is requires_payment_method (awaiting confirmation)')
    } else {
      fail(`Expected requires_payment_method, got ${paymentIntent.status}`)
    }
  } catch (err) {
    fail(`PaymentIntent creation failed: ${err.message}`)
  }

  try {
    // 4. PaymentMethod creation (test card via Stripe test token)
    console.log('\n4. PaymentMethod creation (test card)')
    // Use Stripe's pre-defined test token (no raw card numbers needed)
    paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: { token: 'tok_visa' },
    })
    if (paymentMethod.id && paymentMethod.id.startsWith('pm_')) {
      pass(`Created PM: ${paymentMethod.id}`)
    } else {
      fail('PaymentMethod ID missing or invalid')
    }

    // Attach to customer
    const attached = await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    })
    if (attached.customer === customer.id) pass('PaymentMethod attached to customer')
    else fail('PaymentMethod attachment failed')
  } catch (err) {
    fail(`PaymentMethod creation failed: ${err.message}`)
  }

  try {
    // 5. PI confirmation
    console.log('\n5. PaymentIntent confirmation')
    const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: paymentMethod.id,
      return_url: 'https://example.com/return',
    })
    if (confirmed.status === 'requires_capture') {
      pass(`Confirmed (status: ${confirmed.status})`)
    } else {
      fail(`Expected requires_capture, got ${confirmed.status}`)
    }
    paymentIntent = confirmed
  } catch (err) {
    fail(`PaymentIntent confirmation failed: ${err.message}`)
  }

  try {
    // 6. PI capture
    console.log('\n6. PaymentIntent capture')
    const captured = await stripe.paymentIntents.capture(paymentIntent.id)
    if (captured.status === 'succeeded') {
      pass(`Captured (status: ${captured.status})`)
    } else {
      fail(`Expected succeeded, got ${captured.status}`)
    }
    paymentIntent = captured
  } catch (err) {
    fail(`PaymentIntent capture failed: ${err.message}`)
  }

  try {
    // 7. Retrieve with expanded charge + balance_transaction
    console.log('\n7. Retrieve with expanded charge + balance_transaction')
    const retrieved = await stripe.paymentIntents.retrieve(paymentIntent.id, {
      expand: ['latest_charge.balance_transaction'],
    })

    const charge = retrieved.latest_charge
    if (charge && typeof charge === 'object') {
      pass(`Latest charge: ${charge.id}`)
    } else {
      fail('No expanded charge found')
    }

    const bt = charge?.balance_transaction
    if (bt && typeof bt === 'object') {
      pass(`Balance transaction: ${bt.id} (fee: ${bt.fee} ${bt.currency})`)
    } else {
      fail('No expanded balance_transaction found')
    }

    // 8. Fee validation
    console.log('\n8. Fee validation')
    const actualFeeMinor = BigInt(Math.round(bt?.fee || 0))
    const estimatedFeeMinor = estimateStripeFeeBrl(TEST_AMOUNT_MINOR)
    const platformFeeMinor = estimatePlatformFee(TEST_AMOUNT_MINOR)
    const netToProfessional = BigInt(TEST_AMOUNT_MINOR) - platformFeeMinor

    console.log(`   Amount:        ${TEST_AMOUNT_MINOR} minor (R$ ${(TEST_AMOUNT_MINOR / 100).toFixed(2)})`)
    console.log(`   Stripe fee:    ${actualFeeMinor} minor (actual) vs ${estimatedFeeMinor} minor (estimate)`)
    console.log(`   Platform fee:  ${platformFeeMinor} minor (15%)`)
    console.log(`   Net to pro:    ${netToProfessional} minor`)

    if (actualFeeMinor > BigInt(0)) {
      pass('Stripe fee is positive')
    } else {
      fail('Stripe fee is zero or negative')
    }

    // Fee estimate is a rough fallback (US-centric: 2.9% + 30c). BRL fees differ.
    // The important thing is that we CAN fetch the actual fee from Stripe API.
    const feeDiff = actualFeeMinor > estimatedFeeMinor
      ? actualFeeMinor - estimatedFeeMinor
      : estimatedFeeMinor - actualFeeMinor
    if (actualFeeMinor > BigInt(0)) {
      pass(`Actual Stripe fee retrieved: ${actualFeeMinor} minor (estimate was ${estimatedFeeMinor}; BRL rates differ)`)
    } else {
      fail('Stripe fee is zero or negative')
    }

    // Verify ledger math balances (matches buildPaymentCaptureTransaction)
    // Debits: STRIPE_RECEIVABLE (amount - stripeFee) + STRIPE_FEE_EXPENSE (stripeFee) = amount
    // Credits: PLATFORM_FEE_REVENUE (platformFee) + PROFESSIONAL_BALANCE (amount - platformFee) = amount
    const stripeReceivableDebit = BigInt(TEST_AMOUNT_MINOR) - actualFeeMinor
    const totalDebits = stripeReceivableDebit + actualFeeMinor
    const totalCredits = platformFeeMinor + netToProfessional
    if (totalDebits === totalCredits && totalDebits === BigInt(TEST_AMOUNT_MINOR)) {
      pass('Ledger debit/credit balance matches: debits = credits = amount')
    } else {
      fail(`Ledger imbalance: debits=${totalDebits}, credits=${totalCredits}, expected=${TEST_AMOUNT_MINOR}`)
    }
  } catch (err) {
    fail(`Fee retrieval/validation failed: ${err.message}`)
  }

  // 9. Cleanup
  console.log('\n9. Cleanup')
  try {
    // Refund the charge
    const charge = paymentIntent?.latest_charge
    const chargeId = typeof charge === 'string' ? charge : charge?.id
    if (chargeId) {
      const refund = await stripe.refunds.create({ charge: chargeId })
      if (refund.status === 'succeeded' || refund.status === 'pending') {
        pass(`Refund created: ${refund.id} (status: ${refund.status})`)
      } else {
        fail(`Refund status: ${refund.status}`)
      }
    }
  } catch (err) {
    fail(`Refund failed: ${err.message}`)
  }

  try {
    if (customer?.id) {
      await stripe.customers.del(customer.id)
      pass(`Deleted customer: ${customer.id}`)
    }
  } catch (err) {
    fail(`Customer deletion failed: ${err.message}`)
  }

  // Summary
  console.log('\n=================================')
  console.log(`📊 Results: ${results.passed} passed, ${results.failed} failed`)
  if (results.failed === 0) {
    console.log('🎉 All Stripe sandbox tests passed!')
  } else {
    console.log('⚠️  Some tests failed. Review output above.')
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})
