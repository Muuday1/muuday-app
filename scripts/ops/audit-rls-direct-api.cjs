#!/usr/bin/env node
 

const { createClient } = require('@supabase/supabase-js')
const { existsSync, readFileSync } = require('fs')
const { resolve } = require('path')

function loadLocalEnvFile(fileName) {
  const envPath = resolve(process.cwd(), fileName)
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf-8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadLocalEnvFile('.env.local')
loadLocalEnvFile('.env')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const USER_A_EMAIL = process.env.RLS_A_EMAIL || process.env.E2E_USER_EMAIL
const USER_A_PASSWORD = process.env.RLS_A_PASSWORD || process.env.E2E_USER_PASSWORD
const USER_B_EMAIL = process.env.RLS_B_EMAIL || process.env.E2E_PROFESSIONAL_EMAIL
const USER_B_PASSWORD = process.env.RLS_B_PASSWORD || process.env.E2E_PROFESSIONAL_PASSWORD
const SAMPLE_BOOKING_ID = process.env.RLS_SAMPLE_BOOKING_ID || null
const SAMPLE_PAYMENT_ID = process.env.RLS_SAMPLE_PAYMENT_ID || null
const SAMPLE_HIDDEN_REVIEW_ID = process.env.RLS_SAMPLE_HIDDEN_REVIEW_ID || null
const SAMPLE_MESSAGE_ID = process.env.RLS_SAMPLE_MESSAGE_ID || null

function fail(message) {
  console.error(`\n[rls-audit] FAIL: ${message}`)
  process.exit(1)
}

function warn(message) {
  console.warn(`[rls-audit] WARN: ${message}`)
}

function info(message) {
  console.log(`[rls-audit] ${message}`)
}

function makeClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

async function signIn(label, email, password) {
  const client = makeClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data?.user) {
    fail(`${label}: login failed (${error?.message || 'unknown error'})`)
  }
  info(`${label}: logged in as ${data.user.id}`)
  return { client, userId: data.user.id }
}

async function getProfessionalIdForUser(client, userId) {
  const { data, error } = await client
    .from('professionals')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data?.id || null
}

async function verifyOwnerCanRead(ownerClient, table, rowId) {
  const { data, error } = await ownerClient
    .from(table)
    .select('id')
    .eq('id', rowId)
    .limit(1)
  if (error) {
    return { ok: false, reason: `owner read error: ${error.message}` }
  }
  return { ok: Array.isArray(data) && data.length > 0, reason: 'owner row not visible' }
}

async function verifyCrossReadBlocked(actorClient, table, rowId) {
  const { data, error } = await actorClient
    .from(table)
    .select('id')
    .eq('id', rowId)
    .limit(1)

  if (error) {
    const message = String(error.message || '').toLowerCase()
    const code = String(error.code || '')
    if (
      code === 'PGRST205' ||
      code === '42P01' ||
      message.includes('could not find the table') ||
      message.includes('relation') && message.includes('does not exist')
    ) {
      return { ok: false, skipped: true, reason: 'table not found' }
    }
    return { ok: true, blocked: true, reason: `query blocked/error (${error.message})` }
  }

  const leaked = Array.isArray(data) && data.length > 0
  return leaked
    ? { ok: false, blocked: false, reason: 'row leaked in cross-user direct ID query' }
    : { ok: true, blocked: true, reason: 'no rows returned' }
}

async function findBookingSample(ownerClient, ownerProfessionalId, userAId) {
  if (!ownerProfessionalId) return null
  const { data, error } = await ownerClient
    .from('bookings')
    .select('id,user_id')
    .eq('professional_id', ownerProfessionalId)
    .neq('user_id', userAId)
    .limit(1)
  if (error || !data?.length) return null
  return data[0].id
}

async function findPaymentSample(ownerClient, ownerProfessionalId, userAId) {
  if (!ownerProfessionalId) return null
  const { data, error } = await ownerClient
    .from('payments')
    .select('id,user_id')
    .eq('professional_id', ownerProfessionalId)
    .neq('user_id', userAId)
    .limit(1)
  if (error || !data?.length) return null
  return data[0].id
}

async function findHiddenReviewSample(ownerClient, ownerUserId) {
  const { data, error } = await ownerClient
    .from('reviews')
    .select('id')
    .eq('user_id', ownerUserId)
    .eq('is_visible', false)
    .limit(1)
  if (error || !data?.length) return null
  return data[0].id
}

