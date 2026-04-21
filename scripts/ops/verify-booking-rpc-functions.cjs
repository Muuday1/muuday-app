#!/usr/bin/env node
/**
 * Verify that the atomic booking RPC functions exist in the database.
 * Run with: node scripts/ops/verify-booking-rpc-functions.cjs
 *
 * This script attempts to call each RPC function with minimal/invalid args.
 * If the function EXISTS, it will fail with a parameter/validation error.
 * If the function DOES NOT EXIST, it will fail with "does not exist".
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 */

const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkFunctionExists(supabase, functionName, params) {
  try {
    await supabase.rpc(functionName, params)
    // If it somehow succeeds, it exists
    return { exists: true, error: null }
  } catch (err) {
    const msg = err?.message || String(err)
    if (msg.includes('does not exist')) {
      return { exists: false, error: msg }
    }
    // Any other error means the function exists but parameters were invalid
    return { exists: true, error: msg }
  }
}

async function main() {
  if (!url) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
    process.exit(1)
  }

  if (!serviceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
    console.error('   This script needs service_role access.')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const functions = [
    {
      name: 'create_booking_with_payment',
      params: { p_user_id: '00000000-0000-0000-0000-000000000000' },
    },
    {
      name: 'create_batch_bookings_with_payment',
      params: { p_user_id: '00000000-0000-0000-0000-000000000000' },
    },
    {
      name: 'create_recurring_booking_with_payment',
      params: { p_user_id: '00000000-0000-0000-0000-000000000000' },
    },
  ]

  let allExist = true
  console.log('Checking atomic booking RPC functions...\n')

  for (const fn of functions) {
    const result = await checkFunctionExists(supabase, fn.name, fn.params)
    if (result.exists) {
      console.log(`✅ ${fn.name} — EXISTS`)
    } else {
      console.log(`❌ ${fn.name} — MISSING`)
      console.log(`   Error: ${result.error}`)
      allExist = false
    }
  }

  console.log()
  if (allExist) {
    console.log('✅ All atomic booking RPC functions are present.')
    process.exit(0)
  } else {
    console.log('❌ Some functions are missing.')
    console.log('   Apply: db/sql/migrations/052-booking-transactions.sql')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err.message)
  process.exit(1)
})