async function findMessageSample(ownerClient, ownerUserId, userAId) {
  // Current schema uses receiver_id, but keep recipient_id fallback for legacy datasets.
  const primary = await ownerClient
    .from('messages')
    .select('id,sender_id,receiver_id')
    .or(`sender_id.eq.${ownerUserId},receiver_id.eq.${ownerUserId}`)
    .neq('sender_id', userAId)
    .neq('receiver_id', userAId)
    .limit(1)

  const primaryError = primary.error
  if (!primaryError) {
    return { id: primary.data?.[0]?.id || null, missingTable: false }
  }

  const primaryCode = String(primaryError.code || '')
  const primaryMessage = String(primaryError.message || '').toLowerCase()
  if (
    primaryCode === 'PGRST205' ||
    primaryCode === '42P01' ||
    primaryMessage.includes('could not find the table') ||
    (primaryMessage.includes('relation') && primaryMessage.includes('does not exist'))
  ) {
    return { id: null, missingTable: true }
  }

  // If receiver_id is missing on older schema, retry against recipient_id.
  if (!primaryMessage.includes('receiver_id')) {
    return { id: null, missingTable: false }
  }

  const fallback = await ownerClient
    .from('messages')
    .select('id,sender_id,recipient_id')
    .or(`sender_id.eq.${ownerUserId},recipient_id.eq.${ownerUserId}`)
    .neq('sender_id', userAId)
    .neq('recipient_id', userAId)
    .limit(1)

  if (fallback.error) {
    const fallbackCode = String(fallback.error.code || '')
    const fallbackMessage = String(fallback.error.message || '').toLowerCase()
    if (
      fallbackCode === 'PGRST205' ||
      fallbackCode === '42P01' ||
      fallbackMessage.includes('could not find the table') ||
      (fallbackMessage.includes('relation') && fallbackMessage.includes('does not exist'))
    ) {
      return { id: null, missingTable: true }
    }
    return { id: null, missingTable: false }
  }

  return { id: fallback.data?.[0]?.id || null, missingTable: false }
}

async function run() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    fail('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  if (!USER_A_EMAIL || !USER_A_PASSWORD || !USER_B_EMAIL || !USER_B_PASSWORD) {
    fail('Missing test credentials. Set RLS_A_EMAIL/RLS_A_PASSWORD and RLS_B_EMAIL/RLS_B_PASSWORD (or E2E_* fallbacks).')
  }

  info('Starting direct API RLS isolation audit...')

  const actorA = await signIn('user_a', USER_A_EMAIL, USER_A_PASSWORD)
  const actorB = await signIn('user_b', USER_B_EMAIL, USER_B_PASSWORD)

  const bProfessionalId = await getProfessionalIdForUser(actorB.client, actorB.userId)

  const checks = []

  const bookingId = SAMPLE_BOOKING_ID || await findBookingSample(actorB.client, bProfessionalId, actorA.userId)
  if (bookingId) {
    checks.push({ table: 'bookings', id: bookingId })
  } else {
    warn('No suitable booking sample found for cross-user test.')
  }

  const paymentId = SAMPLE_PAYMENT_ID || await findPaymentSample(actorB.client, bProfessionalId, actorA.userId)
  if (paymentId) {
    checks.push({ table: 'payments', id: paymentId })
  } else {
    warn('No suitable payment sample found for cross-user test.')
  }

  const hiddenReviewId = SAMPLE_HIDDEN_REVIEW_ID || await findHiddenReviewSample(actorB.client, actorB.userId)
  if (hiddenReviewId) {
    checks.push({ table: 'reviews', id: hiddenReviewId })
  } else {
    warn('No hidden review sample found. Hidden-review isolation check skipped.')
  }

  const messageSample = SAMPLE_MESSAGE_ID
    ? { id: SAMPLE_MESSAGE_ID, missingTable: false }
    : await findMessageSample(actorB.client, actorB.userId, actorA.userId)
  if (messageSample.missingTable) {
    warn('messages table not found. Messaging RLS check skipped.')
  } else if (messageSample.id) {
    checks.push({ table: 'messages', id: messageSample.id })
  } else {
    warn('No suitable message sample found for cross-user test.')
  }

  if (checks.length === 0) {
    warn('No executable checks found from sample data. Provide richer fixtures and rerun.')
    process.exit(2)
  }

  let failures = 0
  for (const check of checks) {
    const ownerCanRead = await verifyOwnerCanRead(actorB.client, check.table, check.id)
    if (!ownerCanRead.ok) {
      warn(`${check.table}: skipped (owner validation failed: ${ownerCanRead.reason})`)
      continue
    }

    const crossRead = await verifyCrossReadBlocked(actorA.client, check.table, check.id)
    if (crossRead.skipped) {
      warn(`${check.table}: skipped (${crossRead.reason})`)
      continue
    }
    if (!crossRead.ok) {
      failures += 1
      console.error(`[rls-audit] LEAK ${check.table} id=${check.id}: ${crossRead.reason}`)
      continue
    }
    info(`PASS ${check.table} id=${check.id}: ${crossRead.reason}`)
  }

  if (failures > 0) {
    fail(`${failures} cross-user isolation check(s) failed.`)
  }

  info('All executed cross-user isolation checks passed.')
}

run().catch((error) => {
  fail(error?.message || String(error))
})
